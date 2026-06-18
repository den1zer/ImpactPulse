import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';
import API_BASE_URL from '../config/api.js';
import {
  FiUsers, FiZap, FiClock, FiTag, FiShield, FiCheck,
  FiX, FiSend, FiHeart, FiTrash2, FiMessageCircle,
  FiUpload, FiChevronLeft, FiAlertCircle, FiStar,
  FiMapPin, FiEdit, FiImage, FiFileText,
} from 'react-icons/fi';
import {
  MapContainer, TileLayer, Marker,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import confetti from 'canvas-confetti';
import '../styles/TasksPage.css';
import './TaskDetailPage2.css';
import playSound from '../utils/sounds';

const STATUS_META = {
  open:        { label: 'Відкрите',  color: '#22c55e' },
  in_progress: { label: 'В роботі',  color: '#f59e0b' },
  closed:      { label: 'Закрите',   color: '#6b7280' },
};

const PART_STATUS = {
  working:  { label: 'Виконує',    color: '#f59e0b' },
  review:   { label: 'На перевірці', color: '#a78bfa' },
  approved: { label: 'Підтверджено', color: '#22c55e' },
  rejected: { label: 'Відхилено',  color: '#ef4444' },
};

function getAvatar(user) {
  if (!user) return null;
  const src = user.avatarUrl || user.avatar;
  if (!src) return null;
  return src.startsWith('http') ? src : `${API_BASE_URL}/${src}`;
}

const Avatar = ({ user, size = 36 }) => {
  const src = getAvatar(user);
  return (
    <div className="td2-avatar" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {src ? <img src={src} alt={user?.username || 'User'} /> : <img src="/default-avatar.svg" alt={user?.username || 'User'} />}
    </div>
  );
};

/**
 * ParticipantRow Component
 * Renders a single row for a participant in the task, displaying their status, proof of completion,
 * and review controls for the task creator.
 *
 * @param {Object} props - Component properties.
 * @param {Object} props.p - The participant data object.
 * @param {boolean} props.isCreator - Flag indicating if the current user is the creator of the task.
 * @param {string} props.currentUserId - The ID of the currently authenticated user.
 * @param {Function} props.onReview - Callback invoked when the creator approves or rejects the submission.
 * @param {string} props.taskId - The ID of the task.
 * @returns {JSX.Element} The rendered participant row.
 */
const ParticipantRow = ({ p, isCreator, currentUserId, onReview, taskId }) => {
  const [comment, setComment]   = useState('');
  const [expanded, setExpanded] = useState(false);
  const ps = PART_STATUS[p.status] || PART_STATUS.working;
  const isMe = p.user?._id === currentUserId || p.user === currentUserId;

  const handleReview = (action) => {
    onReview({ participantUserId: p.user?._id || p.user, action, reviewComment: comment });
  };

  return (
    <div className="td2-participant">
      <div className="td2-participant-top">
        <Avatar user={p.user} size={34} />
        <div className="td2-participant-info">
          <span className="td2-participant-name">
            {p.user?.username || '—'} {isMe && <span className="td2-you-tag">Ви</span>}
          </span>
          <span className="td2-participant-mode">
            {p.joinMode === 'guild' ? <><FiShield size={11} /> Команда</> : <><FiUsers size={11} /> Соло</>}
          </span>
        </div>
        <span className="td2-part-status-pill" style={{ borderColor: ps.color, color: ps.color }}>
          {ps.label}
        </span>
      </div>

      {(isCreator || isMe) && p.status === 'review' && p.proofText && (
        <div className="td2-proof-block">
          <p className="td2-proof-label">Звіт:</p>
          <p className="td2-proof-text">{p.proofText}</p>
          {p.proofFile && (
            <a className="td2-proof-link" href={p.proofFile.startsWith('http') ? p.proofFile : `${API_BASE_URL}/${p.proofFile}`} target="_blank" rel="noreferrer">
              <FiUpload size={14} /> Файл підтвердження
            </a>
          )}
        </div>
      )}

      {isCreator && p.status === 'review' && (
        <div className="td2-review-controls">
          <textarea
            placeholder="Коментар (необов'язково)..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={2}
          />
          <div className="td2-review-btns">
            <button className="btn-approve" onClick={() => handleReview('approve')}>
              <FiCheck /> Підтвердити
            </button>
            <button className="btn-reject" onClick={() => handleReview('reject')}>
              <FiX /> Відхилити
            </button>
          </div>
        </div>
      )}

      {['approved', 'rejected'].includes(p.status) && p.reviewComment && (
        <div className={`td2-review-result ${p.status}`}>
          <FiMessageCircle size={13} /> {p.reviewComment}
        </div>
      )}
    </div>
  );
};

/**
 * CommentItem Component
 * Renders a single discussion comment on the task page, providing interaction
 * capabilities like liking or deleting the comment.
 *
 * @param {Object} props - Component properties.
 * @param {Object} props.comment - The comment object.
 * @param {string} props.currentUserId - The ID of the currently authenticated user.
 * @param {boolean} props.isCreator - Flag indicating if the current user is the task creator.
 * @param {string} props.taskId - The ID of the task.
 * @param {Function} props.onDelete - Callback invoked when deleting the comment.
 * @param {Function} props.onLike - Callback invoked when liking the comment.
 * @returns {JSX.Element} The rendered comment item.
 */
const CommentItem = ({ comment, currentUserId, isCreator, taskId, onDelete, onLike }) => {
  const isOwn  = comment.author?._id === currentUserId;
  const liked  = comment.likes?.includes(currentUserId);
  const timeAgo = (d) => {
    const s = Math.floor((Date.now() - new Date(d)) / 1000);
    if (s < 60)   return `${s}с тому`;
    if (s < 3600) return `${Math.floor(s/60)}хв тому`;
    if (s < 86400)return `${Math.floor(s/3600)}год тому`;
    return new Date(d).toLocaleDateString('uk-UA');
  };

  return (
    <motion.div className="td2-comment" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Avatar user={comment.author} size={32} />
      <div className="td2-comment-body">
        <div className="td2-comment-header">
          <span className="td2-comment-author">{comment.author?.username || '—'}</span>
          <span className="td2-comment-time">{timeAgo(comment.createdAt)}</span>
        </div>
        <p className="td2-comment-text">{comment.text}</p>
        <div className="td2-comment-actions">
          <button
            className={`td2-like-btn ${liked ? 'liked' : ''}`}
            onClick={() => onLike(comment._id)}
          >
            <FiHeart size={13} /> {comment.likes?.length || 0}
          </button>
          {(isOwn || isCreator) && (
            <button className="td2-delete-btn" onClick={() => onDelete(comment._id)}>
              <FiTrash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/**
 * SuccessOverlay Component
 * A full-screen overlay displaying a success message after submitting proof of task completion.
 *
 * @param {Object} props - Component properties.
 * @param {Function} props.onClose - Callback to close the overlay.
 * @param {number} props.points - The number of points that will be awarded upon approval.
 * @returns {JSX.Element} The rendered success overlay.
 */
const SuccessOverlay = ({ onClose, points }) => (
  <motion.div 
    className="success-overlay"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <motion.div 
      className="success-card"
      initial={{ scale: 0.8, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.8, y: 20 }}
    >
      <div className="success-icon-wrap">
        <FiStar className="success-star-icon" />
      </div>
      <h2>Дякуємо за допомогу!</h2>
      <p>Ваш звіт успішно відправлено на перевірку. Автор завдання перегляне його найближчим часом.</p>
      <div className="success-reward">
        <span>Ви отримаєте</span>
        <strong>+{points} XP</strong>
      </div>
      <button className="btn-primary" style={{ width: '100%' }} onClick={onClose}>Чудово!</button>
    </motion.div>
  </motion.div>
);

/**
 * ProofForm Component
 * Renders the form for a participant to submit proof of their completed task execution.
 *
 * @param {Object} props - Component properties.
 * @param {string} props.taskId - The ID of the task being submitted.
 * @param {Function} props.onSubmitted - Callback invoked upon successful submission.
 * @returns {JSX.Element} The rendered proof submission form.
 */
const ProofForm = ({ taskId, onSubmitted }) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('userToken');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('proofText', text);
      if (file) fd.append('proofFile', file);
      await axios.post(`${API_BASE_URL}/api/tasks/${taskId}/submit-proof`, fd, {
        headers: { 'x-auth-token': token, 'Content-Type': 'multipart/form-data' },
      });
      onSubmitted();
    } catch (err) {
      alert(err.response?.data?.msg || 'Помилка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="td2-proof-form" onSubmit={handleSubmit}>
      <h4><FiUpload size={14} /> Підтвердити виконання</h4>
      <textarea placeholder="Опишіть, що ви зробили..." value={text}
        onChange={e => setText(e.target.value)} rows={3} required />
      <label className="file-upload-label">
        <input type="file" accept="image/*,.pdf" onChange={e => setFile(e.target.files[0])} hidden />
        <FiUpload size={14} /> {file ? file.name : "Прикріпити файл (необов'язково)"}
      </label>
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? 'Відправка...' : 'Відправити на перевірку'}
      </button>
    </form>
  );
};

/**
 * JoinControls Component
 * Provides context-aware controls for joining, leaving, or submitting proof for a task.
 * Adapts options depending on whether the user is a guest, a solo participant, or acting on behalf of a guild.
 *
 * @param {Object} props - Component properties.
 * @param {Object} props.task - The task object.
 * @param {Object} props.myGuild - The current user's guild data, if any.
 * @param {string} props.currentUserId - The current user's ID.
 * @param {Function} props.onJoin - Callback to join the task or submit proof.
 * @param {Function} props.onLeave - Callback to leave the task.
 * @returns {JSX.Element} The rendered join controls block.
 */
const JoinControls = ({ task, myGuild, currentUserId, onJoin, onLeave }) => {
  const token   = localStorage.getItem('userToken');
  const isGuest = !token || localStorage.getItem('userRole') === 'guest';

  const myParticipant = task.participants?.find(
    p => (p.user?._id || p.user) === currentUserId
  );

  if (isGuest) return (
    <div className="td2-join-hint">
      <FiAlertCircle /> <Link to="/login">Увійдіть</Link>, щоб взяти участь
    </div>
  );

  if (task.status === 'closed') return (
    <div className="td2-closed-hint">Завдання закрито для участі</div>
  );

  if (myParticipant) {
    return (
      <div className="td2-my-status">
        <span>Ваш статус: <strong style={{ color: PART_STATUS[myParticipant.status]?.color }}>
          {PART_STATUS[myParticipant.status]?.label}
        </strong></span>
        {myParticipant.status === 'working' && (
          <>
            <ProofForm taskId={task._id} onSubmitted={() => onJoin('submit')} />
            <button className="btn-leave" onClick={onLeave}><FiX /> Покинути завдання</button>
          </>
        )}
        {myParticipant.status === 'review' && (
          <p className="td2-review-pending"><FiClock size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Ваш звіт на перевірці у автора завдання</p>
        )}
      </div>
    );
  }

  return (
    <div className="td2-join-controls">
      <button className="btn-join-solo" id="join-task-solo"
        onClick={() => onJoin('solo')}>
        <FiUsers /> Приєднатись (соло)
      </button>
      {myGuild && (
        <button className="btn-join-guild" id="join-task-guild"
          onClick={() => onJoin('guild', myGuild._id)}>
          <FiShield /> Від гільдії «{myGuild.name}»
        </button>
      )}
    </div>
  );
};

/**
 * TaskDetailPage Component
 * Renders the detailed view of a specific task, managing participation, proof submission, reviews, and comments.
 *
 * @returns {JSX.Element} The rendered task detail page.
 */
const TaskDetailPage = () => {
  const { id } = useParams();
  const [task, setTask]         = useState(null);
  const [myGuild, setMyGuild]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [comment, setComment]   = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [toast, setToast]       = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const commentsEndRef = useRef(null);

  const token      = localStorage.getItem('userToken');
  const currentUserId = localStorage.getItem('userId')?.replace(/"/g, '');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchTask = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/tasks/${id}`);
      setTask(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTask();
    if (token) {
      axios.get(`${API_BASE_URL}/api/guilds/my/guild`, {
        headers: { 'x-auth-token': token },
      }).then(r => setMyGuild(r.data)).catch(() => {});
    }
  }, [fetchTask, token]);

  const handleJoin = async (mode = 'solo', guildId = null) => {
    try {
      if (mode === 'submit') {
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#22c55e', '#facc15']
          });
          playSound('success');
          setShowSuccess(true);
      } else {
          await axios.post(`${API_BASE_URL}/api/tasks/${id}/join`,
            { joinMode: mode, guildId },
            { headers: { 'x-auth-token': token } }
          );
          playSound('click');
          showToast('Ви приєдналися до завдання');
      }
      fetchTask();
    } catch (err) { showToast(err.response?.data?.msg || 'Помилка', 'error'); }
  };

  const handleLeave = async () => {
    if (!window.confirm('Покинути завдання?')) return;
    try {
      await axios.post(`${API_BASE_URL}/api/tasks/${id}/leave`, {},
        { headers: { 'x-auth-token': token } }
      );
      showToast('Ви покинули завдання');
      fetchTask();
    } catch (err) { showToast(err.response?.data?.msg || 'Помилка', 'error'); }
  };

  const handleReview = async ({ participantUserId, action, reviewComment }) => {
    try {
      await axios.post(`${API_BASE_URL}/api/tasks/${id}/review`,
        { participantUserId, action, reviewComment },
        { headers: { 'x-auth-token': token } }
      );
      playSound(action === 'approve' ? 'badge' : 'click');
      showToast(action === 'approve' ? 'Виконання підтверджено! ✅' : 'Виконання відхилено ❌');
      fetchTask();
    } catch (err) { showToast(err.response?.data?.msg || 'Помилка', 'error'); }
  };

  const handleCloseTask = async () => {
    if (!window.confirm('Закрити завдання для нових учасників?')) return;
    try {
      await axios.post(`${API_BASE_URL}/api/tasks/${id}/close`, {},
        { headers: { 'x-auth-token': token } }
      );
      showToast('Завдання успішно закрито');
      fetchTask();
    } catch (err) { showToast(err.response?.data?.msg || 'Помилка', 'error'); }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setPostingComment(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/tasks/${id}/comments`,
        { text: comment.trim() },
        { headers: { 'x-auth-token': token } }
      );
      setTask(prev => ({ ...prev, comments: [...(prev.comments || []), res.data] }));
      setComment('');
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) { alert(err.response?.data?.msg || 'Помилка'); }
    finally { setPostingComment(false); }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/tasks/${id}/comments/${commentId}`,
        { headers: { 'x-auth-token': token } }
      );
      setTask(prev => ({ ...prev, comments: prev.comments.filter(c => c._id !== commentId) }));
    } catch (err) { alert(err.response?.data?.msg || 'Помилка'); }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/tasks/${id}/comments/${commentId}/like`, {},
        { headers: { 'x-auth-token': token } }
      );
      setTask(prev => ({
        ...prev,
        comments: prev.comments.map(c => {
          if (c._id !== commentId) return c;
          const likes = res.data.liked
            ? [...(c.likes || []), currentUserId]
            : (c.likes || []).filter(l => l !== currentUserId);
          return { ...c, likes };
        }),
      }));
    } catch (err) { console.error(err); }
  };

  if (loading) return (
    <div className="dashboard-layout"><Sidebar />
      <main className="dashboard-main"><DashboardHeader />
        <div className="td2-loading"><div className="guilds-spinner" /> Завантаження...</div>
      </main>
    </div>
  );

  if (!task) return (
    <div className="dashboard-layout"><Sidebar />
      <main className="dashboard-main"><DashboardHeader />
        <div className="td2-loading">Завдання не знайдено.</div>
      </main>
    </div>
  );

  const sm = STATUS_META[task.status] || STATUS_META.open;
  const isCreator = task.createdBy?._id === currentUserId || task.createdBy === currentUserId;
  const approvedCount = task.participants?.filter(p => p.status === 'approved').length ?? 0;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <DashboardHeader />
        <AnimatedPage>
          <div className="dashboard-content-wrapper td2-wrapper">
            <AnimatePresence>
              {showSuccess && (
                <SuccessOverlay 
                  points={task?.points || 0} 
                  onClose={() => setShowSuccess(false)} 
                />
              )}
            </AnimatePresence>

            {toast && (
              <div 
                className={`guild-toast ${toast.type}`} 
                style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '12px 24px', borderRadius: '8px', background: toast.type === 'error' ? 'var(--danger)' : 'var(--success)', color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontWeight: 600 }}
              >
                {toast.msg}
              </div>
            )}

            <Link to="/tasks" className="td2-back"><FiChevronLeft /> Всі завдання</Link>

            <div className="td2-layout">
              <div className="td2-main">

                <div className="td2-header-card">
                  <div className="td2-cover-emoji">
                    {task.coverImage ? (
                      <img src={task.coverImage.startsWith('http') ? task.coverImage : `${API_BASE_URL}/${task.coverImage}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }} />
                    ) : (
                      <FiFileText size={28} />
                    )}
                  </div>
                  <div className="td2-header-info">
                    <div className="td2-header-top">
                      <h1 className="td2-title">{task.title}</h1>
                      <span className="td2-points-badge">+{task.points} XP</span>
                    </div>
                    <div className="td2-header-meta">
                      <span className="td2-status-chip" style={{ borderColor: sm.color, color: sm.color }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: sm.color, display: 'inline-block' }} />
                        {sm.label}
                      </span>
                      <span><FiTag size={13} /> {task.category}</span>
                      {task.endDate && <span><FiClock size={13} /> {new Date(task.endDate).toLocaleDateString('uk-UA')}</span>}
                      {task.guildOnly && <span className="guild-only-badge"><FiShield size={13} /> Для команд</span>}
                    </div>
                    <div className="td2-creator-row">
                      <Avatar user={task.createdBy} size={24} />
                      <span>Автор: <strong>{task.createdBy?.username}</strong></span>
                      {isCreator && task.status !== 'closed' && (
                        <>
                          <button className="btn-close-task" onClick={handleCloseTask}>Закрити завдання</button>
                          <button className="btn-close-task" style={{ background: 'var(--accent)', color: 'var(--accent-text)', marginLeft: '8px' }} onClick={() => setShowEdit(true)}><FiEdit size={13} /> Редагувати</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="td2-section">
                  <h3 className="td2-section-title"><FiFileText size={15} /> Опис</h3>
                  <p className="td2-description">{task.description}</p>
                  {task.filePath && (
                    <a className="td2-attachment" href={task.filePath.startsWith('http') ? task.filePath : `${API_BASE_URL}/${task.filePath}`} target="_blank" rel="noreferrer">
                      <FiUpload size={14} /> Завантажити інструкцію
                    </a>
                  )}
                </div>

                {task.lat && task.lng && (
                  <div className="td2-section">
                    <h3 className="td2-section-title"><FiMapPin size={15} /> Місце виконання</h3>
                    {task.address && <p className="td2-description" style={{ marginBottom: '12px' }}>{task.address}</p>}
                    <div style={{ height: '250px', width: '100%', border: 'var(--border)', overflow: 'hidden' }}>
                      <MapContainer center={[task.lat, task.lng]} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={[task.lat, task.lng]} />
                      </MapContainer>
                    </div>
                  </div>
                )}

                <div className="td2-section">
                  <h3 className="td2-section-title"><FiZap size={15} /> Участь</h3>
                  <JoinControls
                    task={task}
                    myGuild={myGuild}
                    currentUserId={currentUserId}
                    onJoin={handleJoin}
                    onLeave={handleLeave}
                  />
                </div>

                <div className="td2-section">
                  <h3 className="td2-section-title">
                    <FiUsers size={15} /> Учасники ({task.participants?.length ?? 0})
                    {approvedCount > 0 && <span className="td2-approved-count"> · {approvedCount} підтверджено</span>}
                  </h3>
                  {task.participants?.length === 0 ? (
                    <p className="td2-empty">Поки немає учасників. Будьте першим!</p>
                  ) : (
                    <div className="td2-participants-list">
                      {task.participants.map((p, i) => (
                        <ParticipantRow
                          key={p._id || i}
                          p={p}
                          isCreator={isCreator}
                          currentUserId={currentUserId}
                          onReview={handleReview}
                          taskId={id}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="td2-section td2-comments-section">
                  <h3 className="td2-section-title">
                    <FiMessageCircle size={15} /> Коментарі ({task.comments?.length ?? 0})
                  </h3>

                  <div className="td2-comments-list">
                    <AnimatePresence>
                      {(task.comments || []).map(c => (
                        <CommentItem
                          key={c._id}
                          comment={c}
                          currentUserId={currentUserId}
                          isCreator={isCreator}
                          taskId={id}
                          onDelete={handleDeleteComment}
                          onLike={handleLikeComment}
                        />
                      ))}
                    </AnimatePresence>
                    <div ref={commentsEndRef} />
                  </div>

                  {token && localStorage.getItem('userRole') !== 'guest' && (
                    <form className="td2-comment-form" onSubmit={handleAddComment}>
                      <Avatar user={{ username: '' }} size={32} />
                      <input
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="Напишіть коментар..."
                        maxLength={1000}
                      />
                      <button type="submit" disabled={postingComment || !comment.trim()}>
                        <FiSend />
                      </button>
                    </form>
                  )}
                </div>
              </div>

              <div className="td2-sidebar">
                <div className="td2-info-card">
                  <h4>Статистика</h4>
                  <div className="td2-stat-row">
                    <FiZap className="stat-icon xp" />
                    <div>
                      <div className="td2-stat-val">{task.points}</div>
                      <div className="td2-stat-lbl">XP за виконання</div>
                    </div>
                  </div>
                  <div className="td2-stat-row">
                    <FiUsers className="stat-icon members" />
                    <div>
                      <div className="td2-stat-val">{task.participants?.length ?? 0}</div>
                      <div className="td2-stat-lbl">Учасників</div>
                    </div>
                  </div>
                  <div className="td2-stat-row">
                    <FiCheck className="stat-icon approved" />
                    <div>
                      <div className="td2-stat-val">{approvedCount}</div>
                      <div className="td2-stat-lbl">Підтверджено</div>
                    </div>
                  </div>
                  <div className="td2-stat-row">
                    <FiMessageCircle className="stat-icon comments" />
                    <div>
                      <div className="td2-stat-val">{task.comments?.length ?? 0}</div>
                      <div className="td2-stat-lbl">Коментарів</div>
                    </div>
                  </div>
                </div>

                {task.targetGuild && (
                  <div className="td2-info-card">
                    <h4><FiShield /> Гільдія</h4>
                    <p>{task.targetGuild?.logo} {task.targetGuild?.name}</p>
                  </div>
                )}

                {task.lat && task.lng && (
                  <div className="td2-info-card">
                    <h4><FiMapPin /> Локація</h4>
                    {task.address && <p style={{ fontSize: '0.82rem', marginBottom: '4px' }}>{task.address}</p>}
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', opacity: 0.5 }}>
                      {task.lat.toFixed(4)}, {task.lng.toFixed(4)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <AnimatePresence>
              {showEdit && (
                <EditTaskModal task={task} onClose={() => setShowEdit(false)} onUpdated={(updated) => { setTask(updated); setShowEdit(false); showToast('Завдання оновлено'); }} />
              )}
            </AnimatePresence>
          </div>
        </AnimatedPage>
      </main>
    </div>
  );
};

/**
 * EditTaskModal Component
 * Provides a modal interface to edit the attributes of an existing task.
 *
 * @param {Object} props - Component properties.
 * @param {Object} props.task - The task data being edited.
 * @param {Function} props.onClose - Callback to close the modal without saving.
 * @param {Function} props.onUpdated - Callback invoked with the new task data upon successful update.
 * @returns {JSX.Element} The rendered task edit modal.
 */
const EditTaskModal = ({ task, onClose, onUpdated }) => {
  const [form, setForm] = useState({
    title: task.title, description: task.description,
    category: task.category, points: task.points,
    endDate: task.endDate ? new Date(task.endDate).toISOString().split('T')[0] : '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const token = localStorage.getItem('userToken');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.put(`${API_BASE_URL}/api/tasks/${task._id}/edit`, form, {
        headers: { 'x-auth-token': token },
      });
      onUpdated(res.data);
    } catch (err) {
      setError(err.response?.data?.msg || 'Помилка');
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
          <h2>Редагувати завдання</h2>
          <button className="modal-close-btn" onClick={onClose}><FiX /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Назва</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Опис</label>
            <textarea rows={4} value={form.description} onChange={e => set('description', e.target.value)} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Категорія</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}>
                <option value="volunteering">Волонтерство</option>
                <option value="aid">Допомога</option>
                <option value="donation">Донат</option>
                <option value="education">Освіта</option>
                <option value="ecology">Екологія</option>
                <option value="military">Армія</option>
                <option value="other">Інше</option>
              </select>
            </div>
            <div className="form-group">
              <label>Балів</label>
              <input type="number" min={1} value={form.points} onChange={e => set('points', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Дедлайн</label>
            <input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} />
          </div>
          {error && <div className="modal-error">{error}</div>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Збереження...' : 'Зберегти зміни'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default TaskDetailPage;