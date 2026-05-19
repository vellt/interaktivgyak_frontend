import React from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './StartPage.css';
import logo from '../images/logo-1.png';

export default function StartPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [rulesOpen, setRulesOpen] = React.useState(false);

  const startExam = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/exam/start');
      sessionStorage.setItem('examData', JSON.stringify(data));
      navigate('/exam');
    } catch (e) {
      setError(e.response?.data?.error || 'Hiba a vizsga indításakor. Ellenőrizd, hogy fut-e a szerver!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="start-page">
      <div className="start-hero">
        <img src={logo} alt="Logo" />
        <h1>Szoftverfejlesztő és -tesztelő</h1>
        <p className="subtitle">Interaktív gyakorló</p>

        <div className="info-cards">
          <div className="info-card">
            <div className="info-value">45</div>
            <div className="info-label">perc</div>
          </div>
          <div className="info-card">
            <div className="info-value">20</div>
            <div className="info-label">kérdés</div>
          </div>
          <div className="info-card">
            <div className="info-value">40%</div>
            <div className="info-label">minimum</div>
          </div>
        </div>

        <div className={`rules ${rulesOpen ? 'open' : ''}`}>
        <button
          type="button"
          className="rules-toggle"
          onClick={() => setRulesOpen(o => !o)}
          aria-expanded={rulesOpen}
        >
          <span>Tudnivalók</span>
          <span className="rules-arrow">›</span>
        </button>

        <div className="rules-content">
          <div className="rules-content-inner">
            <ul>
            <li>A vizsga során <strong>20 véletlenszerű kérdés</strong> kerül kiválasztásra a kérdésbankból</li>
            <li>A rendelkezésre álló idő <strong>45 perc</strong> – az idő lejártával a vizsga automatikusan lezárul</li>
            <li>Az eredményes teljesítéshez a kérdések legalább <strong>40%-át</strong> szükséges helyesen megválaszolni</li>
            <li>Minden helyes válasz <strong>1 pontot</strong> ér, hibás válasz esetén <strong>0 pont</strong> jár</li>
            <li>A kérdések között szabadon navigálhatsz</li>
          </ul>
          </div>
        </div>
      </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="result-actions">
          <button className="btn btn-primary btn-lg" onClick={startExam} disabled={loading}>
          {loading ? 'Indítás...' : 'Vizsga indítása'}
        </button>
        </div>

        <a href="/admin/login" className="admin-link"> Admin belépés</a>
      </div>
    </div>
  );
}
