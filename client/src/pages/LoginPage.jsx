import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import authService from '../api/authService';

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();
  const { email, password } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleGuestLogin = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userId');
    localStorage.setItem('userRole', 'guest');
    navigate('/dashboard');
  };

  const onSubmit = async e => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const { role } = await authService.login({ email, password });
      navigate(role === 'admin' ? '/admin/dashboard' : '/dashboard');
    } catch (error) {
      const msg = error.response?.data?.msg || '';
      if (error.response?.status === 401 && msg.includes('verify')) {
        setErrorMsg('Будь ласка, підтвердіть вашу пошту перед входом.');
      } else {
        setErrorMsg('Помилка входу: ' + (msg || 'Невідома помилка'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-main-container">

        {/* ── Left: form ── */}
        <div className="auth-left-panel">
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 6,
              background: 'var(--accent)', display: 'grid', placeItems: 'center',
              color: '#fff', fontWeight: 700, fontSize: '0.8rem',
            }}>IP</div>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              ImpactPulse
            </span>
          </div>

          <h1 className="auth-title">З поверненням</h1>
          <p className="auth-subtitle">Увійдіть, щоб продовжити</p>

          {errorMsg && <div className="error-message">{errorMsg}</div>}

          <form onSubmit={onSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                name="email"
                value={email}
                onChange={onChange}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Пароль</label>
              <div className="password-input-wrapper">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={password}
                  onChange={onChange}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <Link to="/forgot-password" className="forgot-password-link">
              Забули пароль?
            </Link>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Вхід…' : 'Увійти'}
            </button>

            <button
              type="button"
              className="auth-button secondary"
              onClick={handleGuestLogin}
            >
              Продовжити як гість
            </button>
          </form>

          <p className="auth-toggle">
            Немає акаунту? <Link to="/register">Зареєструватись</Link>
          </p>
        </div>

        {/* ── Right: promo ── */}
        <div className="auth-right-panel">
          <h2>Разом ми робимо різницю</h2>
          <p>
            Приєднуйтесь до спільноти волонтерів ImpactPulse — відстежуйте внески,
            збирайте нагороди та допомагайте тим, хто потребує підтримки.
          </p>
          <Link to="/register" className="auth-button ghost">
            Створити акаунт
          </Link>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;