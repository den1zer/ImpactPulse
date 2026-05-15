import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AnimatedPage from '../components/AnimatedPage';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';
import { Link } from 'react-router-dom';
import { FiClipboard, FiArrowUpRight, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import '../styles/Dashboard.css';
import '../styles/MyContributions.css';
import API_BASE_URL from '../config/api.js';

const TYPE_LABELS = {
  donation:     'Донат',
  volunteering: 'Волонтерство',
  aid:          'Допомога',
  other:        'Інше',
};

const STATUS_META = {
  pending:  { label: 'Очікує',   cls: 'pending' },
  approved: { label: 'Схвалено', cls: 'approved' },
  rejected: { label: 'Відхилено', cls: 'rejected' },
};

const FILTERS = [
  { key: 'all',          label: 'Усі' },
  { key: 'donation',     label: 'Донат' },
  { key: 'volunteering', label: 'Волонтерство' },
  { key: 'aid',          label: 'Допомога' },
  { key: 'other',        label: 'Інше' },
];

const PER_PAGE = 6;

const Paginator = ({ total, current, onChange }) => {
  if (total <= 1) return null;
  return (
    <div className="mc-pagination">
      <button
        className="mc-page-btn"
        disabled={current === 1}
        onClick={() => onChange(current - 1)}
      >
        <FiChevronLeft />
      </button>
      {Array.from({ length: total }, (_, i) => i + 1).map(n => (
        <button
          key={n}
          className={`mc-page-btn ${current === n ? 'active' : ''}`}
          onClick={() => onChange(n)}
        >
          {n}
        </button>
      ))}
      <button
        className="mc-page-btn"
        disabled={current === total}
        onClick={() => onChange(current + 1)}
      >
        <FiChevronRight />
      </button>
    </div>
  );
};

const MyContributionsPage = () => {
  const [contributions, setContributions] = useState([]);
  const [tasks,         setTasks]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [taskPage,      setTaskPage]      = useState(1);
  const [contribPage,   setContribPage]   = useState(1);
  const [filter,        setFilter]        = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token  = localStorage.getItem('userToken');
        const config = { headers: { 'x-auth-token': token } };
        const [cRes, tRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/contributions/my`, config),
          axios.get(`${API_BASE_URL}/api/tasks/my`, config),
        ]);
        setContributions(cRes.data);
        setTasks(tRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered     = contributions.filter(c => filter === 'all' || c.type === filter);
  const totalTask    = Math.ceil(tasks.length / PER_PAGE);
  const totalContrib = Math.ceil(filtered.length / PER_PAGE);

  const pageTasks    = tasks.slice((taskPage - 1) * PER_PAGE, taskPage * PER_PAGE);
  const pageContribs = filtered.slice((contribPage - 1) * PER_PAGE, contribPage * PER_PAGE);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <DashboardHeader />
        <AnimatedPage>
          <div className="dashboard-content-wrapper">

            {/* Hero */}
            <div className="mc-hero">
              <div>
                <p className="small-title">ImpactPulse / Мої внески</p>
                <h1>Мої Заявки</h1>
                <p className="mc-hero-desc">Завдання в роботі та повна історія ваших заявок.</p>
              </div>
            </div>

            {loading ? (
              <div className="mc-loading">
                <div className="guilds-spinner" />
                <span>ЗАВАНТАЖЕННЯ...</span>
              </div>
            ) : (
              <>
                {/* ── Tasks in progress ── */}
                <section className="mc-section">
                  <div className="mc-section-header">
                    <h2 className="mc-section-title">
                      <FiClipboard size={16} />
                      Завдання в опрацюванні
                      <span className="mc-count">{tasks.length}</span>
                    </h2>
                  </div>

                  {tasks.length === 0 ? (
                    <div className="mc-empty">Активних завдань немає.</div>
                  ) : (
                    <>
                      <div className="mc-tasks-grid">
                        {pageTasks.map(task => (
                          <div key={task._id} className="mc-task-card">
                            <div className="mc-task-top">
                              <h3 className="mc-task-title">{task.title}</h3>
                              <span className="mc-task-pts">+{task.points} XP</span>
                            </div>
                            <p className="mc-task-desc">{task.description}</p>
                            <Link to={`/tasks/${task._id}`} className="mc-task-link">
                              Переглянути деталі
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                            </Link>
                          </div>
                        ))}
                      </div>
                      <Paginator total={totalTask} current={taskPage} onChange={p => { setTaskPage(p); window.scrollTo(0, 0); }} />
                    </>
                  )}
                </section>

                {/* ── Contributions history ── */}
                <section className="mc-section">
                  <div className="mc-section-header">
                    <h2 className="mc-section-title">
                      Історія заявок
                      <span className="mc-count">{contributions.length}</span>
                    </h2>
                    {/* Filters */}
                    <div className="mc-filters">
                      {FILTERS.map(f => (
                        <button
                          key={f.key}
                          className={`mc-filter-btn ${filter === f.key ? 'active' : ''}`}
                          onClick={() => { setFilter(f.key); setContribPage(1); }}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filtered.length === 0 ? (
                    <div className="mc-empty">Заявок за цим фільтром немає.</div>
                  ) : (
                    <>
                      <div className="mc-contribs-list">
                        {pageContribs.map(item => {
                          const sm = STATUS_META[item.status] || { label: item.status, cls: 'pending' };
                          return (
                            <div key={item._id} className={`mc-contrib-card status-${sm.cls}`}>
                              <div className={`mc-contrib-bar bar-${sm.cls}`} />
                              <div className="mc-contrib-body">
                                <div className="mc-contrib-top">
                                  <h3 className="mc-contrib-title">{item.title}</h3>
                                  <div className="mc-contrib-badges">
                                    <span className="mc-type-tag">{TYPE_LABELS[item.type] || 'Інше'}</span>
                                    <span className={`mc-status-tag ${sm.cls}`}>{sm.label}</span>
                                  </div>
                                </div>
                                <p className="mc-contrib-meta">
                                  Створено: {new Date(item.createdAt).toLocaleDateString('uk-UA')}
                                  {item.status === 'approved' && ` · Схвалено: ${new Date(item.updatedAt).toLocaleDateString('uk-UA')}`}
                                  {item.status === 'rejected' && ` · Відхилено: ${new Date(item.updatedAt).toLocaleDateString('uk-UA')}`}
                                </p>
                                {(item.description || item.itemList) && (
                                  <p className="mc-contrib-desc">{item.description || item.itemList}</p>
                                )}
                                {item.status === 'approved' && item.pointsAwarded > 0 && (
                                  <p className="mc-contrib-award">+{item.pointsAwarded} балів нараховано</p>
                                )}
                                {item.status === 'rejected' && item.rejectionComment && (
                                  <div className="mc-rejection">
                                    <span className="mc-rejection-label">Причина відхилення:</span>
                                    <p>{item.rejectionComment}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <Paginator total={totalContrib} current={contribPage} onChange={p => { setContribPage(p); window.scrollTo(0, 0); }} />
                    </>
                  )}
                </section>
              </>
            )}

          </div>
        </AnimatedPage>
      </main>
    </div>
  );
};

export default MyContributionsPage;