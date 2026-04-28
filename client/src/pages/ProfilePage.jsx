import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AnimatedPage from '../components/AnimatedPage';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';
import '../styles/Dashboard.css';
import '../styles/AddHelpPage.css';
import '../styles/ProfilePage.css';
import API_BASE_URL from '../config/api.js';


const BADGE_DICTIONARY = [
  {
    badgeId: 'points_master', triggerType: 'POINTS',
    description: 'Видається за досягнення певної кількості балів.',
    levels: [
      { level: 1, name: 'Новачок', value: 500, icon: '🥉' },
      { level: 2, name: 'Спеціаліст', value: 1000, icon: '🥈' },
      { level: 3, name: 'Профі', value: 3000, icon: '🥇' },
      { level: 4, name: 'Експерт', value: 5000, icon: '⭐' },
      { level: 5, name: 'Майстер', value: 10000, icon: '🏆' },
      { level: 6, name: 'Грандмайстер', value: 15000, icon: '💎' },
      { level: 7, name: 'Легенда', value: 20000, icon: '🔥' },
      { level: 8, name: 'Semigod', value: 30000, icon: '👑' },
    ],
    lockedIcon: '🔒',
  },
  {
    badgeId: 'donator', triggerType: 'DONATION_COUNT',
    description: 'Видається за загальну кількість схвалених донатів.',
    levels: [
      { level: 1, name: 'Перший Донат', value: 1, icon: '❤️' },
      { level: 2, name: 'Щедрий Донатор', value: 5, icon: '💰' },
      { level: 3, name: 'Меценат', value: 10, icon: '🏦' },
      { level: 4, name: 'Інвестор Перемоги', value: 25, icon: '💎' },
    ],
    lockedIcon: '💸',
  },
  {
    badgeId: 'volunteer', triggerType: 'VOLUNTEER_COUNT',
    description: 'Видається за кількість виконаних волонтерських завдань.',
    levels: [
      { level: 1, name: 'Перша Справа', value: 1, icon: '💪' },
      { level: 2, name: 'Активіст', value: 5, icon: '🛠️' },
      { level: 3, name: 'Лідер Руху', value: 10, icon: '🚀' },
    ],
    lockedIcon: '👤',
  },
  {
    badgeId: 'aid_worker', triggerType: 'AID_COUNT',
    description: 'Видається за кількість передач гуманітарної допомоги.',
    levels: [
      { level: 1, name: 'Перша Посилка', value: 1, icon: '📦' },
      { level: 2, name: 'Надійний Тип', value: 5, icon: '🚚' },
      { level: 3, name: 'Ангел Логістики', value: 10, icon: '✈️' },
    ],
    lockedIcon: '🤷',
  },
  {
    badgeId: 'versatile', triggerType: 'VERSATILE',
    description: 'Видається за 1 донат, 1 волонтерство і 1 гум. допомогу.',
    levels: [{ level: 1, name: 'Майстер на всі руки', value: 1, icon: '🧑‍🔧' }],
    lockedIcon: '❓',
  },
  {
    badgeId: 'profile_complete', triggerType: 'PROFILE',
    description: 'Заповніть свій профіль (Аватар, Місто, Вік).',
    levels: [{ level: 1, name: 'Представся!', value: 1, icon: '🆔' }],
    lockedIcon: '❓',
  },
  {
    badgeId: 'streak_3_days', triggerType: 'STREAK',
    description: 'Зробіть 3 внески протягом 3 днів.',
    levels: [{ level: 1, name: 'Ударник', value: 3, icon: '⚡' }],
    lockedIcon: '❓',
  },
  {
    badgeId: 'high_roller', triggerType: 'HIGH_POINTS',
    description: 'Отримайте 1000+ балів за ОДНУ заявку.',
    levels: [{ level: 1, name: 'Хайролер', value: 1, icon: '💥' }],
    lockedIcon: '❓',
  },
  {
    badgeId: 'geo_tagger', triggerType: 'GEO',
    description: 'Додайте 5 заявок з геолокацією.',
    levels: [{ level: 1, name: 'Картограф', value: 5, icon: '🗺️' }],
    lockedIcon: '❓',
  },
  {
    badgeId: 'first_rejection', triggerType: 'REJECTED',
    description: 'Вашу заявку було відхилено. Не здавайтесь!',
    levels: [{ level: 1, name: 'Не здавайся!', value: 1, icon: '🤕' }],
    lockedIcon: '❓',
  },
];

const useAlertHook = () => ({ showAlert: (message) => { alert(message); } });

