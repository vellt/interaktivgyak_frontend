import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import './QuestionForm.css';

const TYPES = [
  { value: 'single', label: '🔘 Egy helyes válasz' },
  { value: 'multiple', label: '☑️ Több helyes válasz' },
  { value: 'sort', label: '↕️ Sorba rendezés' },
  { value: 'match', label: '🔗 Párosítás' },
];

export default function QuestionForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [type, setType] = useState('single');
  const [questionText, setQuestionText] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [options, setOptions] = useState([{ text: '', correct: false }, { text: '', correct: false }]);
  const [pairs, setPairs] = useState([{ left: '', right: '' }, { left: '', right: '' }]);
  const [sortItems, setSortItems] = useState([{ text: '' }, { text: '' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/admin/questions/${id}`).then(({ data }) => {
      setType(data.type);
      setQuestionText(data.question_text);
      setCodeSnippet(data.code_snippet || '');
      if (data.options?.length) {
        setOptions(data.options.map(o => ({ text: o.option_text, correct: o.is_correct })));
      }
      if (data.pairs?.length) {
        setPairs(data.pairs.map(p => ({ left: p.left_item, right: p.right_item })));
      }
      if (data.sortItems?.length) {
        setSortItems(data.sortItems.map(s => ({ text: s.item_text })));
      }
    }).catch(() => navigate('/admin'));
  }, [id, isEdit, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');

    const formData = new FormData();
    formData.append('type', type);
    formData.append('question_text', questionText);
    if (codeSnippet) formData.append('code_snippet', codeSnippet);
    if (imageFile) formData.append('image', imageFile);
    if (type === 'single' || type === 'multiple') formData.append('options', JSON.stringify(options));
    if (type === 'match') formData.append('pairs', JSON.stringify(pairs));
    if (type === 'sort') formData.append('sortItems', JSON.stringify(sortItems));

    try {
      if (isEdit) {
        await api.put(`/admin/questions/${id}`, formData);
      } else {
        await api.post('/admin/questions', formData);
      }
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Mentési hiba');
    } finally {
      setLoading(false);
    }
  };

  // Options handlers
  const addOption = () => setOptions(o => [...o, { text: '', correct: false }]);
  const removeOption = (i) => setOptions(o => o.filter((_, j) => j !== i));
  const updateOption = (i, field, val) => setOptions(o => o.map((opt, j) => j === i ? { ...opt, [field]: val } : opt));
  const toggleCorrect = (i) => {
    if (type === 'single') {
      setOptions(o => o.map((opt, j) => ({ ...opt, correct: j === i })));
    } else {
      updateOption(i, 'correct', !options[i].correct);
    }
  };

  // Pairs handlers
  const addPair = () => setPairs(p => [...p, { left: '', right: '' }]);
  const removePair = (i) => setPairs(p => p.filter((_, j) => j !== i));
  const updatePair = (i, side, val) => setPairs(p => p.map((pair, j) => j === i ? { ...pair, [side]: val } : pair));

  // Sort handlers
  const addSort = () => setSortItems(s => [...s, { text: '' }]);
  const removeSort = (i) => setSortItems(s => s.filter((_, j) => j !== i));
  const updateSort = (i, val) => setSortItems(s => s.map((si, j) => j === i ? { text: val } : si));
  const moveSortUp = (i) => { if (i === 0) return; const n = [...sortItems]; [n[i-1], n[i]] = [n[i], n[i-1]]; setSortItems(n); };
  const moveSortDown = (i) => { if (i === sortItems.length-1) return; const n = [...sortItems]; [n[i], n[i+1]] = [n[i+1], n[i]]; setSortItems(n); };

  return (
    <div className="qform-page">
      <div className="qform-header">
        <button className="btn btn-outline" onClick={() => navigate('/admin')}>← Vissza</button>
        <h1>{isEdit ? '✏️ Kérdés szerkesztése' : '＋ Új kérdés'}</h1>
      </div>

      <div className="qform-body">
        <form onSubmit={submit} className="card">
          {error && <div className="alert alert-error">{error}</div>}

          {/* Típus */}
          <div className="form-group">
            <label>Kérdés típusa</label>
            <div className="type-selector">
              {TYPES.map(t => (
                <button
                  key={t.value} type="button"
                  className={`type-btn ${type === t.value ? 'active' : ''}`}
                  onClick={() => setType(t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Kérdés szövege */}
          <div className="form-group">
            <label>Kérdés szövege *</label>
            <textarea
              value={questionText}
              onChange={e => setQuestionText(e.target.value)}
              rows={4} required
              placeholder="Írja be a kérdés szövegét..."
            />
          </div>

          {/* Kép */}
          <div className="form-group">
            <label>Kép csatolása (opcionális)</label>
            <input
              type="file" accept="image/*"
              onChange={e => setImageFile(e.target.files[0])}
              style={{ padding: '6px' }}
            />
          </div>

          {/* Kód snippet */}
          <div className="form-group">
            <label>Kódblokk (opcionális)</label>
            <textarea
              value={codeSnippet}
              onChange={e => setCodeSnippet(e.target.value)}
              rows={5}
              placeholder="const x = 10; ..."
              style={{ fontFamily: 'Consolas, monospace', fontSize: '13px' }}
            />
          </div>

          {/* Single / Multiple choices */}
          {(type === 'single' || type === 'multiple') && (
            <div className="form-group">
              <label>Válaszlehetőségek {type === 'single' ? '(egy helyes)' : '(több helyes lehetséges)'}</label>
              <div className="options-list">
                {options.map((opt, i) => (
                  <div key={i} className={`option-row ${opt.correct ? 'correct' : ''}`}>
                    <button
                      type="button"
                      className={`correct-toggle ${opt.correct ? 'is-correct' : ''}`}
                      onClick={() => toggleCorrect(i)}
                      title="Helyes válasz megjelölése"
                    >
                      {opt.correct ? '✅' : '⬜'}
                    </button>
                    <input
                      type="text"
                      value={opt.text}
                      onChange={e => updateOption(i, 'text', e.target.value)}
                      placeholder={`${i + 1}. válaszlehetőség`}
                      required
                    />
                    {options.length > 2 && (
                      <button type="button" className="btn btn-danger remove-btn" onClick={() => removeOption(i)}>✕</button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" className="btn btn-outline" onClick={addOption} style={{ marginTop: 8 }}>
                ＋ Válasz hozzáadása
              </button>
            </div>
          )}

          {/* Match pairs */}
          {type === 'match' && (
            <div className="form-group">
              <label>Párosítandó elemek (bal oldal → jobb oldal)</label>
              <div className="pairs-list">
                {pairs.map((pair, i) => (
                  <div key={i} className="pair-row">
                    <input
                      type="text" value={pair.left}
                      onChange={e => updatePair(i, 'left', e.target.value)}
                      placeholder="Bal oldal" required
                    />
                    <span className="pair-arrow">↔</span>
                    <input
                      type="text" value={pair.right}
                      onChange={e => updatePair(i, 'right', e.target.value)}
                      placeholder="Jobb oldal" required
                    />
                    {pairs.length > 2 && (
                      <button type="button" className="btn btn-danger remove-btn" onClick={() => removePair(i)}>✕</button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" className="btn btn-outline" onClick={addPair} style={{ marginTop: 8 }}>
                ＋ Pár hozzáadása
              </button>
            </div>
          )}

          {/* Sort items */}
          {type === 'sort' && (
            <div className="form-group">
              <label>Sorba rendezendő elemek (felülről lefelé a helyes sorrend)</label>
              <div className="sort-list">
                {sortItems.map((si, i) => (
                  <div key={i} className="sort-row">
                    <span className="sort-num">{i + 1}</span>
                    <input
                      type="text" value={si.text}
                      onChange={e => updateSort(i, e.target.value)}
                      placeholder={`${i + 1}. elem`} required
                    />
                    <div className="sort-ctrl">
                      <button type="button" onClick={() => moveSortUp(i)} disabled={i === 0}>▲</button>
                      <button type="button" onClick={() => moveSortDown(i)} disabled={i === sortItems.length - 1}>▼</button>
                    </div>
                    {sortItems.length > 2 && (
                      <button type="button" className="btn btn-danger remove-btn" onClick={() => removeSort(i)}>✕</button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" className="btn btn-outline" onClick={addSort} style={{ marginTop: 8 }}>
                ＋ Elem hozzáadása
              </button>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => navigate('/admin')}>Mégse</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Mentés...' : (isEdit ? 'Módosítás mentése' : 'Kérdés létrehozása')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
