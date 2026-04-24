import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AnimatedPage from '../components/AnimatedPage';
import { useNavigate } from 'react-router-dom';

import '../styles/AdminDashboard.css';
import '../styles/AddHelpPage.css';

const PendingContributions = () => {
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchPending = async () => {
    setLoading(true);
    try {
      const token = JSON.parse(localStorage.getItem('userToken'));
      const config = {
        headers: { 'x-auth-token': token },
        params: { type: filterType }
      };
      const res = await axios.get('http://localhost:5000/api/contributions/pending', config);
      setContributions(res.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.msg || 'Не вдалося завантажити дані');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
    setCurrentPage(1);
  }, [filterType]);

  const handleApprove = async (id) => {
    const pointsInput = prompt("Скільки балів нарахувати?", "100");
    if (pointsInput === null) return;
    const points = parseInt(pointsInput) || 100;
    try {
      const token = JSON.parse(localStorage.getItem('userToken'));
      const config = { headers: { 'x-auth-token': token } };
      await axios.put(`http://localhost:5000/api/contributions/approve/${id}`, { points: points }, config);
      setContributions(contributions.filter(c => c._id !== id));
    } catch (err) { alert('Помилка схвалення: ' + (err.response?.data?.msg || '')); }
  };

  const handleReject = async (id) => {
    const comment = prompt('Вкажіть причину відхилення:');
    if (comment === null) return;
    if (comment === "") {
      alert("Причина відхилення є обов'язковою");
      return;
    }
    try {
      const token = JSON.parse(localStorage.getItem('userToken'));
      const config = { headers: { 'x-auth-token': token } };
      await axios.put(`http://localhost:5000/api/contributions/reject/${id}`, { comment: comment }, config);
      setContributions(contributions.filter(c => c._id !== id));
    } catch (err) { alert('Помилка відхилення: ' + (err.response?.data?.msg || '')); }
  };

  if (loading) return <p>Завантаження заявок...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  let filtered = contributions.filter(item =>
    (filterType === 'all' || item.type === filterType) &&
    (searchTerm === '' ||
      item.user?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (sortBy === 'newest') filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  else if (sortBy === 'oldest') filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  else if (sortBy === 'username') filtered.sort((a, b) => (a.user?.username || '').localeCompare(b.user?.username || ''));

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentContribs = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  return (
    <>
      <div className="admin-filters" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <label style={{ fontWeight: 600, color: '#555' }}>Тип:</label>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="filter-select">
            <option value="all">Всі</option><option value="donation">Донат</option><option value="aid">Гум. Допомога</option><option value="volunteering">Волонтерство</option><option value="other">Інше</option>
          </select>
        </div>
        <div>
          <label style={{ fontWeight: 600, color: '#555' }}>Пошук:</label>
          <input type="text" placeholder="Користувач, email, заголовок..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '8px 12px', border: '2px solid #e0e0e0', borderRadius: '8px', width: '250px' }} />
        </div>
        <div>
          <label style={{ fontWeight: 600, color: '#555' }}>Сортування:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-select">
            <option value="newest">Найновіші</option><option value="oldest">Найстарші</option><option value="username">По користувачу (A-Z)</option>
          </select>
        </div>
      </div>
      {filtered.length === 0 && <p>Заявок не знайдено.</p>}
      {filtered.length > 0 && (
        <>
          <table className="admin-table">
            <thead><tr><th>Користувач</th><th>Тип</th><th>Заголовок</th><th>Дата</th><th>Підтвердження</th><th>Дії</th></tr></thead>
            <tbody>
              {currentContribs.map(item => (
                <tr key={item._id}>
                  <td>{item.user ? `${item.user.username}${item.user.selectedBadge && item.user.selectedBadge.icon ? ` ${item.user.selectedBadge.icon}` : ''} (${item.user.email})` : 'Юзер видалений'}</td>
                  <td>{item.type}</td>
                  <td>{item.title}</td>
                  <td style={{ fontSize: '0.85em', color: '#999' }}>{new Date(item.createdAt).toLocaleDateString('uk-UA')}</td>
                  <td><a href={`http://localhost:5000/${item.filePath}`} target="_blank" rel="noopener noreferrer" className="proof-link">Подивитись</a></td>
                  <td>
                    <button className="action-btn approve" onClick={() => handleApprove(item._id)}>Схвалити</button>
                    <button className="action-btn reject" onClick={() => handleReject(item._id)}>Відхилити</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', margin: '20px 0', flexWrap: 'wrap' }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  style={{
                    padding: '8px 12px',
                    border: `2px solid ${currentPage === pageNum ? '#007bff' : '#e0e0e0'}`,
                    background: currentPage === pageNum ? '#007bff' : 'white',
                    color: currentPage === pageNum ? 'white' : '#333',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    minWidth: '44px'
                  }}
                >
                  {pageNum}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
};

const AdminUserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('username');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const token = JSON.parse(localStorage.getItem('userToken'));
      const config = { headers: { 'x-auth-token': token }, params: { role: filterRole } };
      try {
        const res = await axios.get('http://localhost:5000/api/users', config);
        setUsers(res.data);
        setLoading(false);
      } catch (err) { setLoading(false); }
    };
    fetchUsers();
    setCurrentPage(1);
  }, [filterRole]);

  const handleRoleChange = async (id, newRole) => {
    if (!window.confirm(`Змінити роль на ${newRole}?`)) return;
    try {
      const token = JSON.parse(localStorage.getItem('userToken'));
      const config = { headers: { 'x-auth-token': token } };
      await axios.put(`http://localhost:5000/api/users/role/${id}`, { role: newRole }, config);
      setUsers(users.map(user => user._id === id ? { ...user, role: newRole } : user));
      alert('Роль оновлено!');
    } catch (err) { alert('Помилка оновлення ролі'); }
  };

  if (loading) return <p>Завантаження користувачів...</p>;

  let filtered = users.filter(user =>
    (filterRole === 'all' || user.role === filterRole) &&
    (searchTerm === '' ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (sortBy === 'username') filtered.sort((a, b) => a.username.localeCompare(b.username));
  else if (sortBy === 'email') filtered.sort((a, b) => a.email.localeCompare(b.email));
  else if (sortBy === 'role') filtered.sort((a, b) => a.role.localeCompare(b.role));

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentUsers = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  return (
    <>
      <div className="admin-filters" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <label style={{ fontWeight: 600, color: '#555' }}>Роль:</label>
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="filter-select">
            <option value="all">Всі</option><option value="user">Юзери</option><option value="admin">Адміни</option>
          </select>
        </div>
        <div>
          <label style={{ fontWeight: 600, color: '#555' }}>Пошук:</label>
          <input type="text" placeholder="Username, email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '8px 12px', border: '2px solid #e0e0e0', borderRadius: '8px', width: '250px' }} />
        </div>
        <div>
          <label style={{ fontWeight: 600, color: '#555' }}>Сортування:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-select">
            <option value="username">По Username (A-Z)</option><option value="email">По Email (A-Z)</option><option value="role">По Ролі</option>
          </select>
        </div>
      </div>
      {filtered.length === 0 && <p>Користувачів не знайдено.</p>}
      {filtered.length > 0 && (
        <>
          <table className="admin-table">
            <thead><tr><th>Username</th><th>Email</th><th>Роль</th><th>Дата Реєстрації</th><th>Дії</th></tr></thead>
            <tbody>
              {currentUsers.map(user => (
                <tr key={user._id}>
                  <td>{user.username}{user.selectedBadge && user.selectedBadge.icon ? ` ${user.selectedBadge.icon}` : ''}</td><td>{user.email}</td>
                  <td>
                    <select value={user.role} onChange={(e) => handleRoleChange(user._id, e.target.value)} className="neumorph-select">
                      <option value="user">User</option><option value="admin">Admin</option>
                    </select>
                  </td>
                  <td style={{ fontSize: '0.85em', color: '#999' }}>{new Date(user.createdAt).toLocaleDateString('uk-UA')}</td>
                  <td>
                    {user.role === 'user' ? (
                      <button className="action-btn approve" onClick={() => handleRoleChange(user._id, 'admin')}>Зробити Адміном</button>
                    ) : (
                      <button className="action-btn reject" onClick={() => handleRoleChange(user._id, 'user')}>Зробити Юзером</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', margin: '20px 0', flexWrap: 'wrap' }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button key={page} onClick={() => setCurrentPage(page)} style={{
                padding: '8px 12px',
                border: `2px solid ${currentPage === page ? '#007bff' : '#e0e0e0'}`,
                backgroundColor: currentPage === page ? '#007bff' : 'white',
                color: currentPage === page ? 'white' : '#333',
                borderRadius: '8px',
                cursor: 'pointer',
                minWidth: '44px',
                fontWeight: currentPage === page ? 'bold' : 'normal',
                transition: '0.3s ease'
              }}>
                {page}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
};

const AdminTicketList = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('userToken'));
        const config = { headers: { 'x-auth-token': token } };
        const res = await axios.get('http://localhost:5000/api/support/tickets', config);
        setTickets(res.data);
        setLoading(false);
      } catch (err) { setLoading(false); }
    };
    fetchTickets();
  }, []);

  if (loading) return <p>Завантаження тікетів...</p>;

  let filtered = tickets.filter(ticket =>
    searchTerm === '' ||
    ticket.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.question.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (sortBy === 'newest') filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  else if (sortBy === 'oldest') filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  else if (sortBy === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));

  if (filtered.length === 0) return <p>Тікетів не знайдено.</p>;

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentTickets = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  return (
    <>
      <div className="admin-filters" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <label style={{ fontWeight: 600, color: '#555' }}>Пошук:</label>
          <input type="text" placeholder="Ім'я, email, питання..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '8px 12px', border: '2px solid #e0e0e0', borderRadius: '8px', width: '300px' }} />
        </div>
        <div>
          <label style={{ fontWeight: 600, color: '#555' }}>Сортування:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-select">
            <option value="newest">Найновіші</option><option value="oldest">Найстарші</option><option value="name">По Імені (A-Z)</option>
          </select>
        </div>
      </div>
      <table className="admin-table">
        <thead><tr><th>Ім'я</th><th>Email</th><th>Телефон</th><th>Питання</th><th>Дата</th></tr></thead>
        <tbody>
          {currentTickets.map(ticket => (
            <tr key={ticket._id}>
              <td>{ticket.name}</td>
              <td><a href={`mailto:${ticket.email}`} className="proof-link">{ticket.email}</a></td>
              <td>{ticket.phone || '---'}</td>
              <td>{ticket.question}</td>
              <td style={{ fontSize: '0.85em', color: '#999' }}>{new Date(ticket.createdAt).toLocaleDateString('uk-UA')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', margin: '20px 0', flexWrap: 'wrap' }}>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button key={page} onClick={() => setCurrentPage(page)} style={{
            padding: '8px 12px',
            border: `2px solid ${currentPage === page ? '#007bff' : '#e0e0e0'}`,
            backgroundColor: currentPage === page ? '#007bff' : 'white',
            color: currentPage === page ? 'white' : '#333',
            borderRadius: '8px',
            cursor: 'pointer',
            minWidth: '44px',
            fontWeight: currentPage === page ? 'bold' : 'normal',
            transition: '0.3s ease'
          }}>
            {page}
          </button>
        ))}
      </div>
    </>
  );
};

const AdminFeedbackList = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const StarRating = ({ rating }) => (
    <div className="admin-rating-stars">
      {[...Array(5)].map((_, index) => (
        <span key={index} className={index < rating ? 'star-filled' : 'star-empty'}>
          ★
        </span>
      ))}
    </div>
  );

  useEffect(() => {
    const fetchFeedback = async () => {
      setLoading(true);
      try {
        const token = JSON.parse(localStorage.getItem('userToken'));
        const config = { headers: { 'x-auth-token': token }, params: { rating: filterRating } };
        const res = await axios.get('http://localhost:5000/api/support/feedback', config);
        setFeedback(res.data);
        setLoading(false);
      } catch (err) { setLoading(false); }
    };
    fetchFeedback();
    setCurrentPage(1);
  }, [filterRating]);

  if (loading) return <p>Завантаження відгуків...</p>;

  let filtered = feedback.filter(item =>
    (filterRating === 'all' || item.rating.toString() === filterRating) &&
    (searchTerm === '' ||
      (item.user?.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.comment || '').toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (sortBy === 'newest') filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  else if (sortBy === 'oldest') filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  else if (sortBy === 'rating-high') filtered.sort((a, b) => b.rating - a.rating);
  else if (sortBy === 'rating-low') filtered.sort((a, b) => a.rating - b.rating);

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentFeedback = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  return (
    <>
      <div className="admin-filters" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <label style={{ fontWeight: 600, color: '#555' }}>Рейтинг:</label>
          <select value={filterRating} onChange={(e) => setFilterRating(e.target.value)} className="filter-select">
            <option value="all">Всі</option><option value="5">5★</option><option value="4">4★</option><option value="3">3★</option><option value="2">2★</option><option value="1">1★</option>
          </select>
        </div>
        <div>
          <label style={{ fontWeight: 600, color: '#555' }}>Пошук:</label>
          <input type="text" placeholder="Користувач, коментар..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '8px 12px', border: '2px solid #e0e0e0', borderRadius: '8px', width: '250px' }} />
        </div>
        <div>
          <label style={{ fontWeight: 600, color: '#555' }}>Сортування:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-select">
            <option value="newest">Найновіші</option><option value="oldest">Найстарші</option><option value="rating-high">Рейтинг (Вверх)</option><option value="rating-low">Рейтинг (Вниз)</option>
          </select>
        </div>
      </div>
      {filtered.length === 0 && <p>Відгуків за цим фільтром немає.</p>}
      {filtered.length > 0 && (
        <>
          <table className="admin-table">
            <thead><tr><th>Користувач</th><th>Рейтинг</th><th>Коментар</th><th>Дата</th></tr></thead>
            <tbody>
              {currentFeedback.map(item => (
                <tr key={item._id}>
                  <td>{item.user ? item.user.username : 'Анонім'}</td>
                  <td><StarRating rating={item.rating} /></td>
                  <td>{item.comment || '---'}</td>
                  <td style={{ fontSize: '0.85em', color: '#999' }}>{new Date(item.createdAt).toLocaleDateString('uk-UA')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', margin: '20px 0', flexWrap: 'wrap' }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button key={page} onClick={() => setCurrentPage(page)} style={{
                padding: '8px 12px',
                border: `2px solid ${currentPage === page ? '#007bff' : '#e0e0e0'}`,
                backgroundColor: currentPage === page ? '#007bff' : 'white',
                color: currentPage === page ? 'white' : '#333',
                borderRadius: '8px',
                cursor: 'pointer',
                minWidth: '44px',
                fontWeight: currentPage === page ? 'bold' : 'normal',
                transition: '0.3s ease'
              }}>
                {page}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
};

const AdminStatistics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('userToken'));
        const config = { headers: { 'x-auth-token': token } };
        const res = await axios.get('http://localhost:5000/api/users/stats', config);
        setStats(res.data);
        setLoading(false);
      } catch (err) { setLoading(false); }
    };
    fetchStats();
  }, []);

  if (loading) return <p>Завантаження статистики...</p>;
  if (!stats) return <p>Не вдалося завантажити статистику.</p>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
      <div className="stat-card">
        <h3>Загальна Статистика</h3>
        <p><strong>Користувачів:</strong> {stats.totalUsers}</p>
        <p><strong>Адмінів:</strong> {stats.totalAdmins}</p>
        <p><strong>Середні бали:</strong> {stats.averagePoints}</p>
      </div>
      <div className="stat-card">
        <h3>Розподіл Балів</h3>
        <p>0-100: {stats.pointsDistribution['0-100']}</p>
        <p>101-500: {stats.pointsDistribution['101-500']}</p>
        <p>501-1000: {stats.pointsDistribution['501-1000']}</p>
        <p>1001+: {stats.pointsDistribution['1001+']}</p>
      </div>
      <div className="stat-card">
        <h3>Топ Контриб'юторів</h3>
        {stats.topContributors.map((user, index) => (
          <p key={index}>{index + 1}. {user.username} - {user.points} балів</p>
        ))}
      </div>
      <div className="stat-card">
        <h3>Загальні Внески</h3>
        <p><strong>Донати:</strong> {stats.totalDonations}</p>
        <p><strong>Волонтерство:</strong> {stats.totalVolunteering}</p>
        <p><strong>Допомога:</strong> {stats.totalAid}</p>
        <p><strong>Геолокації:</strong> {stats.totalGeo}</p>
      </div>
      <div className="stat-card">
        <h3>Інші Статистики</h3>
        <p><strong>High Rollers:</strong> {stats.highRollers}</p>
        <p><strong>Повні Профілі:</strong> {stats.profileCompletes}</p>
      </div>
      <div className="stat-card">
        <h3>Останні Реєстрації</h3>
        {stats.recentRegistrations.map((user, index) => (
          <p key={index}>{user.username} - {new Date(user.createdAt).toLocaleDateString('uk-UA')}</p>
        ))}
      </div>
    </div>
  );
};

const AdminManageTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('userToken'));
      const config = { headers: { 'x-auth-token': token } };
      const res = await axios.get('http://localhost:5000/api/tasks/admin/all', config);
      setTasks(res.data);
      setLoading(false);
    } catch (err) { setLoading(false); }
  };

  const handleEdit = (task) => {
    setEditingTask(task._id);
    setEditForm({
      title: task.title,
      description: task.description,
      category: task.category,
      points: task.points,
      status: task.status,
      endDate: task.endDate ? task.endDate.split('T')[0] : ''
    });
  };

  const handleSaveEdit = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('userToken'));
      const config = { headers: { 'x-auth-token': token } };
      await axios.put(`http://localhost:5000/api/tasks/${editingTask}/admin`, editForm, config);
      setEditingTask(null);
      fetchTasks();
    } catch (err) { alert('Помилка оновлення завдання'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Видалити завдання?')) return;
    try {
      const token = JSON.parse(localStorage.getItem('userToken'));
      const config = { headers: { 'x-auth-token': token } };
      await axios.delete(`http://localhost:5000/api/tasks/${id}/admin`, config);
      fetchTasks();
    } catch (err) { alert('Помилка видалення завдання'); }
  };

  if (loading) return <p>Завантаження завдань...</p>;

  return (
    <>
      <table className="admin-table">
        <thead><tr><th>Назва</th><th>Категорія</th><th>Статус</th><th>Бали</th><th>Створено</th><th>Дії</th></tr></thead>
        <tbody>
          {tasks.map(task => (
            <tr key={task._id}>
              <td>
                {editingTask === task._id ? (
                  <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                ) : task.title}
              </td>
              <td>
                {editingTask === task._id ? (
                  <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}>
                    <option value="volunteering">Волонтерство</option>
                    <option value="aid">Допомога</option>
                    <option value="other">Інше</option>
                  </select>
                ) : task.category}
              </td>
              <td>
                {editingTask === task._id ? (
                  <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                    <option value="open">Відкрите</option>
                    <option value="in_progress">В роботі</option>
                    <option value="completed">Завершене</option>
                  </select>
                ) : task.status}
              </td>
              <td>
                {editingTask === task._id ? (
                  <input type="number" value={editForm.points} onChange={(e) => setEditForm({ ...editForm, points: e.target.value })} />
                ) : task.points}
              </td>
              <td>{new Date(task.createdAt).toLocaleDateString('uk-UA')}</td>
              <td>
                {editingTask === task._id ? (
                  <>
                    <button onClick={handleSaveEdit}>Зберегти</button>
                    <button onClick={() => setEditingTask(null)}>Скасувати</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleEdit(task)}>Редагувати</button>
                    <button onClick={() => handleDelete(task._id)}>Видалити</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

const AdminManageFundraisers = () => {
  const [fundraisers, setFundraisers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingFundraiser, setEditingFundraiser] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchFundraisers();
  }, []);

  const fetchFundraisers = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('userToken'));
      const config = { headers: { 'x-auth-token': token } };
      const res = await axios.get('http://localhost:5000/api/fundraisers/admin/all', config);
      setFundraisers(res.data);
      setLoading(false);
    } catch (err) { setLoading(false); }
  };

  const handleEdit = (fundraiser) => {
    setEditingFundraiser(fundraiser._id);
    setEditForm({
      title: fundraiser.title,
      description: fundraiser.description,
      goalAmount: fundraiser.goalAmount,
      status: fundraiser.status,
      cardName: fundraiser.cardName,
      cardNumber: fundraiser.cardNumber
    });
  };

  const handleSaveEdit = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('userToken'));
      const config = { headers: { 'x-auth-token': token } };
      await axios.put(`http://localhost:5000/api/fundraisers/${editingFundraiser}/admin`, editForm, config);
      setEditingFundraiser(null);
      fetchFundraisers();
    } catch (err) { alert('Помилка оновлення збору'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Видалити збір?')) return;
    try {
      const token = JSON.parse(localStorage.getItem('userToken'));
      const config = { headers: { 'x-auth-token': token } };
      await axios.delete(`http://localhost:5000/api/fundraisers/${id}/admin`, config);
      fetchFundraisers();
    } catch (err) { alert('Помилка видалення збору'); }
  };

  if (loading) return <p>Завантаження зборів...</p>;

  return (
    <>
      <table className="admin-table">
        <thead><tr><th>Назва</th><th>Ціль</th><th>Зібрано</th><th>Статус</th><th>Створено</th><th>Дії</th></tr></thead>
        <tbody>
          {fundraisers.map(fundraiser => (
            <tr key={fundraiser._id}>
              <td>
                {editingFundraiser === fundraiser._id ? (
                  <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                ) : fundraiser.title}
              </td>
              <td>
                {editingFundraiser === fundraiser._id ? (
                  <input type="number" value={editForm.goalAmount} onChange={(e) => setEditForm({ ...editForm, goalAmount: e.target.value })} />
                ) : fundraiser.goalAmount}
              </td>
              <td>{fundraiser.collectedAmount}</td>
              <td>
                {editingFundraiser === fundraiser._id ? (
                  <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                    <option value="open">Відкритий</option>
                    <option value="closed">Закритий</option>
                  </select>
                ) : fundraiser.status}
              </td>
              <td>{new Date(fundraiser.createdAt).toLocaleDateString('uk-UA')}</td>
              <td>
                {editingFundraiser === fundraiser._id ? (
                  <>
                    <button onClick={handleSaveEdit}>Зберегти</button>
                    <button onClick={() => setEditingFundraiser(null)}>Скасувати</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleEdit(fundraiser)}>Редагувати</button>
                    <button onClick={() => handleDelete(fundraiser._id)}>Видалити</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

const CreateFundraiser = () => {
  const [formData, setFormData] = useState({ title: '', description: '', goalAmount: '', cardName: '', cardNumber: '' });
  const [message, setMessage] = useState('');

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = JSON.parse(localStorage.getItem('userToken'));
      const config = { headers: { 'x-auth-token': token } };
      await axios.post('http://localhost:5000/api/fundraisers', formData, config);
      setMessage('Збір успішно створено!');
      setFormData({ title: '', description: '', goalAmount: '', cardName: '', cardNumber: '' });
    } catch (err) {
      const errorMsg = err.response?.data?.errors ? err.response.data.errors[0].msg : (err.response?.data?.msg || 'Щось пішло не так');
      setMessage('Помилка: ' + errorMsg);
    }
  };

  return (
    <form className="add-help-form" onSubmit={onSubmit}>
      <div className="form-group">
        <label>Назва Збору</label>
        <input type="text" name="title" value={formData.title} onChange={onChange} className="neumorph-input" required minLength="5" />
      </div>
      <div className="form-group">
        <label>Ціль (UAH)</label>
        <input type="number" name="goalAmount" value={formData.goalAmount} onChange={onChange} className="neumorph-input" required min="1" />
      </div>
      <div className="form-group">
        <label>Опис</label>
        <textarea name="description" value={formData.description} onChange={onChange} className="neumorph-textarea" required minLength="10"></textarea>
      </div>
      <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #ccc' }} />
      <div className="form-group">
        <label>Реквізити (Ім'я на карті)</label>
        <input type="text" name="cardName" value={formData.cardName} onChange={onChange} className="neumorph-input" required />
      </div>
      <div className="form-group">
        <label>Реквізити (Номер картки)</label>
        <input type="text" name="cardNumber" value={formData.cardNumber} onChange={onChange} className="neumorph-input" required minLength="16" maxLength="16" />
      </div>
      <button type="submit" className="neumorph-button">Створити Збір</button>
      {message && <p style={{ textAlign: 'center', marginTop: '15px' }}>{message}</p>}
    </form>
  );
};

const CreateTask = () => {
  const [formData, setFormData] = useState({
    title: '', description: '', category: 'volunteering', points: '100', endDate: ''
  });
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const onFileChange = (e) => {
    setFile(e.target.files.length > 0 ? e.target.files[0] : null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('category', formData.category);
    data.append('points', formData.points);
    if (formData.endDate) data.append('endDate', formData.endDate);
    if (file) {
      data.append('taskFile', file);
    }

    try {
      const token = JSON.parse(localStorage.getItem('userToken'));
      const config = {
        headers: {
          'x-auth-token': token,
        }
      };
      await axios.post('http://localhost:5000/api/tasks', data, config);
      setMessage('Завдання успішно створено!');
      setFormData({ title: '', description: '', category: 'volunteering', points: '100', endDate: '' });
      setFile(null);
    } catch (err) {
      const errorMsg = err.response?.data?.errors ? err.response.data.errors[0].msg : (err.response?.data?.msg || 'Щось пішло не так');
      setMessage('Помилка: ' + errorMsg);
    }
  };

  return (
    <form className="add-help-form" onSubmit={onSubmit}>
      <div className="form-group">
        <label>Назва Завдання</label>
        <input type="text" name="title" value={formData.title} onChange={onChange} className="neumorph-input" required minLength="5" />
      </div>
      <div className="form-group">
        <label>Категорія</label>
        <select name="category" value={formData.category} onChange={onChange} className="neumorph-select">
          <option value="volunteering">Волонтерське завдання</option>
          <option value="aid">Гуманітарна допомога (речі)</option>
          <option value="other">Інше</option>
        </select>
      </div>
      <div className="form-group">
        <label>Опис Завдання</label>
        <textarea name="description" value={formData.description} onChange={onChange} className="neumorph-textarea" required minLength="10"></textarea>
      </div>
      <div className="form-group">
        <label>Бажана дата кінця (опціонально)</label>
        <input type="date" name="endDate" value={formData.endDate} onChange={onChange} className="neumorph-input" min={new Date().toISOString().split('T')[0]} />
      </div>
      <div className="form-group">
        <label>Бали за виконання</label>
        <input type="number" name="points" value={formData.points} onChange={onChange} className="neumorph-input" required min="1" />
      </div>
      <div className="form-group">
        <label>Файл (Інструкція/Фото) (опціонально)</label>
        <label htmlFor="taskFile" className={`neumorph-file-input ${file ? 'file-selected' : ''}`}>
          <span>{file ? '✅' : '📁'} </span>
          {file ? file.name : 'Натисніть, щоб обрати файл'}
          <input type="file" id="taskFile" onChange={onFileChange} />
        </label>
      </div>
      <button type="submit" className="neumorph-button">Створити Завдання</button>
      {message && <p style={{ textAlign: 'center', marginTop: '15px' }}>{message}</p>}
    </form>
  );
};

const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState('contributions');
  const navigate = useNavigate();

  const handleLogout = () => {
    alert('Ви вийшли з адмін-панелі');
    localStorage.removeItem('userToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  return (
    <AnimatedPage>
      <div className="admin-container">
        <div className="admin-header">
          <h2>Адмін-панель</h2>
          <button
            className="action-btn reject"
            onClick={handleLogout}
          >
            Вийти
          </button>
        </div>

        <div className="admin-tabs">
          <button
            className={`tab-btn ${activeTab === 'contributions' ? 'active' : ''}`}
            onClick={() => setActiveTab('contributions')}
          >
            Заявки
          </button>
          <button
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Користувачі
          </button>
          <button
            className={`tab-btn ${activeTab === 'tickets' ? 'active' : ''}`}
            onClick={() => setActiveTab('tickets')}
          >
            Тікети
          </button>
          <button
            className={`tab-btn ${activeTab === 'feedback' ? 'active' : ''}`}
            onClick={() => setActiveTab('feedback')}
          >
            Відгуки
          </button>
          <button
            className={`tab-btn ${activeTab === 'statistics' ? 'active' : ''}`}
            onClick={() => setActiveTab('statistics')}
          >
            Статистика
          </button>
          <button
            className={`tab-btn ${activeTab === 'manage-tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('manage-tasks')}
          >
            Керування Завданнями
          </button>
          <button
            className={`tab-btn ${activeTab === 'manage-fundraisers' ? 'active' : ''}`}
            onClick={() => setActiveTab('manage-fundraisers')}
          >
            Керування Зборами
          </button>
          <button
            className={`tab-btn ${activeTab === 'fundraisers' ? 'active' : ''}`}
            onClick={() => setActiveTab('fundraisers')}
          >
            Створити Збір
          </button>
          <button
            className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            Створити Завдання
          </button>
        </div>

        {activeTab === 'contributions' && <PendingContributions />}
        {activeTab === 'users' && <AdminUserList />}
        {activeTab === 'tickets' && <AdminTicketList />}
        {activeTab === 'feedback' && <AdminFeedbackList />}
        {activeTab === 'statistics' && <AdminStatistics />}
        {activeTab === 'manage-tasks' && <AdminManageTasks />}
        {activeTab === 'manage-fundraisers' && <AdminManageFundraisers />}
        {activeTab === 'fundraisers' && <CreateFundraiser />}
        {activeTab === 'tasks' && <CreateTask />}

      </div>
    </AnimatedPage>
  );
};

export default AdminDashboardPage;