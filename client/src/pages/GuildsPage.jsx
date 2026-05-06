import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';
import {
  FiShield, FiUsers, FiAward, FiPlus, FiLogOut,
  FiZap, FiTrendingUp, FiChevronRight, FiX,
} from 'react-icons/fi';
import API_BASE_URL from '../config/api.js';
import './GuildsPage.css';

// ──────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────
const GUILD_LEVEL_THRESHOLDS = [0, 500, 1500, 3000, 6000, 10000, 16000, 24000, 35000, 50000];
const EMOJI_OPTIONS = ['⚔️','🛡️','🔥','🌟','⚡','🦁','🐉','🌊','🗡️','🏆','🎯','🌿','💎','🦅','🌙'];

function getLevelProgress(guild) {
  const lvlIdx = (guild.level ?? 1) - 1;
  const start  = GUILD_LEVEL_THRESHOLDS[lvlIdx]   ?? 0;
  const end    = GUILD_LEVEL_THRESHOLDS[lvlIdx + 1] ?? null;
  if (end === null) return { pct: 100, start, end: null };
  const pct = Math.min(100, ((guild.totalXP - start) / (end - start)) * 100);
  return { pct, start, end };
}

// ──────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────
const LevelBadge = ({ level }) => (
  <span className="guild-level-badge">Lv.{level}</span>
);

