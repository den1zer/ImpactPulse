import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useLocation } from 'react-router-dom';
import { FiStar, FiAward, FiSun, FiMoon } from 'react-icons/fi';
import API_BASE_URL from '../config/api.js';
import playSound from '../utils/sounds.js';
import { useRef } from 'react';

const POINT_LEVELS = [
  { level: 1, name: 'Новачок',     value: 500   },
  { level: 2, name: 'Спеціаліст', value: 1000  },
  { level: 3, name: 'Профі',       value: 3000  },
  { level: 4, name: 'Експерт',     value: 5000  },
  { level: 5, name: 'Майстер',     value: 10000 },
  { level: 6, name: 'Грандмайстер',value: 15000 },
  { level: 7, name: 'Легенда',     value: 20000 },
  { level: 8, name: 'Semigod',     value: 30000 },
];

/* Route → breadcrumb label */
const LABELS = {
  '/dashboard':        'Дашборд',
  '/tasks':            'Завдання',
  '/fundraisers':      'Збори',
  '/my-contributions': 'Мої заявки',
  '/add-help':         'Додати допомогу',
  '/rewards':          'Нагороди',
  '/profile':          'Профіль',
  '/instructions':     'Інструкція',
  '/support':          'Підтримка',
  '/guilds':           'Гільдії',
};

const DashboardHeader = () => {
  const [userData, setUserData] = useState({ username: '...', points: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [currentLevel, setCurrentLevel] = useState({ name: 'Рекрут' });
  const [progress, setProgress] = useState(0);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const location = useLocation();
  const prevPointsRef = useRef(0);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
    playSound('click', 0.15);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('userToken');
      if (!token) {
        setUserData({ username: 'Гість', points: 0 });
        setIsLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${API_BASE_URL}/api/users/me`, {
          headers: { 'x-auth-token': token },
        });
        const { username, points, profileCustomization } = res.data;
        setUserData({ username, points, profileCustomization });

        let achieved = null;
        let next = POINT_LEVELS[0];
        for (const lvl of POINT_LEVELS) {
          if (points >= lvl.value) achieved = lvl;
          else { next = lvl; break; }
        }

        setCurrentLevel(achieved || { name: 'Рекрут' });

        const start = achieved ? achieved.value : 0;
        const end   = next ? next.value : (achieved ? achieved.value : 500);
        const pct   = Math.min(((points - start) / Math.max(end - start, 1)) * 100, 100);
        setProgress(Math.round(pct));
        setIsLoading(false);

        if (prevPointsRef.current > 0 && points > prevPointsRef.current) {
          playSound('success', 0.25);
        }
        prevPointsRef.current = points;
      } catch {
        setUserData({ username: 'Помилка', points: 0 });
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, []);

  /* breadcrumb */
  const pageLabel = LABELS[location.pathname] || 'ImpactPulse';

  return (
    <header className="dashboard-header">
      {/* Left: breadcrumb */}
      <div className="header-left">
        <span className="header-subtitle">ImpactPulse</span>
        <h1>{pageLabel}</h1>
      </div>

      {/* Right: status + actions */}
      <div className="header-right">
        {/* Theme toggle */}
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title="Змінити тему"
          aria-label="Змінити тему"
        >
          {theme === 'dark' ? <FiSun /> : <FiMoon />}
        </button>

        {/* Points pill */}
        <div className="header-status-card">
          <span className="status-icon"><FiStar /></span>
          <span>{isLoading ? '—' : userData.points}</span>
          <strong>&nbsp;балів</strong>
        </div>

        {/* Level + progress */}
        <div className="header-progress-card">
          <span className="level-line">{currentLevel.name}</span>
          <div className="level-progress">
            <div className="level-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-muted" style={{ fontSize: '0.75rem' }}>{progress}%</span>
        </div>

        {/* Rewards CTA */}
        <Link to="/rewards" className="header-action-button">
          <FiAward /> Нагороди
        </Link>
      </div>
    </header>
  );
};

export default DashboardHeader;
