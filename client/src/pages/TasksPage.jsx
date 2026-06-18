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
  FiClock, FiTag, FiChevronRight, FiShield, FiX, FiClipboard,
} from 'react-icons/fi';
import {
  MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/TasksPage.css';
import './TasksPage2.css';

// Бізнес-логіка: Виправлення шляхів до стандартних іконок Leaflet у середовищі Webpack/React.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const CATEGORIES = [
  { key: 'all',          label: 'Всі' },
  { key: 'volunteering', label: 'Волонтерство' },
  { key: 'aid',          label: 'Допомога' },
  { key: 'donation',     label: 'Донат' },
  { key: 'education',    label: 'Освіта' },
  { key: 'ecology',      label: 'Екологія' },
  { key: 'military',     label: 'Армія' },
  { key: 'other',        label: 'Інше' },
];

const STATUS_FILTERS = [
  { key: 'all',         label: 'Всі' },
  { key: 'open',        label: 'Відкриті' },
  { key: 'in_progress', label: 'В роботі' },
  { key: 'closed',      label: 'Закриті' },
];

const STATUS_META = {
  open:        { label: 'Відкрите',  color: 'var(--status-open)',     dot: 'open' },
  in_progress: { label: 'В роботі',  color: 'var(--status-progress)', dot: 'in_progress' },
  closed:      { label: 'Закрите',   color: 'var(--status-closed)',   dot: 'completed' },
};

const CATEGORY_LABELS = {
  volunteering: 'ВОЛ',
  aid:          'ДОП',
  donation:     'ДОН',
  education:    'ОСВ',
  ecology:      'ЕКО',
  military:     'АРМ',
  other:        'ІНШ',
};

const CAT_COLORS = {
  volunteering: '#FFE500',
  aid:          '#FF5C00',
  donation:     '#00C853',
  education:    '#0057FF',
  ecology:      '#00C853',
  military:     '#FF1F1F',
  other:        '#888',
};

/**
 * Creates a custom HTML Leaflet icon for task markers based on the task category.
 *
 * @param {string} category - The category of the task to determine color and label.
 * @returns {L.DivIcon} The configured Leaflet DivIcon instance.
 */
const createCategoryIcon = (category) => {
  const color = CAT_COLORS[category] || '#FFE500';
  const label = CATEGORY_LABELS[category] || 'TSK';
  return L.divIcon({
    html: `
      <div class="premium-marker">
        <div class="marker-pulse"></div>
        <div class="marker-base" style="background:${color}">
          <span class="marker-emoji" style="font-family:var(--font-mono,monospace);font-size:9px;font-weight:700;color:#000">${label}</span>
        </div>
      </div>
    `,
    className: 'custom-map-icon',
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34],
  });
};

/**
 * LocationPicker Component
 * Renders a map marker at the selected position and listens for click events
 * to update the selected coordinates.
 *
 * @param {Object} props - Component properties.
 * @param {Function} props.onSelect - Callback invoked when a location on the map is clicked.
 * @param {Object} props.selectedPos - The currently selected coordinates {lat, lng}.
 * @returns {JSX.Element|null} The Leaflet Marker component.
 */
const LocationPicker = ({ onSelect, selectedPos }) => {
  const map = useMapEvents({
    click(e) {
      onSelect(e.latlng);
    },
  });

  return selectedPos ? <Marker position={selectedPos} /> : null;
};

/**
 * CreateTaskModal Component
 * Provides a form to create a new task, including location picking, category selection,
 * and optional guild-only restrictions.
 *
 * @param {Object} props - Component properties.
 * @param {Function} props.onClose - Callback to close the modal.
 * @param {Function} props.onCreated - Callback invoked with the new task data upon successful creation.
 * @param {Object} props.myGuild - The authenticated user's guild data, if any.
 * @returns {JSX.Element} The rendered modal component.
 */
