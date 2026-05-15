import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AnimatedPage from '../components/AnimatedPage';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';
import { getBadges } from '../api/gameApi';
import '../styles/Dashboard.css';
import '../styles/AddHelpPage.css';
import '../styles/ProfilePage.css';
import API_BASE_URL from '../config/api.js';

const useAlertHook = () => ({ showAlert: (message) => { alert(message); } });

const ProfilePage = () => {
  const { showAlert } = useAlertHook();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({ username: '', email: '', backupEmail: '', age: '', city: '', gender: 'unspecified' });
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [currentAvatar, setCurrentAvatar] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [badges, setBadges] = useState([]); 
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [profileCustomization, setProfileCustomization] = useState({ nicknameIcon: '', avatarFrame: 'none', profileTheme: 'default' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem('userToken');
        const config = { headers: { 'x-auth-token': token } };
        
        const [res, badgesData] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/users/me`, config),
          getBadges()
        ]);
        
        const userData = res.data;
        setUser(userData);
        setFormData({
          username: userData.username || '', email: userData.email || '',
          backupEmail: userData.backupEmail || '', age: userData.age || '',
          city: userData.city || '', gender: userData.gender || 'unspecified',
        });
        setCurrentAvatar(userData.avatar);
        setProfileCustomization({
          nicknameIcon: userData.profileCustomization?.nicknameIcon || '',
          avatarFrame: userData.profileCustomization?.avatarFrame || 'none',
          profileTheme: userData.profileCustomization?.profileTheme || 'default'
        });
        
        const earned = userData.badges || [];
        const merged = badgesData.map(def => {
          const has = earned.some(b => b.badgeId === def.id);
          return {
            badgeId: def.id,
            level: 1, // Flattened
            name: def.name,
            icon: def.icon,
            unlocked: has
          };
        });
        
        setBadges(merged);
        // Treat {badgeId: null, ...} (DB default) the same as "none selected"
        const rawBadge = userData.selectedBadge;
        setSelectedBadge(rawBadge?.badgeId ? rawBadge : null);
        if (userData.createdAt) setCreatedAt(new Date(userData.createdAt).toLocaleDateString('uk-UA'));
        setIsLoading(false);
      } catch (err) { showAlert('Помилка завантаження профілю'); setIsLoading(false); }
    };
    fetchProfileData();
  }, []);

  const onChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };
  const onCustomizationChange = (e) => { setProfileCustomization({ ...profileCustomization, [e.target.name]: e.target.value }); };
  const onFileChange = (e) => { if (e.target.files.length > 0) { setAvatar(e.target.files[0]); setAvatarPreview(URL.createObjectURL(e.target.files[0])); } };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || formData.username.length < 3) return showAlert('Username має бути мін. 3 символи');
    if (formData.age && (formData.age < 13 || formData.age > 100)) return showAlert('Вік має бути від 13 до 100');

    const data = new FormData();
    data.append('username', formData.username);
    if (formData.age) data.append('age', formData.age);
    if (formData.backupEmail) data.append('backupEmail', formData.backupEmail);
    if (formData.city) data.append('city', formData.city);
    if (formData.gender) data.append('gender', formData.gender);
    data.append('profileCustomization', JSON.stringify(profileCustomization));
    if (avatar) data.append('avatar', avatar);

    try {
      const token = localStorage.getItem('userToken');
      const config = { headers: { 'Content-Type': 'multipart/form-data', 'x-auth-token': token } };
      const res = await axios.put(`${API_BASE_URL}/api/users/me`, data, config);
      showAlert('Профіль оновлено!');
      if (res.data.avatar) { setCurrentAvatar(res.data.avatar); setAvatarPreview(null); }
      window.location.reload();
    } catch (err) {
      const errorMsg = err.response?.data?.errors ? err.response.data.errors[0].msg : (err.response?.data?.msg || 'Помилка');
      showAlert(errorMsg);
    }
  };

  const onBadgeChange = async (e) => {
    const value = e.target.value;
    let selected = null;
    if (value) {
      const badgeId = value;
      selected = badges.find(b => b.badgeId === badgeId);
    }

    try {
      const token = localStorage.getItem('userToken');
      const config = { headers: { 'x-auth-token': token } };
      const res = await axios.put(`${API_BASE_URL}/api/users/selected-badge`, {
        badgeId: selected ? selected.badgeId : null,
        level: selected ? selected.level : null,
        name: selected ? selected.name : null,
        icon: selected ? selected.icon : null
      }, config);
      setSelectedBadge(selected);
      showAlert('Вибраний бейдж оновлено!');
    } catch (err) {
      const errorMsg = err.response?.data?.msg || 'Помилка';
      showAlert(errorMsg);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <DashboardHeader />
        <AnimatedPage>
          <div className="dashboard-content-wrapper">
          <div className={`profile-container theme-${profileCustomization.profileTheme}`}>
            {isLoading ? (
              <div style={{ padding: 40, color: 'var(--text-muted)', textAlign: 'center' }}>Завантаження профілю…</div>
            ) : (
            <form className="profile-form" onSubmit={onSubmit}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Налаштування Профілю</h2>
                {user && (
                  <div className="streak-badge" style={{ fontSize: '0.72rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--yellow)', padding: '6px 14px', border: '2px solid var(--black)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', boxShadow: 'var(--shadow-sm)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C8.5 2 6 4.5 6 8c0 2.5 1.5 4.5 3 5.5V16h6v-2.5c1.5-1 3-3 3-5.5 0-3.5-2.5-6-6-6z"/><rect x="9" y="16" width="6" height="4" rx="1"/></svg>
                    {user.streak?.current || 0} ДНІВ ПОСПІЛЬ
                  </div>
                )}
              </div>
              
              {createdAt && <p style={{fontSize: '0.72em', color: 'var(--black)', opacity: 0.5, marginBottom: '20px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em'}}>Acc. створено: <strong>{createdAt}</strong></p>}
              <div className="avatar-section">
                <div className={`avatar-preview frame-${profileCustomization.avatarFrame}`}>{avatarPreview ? <img src={avatarPreview} style={{width: '100%', height: '100%', objectFit: 'cover'}} alt="avatar preview" /> : currentAvatar ? <img src={currentAvatar.startsWith('http') ? currentAvatar : `${API_BASE_URL}/${currentAvatar}`} style={{width: '100%', height: '100%', objectFit: 'cover'}} alt="avatar" /> : <img src="/default-avatar.svg" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%'}} alt="default avatar" />}</div>
                <label htmlFor="avatar" className="avatar-change-btn">Змінити фото<input type="file" id="avatar" accept="image/*" onChange={onFileChange} /></label>
              </div>
              <div className="form-grid">
                <div className="form-group"><label>Username</label><input type="text" name="username" className="neumorph-input" value={formData.username} onChange={onChange} /></div>
                <div className="form-group"><label>Email</label><input type="email" className="neumorph-input" value={formData.email} disabled /></div>
                <div className="form-group"><label>Резервний Email</label><input type="email" name="backupEmail" className="neumorph-input" value={formData.backupEmail} onChange={onChange} /></div>
                <div className="form-group"><label>Вік</label><input type="number" name="age" className="neumorph-input" value={formData.age} onChange={onChange} /></div>
                <div className="form-group full-width"><label>Місто</label><input type="text" name="city" className="neumorph-input" value={formData.city} onChange={onChange} /></div>
                <div className="form-group full-width"><label>Стать</label><select name="gender" className="neumorph-select" value={formData.gender} onChange={onChange}><option value="unspecified">Не вказано</option><option value="male">Чоловік</option><option value="female">Жінка</option><option value="other">Інше</option></select></div>
                
                <div className="form-group full-width">
                  <label>Вибрати бейдж для відображення</label>
                  <select className="neumorph-select" value={selectedBadge ? selectedBadge.badgeId : ''} onChange={onBadgeChange}>
                    <option value="">Без бейджа</option>
                    {badges.map(badge => (
                      <option
                        key={badge.badgeId}
                        value={badge.badgeId}
                        disabled={!badge.unlocked}
                        style={{ color: badge.unlocked ? 'inherit' : 'gray' }}
                      >
                        {badge.unlocked ? `${badge.icon} ${badge.name}` : `🔒 ${badge.name} (заблоковано)`}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group full-width">
                  <label>Іконка біля нікнейму</label>
                  <select name="nicknameIcon" className="neumorph-select" value={profileCustomization.nicknameIcon} onChange={onCustomizationChange}>
                    <option value="">Без іконки</option>
                    <option value="CROWN">[CROWN]</option>
                    <option value="UNI">[UNI]</option>
                    <option value="ROCKET">[ROCKET]</option>
                    <option value="FIRE">[FIRE]</option>
                    <option value="STAR">[STAR]</option>
                    <option value="GEM">[GEM]</option>
                    <option value="ZAP">[ZAP]</option>
                    <option value="SHIELD">[SHIELD]</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Рамка аватара</label>
                  <select name="avatarFrame" className="neumorph-select" value={profileCustomization.avatarFrame} onChange={onCustomizationChange}>
                    <option value="none">Стандартна</option>
                    <option value="gold">Золота</option>
                    <option value="silver">Срібна</option>
                    <option value="neon">Неонова</option>
                    <option value="fire">Вогняна</option>
                    <option value="diamond">Діамантова</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Тема профілю</label>
                  <select name="profileTheme" className="neumorph-select" value={profileCustomization.profileTheme} onChange={onCustomizationChange}>
                    <option value="default">Стандартна</option>
                    <option value="ocean">Океан</option>
                    <option value="sunset">Захід сонця</option>
                    <option value="cyberpunk">Кіберпанк</option>
                    <option value="forest">Ліс</option>
                  </select>
                </div>
              </div>
              <hr style={{ margin: '30px 0', border: 'none', borderTop: '1px solid var(--panel-border)' }} />
              <button type="submit" className="neumorph-button">Зберегти зміни</button>
            </form>
            )}
          </div>
          </div>
        </AnimatedPage>
      </main>
    </div>
  );
};
export default ProfilePage;