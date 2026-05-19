import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import SingleChoice from '../components/SingleChoice';
import MultipleChoice from '../components/MultipleChoice';
import SortQuestion from '../components/SortQuestion';
import MatchQuestion from '../components/MatchQuestion';
import './ExamPage.css';
import logo from '../images/logo-1.png';

export default function ExamPage() {
  const navigate = useNavigate();
  const [examData, setExamData] = useState(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Refs a loop elkerüléséhez
  const timerRef = useRef(null);
  const expiredRef = useRef(false);
  const examDataRef = useRef(null);
  const answersRef = useRef({});

  // Exam betöltése sessionStorage-ból
  useEffect(() => {
    const stored = sessionStorage.getItem('examData');
    if (!stored) { navigate('/'); return; }
    const data = JSON.parse(stored);
    examDataRef.current = data;
    setExamData(data);
    setTimeLeft(data.duration);
  }, [navigate]);

  // finishExam csak navigate-től függ, ref-eket olvas
  const finishExam = useCallback(async (expired = false) => {
    if (expiredRef.current) return;
    expiredRef.current = true;
    clearInterval(timerRef.current);
    setFinishing(true);
    try {
      const { data } = await api.post('/exam/finish', {
        sessionId: examDataRef.current.sessionId,
        expired
      });
      sessionStorage.setItem('examResult', JSON.stringify({
        ...data,
        questions: examDataRef.current.questions,
        userAnswers: answersRef.current
      }));
      navigate('/result');
    } catch (e) {
      console.error(e);
      setFinishing(false);
      expiredRef.current = false;
    }
  }, [navigate]);

  // Timer — csak examData (boolean) és stabil finishExam függvény triggereli
  useEffect(() => {
    if (!examData) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          finishExam(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [examData, finishExam]);

  // Válasz mentése — ref + state egyszerre frissül
  const saveAnswer = useCallback(async (questionId, answer) => {
  const newAnswers = { ...answersRef.current, [questionId]: answer };
  answersRef.current = newAnswers;
  setAnswers(newAnswers);
  try {
    await api.post('/exam/answer', {
      sessionId: examDataRef.current.sessionId,
      questionId,
      answer
    });
  } catch (e) {
    console.error('Válasz mentési hiba:', e);
    if (e.response?.data?.expired) finishExam(true);
  }
}, [finishExam]);

// Sort auto-mentés
useEffect(() => {
  if (!examData) return;
  const q = examData.questions[current];
  if (q.type === 'sort' && answers[q.id] === undefined) {
    const defaultOrder = q.sortItems.map(item => item.id);
    saveAnswer(q.id, defaultOrder);
  }
}, [current, examData, answers, saveAnswer]);

  if (!examData) return <div className="spinner" />;

  const questions = examData.questions;
  const q = questions[current];
  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs = String(timeLeft % 60).padStart(2, '0');
  const timerCritical = timeLeft < 300;
  const answered = Object.keys(answers).length;

  return (
    <div className="exam-page">
      {/* Header */}
      <div className="exam-header">
        <div className="exam-header-inner">
          <div className="exam-brand">
            <img src={logo} className="exam-logo" alt="Logo" width={100} />
            <div className="exam-title">Interaktív <br /> Vizsga</div>
          </div>

          <div className={`timer ${timerCritical ? 'timer-critical' : ''}`}>
            {mins}:{secs}
          </div>

          <button
            className="exit-btn"
            onClick={() => setShowExitConfirm(true)}
          >
            Kilépés
          </button>
        </div>
        <div className="exam-progress-bar">
          <div
            className="exam-progress-fill"
            style={{ width: `${(answered / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="exam-body container">
        {/* Kérdés navigáció */}
        <div className="question-nav">
          {questions.map((qq, i) => (
            <button
              key={qq.id}
              className={`nav-dot ${i === current ? 'active' : ''} ${answers[qq.id] !== undefined ? 'answered' : ''}`}
              onClick={() => setCurrent(i)}
              title={`${i + 1}. kérdés`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Kérdés kártya */}
        <div className="question-card card">
          <div className="question-meta">
            <span className="question-num">{current + 1}. kérdés</span>
            <span className="badge badge-info type-badge">{typeLabel(q.type)}</span>
          </div>

          <div className="question-text">{q.question_text}</div>

          {q.image_path && (
            <div className="question-image">
              <img
                src={`${api.defaults.baseURL.replace('/api', '')}${q.image_path}`}
                alt="Kérdés képe"
              />
            </div>
          )}

          {q.code_snippet && (
            <pre className="code-block"><code>{q.code_snippet}</code></pre>
          )}

          <div className="question-answers">
            {q.type === 'single' && (
              <SingleChoice
                options={q.options}
                value={answers[q.id]}
                onChange={val => saveAnswer(q.id, val)}
              />
            )}
            {q.type === 'multiple' && (
              <MultipleChoice
                options={q.options}
                value={answers[q.id] || []}
                onChange={val => saveAnswer(q.id, val)}
              />
            )}
            {q.type === 'sort' && (
              <SortQuestion
                items={q.sortItems}
                value={answers[q.id]}
                onChange={val => saveAnswer(q.id, val)}
              />
            )}
            {q.type === 'match' && (
              <MatchQuestion
                pairs={q.pairs}
                value={answers[q.id] || {}}
                onChange={val => saveAnswer(q.id, val)}
              />
            )}
          </div>
        </div>

        {/* Navigációs gombok */}
        <div className="exam-nav-buttons">
          <button
            className="btn btn-outline"
            onClick={() => setCurrent(c => c - 1)}
            disabled={current === 0}
          >
            Előző
          </button>

          {current < questions.length - 1 ? (
            <button
              className="btn btn-primary"
              onClick={() => setCurrent(c => c + 1)}
            >
              Következő
            </button>
          ) : (
            <button
              className="btn btn-success"
              onClick={() => finishExam(false)}
              disabled={finishing}
            >
              {finishing ? 'Kiértékelés...' : 'Vizsga befejezése'}
            </button>
          )}
        </div>
      </div>

      {/* Kiértékelés overlay */}
      {finishing && (
        <div className="overlay">
          <div className="overlay-box">
            <div className="spinner" />
            <p>Vizsga kiértékelése...</p>
          </div>
        </div>
      )}

      {/* Kilépés megerősítés */}
      {showExitConfirm && (
        <div className="overlay">
          <div className="confirm-modal">
            <div className="confirm-icon">!</div>
            <h2>Biztosan kilépsz?</h2>
            <p>Az eddigi válaszaid elvesznek, és a vizsga megszakad.</p>
            <div className="confirm-actions">
              <button
                className="confirm-cancel"
                onClick={() => setShowExitConfirm(false)}
              >
                Mégse
              </button>
              <button
                className="confirm-exit"
                onClick={() => {
                  clearInterval(timerRef.current);
                  sessionStorage.clear();
                  navigate('/');
                }}
              >
                Kilépés
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function typeLabel(type) {
  const labels = {
    single: 'Egy válasz',
    multiple: 'Több válasz',
    sort: 'Sorba rendezés',
    match: 'Párosítás',
    text: 'Szöveges'
  };
  return labels[type] || type;
}