import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AnimatedPage from '../components/AnimatedPage';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';
import { getQuests, claimQuest, getLeaderboards, getBadges } from '../api/gameApi';
import API_BASE_URL from '../config/api.js';
import '../styles/Dashboard.css';
import '../styles/RewardsPage.css';

const LEVELS = [
  { level: 1, name: 'Новобранець', threshold: 0, icon: '🌱' },
  { level: 2, name: 'Дослідник', threshold: 100, icon: '🔍' },
  { level: 3, name: 'Ентузіаст', threshold: 300, icon: '🔥' },
  { level: 4, name: 'Активіст', threshold: 600, icon: '⚡' },
  { level: 5, name: 'Провідник', threshold: 1000, icon: '🧭' },
  { level: 6, name: 'Лідер', threshold: 1500, icon: '👑' },
  { level: 7, name: 'Герой', threshold: 2500, icon: '🦸' }
];

const getLevelData = (xp = 0) => {
  let current = LEVELS[0];
  let next = LEVELS[1];
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].threshold) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || null;
    } else {
      break;
    }
  }
  let progress = 100;
  if (next) {
    progress = ((xp - current.threshold) / (next.threshold - current.threshold)) * 100;
  }
  return { current, next, progress };
};

const BadgeDisplay = ({ user, badge }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const isUnlocked = user.badges?.some(b => b.badgeId === badge.id);
  
  return (
    <motion.div className="badge-card" onClick={() => setIsFlipped(f => !f)}>
      <motion.div className="badge-inner" animate={{ rotateY: isFlipped ? 180 : 0 }} transition={{ duration: 0.6 }}>
        <div className={`badge-front ${!isUnlocked ? 'badge-locked' : ''}`}>
          <div className="badge-icon">{isUnlocked ? badge.icon : '🔒'}</div>
          <h3 className="badge-name">{badge.name}</h3>
        </div>
        <div className="badge-back">
          <h3 className="badge-name">{badge.name}</h3>
          <p className="badge-description">{badge.description}</p>
          <p className="badge-status">
            {isUnlocked ? '✅ Отримано!' : '❌ Заблоковано'}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

const RewardsPage = () => {
  const [user, setUser] = useState(null);
  const [questsData, setQuestsData] = useState(null);
  const [leaderboards, setLeaderboards] = useState(null);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('allTime');

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const config = { headers: { 'x-auth-token': token } };
      
      const [userRes, questsRes, leaderboardsRes, badgesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/users/me`, config),
        getQuests(),
        getLeaderboards(),
        getBadges()
      ]);

      setUser(userRes.data);
      setQuestsData(questsRes);
      setLeaderboards(leaderboardsRes);
      setBadges(badgesRes);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleClaim = async (questId) => {
    try {
      await claimQuest(questId);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      fetchData(); // Refresh data
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || 'Помилка при отриманні нагороди');
    }
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Завантаження...</div>;

  const levelData = user ? getLevelData(user.xp || user.points || 0) : null;

  const renderLeaderboardList = () => {
    let list = [];
    if (activeTab === 'allTime') list = leaderboards.topAllTime;
    if (activeTab === 'weekly') list = leaderboards.topWeekly;
    if (activeTab === 'donors') list = leaderboards.topDonors;
    if (activeTab === 'streaks') list = leaderboards.topStreaks;

    return (
      <div className="leaderboard-list">
        {list?.map((u, i) => (
          <motion.div 
            key={u._id} 
            className="leaderboard-item"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <span className="leaderboard-rank">#{i + 1}</span>
            <img src={u.avatar?.startsWith('http') ? u.avatar : `${API_BASE_URL}/${u.avatar}`} alt="avatar" className="leaderboard-avatar" />
            <span className="leaderboard-name">{u.profileCustomization?.nicknameIcon} {u.username}</span>
            <strong className="leaderboard-points">
              {activeTab === 'allTime' && `${u.points} балів`}
              {activeTab === 'weekly' && `${u.weeklyPoints?.amount || 0} балів`}
              {activeTab === 'donors' && `${u.stats?.totalDonations || 0} донатів`}
              {activeTab === 'streaks' && `${u.streak?.longest || 0} днів`}
            </strong>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <DashboardHeader />
        <AnimatedPage>
          <div className="dashboard-content-wrapper">
            <div className="dashboard-hero">
              <div className="hero-summary-card">
                <div>
                  <p className="small-title">Центр нагород</p>
                  <h2>Ваші досягнення та бейджі</h2>
                  <p className="hero-description">Слідкуйте за своїм прогресом, виконуйте щоденні квести та колекціонуйте унікальні бейджі.</p>
                </div>
              </div>
            </div>
            
            {user && (
              <>
                <section className="panel-card level-progress-card" style={{ marginBottom: '20px' }}>
                  <div className="level-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0 }}>{levelData.current.icon} {levelData.current.name} (Рівень {levelData.current.level})</h3>
                    <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{user.xp || user.points || 0} XP</span>
                  </div>
                  <div className="progress-bar-container">
                    <motion.div 
                      className="progress-bar-fill" 
                      initial={{ width: 0 }}
                      animate={{ width: `${levelData.progress}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    ></motion.div>
                  </div>
                  {levelData.next && (
                    <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '10px' }}>Залишилося {(levelData.next.threshold - (user.xp || user.points || 0))} XP до {levelData.next.name}</p>
                  )}
                </section>

                <section className="panel-card quests-section" style={{ marginBottom: '20px' }}>
                  <div className="panel-heading" style={{ marginBottom: '16px' }}>
                    <h3>Щоденні Квести</h3>
                    <p>Виконуйте завдання для отримання додаткового XP</p>
                  </div>
                  <div className="quests-grid-container">
                    {questsData?.quests?.map(quest => (
                      <motion.div key={quest._id} className="quest-card" whileHover={{ scale: 1.02 }}>
                        <div className="quest-card-header">
                          <h4>{quest.type.toUpperCase()}</h4>
                          <span className="badge badge-accent">+{quest.xpReward} XP</span>
                        </div>
                        <div className="quest-progress">
                          <span>{quest.current} / {quest.target}</span>
                          <progress value={quest.current} max={quest.target}></progress>
                        </div>
                        <button 
                          className={`btn ${quest.completed && !quest.claimed ? 'btn-primary' : 'btn-secondary'}`} 
                          disabled={!quest.completed || quest.claimed}
                          onClick={() => handleClaim(quest._id)}
                          style={{ width: '100%', marginTop: '10px' }}
                        >
                          {quest.claimed ? 'Отримано' : (quest.completed ? 'Забрати нагороду' : 'В процесі')}
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </section>

                <div className="dashboard-grid">
                  <section className="panel-card badges-section">
                    <div className="panel-heading" style={{ marginBottom: '16px' }}>
                      <h3>Колекція Бейджів</h3>
                    </div>
                    <div className="rewards-grid">
                      {badges.map(def => (
                        <BadgeDisplay key={def.id} user={user} badge={def} />
                      ))}
                    </div>
                  </section>

                  <section className="panel-card leaderboards-section">
                    <div className="panel-heading" style={{ marginBottom: '16px' }}>
                      <h3>Таблиця Лідерів</h3>
                    </div>
                    <div className="tabs" style={{ display: 'flex', gap: '4px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
                      <button className={`btn btn-sm ${activeTab === 'allTime' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('allTime')}>Всі часи</button>
                      <button className={`btn btn-sm ${activeTab === 'weekly' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('weekly')}>Тиждень</button>
                      <button className={`btn btn-sm ${activeTab === 'donors' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('donors')}>Донати</button>
                      <button className={`btn btn-sm ${activeTab === 'streaks' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('streaks')}>Streaks</button>
                    </div>
                    {leaderboards && renderLeaderboardList()}
                  </section>
                </div>
              </>
            )}
            
          </div>
        </AnimatedPage>
      </main>
    </div>
  );
};

export default RewardsPage;