const ProfilePage = () => {
  const { showAlert } = useAlertHook();
  const [formData, setFormData] = useState({ username: '', email: '', backupEmail: '', age: '', city: '', gender: 'unspecified' });
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [currentAvatar, setCurrentAvatar] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [badges, setBadges] = useState([]); 
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [profileCustomization, setProfileCustomization] = useState({ nicknameIcon: '', avatarFrame: 'none', profileTheme: 'default' });

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('userToken'));
        const config = { headers: { 'x-auth-token': token } };
        const res = await axios.get(`${API_BASE_URL}/api/users/me`, config);
        setFormData({
          username: res.data.username || '', email: res.data.email || '',
          backupEmail: res.data.backupEmail || '', age: res.data.age || '',
          city: res.data.city || '', gender: res.data.gender || 'unspecified',
        });
        setCurrentAvatar(res.data.avatar);
        setProfileCustomization({
          nicknameIcon: res.data.profileCustomization?.nicknameIcon || '',
          avatarFrame: res.data.profileCustomization?.avatarFrame || 'none',
          profileTheme: res.data.profileCustomization?.profileTheme || 'default'
        });
        const earned = res.data.badges || [];

        const merged = [];
        BADGE_DICTIONARY.forEach(def => {
          def.levels.forEach(l => {
            const has = earned.some(b => b.badgeId === def.badgeId && b.level === l.level);
            merged.push({
              badgeId: def.badgeId,
              level: l.level,
              name: l.name,
              icon: has ? (l.icon || def.lockedIcon) : def.lockedIcon || '🔒',
              unlocked: has
            });
          });
        });
        setBadges(merged);
        setSelectedBadge(res.data.selectedBadge || null);
        if (res.data.createdAt) setCreatedAt(new Date(res.data.createdAt).toLocaleDateString('uk-UA'));
      } catch (err) { showAlert('Помилка завантаження профілю'); }
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
      const token = JSON.parse(localStorage.getItem('userToken'));
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
      const [badgeId, levelStr] = value.split('-');
      const level = parseInt(levelStr);
      selected = badges.find(b => b.badgeId === badgeId && b.level === level);
    }

    try {
      const token = JSON.parse(localStorage.getItem('userToken'));
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
          <div className={`profile-container theme-${profileCustomization.profileTheme}`}>
            <form className="profile-form" onSubmit={onSubmit}>
              <h2>Налаштування Профілю</h2>
              {createdAt && <p style={{fontSize: '0.9em', color: '#777', marginBottom: '20px'}}>📅 Акаунт створено: <strong>{createdAt}</strong></p>}
              <div className="avatar-section">
                <div className={`avatar-preview frame-${profileCustomization.avatarFrame}`}>{avatarPreview ? <img src={avatarPreview} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : currentAvatar ? <img src={currentAvatar.startsWith('http') ? currentAvatar : `${API_BASE_URL}/${currentAvatar}`} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : '👤'}</div>
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
                  <select className="neumorph-select" value={selectedBadge ? `${selectedBadge.badgeId}-${selectedBadge.level}` : ''} onChange={onBadgeChange}>
                    <option value="">Без бейджа</option>
                    {badges.map(badge => (
                      <option
                        key={`${badge.badgeId}-${badge.level}`}
                        value={`${badge.badgeId}-${badge.level}`}
                        disabled={!badge.unlocked}
                      >
                        {badge.unlocked ? `${badge.icon} ${badge.name}` : `${badge.icon} ${badge.name} (заблоковано)`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Іконка біля нікнейму (наприклад: 👑, 🦄, 🚀)</label>
                  <select name="nicknameIcon" className="neumorph-select" value={profileCustomization.nicknameIcon} onChange={onCustomizationChange}>
                    <option value="">Без іконки</option>
                    <option value="👑">👑 Корона</option>
                    <option value="🦄">🦄 Єдиноріг</option>
                    <option value="🚀">🚀 Ракета</option>
                    <option value="🔥">🔥 Вогонь</option>
                    <option value="⭐">⭐ Зірка</option>
                    <option value="💎">💎 Діамант</option>
                    <option value="⚡">⚡ Блискавка</option>
                    <option value="🛡️">🛡️ Щит</option>
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
              <hr style={{ margin: '30px 0', border: 'none', borderTop: '1px solid #ccc' }} />
              <button type="submit" className="neumorph-button">Зберегти зміни</button>
            </form>
          </div>
        </AnimatedPage>
      </main>
    </div>
  );
};
export default ProfilePage;