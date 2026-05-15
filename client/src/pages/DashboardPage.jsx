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
  const isGuest = localStorage.getItem('userRole') === 'guest';

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
                    <Link to="/login" className="action-item">Увійти для повного доступу →</Link>
                  ) : (
                    <>
                      <Link to="/add-help"         className="action-item">+ Нова заявка</Link>
                      <Link to="/my-contributions"  className="action-item">Переглянути заявки →</Link>
                      <Link to="/rewards"           className="action-item">Нагороди →</Link>
                      <Link to="/fundraisers"       className="action-item">Актуальні збори →</Link>
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
                  <h3>Live Feed ⚡</h3>
                  <p>Останні дії спільноти</p>
                </div>
                <div className="feed-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                  {feed.length > 0 ? (
                    feed.map((item, idx) => (
                      <div key={idx} className="feed-item" style={{ padding: '12px', background: 'rgba(var(--accent-color-rgb), 0.1)', borderRadius: '8px', borderLeft: '4px solid var(--accent-color)', animation: 'fadeIn 0.5s ease-out' }}>
                        {item.message}
                      </div>
                    ))
                  ) : (
                    <div style={{ color: 'var(--text-secondary)', padding: '12px', background: 'var(--card-bg)', borderRadius: '8px' }}>Поки що немає активності...</div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </AnimatedPage>
      </main>
    </div>
  );
};

export default DashboardPage;
