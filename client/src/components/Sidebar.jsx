import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FiGrid,
  FiAward,
  FiPlus,
  FiUser,
  FiLogOut,
  FiHelpCircle,
  FiBookOpen,
  FiDollarSign,
  FiClipboard,
  FiMenu,
} from 'react-icons/fi';

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [avatar, setAvatar] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserAvatar = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('userToken'));
        if (!token) return;

        const config = { headers: { 'x-auth-token': token } };
        const res = await axios.get('http://localhost:5000/api/users/me', config);

        if (res.data.avatar) {
          setAvatar(res.data.avatar);
        }
      } catch (err) {
        console.error('Не вдалося завантажити аватар для сайдбару', err);
      }
    };
    fetchUserAvatar();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="sidebar-top">
        <div className="sidebar-brand">
          <div className="brand-icon">IP</div>
          {isExpanded && <h2>ImpactPulse</h2>}
        </div>
        <button className="sidebar-toggle" onClick={() => setIsExpanded(!isExpanded)}>
          <FiMenu />
        </button>
      </div>

      <div className="sidebar-profile-link">
        <NavLink to="/profile" className={({ isActive }) => `sidebar-link sidebar-profile${isActive ? ' active' : ''}`}>
          <span className="sidebar-icon profile-icon">
            {avatar ? (
              <img src={avatar.startsWith('http') ? avatar : `http://localhost:5000/${avatar}`} alt="Avatar" />
            ) : (
              <FiUser />
            )}
          </span>
          {isExpanded && <span className="sidebar-text">Мій профіль</span>}
        </NavLink>
      </div>

      <nav className="sidebar-links">
        <NavLink to="/" end className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
          <span className="sidebar-icon"><FiGrid /></span>
          {isExpanded && <span className="sidebar-text">Дашборд</span>}
        </NavLink>
        <NavLink to="/my-contributions" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
          <span className="sidebar-icon"><FiClipboard /></span>
          {isExpanded && <span className="sidebar-text">Мої заявки</span>}
        </NavLink>
        <NavLink to="/add-help" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
          <span className="sidebar-icon"><FiPlus /></span>
          {isExpanded && <span className="sidebar-text">Додати допомогу</span>}
        </NavLink>
        <NavLink to="/rewards" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
          <span className="sidebar-icon"><FiAward /></span>
          {isExpanded && <span className="sidebar-text">Нагороди</span>}
        </NavLink>
        <NavLink to="/fundraisers" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
          <span className="sidebar-icon"><FiDollarSign /></span>
          {isExpanded && <span className="sidebar-text">Збори</span>}
        </NavLink>
        <NavLink to="/tasks" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
          <span className="sidebar-icon"><FiClipboard /></span>
          {isExpanded && <span className="sidebar-text">Завдання</span>}
        </NavLink>
      </nav>

      <div className="sidebar-bottom">
        <NavLink to="/instructions" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
          <span className="sidebar-icon"><FiBookOpen /></span>
          {isExpanded && <span className="sidebar-text">Інструкція</span>}
        </NavLink>
        <NavLink to="/support" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
          <span className="sidebar-icon"><FiHelpCircle /></span>
          {isExpanded && <span className="sidebar-text">Підтримка</span>}
        </NavLink>
        <button type="button" className="sidebar-link sidebar-logout" onClick={handleLogout}>
          <span className="sidebar-icon"><FiLogOut /></span>
          {isExpanded && <span className="sidebar-text">Вийти</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
