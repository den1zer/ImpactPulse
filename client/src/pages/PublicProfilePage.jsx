import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiMessageSquare } from 'react-icons/fi';
import AnimatedPage from '../components/AnimatedPage';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';
import { FiMapPin, FiUserPlus, FiUserMinus, FiAward, FiStar, FiActivity, FiArrowLeft } from 'react-icons/fi';
import API_BASE_URL from '../config/api.js';
import '../styles/Dashboard.css';

const PublicProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFriend, setIsFriend] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const token = localStorage.getItem('userToken');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profileRes, meRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/users/profile/${id}`, { headers: { 'x-auth-token': token } }),
        axios.get(`${API_BASE_URL}/api/users/me`, { headers: { 'x-auth-token': token } })
      ]);
      setProfile(profileRes.data);
      setCurrentUser(meRes.data);
      setIsFriend(meRes.data.friends && meRes.data.friends.includes(id));
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Не вдалося завантажити профіль');
      setLoading(false);
    }
  };

  const handleFriendAction = async () => {
    try {
      if (isFriend) {
        await axios.post(`${API_BASE_URL}/api/users/friends/remove/${id}`, {}, { headers: { 'x-auth-token': token } });
        setIsFriend(false);
      } else {
        await axios.post(`${API_BASE_URL}/api/users/friends/add/${id}`, {}, { headers: { 'x-auth-token': token } });
        setIsFriend(true);
      }
    } catch (err) {
      console.error('Error with friend action', err);
    }
  };

  if (loading) return <div className="dashboard-layout"><Sidebar /><main className="dashboard-main"><DashboardHeader /><div style={{padding: '40px', textAlign: 'center'}}>Завантаження...</div></main></div>;
  if (error || !profile) return <div className="dashboard-layout"><Sidebar /><main className="dashboard-main"><DashboardHeader /><div style={{padding: '40px', textAlign: 'center', color: 'red'}}>{error}</div></main></div>;

  const isMe = currentUser && currentUser._id === id;

  const getAvatarBorder = () => {
    const frame = profile.profileCustomization?.avatarFrame || 'none';
    if (frame === 'gold') return '3px solid #FFD700';
    if (frame === 'neon') return '3px solid #00FF00';
    if (frame === 'fire') return '3px solid #FF4500';
    return '3px solid var(--border)';
  };

  const getThemeBackground = () => {
    const theme = profile.profileCustomization?.profileTheme || 'default';
    if (theme === 'ocean') return 'linear-gradient(135deg, #0077be 0%, #00a8ff 100%)';
    if (theme === 'forest') return 'linear-gradient(135deg, #228b22 0%, #32cd32 100%)';
    if (theme === 'cyberpunk') return 'linear-gradient(135deg, #ff007f 0%, #7df9ff 100%)';
    if (theme === 'sunset') return 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)';
    return 'var(--bg-subtle)';
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <DashboardHeader />
        <AnimatedPage>
          <div className="dashboard-content-wrapper">
            <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ marginBottom: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <FiArrowLeft /> Назад
            </button>

            <div className="dashboard-hero" style={{ background: getThemeBackground() }}>
              <div className="hero-summary-card" style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                  <img 
                    src={profile.avatarUrl || '/default-avatar.svg'} 
                    alt={profile.username} 
                    style={{ 
                      width: '120px', 
                      height: '120px', 
                      borderRadius: '50%', 
                      objectFit: 'cover',
                      border: getAvatarBorder()
                    }} 
                  />
                  {profile.selectedBadge?.icon && (
                    <div style={{ position: 'absolute', bottom: '-10px', right: '-10px', fontSize: '2rem', background: 'var(--bg-surface)', borderRadius: '50%', padding: '4px', border: '1px solid var(--border)' }}>
                      {profile.selectedBadge.icon}
                    </div>
                  )}
                </div>
                
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {profile.username}
                    {profile.profileCustomization?.nicknameIcon && <span>{profile.profileCustomization.nicknameIcon}</span>}
                  </h2>
                  <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>
                    {profile.city && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FiMapPin /> {profile.city}</span>}
                    {profile.age && <span>{profile.age} років</span>}
                    <span>Рівень {profile.level}</span>
                  </div>
                  
                  {!isMe && (
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button 
                        className={`btn ${isFriend ? 'btn-secondary' : 'btn-primary'}`} 
                        onClick={handleFriendAction}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        {isFriend ? <><FiUserMinus /> Видалити з друзів</> : <><FiUserPlus /> Додати в друзі</>}
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => navigate('/messages', { state: { receiverId: id, receiverName: profile.username, receiverAvatar: profile.avatarUrl } })}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        <FiMessageSquare /> Написати
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="dashboard-grid" style={{ marginTop: '24px' }}>
              <div className="panel-card">
                <div className="panel-heading" style={{ marginBottom: '16px' }}>
                  <h3><FiActivity /> Статистика</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '4px' }}>Досвід (XP)</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{profile.xp || 0}</div>
                  </div>
                  <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '4px' }}>Всього Донатів</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{profile.stats?.totalDonations || 0} ₴</div>
                  </div>
                  <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '4px' }}>Рейтинг (Бали)</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{profile.points || 0}</div>
                  </div>
                  <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '4px' }}>Стрік (Днів)</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>🔥 {profile.streak?.current || 0}</div>
                  </div>
                </div>
              </div>

              <div className="panel-card">
                <div className="panel-heading" style={{ marginBottom: '16px' }}>
                  <h3><FiStar /> Відкриті Бейджі</h3>
                </div>
                {profile.badges && profile.badges.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '12px' }}>
                    {profile.badges.map(badge => (
                      <div key={badge.badgeId} style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{badge.icon}</div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 'bold', lineHeight: '1.2' }}>{badge.name}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-secondary)' }}>У цього користувача ще немає бейджів.</p>
                )}
              </div>
            </div>

          </div>
        </AnimatedPage>
      </main>
    </div>
  );
};

export default PublicProfilePage;