const XPBar = ({ guild, large }) => {
  const { pct, end } = getLevelProgress(guild);
  return (
    <div className={`guild-xp-bar-wrap ${large ? 'large' : ''}`}>
      <div className="guild-xp-bar-track">
        <motion.div
          className="guild-xp-bar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
      <div className="guild-xp-bar-labels">
        <span>{guild.totalXP.toLocaleString()} XP</span>
        {end && <span>→ {end.toLocaleString()} XP</span>}
        {!end && <span>Максимальний рівень!</span>}
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────
// Modal: Create Guild
// ──────────────────────────────────────────────────────────────
const CreateGuildModal = ({ onClose, onCreated, userXP }) => {
  const [name, setName]         = useState('');
  const [description, setDesc]  = useState('');
  const [logo, setLogo]         = useState('⚔️');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const token = localStorage.getItem('userToken');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/guilds`,
        { name, description, logo },
        { headers: { 'x-auth-token': token } }
      );
      onCreated(res.data);
    } catch (err) {
      setError(err.response?.data?.msg || 'Помилка при створенні');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        className="modal-card"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Створити Гільдію</h2>
          <button className="modal-close-btn" onClick={onClose}><FiX /></button>
        </div>

        {userXP < 100 && (
          <div className="modal-warning">
            ⚠️ Для створення гільдії потрібно мінімум <strong>100 XP</strong>. У вас: <strong>{userXP} XP</strong>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Emoji picker */}
          <div className="form-group">
            <label>Логотип (emoji)</label>
            <div className="emoji-grid">
              {EMOJI_OPTIONS.map((em) => (
                <button
                  type="button"
                  key={em}
                  className={`emoji-btn ${logo === em ? 'active' : ''}`}
                  onClick={() => setLogo(em)}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="guild-name">Назва гільдії</label>
            <input
              id="guild-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Мінімум 3 символи"
              maxLength={40}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="guild-desc">Опис (необов'язково)</label>
            <textarea
              id="guild-desc"
              value={description}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Розкажіть про місію вашої гільдії..."
              maxLength={300}
              rows={3}
            />
          </div>

          {error && <div className="modal-error">{error}</div>}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading || userXP < 100}
            id="create-guild-submit"
          >
            {loading ? 'Створення...' : 'Створити Гільдію'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

// ──────────────────────────────────────────────────────────────
// My Guild Card
// ──────────────────────────────────────────────────────────────
const MyGuildCard = ({ guild, currentUserId, onLeave }) => {
  const { pct } = getLevelProgress(guild);
  const isLeader = guild.leader?._id === currentUserId || guild.leader === currentUserId;

  return (
    <motion.div
      className="my-guild-card"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="my-guild-header">
        <div className="my-guild-logo">{guild.logo || '⚔️'}</div>
        <div className="my-guild-info">
          <div className="my-guild-title-row">
            <h2>{guild.name}</h2>
            <LevelBadge level={guild.level} />
            {isLeader && <span className="leader-crown">👑 Лідер</span>}
          </div>
          {guild.description && <p className="my-guild-desc">{guild.description}</p>}
        </div>
        <button
          className="leave-btn"
          onClick={() => onLeave(guild._id)}
          title="Покинути гільдію"
          id="leave-guild-btn"
        >
          <FiLogOut />
        </button>
      </div>

      {/* Stats row */}
      <div className="guild-stats-row">
        <div className="guild-stat">
          <FiZap className="guild-stat-icon xp" />
          <div>
            <div className="guild-stat-value">{guild.totalXP.toLocaleString()}</div>
            <div className="guild-stat-label">Загальний XP</div>
          </div>
        </div>
        <div className="guild-stat">
          <FiUsers className="guild-stat-icon members" />
          <div>
            <div className="guild-stat-value">{guild.members?.length ?? 0}/20</div>
            <div className="guild-stat-label">Учасники</div>
          </div>
        </div>
        <div className="guild-stat">
          <FiTrendingUp className="guild-stat-icon level" />
          <div>
            <div className="guild-stat-value">{guild.level}</div>
            <div className="guild-stat-label">Рівень</div>
          </div>
        </div>
      </div>

      {/* XP progress bar */}
      <XPBar guild={guild} large />

      {/* Member list */}
      <div className="guild-members-section">
        <h3><FiUsers /> Учасники</h3>
        <div className="guild-members-list">
          {(guild.members || []).map((m) => (
            <div key={m._id} className="member-row">
              <div className="member-avatar">
                {m.avatarUrl
                  ? <img src={m.avatarUrl} alt={m.username} />
                  : <span>{m.username?.[0]?.toUpperCase()}</span>
                }
              </div>
              <span className="member-name">
                {m.username}
                {(m._id === guild.leader?._id || m._id === guild.leader) && ' 👑'}
              </span>
              <span className="member-xp">{(m.xp ?? 0).toLocaleString()} XP</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// ──────────────────────────────────────────────────────────────
// Guild Card (leaderboard / list)
// ──────────────────────────────────────────────────────────────
const GuildCard = ({ guild, rank, onJoin, inGuild }) => (
  <motion.div
    className="guild-card"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: rank * 0.05 }}
  >
    <div className="guild-card-rank">#{rank}</div>
    <div className="guild-card-logo">{guild.logo || '⚔️'}</div>
    <div className="guild-card-body">
      <div className="guild-card-title-row">
        <span className="guild-card-name">{guild.name}</span>
        <LevelBadge level={guild.level} />
      </div>
      {guild.description && (
        <p className="guild-card-desc">{guild.description}</p>
      )}
      <div className="guild-card-meta">
        <span><FiUsers /> {guild.memberCount ?? guild.members?.length ?? '?'}/20</span>
        <span><FiZap /> {(guild.totalXP ?? 0).toLocaleString()} XP</span>
        {guild.leader?.username && (
          <span>👑 {guild.leader.username}</span>
        )}
      </div>
      <XPBar guild={guild} />
    </div>
    {!inGuild && (
      <button
        className="join-btn"
        onClick={() => onJoin(guild._id)}
        id={`join-guild-${guild._id}`}
      >
        Вступити <FiChevronRight />
      </button>
    )}
  </motion.div>
);

// ──────────────────────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────────────────────
const GuildsPage = () => {
  const [guilds, setGuilds]         = useState([]);
  const [myGuild, setMyGuild]       = useState(null);
  const [userData, setUserData]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast]           = useState(null);
  const [activeTab, setActiveTab]   = useState('leaderboard'); // 'leaderboard' | 'all'

  const token      = localStorage.getItem('userToken');
  const currentId  = localStorage.getItem('userId');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [lbRes, myRes, meRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/guilds/leaderboard`),
        token
          ? axios.get(`${API_BASE_URL}/api/guilds/my/guild`, { headers: { 'x-auth-token': token } })
          : Promise.resolve({ data: null }),
        token
          ? axios.get(`${API_BASE_URL}/api/users/me`, { headers: { 'x-auth-token': token } })
          : Promise.resolve({ data: null }),
      ]);
      setGuilds(lbRes.data);
      setMyGuild(myRes.data);
      setUserData(meRes.data);
    } catch (err) {
      console.error('fetchAll guilds:', err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleJoin = async (guildId) => {
    if (!token) return showToast('Увійдіть для вступу в гільдію', 'error');
    try {
      await axios.post(
        `${API_BASE_URL}/api/guilds/${guildId}/join`,
        {},
        { headers: { 'x-auth-token': token } }
      );
      showToast('Ви успішно вступили в гільдію! 🎉');
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.msg || 'Помилка вступу', 'error');
    }
  };

  const handleLeave = async (guildId) => {
    if (!window.confirm('Покинути гільдію?')) return;
    try {
      await axios.post(
        `${API_BASE_URL}/api/guilds/${guildId}/leave`,
        {},
        { headers: { 'x-auth-token': token } }
      );
      showToast('Ви покинули гільдію');
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.msg || 'Помилка', 'error');
    }
  };

  const handleCreated = (guild) => {
    setShowCreate(false);
    showToast(`Гільдія "${guild.name}" створена! ⚔️`);
    fetchAll();
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <DashboardHeader />
        <AnimatedPage>
          <div className="dashboard-content-wrapper guilds-page">

            {/* ── Hero ── */}
            <div className="guilds-hero">
              <div className="guilds-hero-text">
                <p className="small-title">ImpactPulse Guilds</p>
                <h1>Система Гільдій</h1>
                <p className="hero-description">
                  Об'єднуйтесь у команди, виконуйте завдання разом та змагайтеся за командний рейтинг.
                  Ваш особистий XP додається до загального результату вашої гільдії.
                </p>
              </div>
              {!myGuild && token && (
                <button
                  className="btn-create-guild"
                  onClick={() => setShowCreate(true)}
                  id="open-create-guild-modal"
                >
                  <FiPlus /> Створити Гільдію
                </button>
              )}
            </div>

            {/* ── Toast ── */}
            <AnimatePresence>
              {toast && (
                <motion.div
                  className={`guild-toast ${toast.type}`}
                  initial={{ opacity: 0, y: -16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                >
                  {toast.msg}
                </motion.div>
              )}
            </AnimatePresence>

            {loading ? (
              <div className="guilds-loading">
                <div className="guilds-spinner" />
                Завантаження гільдій...
              </div>
            ) : (
              <>
                {/* ── My Guild ── */}
                {myGuild && (
                  <section className="guilds-section">
                    <h2 className="section-title"><FiShield /> Моя Гільдія</h2>
                    <MyGuildCard
                      guild={myGuild}
                      currentUserId={currentId}
                      onLeave={handleLeave}
                    />
                  </section>
                )}

                {/* ── Leaderboard / All ── */}
                <section className="guilds-section">
                  <div className="guilds-section-header">
                    <h2 className="section-title"><FiAward /> Рейтинг Гільдій</h2>
                    <div className="tab-switcher">
                      <button
                        className={activeTab === 'leaderboard' ? 'active' : ''}
                        onClick={() => setActiveTab('leaderboard')}
                      >
                        Топ 10
                      </button>
                      <button
                        className={activeTab === 'all' ? 'active' : ''}
                        onClick={() => setActiveTab('all')}
                      >
                        Всі гільдії
                      </button>
                    </div>
                  </div>

                  <div className="guilds-list">
                    {(activeTab === 'leaderboard' ? guilds.slice(0, 10) : guilds).map((g, i) => (
                      <GuildCard
                        key={g._id}
                        guild={g}
                        rank={g.rank ?? i + 1}
                        onJoin={handleJoin}
                        inGuild={!!myGuild}
                      />
                    ))}
                    {guilds.length === 0 && (
                      <div className="guilds-empty">
                        <FiShield size={48} />
                        <p>Ще немає жодної гільдії. Станьте першим!</p>
                        {token && !myGuild && (
                          <button
                            className="btn-primary"
                            onClick={() => setShowCreate(true)}
                          >
                            <FiPlus /> Створити першу гільдію
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </section>
              </>
            )}
          </div>
        </AnimatedPage>
      </main>

      {/* ── Create Modal ── */}
      <AnimatePresence>
        {showCreate && (
          <CreateGuildModal
            onClose={() => setShowCreate(false)}
            onCreated={handleCreated}
            userXP={userData?.xp ?? 0}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default GuildsPage;
