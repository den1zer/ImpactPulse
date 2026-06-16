import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import AnimatedPage from '../components/AnimatedPage';
import StatsChart from '../components/StatsChart';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';
import '../styles/Dashboard.css';
import API_BASE_URL from '../config/api.js';

const DashboardPage = () => {
  const [contributions, setContributions] = useState([]);
  const [leaderboard, setLeaderboard]     = useState([]);
  const [feed, setFeed]                   = useState([]);
  const [loading, setLoading]             = useState(true);
  const userRole = localStorage.getItem('userRole');
  const isGuest = userRole === 'guest';
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/activities`);
        setFeed(res.data);
      } catch (err) {
        console.error('fetchActivities error:', err);
      }
    };

    fetchActivities();

    const socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });

    socket.on('connect', () => {
      console.log('Socket connected to server');
    });

    socket.on('activity_feed', (data) => {
      console.log('Received activity_feed event:', data);
      setFeed(prev => [data, ...prev].slice(0, 10)); // keep last 10
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token  = localStorage.getItem('userToken') || '';
        const config = { headers: { 'x-auth-token': token } };

        const reqs = [axios.get(`${API_BASE_URL}/api/users/leaderboard`, config)];
        if (!isGuest) reqs.push(axios.get(`${API_BASE_URL}/api/contributions/my`, config));

        const [lbRes, contribRes] = await Promise.all(reqs);
        // getLeaderboard returns either an array (old) or {topAllTime,...} (new)
        const lbData = lbRes.data;
        const leaderboardList = Array.isArray(lbData)
          ? lbData
          : (lbData?.topAllTime || []);
        setLeaderboard(leaderboardList);
        if (!isGuest && contribRes) setContributions(contribRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = useMemo(() => ({
    totalContributions: contributions.length,
    totalApproved:      contributions.filter(c => c.status === 'approved').length,
    totalPending:       contributions.filter(c => c.status === 'pending').length,
  }), [contributions]);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <DashboardHeader />
        <AnimatedPage>
          <div className="dashboard-content-wrapper">
            
            {isAdmin && (
              <div className="admin-download-banner" style={{
                background: 'var(--yellow, #ffe500)',
                border: '2px solid var(--border-color, #000)',
                padding: '24px',
                marginBottom: '24px',
                boxShadow: '4px 4px 0 var(--shadow-color, #000)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                alignItems: 'flex-start',
                color: '#000'
              }}>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', fontSize: '18px', fontWeight: 800 }}>
                  Панель Адміністратора
                </h3>
                <p style={{ margin: 0, fontWeight: 600, lineHeight: 1.5, fontSize: '14px', maxWidth: '600px' }}>
                  Для управління платформою (модерація користувачів, зборів коштів та перевірки заявок на допомогу), будь ласка, завантажте десктопний додаток <strong>ImpactPulse Admin</strong>.
                </p>
                <a 
                  href="https://drive.google.com/drive/folders/1-_hs3KVTzp9CB9MWoBySKVZQC1rkb8Rt?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: '#000',
                    color: '#fff',
                    padding: '12px 24px',
                    textDecoration: 'none',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    fontSize: '13px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginTop: '8px',
                    boxShadow: '2px 2px 0 rgba(0,0,0,0.2)',
                    transition: 'transform 0.1s, box-shadow 0.1s'
                  }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translate(2px, 2px)'; e.currentTarget.style.boxShadow = 'none'; }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '2px 2px 0 rgba(0,0,0,0.2)'; }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  Завантажити ImpactPulse Admin
                </a>
              </div>
            )}

            {!isAdmin && (
              <>
                {/* ── Hero ── */}
                <div className="dashboard-hero">
                  <div className="hero-summary-card">
                    <div>
                      <p className="small-title">Огляд активності</p>
                      <h2>Ваш прогрес</h2>
                      <p className="hero-description">
                        Відстежуйте заявки, беріть участь у зборах та слідкуйте за лідерами спільноти.
                      </p>
                    </div>
                    <div className="hero-quick-actions">
                      <Link
                        to={isGuest ? '/login' : '/add-help'}
                        className="hero-action-button"
                      >
                        {isGuest ? 'Авторизуватись' : '+ Нова заявка'}
                      </Link>
                    </div>
                  </div>

                  {/* ── KPI cards ── */}
                  <div className="dashboard-metrics-grid">
                    <div className="metric-card metric-primary">
                      <span>Усього заявок</span>
                      <strong>{loading ? '—' : stats.totalContributions}</strong>
                    </div>
                    <div className="metric-card metric-accent">
                      <span>Схвалено</span>
                      <strong>{loading ? '—' : stats.totalApproved}</strong>
                    </div>
                    <div className="metric-card metric-secondary">
                      <span>На розгляді</span>
                      <strong>{loading ? '—' : stats.totalPending}</strong>
                    </div>
                  </div>
                </div>

                {/* ── Main grid ── */}
                <div className="dashboard-grid">
                  <div className="panel-card panel-chart">
                    <StatsChart contributions={contributions} />
                  </div>
                  <div className="panel-card panel-actions">
                    <div className="panel-heading">
                      <h3>Швидкі дії</h3>
                    </div>
                    <div className="action-list">
                      {isGuest ? (
                        <Link to="/login" className="action-item">
                          Увійти для повного доступу
                          <svg style={{marginLeft:'auto'}} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                        </Link>
                      ) : (
                        <>
                          <Link to="/add-help"         className="action-item">
                            + Нова заявка
                            <svg style={{marginLeft:'auto'}} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                          </Link>
                          <Link to="/my-contributions"  className="action-item">
                            Переглянути заявки
                            <svg style={{marginLeft:'auto'}} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                          </Link>
                          <Link to="/rewards"           className="action-item">
                            Нагороди
                            <svg style={{marginLeft:'auto'}} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                          </Link>
                          <Link to="/fundraisers"       className="action-item">
                            Актуальні збори
                            <svg style={{marginLeft:'auto'}} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                          </Link>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Leaderboard */}
                  <div className="panel-card panel-leaderboard">
                    <div className="panel-heading">
                      <h3>Лідери спільноти</h3>
                      <p>Топ-10 найактивніших учасників</p>
                    </div>

                    <ul className="leaderboard-list">
                      {loading ? (
                        <li className="leaderboard-loading">Завантаження…</li>
                      ) : leaderboard.length > 0 ? (
                        leaderboard.slice(0, 10).map((user, i) => (
                          <Link to={`/user/${user._id}`} key={user._id} className="leaderboard-item" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', transition: 'background 0.2s', padding: '8px', borderRadius: '8px' }}>
                            <span className="leaderboard-rank">#{i + 1}</span>
                            <img
                              className={`leaderboard-avatar frame-${user.profileCustomization?.avatarFrame || 'none'}`}
                              src={
                                user.avatar
                                  ? (user.avatar.startsWith('http') ? user.avatar : `${API_BASE_URL}/${user.avatar}`)
                                  : '/default-avatar.svg'
                              }
                              alt={user.username}
                              onError={e => { e.target.src = '/default-avatar.svg'; }}
                            />
                            <span className="leaderboard-name">
                              {user.username}
                              {user.profileCustomization?.nicknameIcon ? ` ${user.profileCustomization.nicknameIcon}` : ''}
                              {user.selectedBadge?.icon ? ` ${user.selectedBadge.icon}` : ''}
                            </span>
                            <strong className="leaderboard-points" style={{ marginLeft: 'auto' }}>{user.points}</strong>
                          </Link>
                        ))
                      ) : (
                        <li className="leaderboard-empty">Немає активних учасників</li>
                      )}
                    </ul>
                  </div>
                  {/* Live Feed */}
                  <div className="panel-card panel-feed">
                    <div className="panel-heading">
                      <h3>Live Feed</h3>
                      <p>Останні дії спільноти</p>
                    </div>
                    <div className="feed-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                      {feed.length > 0 ? (
                        feed.map((item, idx) => (
                          <div key={idx} className="feed-item">
                            {item.message}
                          </div>
                        ))
                      ) : (
                        <div className="feed-item" style={{ opacity: 0.5, fontFamily: 'var(--font-mono)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Поки що немає активності...</div>
                      )}
                    </div>
                  </div>

                </div>
              </>
            )}

          </div>
        </AnimatedPage>
      </main>
    </div>
  );
};

export default DashboardPage;
