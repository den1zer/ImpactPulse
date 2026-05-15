import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import API_BASE_URL from '../config/api.js';
import AnimatedPage from '../components/AnimatedPage';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';
import {
  FiPlus, FiFilter, FiSearch, FiUsers, FiZap,
  FiClock, FiTag, FiChevronRight, FiShield, FiX,
} from 'react-icons/fi';
import {
  MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/TasksPage.css';
import './TasksPage2.css';

// Fix Leaflet default icon issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: 'all',          label: 'Всі' },
  { key: 'volunteering', label: '🤝 Волонтерство' },
  { key: 'aid',          label: '📦 Допомога' },
  { key: 'donation',     label: '💰 Донат' },
  { key: 'education',    label: '📚 Освіта' },
  { key: 'ecology',      label: '🌱 Екологія' },
  { key: 'military',     label: '🪖 Армія' },
  { key: 'other',        label: '⚙️ Інше' },
];

const STATUS_FILTERS = [
  { key: 'all',         label: 'Всі' },
  { key: 'open',        label: 'Відкриті' },
  { key: 'in_progress', label: 'В роботі' },
  { key: 'closed',      label: 'Закриті' },
];

const STATUS_META = {
  open:        { label: 'Відкрите',  color: '#22c55e', dot: 'open' },
  in_progress: { label: 'В роботі',  color: '#f59e0b', dot: 'in_progress' },
  closed:      { label: 'Закрите',   color: '#6b7280', dot: 'completed' },
};

const EMOJI_LIST = ['📋','🤝','💪','🔥','🌟','📦','🎯','🌿','💎','🏆','🌊','📚','🏗️','🎨','⚡'];
const CATEGORY_ICONS = {
  volunteering: '🤝',
  aid:          '📦',
  donation:     '💰',
  education:    '📚',
  ecology:      '🌱',
  military:     '🪖',
  other:        '⚙️',
};

