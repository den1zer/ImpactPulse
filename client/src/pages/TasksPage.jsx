import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import API_BASE_URL from '../config/api.js';
import AnimatedPage from '../components/AnimatedPage';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';
import '../styles/Dashboard.css';
import '../styles/TasksPage.css';

const FILTERS = [
  { key: 'all',         label: 'Всі' },
  { key: 'open',        label: 'Відкриті' },
  { key: 'in_progress', label: 'В роботі' },
  { key: 'completed',   label: 'Завершені' },
];

const STATUS_MAP = {
  open:        { label: 'Відкрите',  dot: 'open' },
  in_progress: { label: 'В процесі', dot: 'in_progress' },
  completed:   { label: 'Завершено', dot: 'completed' },
};

const TasksPage = () => {
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');

  useEffect(() => {
    const fetch = async () => {
      try {
        const token  = localStorage.getItem('userToken') || '';
        const config = { headers: { 'x-auth-token': token } };
        const res    = await axios.get(`${API_BASE_URL}/api/tasks`, config);
        setTasks(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <DashboardHeader />
        <AnimatedPage>
          <div className="dashboard-content-wrapper">
            <div className="tasks-container">

              {/* Header row */}
              <div className="tasks-header">
                <h2>Актуальні завдання <span className="text-muted" style={{ fontWeight: 400 }}>({filtered.length})</span></h2>
                <div className="tasks-filter">
                  {FILTERS.map(f => (
                    <button
                      key={f.key}
                      className={`filter-btn${filter === f.key ? ' active' : ''}`}
                      onClick={() => setFilter(f.key)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* States */}
              {loading && (
                <div className="tasks-empty">Завантаження завдань…</div>
              )}
              {!loading && filtered.length === 0 && (
                <div className="tasks-empty">Завдань за цим фільтром немає.</div>
              )}

              {/* Task list */}
              {!loading && filtered.length > 0 && (
                <div className="tasks-grid">
                  {filtered.map(task => {
                    const s = STATUS_MAP[task.status] || { label: task.status, dot: 'open' };
                    return (
                      <div key={task._id} className="task-card">
                        <div className="task-header">
                          <h3>{task.title}</h3>
                          <span className="task-points">+{task.points} балів</span>
                        </div>

                        <div className="task-meta">
                          <span>
                            <span className={`status-dot ${s.dot}`} />
                            {s.label}
                          </span>
                          <span><strong>Категорія:</strong> {task.category || '—'}</span>
                          <span>
                            <strong>Дедлайн:</strong>{' '}
                            {task.endDate ? new Date(task.endDate).toLocaleDateString('uk-UA') : 'Немає'}
                          </span>
                          {task.filePath && (
                            <a
                              href={`${API_BASE_URL}/${task.filePath}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="proof-link"
                            >
                              Інструкція ↗
                            </a>
                          )}
                        </div>

                        <Link to={`/tasks/${task._id}`} className="task-button">
                          Деталі →
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </div>
        </AnimatedPage>
      </main>
    </div>
  );
};

export default TasksPage;