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
  FiUpload, FiChevronLeft, FiAlertCircle,
} from 'react-icons/fi';
import '../styles/TasksPage.css';
import './TaskDetailPage2.css';

// ── helpers ───────────────────────────────────────────────────
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
  const letter = user?.username?.[0]?.toUpperCase() || '?';
  return (
    <div className="td2-avatar" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {src ? <img src={src} alt={user.username} /> : letter}
    </div>
  );
};

// ── Participant row ───────────────────────────────────────────
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

      {/* Proof (visible to creator or self) */}
      {(isCreator || isMe) && p.status === 'review' && p.proofText && (
        <div className="td2-proof-block">
          <p className="td2-proof-label">Звіт:</p>
          <p className="td2-proof-text">{p.proofText}</p>
          {p.proofFile && (
            <a className="td2-proof-link" href={`${API_BASE_URL}/${p.proofFile}`} target="_blank" rel="noreferrer">
              📎 Файл підтвердження
            </a>
          )}
        </div>
      )}

      {/* Creator review controls */}
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

      {/* Review result */}
      {['approved', 'rejected'].includes(p.status) && p.reviewComment && (
        <div className={`td2-review-result ${p.status}`}>
          💬 {p.reviewComment}
        </div>
      )}
    </div>
  );
};

// ── Comment item ──────────────────────────────────────────────
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

// ── Proof submit form ─────────────────────────────────────────
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

// ── Join buttons ──────────────────────────────────────────────
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
            <ProofForm taskId={task._id} onSubmitted={onJoin} />
            <button className="btn-leave" onClick={onLeave}><FiX /> Покинути завдання</button>
          </>
        )}
        {myParticipant.status === 'review' && (
          <p className="td2-review-pending">⏳ Ваш звіт на перевірці у автора завдання</p>
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

// ── Main page ─────────────────────────────────────────────────
const TaskDetailPage = () => {
  const { id } = useParams();
  const [task, setTask]         = useState(null);
  const [myGuild, setMyGuild]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [comment, setComment]   = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const commentsEndRef = useRef(null);

  const token      = localStorage.getItem('userToken');
  const currentUserId = localStorage.getItem('userId')?.replace(/"/g, '');

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
      await axios.post(`${API_BASE_URL}/api/tasks/${id}/join`,
        { joinMode: mode, guildId },
        { headers: { 'x-auth-token': token } }
      );
      fetchTask();
    } catch (err) { alert(err.response?.data?.msg || 'Помилка'); }
  };

  const handleLeave = async () => {
    if (!window.confirm('Покинути завдання?')) return;
    try {
      await axios.post(`${API_BASE_URL}/api/tasks/${id}/leave`, {},
        { headers: { 'x-auth-token': token } }
      );
      fetchTask();
    } catch (err) { alert(err.response?.data?.msg || 'Помилка'); }
  };

  const handleReview = async ({ participantUserId, action, reviewComment }) => {
    try {
      await axios.post(`${API_BASE_URL}/api/tasks/${id}/review`,
        { participantUserId, action, reviewComment },
        { headers: { 'x-auth-token': token } }
      );
      fetchTask();
    } catch (err) { alert(err.response?.data?.msg || 'Помилка'); }
  };

  const handleCloseTask = async () => {
    if (!window.confirm('Закрити завдання для нових учасників?')) return;
    try {
      await axios.post(`${API_BASE_URL}/api/tasks/${id}/close`, {},
        { headers: { 'x-auth-token': token } }
      );
      fetchTask();
    } catch (err) { alert(err.response?.data?.msg || 'Помилка'); }
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

            {/* ── Back ── */}
            <Link to="/tasks" className="td2-back"><FiChevronLeft /> Всі завдання</Link>

            <div className="td2-layout">
              {/* ══ LEFT: main info ══ */}
              <div className="td2-main">

                {/* Header card */}
                <div className="td2-header-card">
                  <div className="td2-cover-emoji">{task.coverEmoji || '📋'}</div>
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
                        <button className="btn-close-task" onClick={handleCloseTask}>Закрити завдання</button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="td2-section">
                  <h3 className="td2-section-title">📝 Опис</h3>
                  <p className="td2-description">{task.description}</p>
                  {task.filePath && (
                    <a className="td2-attachment" href={`${API_BASE_URL}/${task.filePath}`} target="_blank" rel="noreferrer">
                      📎 Завантажити інструкцію
                    </a>
                  )}
                </div>

                {/* Join controls */}
                <div className="td2-section">
                  <h3 className="td2-section-title">🚀 Участь</h3>
                  <JoinControls
                    task={task}
                    myGuild={myGuild}
                    currentUserId={currentUserId}
                    onJoin={handleJoin}
                    onLeave={handleLeave}
                  />
                </div>

                {/* Participants */}
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

                {/* Comments — Instagram style */}
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

              {/* ══ RIGHT: sidebar info ══ */}
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
              </div>
            </div>
          </div>
        </AnimatedPage>
      </main>
    </div>
  );
};

export default TaskDetailPage;