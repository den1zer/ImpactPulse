import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

import '../styles/AdminDashboard.css';
import API_BASE_URL from '../config/api.js';

/* ══════════════════════════════════════════════════════════
   COMPONENTS (INTERNAL)
   ══════════════════════════════════════════════════════════ */

const PendingContributions = () => {
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  const fetchPending = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const res = await axios.get(`${API_BASE_URL}/api/contributions/pending`, {
        headers: { 'x-auth-token': token },
        params: { type: filterType }
      });
      setContributions(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPending(); }, [filterType]);

  const handleApprove = async (id) => {
    const pts = prompt("Бали:", "100");
    if (pts === null) return;
    try {
      const token = localStorage.getItem('userToken');
      await axios.put(`${API_BASE_URL}/api/contributions/approve/${id}`, { points: parseInt(pts) }, { headers: { 'x-auth-token': token } });
      fetchPending();
    } catch (err) { alert('Помилка'); }
  };

  const handleReject = async (id) => {
    const reason = prompt('Причина:');
    if (!reason) return;
    try {
      const token = localStorage.getItem('userToken');
      await axios.put(`${API_BASE_URL}/api/contributions/reject/${id}`, { comment: reason }, { headers: { 'x-auth-token': token } });
      fetchPending();
    } catch (err) { alert('Помилка'); }
  };

  if (loading) return <div className="admin-loading">ЗАВАНТАЖЕННЯ...</div>;

  return (
    <div className="admin-section">
      <div className="admin-filters">
        <label>ТИП:</label>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="filter-select">
          <option value="all">ВСІ</option>
          <option value="donation">ДОНАТ</option>
          <option value="aid">ДОПОМОГА</option>
          <option value="volunteering">ВОЛОНТЕРСТВО</option>
        </select>
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>КОРИСТУВАЧ</th>
            <th>ТИП</th>
            <th>ЗАГОЛОВОК</th>
            <th>ДОКАЗ</th>
            <th>ДІЇ</th>
          </tr>
        </thead>
        <tbody>
          {contributions.map(c => (
            <tr key={c._id}>
              <td>{c.user?.username}</td>
              <td>{c.type}</td>
              <td>{c.title}</td>
              <td>{c.filePath ? <a href={c.filePath.startsWith('http') ? c.filePath : `${API_BASE_URL}/${c.filePath}`} target="_blank" className="proof-link">ФАЙЛ</a> : '---'}</td>
              <td>
                <button className="action-btn approve" onClick={() => handleApprove(c._id)}>СХВАЛИТИ</button>
                <button className="action-btn reject" onClick={() => handleReject(c._id)}>ВІДХИЛИТИ</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AdminUserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const res = await axios.get(`${API_BASE_URL}/api/users`, { headers: { 'x-auth-token': token } });
      setUsers(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (id, role) => {
    if (!window.confirm('Змінити роль?')) return;
    try {
      const token = localStorage.getItem('userToken');
      await axios.put(`${API_BASE_URL}/api/users/role/${id}`, { role }, { headers: { 'x-auth-token': token } });
      fetchUsers();
    } catch (err) { alert('Помилка'); }
  };

  if (loading) return <div className="admin-loading">ЗАВАНТАЖЕННЯ...</div>;

  return (
    <div className="admin-section">
      <table className="admin-table">
        <thead>
          <tr>
            <th>USERNAME</th>
            <th>EMAIL</th>
            <th>РОЛЬ</th>
            <th>ДІЇ</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u._id}>
              <td>{u.username}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>
                <button className="action-btn" onClick={() => handleRoleChange(u._id, u.role === 'admin' ? 'user' : 'admin')}>
                  {u.role === 'admin' ? 'ЗНЯТИ АДМІНА' : 'ЗРОБИТИ АДМІНОМ'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AdminChat = () => {
  const [chats, setChats] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const socketRef = React.useRef(null);
  const token = localStorage.getItem('userToken');

  useEffect(() => {
    const fetchChats = async () => {
      const res = await axios.get(`${API_BASE_URL}/api/support/chats`, { headers: { 'x-auth-token': token } });
      setChats(res.data);
    };
    fetchChats();
    socketRef.current = io(API_BASE_URL, { transports: ['websocket'], withCredentials: true });
    socketRef.current.emit('join_admins');
    socketRef.current.on('admin_new_support_message', (msg) => {
      if (selected?._id === msg.user) setMessages(prev => [...prev, msg]);
    });
    return () => socketRef.current.disconnect();
  }, [selected]);

  useEffect(() => {
    if (selected) {
      axios.get(`${API_BASE_URL}/api/support/chat/${selected._id}`, { headers: { 'x-auth-token': token } })
        .then(res => setMessages(res.data));
    }
  }, [selected]);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selected) return;
    await axios.post(`${API_BASE_URL}/api/support/chat`, { text: input, userId: selected._id }, { headers: { 'x-auth-token': token } });
    setInput('');
  };

  return (
    <div className="admin-chat-layout" style={{ display: 'flex', height: '500px' }}>
      <div className="admin-chat-sidebar" style={{ width: '250px', borderRight: 'var(--admin-border)' }}>
        <div style={{ padding: '10px', fontWeight: 'bold', borderBottom: 'var(--admin-border)' }}>ЧАТИ</div>
        {chats.map(c => (
          <div key={c._id} onClick={() => setSelected(c)} className={`admin-chat-user-item ${selected?._id === c._id ? 'active' : ''}`} style={{ padding: '10px', cursor: 'pointer', borderBottom: 'var(--admin-border)' }}>
            {c.username}
          </div>
        ))}
      </div>
      <div className="admin-chat-main" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ textAlign: m.isAdmin ? 'right' : 'left', marginBottom: '10px' }}>
              <div style={{ display: 'inline-block', padding: '5px 10px', border: 'var(--admin-border)', backgroundColor: m.isAdmin ? 'var(--admin-accent)' : 'transparent', color: m.isAdmin ? '#fff' : 'inherit' }}>
                {m.text}
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={send} style={{ padding: '10px', borderTop: 'var(--admin-border)', display: 'flex' }}>
          <input value={input} onChange={e => setInput(e.target.value)} className="neumorph-input" style={{ flex: 1 }} placeholder="ПОВІДОМЛЕННЯ..." />
          <button type="submit" className="action-btn approve">ВІДПРАВИТИ</button>
        </form>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════════════════ */

const AdminDashboardPage = () => {
  const [tab, setTab] = useState('contributions');
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h2>АДМІН-ПАНЕЛЬ</h2>
        <button onClick={logout} className="action-btn reject">ВИЙТИ</button>
      </header>

      <div className="admin-tabs">
        <button className={`tab-btn ${tab === 'contributions' ? 'active' : ''}`} onClick={() => setTab('contributions')}>ЗАЯВКИ</button>
        <button className={`tab-btn ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>КОРИСТУВАЧІ</button>
        <button className={`tab-btn ${tab === 'chat' ? 'active' : ''}`} onClick={() => setTab('chat')}>ЧАТ</button>
      </div>

      <div className="admin-content">
        {tab === 'contributions' && <PendingContributions />}
        {tab === 'users' && <AdminUserList />}
        {tab === 'chat' && <AdminChat />}
      </div>
    </div>
  );
};

export default AdminDashboardPage;