import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ResultPage.css";
import api from "../api";

export default function ResultPage() {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("examResult");
    if (!stored) {
      navigate("/");
      return;
    }
    setResult(JSON.parse(stored));
  }, [navigate]);

  if (!result) return <div className="spinner" />;

  const {
    score,
    maxScore,
    percentage,
    passed,
    passPercentage,
    results,
    questions,
    userAnswers,
    correctAnswers,
    timeExpired,
  } = result;
  const wrong = maxScore - score;
  const unanswered = (questions?.length || maxScore) - (results?.length || 0);

  const resultMap = {};
  if (results)
    results.forEach((r) => {
      resultMap[r.questionId] = r.isCorrect;
    });

  return (
    <div className="result-page">
      <div className="container">
        {/* Header eredmény */}
        <div className={`result-hero card`}>
          <h1>{passed ? "Sikeres vizsga!" : "Sikertelen vizsga"}</h1>
          {timeExpired && (
            <p className="time-expired-note">
              Az idő lejárt – a vizsga automatikusan lezárult
            </p>
          )}

          <div
            className={`result-percent ${passed ? "passed" : "failed"}`}
            style={{ "--percent": `${percentage}%` }}
          >
            <span>{percentage}%</span>
          </div>

          <div className="result-stats">
            <div className="stat-item">
              <div className="stat-val correct">{score}</div>
              <div className="stat-label">Helyes</div>
            </div>
            <div className="stat-item">
              <div className="stat-val incorrect">{wrong}</div>
              <div className="stat-label">Hibás</div>
            </div>
           
            <div className="stat-item">
              <div className="stat-val unanswered">{unanswered}</div>
              <div className="stat-label">Megválaszolatlan</div>
            </div>
            
          </div>

          <div className="pass-info">
            Minimum szükséges: <strong>{passPercentage}%</strong> —
            {passed
              ? " Elérted!"
              : ` Nem érted el (hiányzott: ${(passPercentage - percentage).toFixed(1)}%)`}
          </div>
        </div>

        {/* Kérdésenkénti áttekintés */}
        {questions && (
          <div className="questions-review">
            <h2>Részletes áttekintés</h2>
            {console.log(questions)}
            {questions.map((q, idx) => {
              const isCorrect = resultMap[q.id];
              const wasAnswered =
                userAnswers && userAnswers[q.id] !== undefined;
              const userAnswer = userAnswers?.[q.id];
              const correct =
                correctAnswers?.[q.id] ??
                q.correctAnswers ??
                q.correct_answers ??
                q.correctAnswer ??
                q.correct_answer ??
                q.answers ??
                [];

              return (
                <div
                  key={q.id}
                  className={`review-item card ${isCorrect ? "review-correct" : wasAnswered ? "review-incorrect" : "review-unanswered"}`}
                >
                  <div className="review-header">
                    <span className="review-num">{idx + 1}.</span>
                    <span
                      className={`review-status ${isCorrect ? "correct" : wasAnswered ? "incorrect" : "unanswered"}`}
                    >
                      {isCorrect
                        ? "Helyes"
                        : wasAnswered
                          ? "Hibás"
                          : "Nem válaszolt"}
                    </span>
                    <span className="review-type-badge">
                      {typeLabel(q.type)}
                    </span>
                  </div>

                  <div className="review-question">{q.question_text}</div>

                  {q.image_path && (
                    <div className="review-image">
                      <img
                        src={`${api.defaults.baseURL.replace("/api", "")}${q.image_path}`}
                        alt="Kérdés kép"
                      />
                    </div>
                  )}

                  {q.code_snippet && (
                    <pre className="code-block small">
                      <code>{q.code_snippet}</code>
                    </pre>
                  )}

                  {/* Válasz megjelenítő */}
                  <AnswerReview
                    type={q.type}
                    userAnswer={userAnswer}
                    correctAnswer={correct}
                    isCorrect={isCorrect}
                    question={q}
                  />
                </div>
              );
            })}
          </div>
        )}

        <div className="result-actions">
          <button
            className="btn btn-primary btn-lg"
            onClick={() => {
              sessionStorage.clear();
              navigate("/");
            }}
          >
            Vissza a kezdőlapra
          </button>
        </div>
      </div>
    </div>
  );
}

function typeLabel(type) {
  const labels = {
    single: "Egy válasz",
    multiple: "Több válasz",
    sort: "Sorba rendezés",
    match: "Párosítás",
  };
  return labels[type] || type;
}