const CreateTaskModal = ({ onClose, onCreated, myGuild }) => {
  const [form, setForm] = useState({
    title: '', description: '', category: 'volunteering',
    points: 100, endDate: '', coverEmoji: '',
    guildOnly: false, targetGuild: '', maxParticipants: '',
    lat: null, lng: null, address: '',
  });
  const [coverFile, setCoverFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const token = localStorage.getItem('userToken');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('category', form.category);
      fd.append('points', form.points);
      if (form.endDate) fd.append('endDate', form.endDate);
      if (form.maxParticipants) fd.append('maxParticipants', form.maxParticipants);
      if (form.targetGuild) fd.append('targetGuild', form.targetGuild);
      fd.append('guildOnly', form.guildOnly);
      if (form.lat) { fd.append('lat', form.lat); fd.append('lng', form.lng); }
      if (form.address) fd.append('address', form.address);
      if (coverFile) fd.append('taskFile', coverFile);

      const res = await axios.post(`${API_BASE_URL}/api/tasks`, fd, {
        headers: { 'x-auth-token': token, 'Content-Type': 'multipart/form-data' },
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
          <h2>Нове завдання</h2>
          <button className="modal-close-btn" onClick={onClose}><FiX /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">

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

          <div className="form-group">
            <label>Фото завдання (необов'язково)</label>
            <label className="file-upload-label" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', border: 'var(--border)', background: 'var(--bg-surface)' }}>
              <input type="file" accept="image/*" onChange={e => setCoverFile(e.target.files[0])} hidden />
              <FiPlus size={14} /> {coverFile ? coverFile.name : 'Обрати зображення'}
            </label>
          </div>

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

/**
 * TaskCard Component
 * Displays a summarized view of a task including its status, category, participants, and timeline.
 *
 * @param {Object} props - Component properties.
 * @param {Object} props.task - The task data object.
 * @param {number} props.index - Index in the list to calculate animation delay.
 * @returns {JSX.Element} The rendered task card.
 */
const TaskCard = ({ task, index }) => {
  const s = STATUS_META[task.status] || STATUS_META.open;
  const approvedCount = task.participants?.filter(p => p.status === 'approved').length ?? 0;
  const totalCount    = task.participants?.length ?? 0;
  const catColor = CAT_COLORS[task.category] || 'var(--yellow)';

  return (
    <motion.div
      className="task-card-v2"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <div className="tc2-cat-bar" style={{ background: catColor }} />
      <Link to={`/tasks/${task._id}`} className="tc2-link-wrap" id={`open-task-${task._id}`}>
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
              {approvedCount > 0 && <span className="tc2-approved"> ({approvedCount} OK)</span>}
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
        <div className="tc2-btn" aria-label="Відкрити завдання">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
        </div>
      </Link>
    </motion.div>
  );
};

/**
 * TaskMapView Component
 * Renders an interactive map with pins representing available tasks with geographical locations.
 *
 * @param {Object} props - Component properties.
 * @param {Array} props.tasks - The array of task objects to display.
 * @returns {JSX.Element} The rendered Leaflet map component.
 */
const TaskMapView = ({ tasks }) => {
  const tasksWithLocation = tasks.filter(t => t.lat && t.lng);

  return (
    <div className="tasks-map-container">
      <MapContainer
        center={[48.3794, 31.1656]}
        zoom={6}
        style={{ height: '600px', width: '100%' }}
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
                <div className="popup-emoji-bg" style={{ background: CAT_COLORS[task.category] || 'var(--yellow)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 700, color: '#000' }}>
                    {CATEGORY_LABELS[task.category] || 'TSK'}
                  </span>
                </div>
                <div className="popup-main">
                  <div className="popup-header">
                    <span className="popup-cat-tag">{task.category}</span>
                    <span className="popup-points">+{task.points} XP</span>
                  </div>
                  <h4 className="popup-title">{task.title}</h4>
                  <p className="popup-text">{task.description?.substring(0, 70)}...</p>
                  <Link to={`/tasks/${task._id}`} className="popup-action-btn">
                    Переглянути
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
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

/**
 * TasksPage Component
 * Provides a comprehensive view of all available platform tasks.
 * Includes search, categorization, status filtering, and toggling between list and map views.
 *
 * @returns {JSX.Element} The rendered tasks page.
 */
const TasksPage = () => {
  const [tasks, setTasks]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [myGuild, setMyGuild]     = useState(null);
  const [filter, setFilter]       = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [search, setSearch]       = useState('');
  const [viewMode, setViewMode]   = useState('list');

  const token   = localStorage.getItem('userToken');
  const isGuest = localStorage.getItem('userRole') === 'guest';

  /**
   * Fetches tasks matching current filter criteria.
   */
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

            <div className="tasks-v2-hero">
              <div>
                <p className="small-title">ImpactPulse / Tasks</p>
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
                  <FiClipboard size={14} /> Список
                </button>
                <button
                  className={`toggle-btn ${viewMode === 'map' ? 'active' : ''}`}
                  onClick={() => setViewMode('map')}
                >
                  <FiZap size={14} /> Мапа
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

            {loading ? (
              <div className="tasks-loading">
                <div className="guilds-spinner" />
                <span>ЗАВАНТАЖЕННЯ...</span>
              </div>
            ) : tasks.length === 0 ? (
              <div className="tasks-empty-v2">
                <FiClipboard size={40} style={{ opacity: 0.25 }} />
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Завдань за цими фільтрами немає.</p>
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