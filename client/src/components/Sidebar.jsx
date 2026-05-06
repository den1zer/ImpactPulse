import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config/api.js';
import {
  FiGrid, FiAward, FiPlus, FiUser, FiLogOut, FiUsers,
  FiHelpCircle, FiBookOpen, FiDollarSign,
  FiClipboard, FiMenu, FiX, FiChevronLeft, FiShoppingBag
} from 'react-icons/fi';

/* ── Navigation items ─────────────────────────────── */
const NAV_MAIN = [
  { to: '/dashboard', icon: <FiGrid />,      label: 'Дашборд',       alwaysVisible: true },
  { to: '/my-contributions', icon: <FiClipboard />, label: 'Мої заявки',    authOnly: true },
  { to: '/add-help',  icon: <FiPlus />,      label: 'Додати допомогу', authOnly: true },
  { to: '/rewards',   icon: <FiAward />,     label: 'Нагороди',      authOnly: true },
  { to: '/shop',      icon: <FiShoppingBag />, label: 'Магазин',     authOnly: true },
  { to: '/community', icon: <FiUsers />,     label: 'Ком\'юніті',     authOnly: true },
  { to: '/fundraisers', icon: <FiDollarSign />, label: 'Збори',       alwaysVisible: true },
  { to: '/tasks',     icon: <FiClipboard />, label: 'Завдання',      alwaysVisible: true },
];

const NAV_BOTTOM = [
  { to: '/instructions', icon: <FiBookOpen />, label: 'Інструкція' },
  { to: '/support',      icon: <FiHelpCircle />, label: 'Підтримка' },
];

/* ── Bottom nav items (mobile) ───────────────────── */
const BOTTOM_NAV = [
  { to: '/dashboard',   icon: <FiGrid />,      label: 'Головна' },
  { to: '/tasks',       icon: <FiClipboard />, label: 'Завдання' },
  { to: '/fundraisers', icon: <FiDollarSign />,label: 'Збори' },
  { to: '/rewards',     icon: <FiAward />,     label: 'Нагороди' },
  { to: '/profile',     icon: <FiUser />,      label: 'Профіль' },
];

/* ════════════════════════════════════════════════════
   Sidebar component
   ════════════════════════════════════════════════════ */
const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isGuest = localStorage.getItem('userRole') === 'guest';

  /* body class helpers */
  useEffect(() => {
    document.body.classList.add('has-sidebar');
    return () => {
      document.body.classList.remove('has-sidebar');
      document.body.classList.remove('sidebar-expanded');
    };
  }, []);

  useEffect(() => {
    if (isExpanded) document.body.classList.add('sidebar-expanded');
    else document.body.classList.remove('sidebar-expanded');
  }, [isExpanded]);

  /* lock body scroll when drawer is open */
  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileOpen]);

  /* fetch avatar */
  useEffect(() => {
    if (isGuest) return;
    const fetchAvatar = async () => {
      try {
        const token = localStorage.getItem('userToken');
        if (!token) return;
        const res = await axios.get(`${API_BASE_URL}/api/users/me`, {
          headers: { 'x-auth-token': token },
        });
        if (res.data.avatar) setAvatar(res.data.avatar);
      } catch (_) {}
    };
    fetchAvatar();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  const close = () => setIsMobileOpen(false);

  /* helper: build avatar src */
  const avatarSrc = avatar
    ? (avatar.startsWith('http') ? avatar : `${API_BASE_URL}/${avatar}`)
    : null;

  return (
    <>
      {/* ── Mobile hamburger ── */}
      <button
        className="mobile-menu-btn"
        onClick={() => setIsMobileOpen(true)}
        aria-label="Відкрити меню"
      >
        <FiMenu />
      </button>

      {/* ── Overlay ── */}
      {isMobileOpen && <div className="sidebar-overlay" onClick={close} />}

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${isExpanded ? '' : 'collapsed'} ${isMobileOpen ? 'mobile-open' : ''}`}>

        {/* Brand + toggle */}
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <div className="brand-icon">IP</div>
            {isExpanded && <h2>ImpactPulse</h2>}
          </div>

          {/* Desktop collapse toggle */}
          <button
            className="sidebar-toggle desktop-toggle"
            onClick={() => setIsExpanded(v => !v)}
            title={isExpanded ? 'Згорнути' : 'Розгорнути'}
          >
            {isExpanded ? <FiChevronLeft /> : <FiMenu />}
          </button>

          {/* Mobile close */}
          <button className="sidebar-toggle mobile-close-btn" onClick={close}>
            <FiX />
          </button>
        </div>

        {/* Profile link */}
        {!isGuest && (
          <div className="sidebar-profile-link">
            <NavLink
              to="/profile"
              className={({ isActive }) => `sidebar-link sidebar-profile${isActive ? ' active' : ''}`}
              onClick={close}
            >
              <span className="sidebar-icon profile-icon">
                {avatarSrc
                  ? <img src={avatarSrc} alt="Аватар" />
                  : <FiUser />}
              </span>
              {isExpanded && <span className="sidebar-text">Мій профіль</span>}
            </NavLink>
          </div>
        )}

        {/* Main nav */}
        <nav className="sidebar-links">
          {NAV_MAIN.map(item => {
            if (item.authOnly && isGuest) return null;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/dashboard'}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                onClick={close}
              >
                <span className="sidebar-icon">{item.icon}</span>
                {isExpanded && <span className="sidebar-text">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom nav */}
        <div className="sidebar-bottom">
          {NAV_BOTTOM.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              onClick={close}
            >
              <span className="sidebar-icon">{item.icon}</span>
              {isExpanded && <span className="sidebar-text">{item.label}</span>}
            </NavLink>
          ))}

          <button
            type="button"
            className="sidebar-link sidebar-logout"
            onClick={handleLogout}
          >
            <span className="sidebar-icon"><FiLogOut /></span>
            {isExpanded && <span className="sidebar-text">{isGuest ? 'Увійти' : 'Вийти'}</span>}
          </button>
        </div>
      </aside>

      {/* ── Bottom Nav (mobile only) ── */}
      <nav className="bottom-nav">
        {BOTTOM_NAV.map(item => {
          if (item.to === '/profile' && isGuest) return null;
          const isActive = location.pathname === item.to ||
            (item.to !== '/dashboard' && location.pathname.startsWith(item.to));
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`bottom-nav-item${isActive ? ' active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
};

export default Sidebar;
