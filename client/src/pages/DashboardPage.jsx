import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AnimatedPage from '../components/AnimatedPage';
import StatsChart from '../components/StatsChart';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';
import '../styles/Dashboard.css';
import API_BASE_URL from '../config/api.js';


const DashboardPage = () => {
  const [contributions, setContributions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('userToken')) || '';
        const config = { headers: { 'x-auth-token': token } };
        const isGuest = localStorage.getItem('userRole') === 'guest';

        const requests = [axios.get(`${API_BASE_URL}/api/users/leaderboard`, config)];
        if (!isGuest) {
          requests.push(axios.get(`${API_BASE_URL}/api/contributions/my`, config));
        }

        const responses = await Promise.all(requests);
        setLeaderboard(responses[0].data);
        if (!isGuest && responses[1]) {
          setContributions(responses[1].data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = useMemo(() => {
    const totalApproved = contributions.filter(c => c.status === 'approved').length;
    const totalPending = contributions.filter(c => c.status === 'pending').length;
    const totalContributions = contributions.length;
    return { totalApproved, totalPending, totalContributions };
  }, [contributions]);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <DashboardHeader />
        <AnimatedPage>
          <section className="dashboard-hero">
            <div className="hero-summary-card">
              <div>
                <p className="small-title">Ваш прогрес</p>
                <h2>Стан рахунку та актуальні задачі</h2>
                <p className="hero-description">
                  Легко відстежуйте активність, створюйте нові заявки та слідкуйте за топ-учасниками.
                </p>
              </div>
              <div className="hero-quick-actions">
                {localStorage.getItem('userRole') !== 'guest' ? (
                  <Link to="/add-help" className="hero-action-button">
                    Додати допомогу
                  </Link>
                ) : (
                  <Link to="/login" className="hero-action-button">
                    Авторизуватись
                  </Link>
                )}
              </div>
            </div>

            <div className="dashboard-metrics-grid">
              <div className="metric-card metric-primary">
                <span>Усього заявок</span>
                <strong>{loading ? '...' : stats.totalContributions}</strong>
              </div>
              <div className="metric-card metric-accent">
                <span>Схвалено</span>
                <strong>{loading ? '...' : stats.totalApproved}</strong>
              </div>
              <div className="metric-card metric-secondary">
                <span>У черзі</span>
                <strong>{loading ? '...' : stats.totalPending}</strong>
              </div>
            </div>
          </section>

          <section className="dashboard-grid">
            <div className="panel-card panel-chart">
              <StatsChart contributions={contributions.map(item => item.amount || 1)} />
            </div>

            <div className="panel-card panel-actions">
              <h3>Швидкі дії</h3>
              <div className="action-list">
                {localStorage.getItem('userRole') !== 'guest' ? (
                  <>
                    <Link to="/add-help" className="action-item">
                      <span>+ Нова заявка</span>
                    </Link>
                    <Link to="/my-contributions" className="action-item">
                      <span>Переглянути заявки</span>
                    </Link>
                    <Link to="/rewards" className="action-item">
                      <span>Нагороди</span>
                    </Link>
                  </>
                ) : (
                  <Link to="/login" className="action-item">
                    <span>Увійти для всіх можливостей</span>
                  </Link>
                )}
              </div>
            </div>

            <div className="panel-card panel-leaderboard">
              <div className="panel-heading">
                <h3>Лідери спільноти</h3>
                <p>Топ 10 активних користувачів</p>
              </div>
              <ul className="leaderboard-list">
                {loading ? (
                  <li className="leaderboard-loading">Завантаження...</li>
                ) : leaderboard.length > 0 ? (
                  leaderboard.slice(0, 10).map((user, index) => (
                    <li key={user._id} className="leaderboard-item">
                      <span className="leaderboard-rank">#{index + 1}</span>
                      <img
                        src={user.avatar ? (user.avatar.startsWith('http') ? user.avatar : `${API_BASE_URL}/${user.avatar}`) : 'https://icon-library.com/images/default-user-icon/default-user-icon-8.jpg'}
                        alt={user.username}
                        className={`leaderboard-avatar frame-${user.profileCustomization?.avatarFrame || 'none'}`}
                        onError={(e) => { e.target.src = 'https://icon-library.com/images/default-user-icon/default-user-icon-8.jpg'; }}
                      />
                      <span className="leaderboard-name">
                        {user.username}
                        {user.profileCustomization?.nicknameIcon ? ` ${user.profileCustomization.nicknameIcon}` : ''}
                        {user.selectedBadge?.icon ? ` ${user.selectedBadge.icon}` : ''}
                      </span>
                      <strong className="leaderboard-points">{user.points}</strong>
                    </li>
                  ))
                ) : (
                  <li className="leaderboard-empty">Немає активних користувачів</li>
                )}
              </ul>
            </div>
          </section>
        </AnimatedPage>
      </main>
    </div>
  );
};

export default DashboardPage;
