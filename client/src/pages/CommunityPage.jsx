import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import AnimatedPage from '../components/AnimatedPage';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';
import { FiSearch, FiUsers, FiUserMinus, FiMapPin } from 'react-icons/fi';
import API_BASE_URL from '../config/api.js';
import '../styles/Dashboard.css';

const CommunityPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem('userToken');

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/users/friends`, {
        headers: { 'x-auth-token': token }
      });
      setFriends(res.data);
    } catch (err) {
      console.error('Error fetching friends', err);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/users/search?q=${searchQuery}`, {
        headers: { 'x-auth-token': token }
      });
      setSearchResults(res.data);
    } catch (err) {
      console.error('Error searching users', err);
    }
    setLoading(false);
  };

  const handleRemoveFriend = async (id, e) => {
    e.preventDefault(); // prevent navigation
    try {
      await axios.post(`${API_BASE_URL}/api/users/friends/remove/${id}`, {}, {
        headers: { 'x-auth-token': token }
      });
      setFriends(friends.filter(f => f._id !== id));
    } catch (err) {
      console.error('Error removing friend', err);
    }
  };

  const UserCard = ({ user, isFriendSection }) => {
    const border = user.profileCustomization?.avatarFrame === 'gold' ? '2px solid #FFD700' :
                   user.profileCustomization?.avatarFrame === 'neon' ? '2px solid #00FF00' :
                   user.profileCustomization?.avatarFrame === 'fire' ? '2px solid #FF4500' : '2px solid transparent';
    
    return (
      <Link to={`/user/${user._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', transition: 'all 0.2s' }} className="panel-card-hover">
          <img 
            src={user.avatarUrl || '/default-avatar.png'} 
            alt={user.username} 
            style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border }} 
          />
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>
              {user.username} {user.profileCustomization?.nicknameIcon}
            </h4>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '12px' }}>
              <span>Рівень {user.level}</span>
              {user.city && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FiMapPin /> {user.city}</span>}
            </div>
          </div>
          {isFriendSection && (
            <button 
              className="btn btn-ghost" 
              onClick={(e) => handleRemoveFriend(user._id, e)}
              style={{ padding: '8px', color: 'var(--danger)' }}
              title="Видалити з друзів"
            >
              <FiUserMinus />
            </button>
          )}
        </div>
      </Link>
    );
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <DashboardHeader />
        <AnimatedPage>
          <div className="dashboard-content-wrapper">
            
            <div className="dashboard-hero">
              <div className="hero-summary-card">
                <div>
                  <p className="small-title">Ком'юніті</p>
                  <h2>Пошук та Друзі</h2>
                  <p className="hero-description">Знаходьте однодумців, переглядайте їхні профілі та додавайте до друзів.</p>
                </div>
              </div>
            </div>

            <div className="dashboard-grid" style={{ marginTop: '24px' }}>
              {/* Search Section */}
              <div className="panel-card" style={{ alignSelf: 'start' }}>
                <div className="panel-heading" style={{ marginBottom: '16px' }}>
                  <h3><FiSearch /> Пошук користувачів</h3>
                </div>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                  <input 
                    type="text" 
                    placeholder="Введіть ім'я..." 
                    className="form-control" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="btn btn-primary">Знайти</button>
                </form>

                {loading ? (
                  <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Пошук...</p>
                ) : searchResults.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {searchResults.map(user => <UserCard key={user._id} user={user} isFriendSection={false} />)}
                  </div>
                ) : searchQuery ? (
                  <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Нікого не знайдено за запитом "{searchQuery}"</p>
                ) : (
                  <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontStyle: 'italic' }}>Використовуйте пошук, щоб знайти людей</p>
                )}
              </div>

              {/* Friends Section */}
              <div className="panel-card" style={{ alignSelf: 'start' }}>
                <div className="panel-heading" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
                  <h3><FiUsers /> Мої Друзі</h3>
                  <span className="badge badge-accent">{friends.length}</span>
                </div>
                
                {friends.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {friends.map(friend => <UserCard key={friend._id} user={friend} isFriendSection={true} />)}
                  </div>
                ) : (
                  <div style={{ padding: '32px', textAlign: 'center', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                    <FiUsers size={48} color="var(--border-medium)" style={{ marginBottom: '16px' }} />
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>У вас поки немає друзів.<br/>Скористайтесь пошуком, щоб знайти їх!</p>
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

export default CommunityPage;
