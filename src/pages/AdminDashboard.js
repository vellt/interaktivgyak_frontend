import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('questions');
  const [search, setSearch] = useState('');
  const username = localStorage.getItem('adminUsername');

  const load = async () => {
    setLoading(true);
    try {
      const [qRes, sRes] = await Promise.all([
        api.get('/admin/questions'),
        api.get('/admin/stats')
      ]);
      setQuestions(qRes.data);
      setStats(sRes.data);
    } catch (e) {
      if (e.response?.status === 401) logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUsername');
    navigate('/admin/login');
  };

  const deleteQuestion = async (id) => {
    if (!window.confirm('Biztosan törlöd ezt a kérdést?')) return;
    await api.delete(`/admin/questions/${id}`);
    load();
  };

  const typeLabel = { single: '1 választós', multiple: 'Több választós', sort: 'Sorba rendezés', match: 'Párosítás', text: 'Szöveges' };
  const filtered = questions.filter(q =>
    q.question_text.toLowerCase().includes(search.toLowerCase()) ||
    typeLabel[q.type]?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-page">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="admin-brand">Admin Panel</div>
        <div className="admin-user">{username}</div>
        <nav className="admin-nav">
          <button className={tab === 'questions' ? 'active' : ''} onClick={() => setTab('questions')}>
            Kérdések
          </button>
          <button className={tab === 'stats' ? 'active' : ''} onClick={() => setTab('stats')}>
            Statisztikák
          </button>
        </nav>
        <button className="btn " onClick={logout}>Kilépés</button>
      </div>

      {/* Main */}
      <div className="admin-main">
        {loading ? (
          <div className="spinner" />
        ) : tab === 'questions' ? (
          <div>
            <div className="admin-toolbar">
              <h1>Kérdések <span className="count-badge">{questions.length}</span></h1>
              <div className="toolbar-actions">
                <input
                  type="text"
                  placeholder="Keresés..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ width: '240px' }}
                />
                <Link to="/admin/questions/new" className="btn btn-primary">
                  ＋ Új kérdés
                </Link>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="empty-state">
                <p>Nincs kérdés. Hozz létre egyet!</p>
                <Link to="/admin/questions/new" className="btn btn-primary">＋ Első kérdés létrehozása</Link>
              </div>
            ) : (
              <div className="questions-table">
                {filtered.map((q, i) => (
                  <div key={q.id} className="q-row">
                    <div className="q-num">{i + 1}</div>
                    <div className="q-body">
                      <div className="q-text">{q.question_text.substring(0, 120)}{q.question_text.length > 120 ? '...' : ''}</div>
                      <div className="q-meta">
                        <span className={`badge badge-info`}>{typeLabel[q.type] || q.type}</span>
                        {q.image_path && <span className="badge badge-info">Kép</span>}
                        {q.code_snippet && <span className="badge badge-info">Kód</span>}
                      </div>
                    </div>
                    <div className="q-actions">
                      <Link to={`/admin/questions/${q.id}/edit`} className="btn btn-outline">Szerkesztés</Link>
                      <button className="btn btn-danger" onClick={() => deleteQuestion(q.id)}>Törlés</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <h1>Statisztikák</h1>
            {stats && (
              <>
                <div className="stats-cards">
                  <div className="stat-card">
                    <div className="stat-card-val">{stats.totalQuestions}</div>
                    <div className="stat-card-label">Kérdések száma</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-val">{stats.totalExams}</div>
                    <div className="stat-card-label">Megírt vizsgák</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-val">{stats.passedExams}</div>
                    <div className="stat-card-label">Sikeres vizsgák</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-val">{stats.avgScore}%</div>
                    <div className="stat-card-label">Átlagos eredmény</div>
                  </div>
                </div>

                <h2 style={{ marginTop: 28, marginBottom: 16 }}>Legutóbbi vizsgák</h2>
                <div className="exams-table">
                  <div className="exams-header">
                    <span>Időpont</span>
                    <span>Eredmény</span>
                    <span>Százalék</span>
                    <span>Eredmény</span>
                    <span>Idő lejárt</span>
                  </div>
                  {stats.recentExams.map(ex => (
                    <div key={ex.id} className="exam-row">
                      <span>{new Date(ex.finished_at).toLocaleString('hu-HU')}</span>
                      <span>{ex.score}/{ex.max_score}</span>
                      <span>{ex.percentage}%</span>
                      <span className={`badge ${ex.passed ? 'badge-success' : 'badge-danger'}`}>
                        {ex.passed ? 'Sikeres' : 'Sikertelen'}
                      </span>
                      <span>{ex.time_expired ? 'Igen' : '—'}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
