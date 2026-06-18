import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
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
  { level: 1, name: 'Новобранець', threshold: 0,     tag: 'LV.1' },
  { level: 2, name: 'Дослідник',   threshold: 100,   tag: 'LV.2' },
  { level: 3, name: 'Ентузіаст',  threshold: 300,   tag: 'LV.3' },
  { level: 4, name: 'Активіст',   threshold: 600,   tag: 'LV.4' },
  { level: 5, name: 'Провідник',  threshold: 1000,  tag: 'LV.5' },
  { level: 6, name: 'Лідер',      threshold: 1500,  tag: 'LV.6' },
  { level: 7, name: 'Герой',       threshold: 2500,  tag: 'LV.7' },
];

/**
 * Determines the current level, next level, and progress percentage based on a user's total XP.
 *
 * @param {number} xp - The total XP accumulated by the user.
 * @returns {Object} An object containing the current level, next level, and progress percentage.
 */
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

/**
 * BadgeDisplay Component
 * Renders an interactive, flippable card representing a specific achievement badge.
 * Shows the locked/unlocked state based on the user's earned badges.
 *
 * @param {Object} props - Component properties.
 * @param {Object} props.user - The user data object containing their earned badges.
 * @param {Object} props.badge - The badge definition object.
 * @returns {JSX.Element} The rendered badge component.
 */
const BadgeDisplay = ({ user, badge }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const isUnlocked = user.badges?.some(b => b.badgeId === badge.id);
  
  return (
    <motion.div className="badge-card" onClick={() => setIsFlipped(f => !f)}>
      <motion.div className="badge-inner" animate={{ rotateY: isFlipped ? 180 : 0 }} transition={{ duration: 0.6 }}>
        <div className={`badge-front ${!isUnlocked ? 'badge-locked' : ''}`}>
          <div className="badge-icon">
            {isUnlocked ? badge.icon : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="0"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            )}
          </div>
          <h3 className="badge-name">{badge.name}</h3>
        </div>
        <div className="badge-back">
          <h3 className="badge-name">{badge.name}</h3>
          <p className="badge-description">{badge.description}</p>
          <p className="badge-status">
            {isUnlocked ? 'ОТРИМАНО' : 'ЗАБЛОКОВАНО'}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

/**
 * Formats raw quest data into an object with readable titles, descriptions, and action links.
 *
 * @param {Object} quest - The raw quest object containing its type and target.
 * @returns {Object} An object containing the quest's title, description, and applicable UI link.
 */
const getQuestInfo = (quest) => {
  const info = {
    login: {
      title: 'Вхід у додаток',
      description: 'Зайдіть у додаток сьогодні',
      link: '/dashboard'
    },
    donation: {
      title: 'Зробити донат',
      description: `Зробіть донат на будь-який збір (${quest.target} раз)`,
      link: '/fundraisers'
    },
    volunteer: {
      title: 'Волонтерство',
      description: `Долучіться до волонтерської ініціативи (${quest.target} раз)`,
      link: '/tasks'
    },
    comment: {
      title: 'Спілкування',
      description: `Залиште коментар під проєктом (${quest.target} раз)`,
      link: '/tasks'
    }
  };

  return info[quest.type] || { 
    title: quest.type.toUpperCase(), 
    description: `Виконайте завдання (${quest.target} раз)`,
    link: '/dashboard'
  };
};

/**
 * RewardsPage Component
 * Provides a consolidated dashboard for users to track their level progression, 
 * daily quests, earned badges, and leaderboard rankings.
 *
 * @returns {JSX.Element} The rendered rewards/gamification dashboard.
 */
const RewardsPage = () => {
  const navigate = useNavigate();
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
      fetchData(); 
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || 'Помилка при отриманні нагороди');
    }
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Завантаження...</div>;

  const levelData = user ? getLevelData(user.xp || user.points || 0) : null;

  /**
   * Evaluates the active tab state and renders the appropriate list of users for the leaderboard.
   *
   * @returns {JSX.Element} The rendered list of leaderboard entries.
   */
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
            className="leaderboard-item panel-card-hover"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => navigate(`/user/${u._id}`)}
            style={{ cursor: 'pointer' }}
          >
            <span className="leaderboard-rank">#{i + 1}</span>
            <img src={u.avatar ? (u.avatar.startsWith('http') ? u.avatar : `${API_BASE_URL}/${u.avatar}`) : '/default-avatar.svg'} alt="avatar" className={`leaderboard-avatar frame-${u.profileCustomization?.avatarFrame || 'none'}`} />
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
                  <div className="panel-heading" style={{ marginBottom: '12px' }}>
                    <h3>Ваш рівень</h3>
                  </div>
                  <div className="level-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.7rem', background: 'var(--black)', color: 'var(--bg-surface)', padding: '4px 10px', letterSpacing: '0.06em' }}>{levelData.current.tag}</span>
                      <strong style={{ fontSize: '1rem', fontWeight: 700 }}>{levelData.current.name}</strong>
                    </div>
                    <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>{user.xp || user.points || 0} XP</span>
                  </div>
                  <div className="progress-bar-container">
                    <motion.div
                      className="progress-bar-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${levelData.progress}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                  {levelData.next && (
                    <p className="text-muted" style={{ fontSize: '0.72rem', marginTop: '8px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Осталось {levelData.next.threshold - (user.xp || user.points || 0)} XP до рівня {levelData.next.name}
                    </p>
                  )}
                </section>

                <section className="panel-card quests-section" style={{ marginBottom: '20px' }}>
                  <div className="panel-heading" style={{ marginBottom: '16px' }}>
                    <h3>Щоденні Квести</h3>
                    <p>Виконуйте завдання для отримання додаткового XP</p>
                  </div>
                  <div className="quests-grid-container">
                    {questsData?.quests?.map(quest => {
                      const questInfo = getQuestInfo(quest);
                      return (
                        <motion.div 
                          key={quest._id} 
                          className="quest-card" 
                          whileHover={{ scale: 1.02 }}
                          style={{ cursor: (!quest.completed && questInfo.link) ? 'pointer' : 'default' }}
                          onClick={() => {
                            if (!quest.completed && questInfo.link) {
                              navigate(questInfo.link);
                            }
                          }}
                        >
                          <div className="quest-card-header">
                            <h4>{questInfo.title}</h4>
                            <span className="badge badge-accent">+{quest.xpReward} XP</span>
                          </div>
                          <p className="quest-description" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
                            {questInfo.description}
                          </p>
                          <div className="quest-progress">
                            <span>{quest.current} / {quest.target}</span>
                            <progress value={quest.current} max={quest.target}></progress>
                          </div>
                        <button 
                          className={`btn ${quest.completed && !quest.claimed ? 'btn-primary' : 'btn-secondary'}`} 
                          disabled={!quest.completed || quest.claimed}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClaim(quest._id);
                          }}
                          style={{ width: '100%', marginTop: '10px' }}
                        >
                          {quest.claimed ? 'Отримано' : (quest.completed ? 'Забрати нагороду' : 'Виконати')}
                        </button>
                      </motion.div>
                    )})}
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