// ---- Válasz megjelenítő komponens ----
function AnswerReview({
  type,
  userAnswer,
  correctAnswer,
  isCorrect,
  wasAnswered,
  question,
}) {
  if (type === "single" || type === "multiple") {
    const options = question.options || [];

    const correctList = Array.isArray(correctAnswer)
      ? correctAnswer
      : options.filter((opt) => opt.is_correct || opt.isCorrect || opt.correct);

    const correctIds = correctList.map((c) => c.id);

    const userIds = Array.isArray(userAnswer)
      ? userAnswer
      : userAnswer !== undefined && userAnswer !== null
        ? [userAnswer]
        : [];

    return (
      <div className="answer-review">
        <div className="answer-cols">
          <div className="answer-col">
            <div className="answer-col-label">A válaszod</div>

            <div className="answer-option-list">
              {options.length > 0 ? (
                options.map((opt) => {
                  const userPicked = userIds.includes(opt.id);

                  const isCorrectOption = correctIds.includes(opt.id);

                  let optionClass = "opt-muted";

                  /* Válaszolt */
                  if (userIds.length > 0) {
                    /* Rossz válasz */
                    if (userPicked && !isCorrectOption) {
                      optionClass = "opt-wrong";
                    }

                    /* Jó válasz */
                    if (userPicked && isCorrectOption) {
                      optionClass = "opt-correct";
                    }
                  }

                  return (
                    <div key={opt.id} className={`answer-opt ${optionClass}`}>
                      {opt.option_text}
                    </div>
                  );
                })
              ) : (
                <div className="answer-empty">
                  Nincs elérhető válaszlehetőség
                </div>
              )}
            </div>
          </div>
          <div className="answer-col">
            <div className="answer-col-label">Helyes válasz</div>

            <div className="answer-option-list">
              {correctList.length > 0 ? (
                correctList.map((opt) => (
                  <div key={opt.id} className="answer-opt opt-correct">
                    {opt.option_text}
                  </div>
                ))
              ) : (
                <div className="answer-empty">Nincs elérhető helyes válasz</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === "sort") {
    const sortedCorrect = Array.isArray(correctAnswer)
      ? [...correctAnswer].sort(
          (a, b) => a.correct_position - b.correct_position,
        )
      : [];

    const itemMap = {};
    sortedCorrect.forEach((item) => {
      itemMap[item.id] = item.item_text;
    });

    const userOrder = Array.isArray(userAnswer) ? userAnswer : [];

    return (
      <div className="answer-review">
        <div className="answer-cols">
          <div className="answer-col">
            <div className="answer-col-label">Te rendezted</div>

            <div className="sort-review-list">
              {userOrder.length > 0 ? (
                userOrder.map((id, i) => {
                  const correctItem = sortedCorrect.find((c) => c.id === id);
                  const isRightPos = correctItem?.correct_position === i + 1;

                  return (
                    <div
                      key={id}
                      className={`sort-review-item ${isRightPos ? "pos-correct" : "pos-wrong"}`}
                    >
                      <span className="sort-pos-num">{i + 1}</span>
                      <span className="sort-pos-text">{itemMap[id] || id}</span>
                    </div>
                  );
                })
              ) : (
                <div className="answer-empty">Nem válaszoltál</div>
              )}
            </div>
          </div>

          <div className="answer-col">
            <div className="answer-col-label">Helyes sorrend</div>

            <div className="sort-review-list">
              {sortedCorrect.length > 0 ? (
                sortedCorrect.map((item, i) => (
                  <div key={item.id} className="sort-review-item pos-correct">
                    <span className="sort-pos-num">{i + 1}</span>
                    <span className="sort-pos-text">{item.item_text}</span>
                  </div>
                ))
              ) : (
                <div className="answer-empty">
                  Nincs elérhető helyes sorrend
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === "match") {
    const pairs = Array.isArray(correctAnswer) ? correctAnswer : [];

    return (
      <div className="answer-review">
        <div className="answer-col-label" style={{ marginBottom: 10 }}>
          Párosítás eredménye
        </div>

        <div className="match-review-list">
          {pairs.length > 0 ? (
            pairs.map((pair) => {
              const userPicked = userAnswer?.[pair.id];

              const isRight =
                userPicked &&
                userPicked.toString().trim().toLowerCase() ===
                  pair.right_item.toString().trim().toLowerCase();

              return (
                <div
                  key={pair.id}
                  className={`match-review-row ${isRight ? "match-correct" : "match-wrong"}`}
                >
                  <span className="match-left-item">{pair.left_item}</span>

                  <span className="match-arrow">↔</span>

                  <div className="match-answers">
                    {userPicked ? (
                      <span
                        className={`match-answer ${isRight ? "is-right" : "is-wrong"}`}
                      >
                        Te: {userPicked}
                      </span>
                    ) : (
                      <span className="match-answer is-empty">
                        Te: nem párosítottad
                      </span>
                    )}

                    <span className="match-answer is-correct-hint">
                      Helyes: {pair.right_item}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="answer-empty">Nincs elérhető helyes párosítás</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="answer-review">
      <div className="answer-empty">
        Ehhez a kérdéstípushoz nincs válaszmegjelenítés.
      </div>
    </div>
  );
}