const createCategoryIcon = (category) => {
  const emoji = CATEGORY_ICONS[category] || '📋';
  return L.divIcon({
    html: `
      <div class="premium-marker">
        <div class="marker-pulse"></div>
        <div class="marker-base">
          <span class="marker-emoji">${emoji}</span>
        </div>
      </div>
    `,
    className: 'custom-map-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

// ── Location Picker ───────────────────────────────────────────────────────────
const LocationPicker = ({ onSelect, selectedPos }) => {
  const map = useMapEvents({
    click(e) {
      onSelect(e.latlng);
    },
  });

  return selectedPos ? <Marker position={selectedPos} /> : null;
};

// ── Create Task Modal ─────────────────────────────────────────────────────────
const CreateTaskModal = ({ onClose, onCreated, myGuild }) => {
  const [form, setForm] = useState({
    title: '', description: '', category: 'volunteering',
    points: 100, endDate: '', coverEmoji: '📋',
    guildOnly: false, targetGuild: '', maxParticipants: '',
    lat: null, lng: null, address: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const token = localStorage.getItem('userToken');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const body = { ...form };
      if (!body.endDate) delete body.endDate;
      if (!body.maxParticipants) delete body.maxParticipants;
      if (!body.targetGuild) delete body.targetGuild;

      const res = await axios.post(`${API_BASE_URL}/api/tasks`, body, {
        headers: { 'x-auth-token': token },
      });
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
        className="modal-card task-modal-card"
        initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.88, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>📋 Нове завдання</h2>
          <button className="modal-close-btn" onClick={onClose}><FiX /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Emoji */}
          <div className="form-group">
            <label>Іконка</label>
            <div className="emoji-grid">
              {EMOJI_LIST.map(em => (
                <button type="button" key={em}
                  className={`emoji-btn ${form.coverEmoji === em ? 'active' : ''}`}
                  onClick={() => set('coverEmoji', em)}>{em}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="task-title">Назва *</label>
            <input id="task-title" value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="Назва завдання" required maxLength={120} />
          </div>

          <div className="form-group">
            <label htmlFor="task-desc">Опис *</label>
            <textarea id="task-desc" rows={4} value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Детальний опис завдання..." required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="task-cat">Категорія</label>
              <select id="task-cat" value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.slice(1).map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="task-pts">Балів за виконання</label>
              <input id="task-pts" type="number" min={1} max={10000}
                value={form.points} onChange={e => set('points', e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="task-end">Дедлайн</label>
              <input id="task-end" type="date" value={form.endDate}
                onChange={e => set('endDate', e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="task-max">Макс. учасників</label>
              <input id="task-max" type="number" min={1} placeholder="∞ (необмежено)"
                value={form.maxParticipants} onChange={e => set('maxParticipants', e.target.value)} />
            </div>
          </div>

          {/* Guild options */}
          {myGuild && (
            <div className="form-group guild-option-row">
              <label className="checkbox-label">
                <input type="checkbox" checked={form.guildOnly}
                  onChange={e => set('guildOnly', e.target.checked)} />
                <FiShield /> Тільки для команд
              </label>
              <label className="checkbox-label" style={{ marginLeft: 16 }}>
                <input type="checkbox"
                  checked={form.targetGuild === myGuild._id}
                  onChange={e => set('targetGuild', e.target.checked ? myGuild._id : '')} />
                Прив'язати до «{myGuild.name}»
              </label>
            </div>
          )}

          {/* Location Picker */}
          <div className="form-group">
            <label>Місце виконання (натисніть на мапі)</label>
            <div className="modal-map-picker">
              <MapContainer
                center={[48.3794, 31.1656]}
                zoom={5}
                style={{ height: '200px', width: '100%', borderRadius: '8px' }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationPicker
                  selectedPos={form.lat ? { lat: form.lat, lng: form.lng } : null}
                  onSelect={(pos) => {
                    set('lat', pos.lat);
                    set('lng', pos.lng);
                  }}
                />
              </MapContainer>
            </div>
            {form.lat && (
              <div className="location-coords">
                Координати: {form.lat.toFixed(4)}, {form.lng.toFixed(4)}
              </div>
            )}
            <input
              placeholder="Адреса (опціонально)"
              value={form.address}
              onChange={e => set('address', e.target.value)}
              style={{ marginTop: '8px' }}
            />
          </div>

          {error && <div className="modal-error">{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading} id="create-task-submit">
            {loading ? 'Створення...' : '+ Опублікувати завдання'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

// ── Task Card ─────────────────────────────────────────────────────────────────
const TaskCard = ({ task, index }) => {
  const s = STATUS_META[task.status] || STATUS_META.open;
  const approvedCount = task.participants?.filter(p => p.status === 'approved').length ?? 0;
  const totalCount    = task.participants?.length ?? 0;

  return (
    <motion.div
      className="task-card-v2"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <div className="tc2-emoji">{task.coverEmoji || '📋'}</div>
      <div className="tc2-body">
        <div className="tc2-top">
          <h3 className="tc2-title">{task.title}</h3>
          <span className="tc2-points">+{task.points} XP</span>
        </div>
        <p className="tc2-desc">{task.description}</p>
        <div className="tc2-meta">
          <span className="tc2-status-pill" style={{ borderColor: s.color, color: s.color }}>
            <span className="status-dot" style={{ background: s.color }} />
            {s.label}
          </span>
          <span className="tc2-meta-item">
            <FiTag size={12} /> {task.category}
          </span>
          <span className="tc2-meta-item">
            <FiUsers size={12} /> {totalCount} учасн.
            {approvedCount > 0 && <span className="tc2-approved"> ({approvedCount} ✓)</span>}
          </span>
          {task.endDate && (
            <span className="tc2-meta-item">
              <FiClock size={12} /> {new Date(task.endDate).toLocaleDateString('uk-UA')}
            </span>
          )}
          {task.guildOnly && (
            <span className="tc2-meta-item guild-only-badge">
              <FiShield size={12} /> Команди
            </span>
          )}
          {task.createdBy?.username && (
            <span className="tc2-meta-item tc2-author">
              від {task.createdBy.username}
            </span>
          )}
        </div>
      </div>
      <Link to={`/tasks/${task._id}`} className="tc2-btn" id={`open-task-${task._id}`}>
        Відкрити <FiChevronRight />
      </Link>
    </motion.div>
  );
};

// ── Map View ──────────────────────────────────────────────────────────────────
const TaskMapView = ({ tasks }) => {
  const tasksWithLocation = tasks.filter(t => t.lat && t.lng);

  return (
    <div className="tasks-map-container">
      <MapContainer
        center={[48.3794, 31.1656]} // Center of Ukraine
        zoom={6}
        style={{ height: '600px', width: '100%', borderRadius: '12px' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {tasksWithLocation.map(task => (
          <Marker
            key={task._id}
            position={[task.lat, task.lng]}
            icon={createCategoryIcon(task.category)}
          >
            <Popup className="premium-map-popup">
              <div className="popup-card">
                <div className="popup-emoji-bg">{task.coverEmoji || '📋'}</div>
                <div className="popup-main">
                  <div className="popup-header">
                    <span className="popup-cat-tag">
                      {CATEGORY_ICONS[task.category]} {task.category}
                    </span>
                    <span className="popup-points">+{task.points} XP</span>
                  </div>
                  <h4 className="popup-title">{task.title}</h4>
                  <p className="popup-text">{task.description?.substring(0, 70)}...</p>
                  <Link to={`/tasks/${task._id}`} className="popup-action-btn">
                    Переглянути <FiChevronRight />
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const TasksPage = () => {
  const [tasks, setTasks]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [myGuild, setMyGuild]     = useState(null);
  const [filter, setFilter]       = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [search, setSearch]       = useState('');
  const [viewMode, setViewMode]   = useState('list'); // 'list' | 'map'

  const token   = localStorage.getItem('userToken');
  const isGuest = localStorage.getItem('userRole') === 'guest';

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'all') params.status = filter;
      if (catFilter !== 'all') params.category = catFilter;
      if (search.trim()) params.search = search.trim();

      const [tasksRes, guildRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/tasks`, { params }),
        token ? axios.get(`${API_BASE_URL}/api/guilds/my/guild`, {
          headers: { 'x-auth-token': token },
        }) : Promise.resolve({ data: null }),
      ]);

      setTasks(tasksRes.data);
      setMyGuild(guildRes.data);
    } catch (err) {
      console.error('TasksPage fetch:', err.message);
    } finally {
      setLoading(false);
    }
  }, [filter, catFilter, search, token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreated = (task) => {
    setShowCreate(false);
    setTasks(prev => [task, ...prev]);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <DashboardHeader />
        <AnimatedPage>
          <div className="dashboard-content-wrapper tasks-v2-page">

            {/* ── Hero ── */}
            <div className="tasks-v2-hero">
              <div>
                <p className="small-title">ImpactPulse Tasks</p>
                <h1>Завдання спільноти</h1>
                <p className="hero-description">
                  Беріть участь самостійно або з командою. Автор завдання підтверджує виконання.
                </p>
              </div>
              {!isGuest && (
                <button className="btn-create-task" onClick={() => setShowCreate(true)} id="open-create-task">
                  <FiPlus /> Створити завдання
                </button>
              )}
            </div>

            {/* ── Toolbar ── */}
            <div className="tasks-toolbar">
              <div className="tasks-search-wrap">
                <FiSearch className="search-icon" />
                <input
                  className="tasks-search"
                  placeholder="Пошук завдань..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <div className="view-mode-toggle">
                <button
                  className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  📋 Список
                </button>
                <button
                  className={`toggle-btn ${viewMode === 'map' ? 'active' : ''}`}
                  onClick={() => setViewMode('map')}
                >
                  🗺️ Мапа
                </button>
              </div>

              <div className="tasks-filters-row">
                <div className="filter-group">
                  <FiFilter size={13} />
                  {STATUS_FILTERS.map(f => (
                    <button key={f.key}
                      className={`filter-btn ${filter === f.key ? 'active' : ''}`}
                      onClick={() => setFilter(f.key)}>{f.label}
                    </button>
                  ))}
                </div>
                <div className="filter-group">
                  {CATEGORIES.map(c => (
                    <button key={c.key}
                      className={`filter-btn small ${catFilter === c.key ? 'active' : ''}`}
                      onClick={() => setCatFilter(c.key)}>{c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Content (Map or List) ── */}
            {loading ? (
              <div className="tasks-loading">
                <div className="guilds-spinner" />
                Завантаження завдань...
              </div>
            ) : tasks.length === 0 ? (
              <div className="tasks-empty-v2">
                <span style={{ fontSize: '3rem' }}>📋</span>
                <p>Завдань за цими фільтрами немає.</p>
                {!isGuest && (
                  <button className="btn-primary" onClick={() => setShowCreate(true)}>
                    <FiPlus /> Створити перше завдання
                  </button>
                )}
              </div>
            ) : viewMode === 'map' ? (
              <TaskMapView tasks={tasks} />
            ) : (
              <div className="tasks-list-v2">
                <AnimatePresence>
                  {tasks.map((t, i) => <TaskCard key={t._id} task={t} index={i} />)}
                </AnimatePresence>
              </div>
            )}
          </div>
        </AnimatedPage>
      </main>

      <AnimatePresence>
        {showCreate && (
          <CreateTaskModal
            onClose={() => setShowCreate(false)}
            onCreated={handleCreated}
            myGuild={myGuild}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TasksPage;