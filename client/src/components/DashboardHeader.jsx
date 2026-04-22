import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FiStar, FiAward, FiSun, FiMoon } from 'react-icons/fi';

const POINT_LEVELS = [
  { level: 1, name: 'Новачок', value: 500, icon: '🌱' },
  { level: 2, name: 'Спеціаліст', value: 1000, icon: '🛠️' },
  { level: 3, name: 'Профі', value: 3000, icon: '🚀' },
  { level: 4, name: 'Експерт', value: 5000, icon: '🏅' },
  { level: 5, name: 'Майстер', value: 10000, icon: '🎯' },
  { level: 6, name: 'Грандмайстер', value: 15000, icon: '🌟' },
  { level: 7, name: 'Легенда', value: 20000, icon: '🔥' },
  { level: 8, name: 'Semigod', value: 30000, icon: '👑' },
];

const DashboardHeader = () => {
  const [userData, setUserData] = useState({ username: 'Завантаження...', points: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [currentLevel, setCurrentLevel] = useState({ name: '---', icon: '🔒' });
  const [nextLevel, setNextLevel] = useState(null);
  const [progress, setProgress] = useState(0);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('userToken'));
        if (!token) {
          setUserData({ username: 'Гість', points: 0 });
          setIsLoading(false);
          return;
        }

        const config = { headers: { 'x-auth-token': token } };
        const res = await axios.get('http://localhost:5000/api/users/me', config);

        setUserData({
          username: res.data.username,
          points: res.data.points,
          selectedBadge: res.data.selectedBadge,
        });

        const userPoints = res.data.points;
        let achievedLevel = null;
        let nextLevelTarget = POINT_LEVELS[0];

        for (const level of POINT_LEVELS) {
          if (userPoints >= level.value) {
            achievedLevel = level;
          } else {
            nextLevelTarget = level;
            break;
          }
        }

        if (achievedLevel) {
          setCurrentLevel({ name: achievedLevel.name, icon: achievedLevel.icon });
        } else {
          setCurrentLevel({ name: 'Рекрут', icon: '👤' });
        }

        if (nextLevelTarget && (!achievedLevel || achievedLevel.level < POINT_LEVELS.length)) {
          setNextLevel(nextLevelTarget);
          const startValue = achievedLevel ? achievedLevel.value : 0;
          const endValue = nextLevelTarget.value;
          const progressValue = userPoints - startValue;
          const totalValue = Math.max(endValue - startValue, 1);
          setProgress(Math.min((progressValue / totalValue) * 100, 100));
        } else {
          setNextLevel(null);
          setProgress(100);
        }

        setIsLoading(false);
      } catch (err) {
        console.error(err);
        setUserData({ username: 'Помилка', points: 0 });
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <span className="header-subtitle">Панель керування</span>
        <h1>Привіт, {userData.username}!</h1>
      </div>

      <div className="header-right">
        <button className="theme-toggle-btn" onClick={toggleTheme} title="Змінити тему">
          {theme === 'dark' ? <FiSun /> : <FiMoon />}
        </button>

        <div className="header-status-card">
          <div className="status-icon">
            <FiStar />
          </div>
          <div>
            <span>Балів</span>
            <strong>{isLoading ? '---' : `${userData.points}`}</strong>
          </div>
        </div>

        <div className="header-progress-card">
          <div className="level-line">
            <span>{currentLevel.icon} {currentLevel.name}</span>
            <span>{isLoading ? '---%' : `${Math.round(progress)}%`}</span>
          </div>
          <div className="level-progress">
            <div className="level-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          {nextLevel ? (
            <p>До {nextLevel.name}: {Math.max(nextLevel.value - userData.points, 0)} балів</p>
          ) : (
            <p>Ви досягли максимального рівня!</p>
          )}
        </div>

        <Link to="/rewards" className="header-action-button">
          <FiAward /> Переглянути нагороди
        </Link>
      </div>
    </header>
  );
};

export default DashboardHeader;
