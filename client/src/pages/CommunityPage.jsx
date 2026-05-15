import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import AnimatedPage from '../components/AnimatedPage';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';
import { FiSearch, FiUsers, FiUserMinus, FiMapPin, FiX } from 'react-icons/fi';
import API_BASE_URL from '../config/api.js';
import '../styles/Dashboard.css';
import '../styles/CommunityPage.css';

const FRAME_BORDERS = {
  gold:    '2px solid #FFD700',
  neon:    '2px solid #00ffcc',
  fire:    '2px solid #ff4500',
  silver:  '2px solid #a8b2c0',
  diamond: '2px solid #00bfff',
};

const UserCard = ({ user, isFriendSection, onRemove }) => {
  const frame = user.profileCustomization?.avatarFrame;
  const border = FRAME_BORDERS[frame] || 'var(--border)';

  return (
    <div className="comm-user-card">
      <Link to={`/user/${user._id}`} className="comm-user-link">
        <img
          src={user.avatarUrl || '/default-avatar.svg'}
          alt={user.username}
          className="comm-user-avatar"
          style={{ border }}
        />
        <div className="comm-user-info">
          <span className="comm-user-name">
            {user.username}
            {user.profileCustomization?.nicknameIcon && (
              <span className="comm-user-icon"> {user.profileCustomization.nicknameIcon}</span>
            )}
          </span>
          <div className="comm-user-meta">
            <span>Рівень {user.level || 1}</span>
            {user.city && (
              <span className="comm-user-city">
                <FiMapPin size={10} /> {user.city}
              </span>
            )}
          </div>
        </div>
      </Link>
      {isFriendSection && (
        <button
          className="comm-remove-btn"
          onClick={onRemove}
          title="Видалити з друзів"
        >
          <FiX size={14} />
        </button>
      )}
    </div>
  );
};

const CommunityPage = () => {
  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friends,       setFriends]       = useState([]);
  const [loading,       setLoading]       = useState(false);
  const token = localStorage.getItem('userToken');

  useEffect(() => { fetchFriends(); }, []);

  const fetchFriends = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/users/friends`, {
        headers: { 'x-auth-token': token },
      });
      setFriends(res.data);
    } catch (err) { console.error(err); }
  };

  const handleSearch = async e => {
    e.preventDefault();
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/users/search?q=${searchQuery}`, {
        headers: { 'x-auth-token': token },
      });
      setSearchResults(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleRemoveFriend = async (id) => {
    try {
      await axios.post(`${API_BASE_URL}/api/users/friends/remove/${id}`, {}, {
        headers: { 'x-auth-token': token },
      });
      setFriends(friends.filter(f => f._id !== id));
    } catch (err) { console.error(err); }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <DashboardHeader />
        <AnimatedPage>
          <div className="dashboard-content-wrapper">

            {/* Hero */}
            <div className="comm-hero">
              <div>
                <p className="small-title">ImpactPulse / Ком'юніті</p>
                <h1>Ком'юніті</h1>
                <p className="comm-hero-desc">
                  Знаходьте однодумців, переглядайте їхні профілі та додавайте до друзів.
                </p>
              </div>
            </div>

            <div className="comm-grid">
              {/* Search */}
              <section className="comm-panel">
                <div className="comm-panel-header">
                  <h2 className="comm-panel-title">
                    <FiSearch size={14} /> Пошук користувачів
                  </h2>
                </div>
                <div className="comm-panel-body">
                  <form onSubmit={handleSearch} className="comm-search-form">
                    <input
                      type="text"
                      placeholder="Введіть ім'я..."
                      className="comm-search-input"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                    <button type="submit" className="comm-search-btn">
                      Знайти
                    </button>
                  </form>

                  {loading ? (
                    <div className="comm-state">Пошук...</div>
                  ) : searchResults.length > 0 ? (
                    <div className="comm-list">
                      {searchResults.map(u => (
                        <UserCard key={u._id} user={u} isFriendSection={false} />
                      ))}
                    </div>
                  ) : searchQuery ? (
                    <div className="comm-state">Нікого не знайдено за запитом «{searchQuery}»</div>
                  ) : (
                    <div className="comm-state">Використовуйте пошук, щоб знайти людей</div>
                  )}
                </div>
              </section>

              {/* Friends */}
              <section className="comm-panel">
                <div className="comm-panel-header">
                  <h2 className="comm-panel-title">
                    <FiUsers size={14} /> Мої Друзі
                  </h2>
                  <span className="comm-count">{friends.length}</span>
                </div>
                <div className="comm-panel-body">
                  {friends.length === 0 ? (
                    <div className="comm-state">
                      <FiUsers size={32} style={{ opacity: 0.2 }} />
                      <span>У вас поки немає друзів. Скористайтесь пошуком!</span>
                    </div>
                  ) : (
                    <div className="comm-list">
                      {friends.map(f => (
                        <UserCard
                          key={f._id}
                          user={f}
                          isFriendSection={true}
                          onRemove={() => handleRemoveFriend(f._id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>

          </div>
        </AnimatedPage>
      </main>
    </div>
  );
};

export default CommunityPage;
