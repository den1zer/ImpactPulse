import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import authService from '../api/authService';

const RegisterPage = () => {
  const [formData, setFormData]   = useState({ 
    username: '', 
    email: '', 
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg]   = useState('');
  const [loading, setLoading]     = useState(false);
  const navigate = useNavigate();
  const { username, email, password, confirmPassword } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleGuest = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userId');
    localStorage.setItem('userRole', 'guest');
    navigate('/dashboard');
  };

  const validatePassword = (pass) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d\s]).{8,}$/;
    return regex.test(pass);
  };

  const onSubmit = async e => {
    e.preventDefault();
    setErrorMsg(''); setSuccessMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Паролі не співпадають');
      return;
    }

    if (!validatePassword(password)) {
      setErrorMsg('Пароль має бути мін. 8 символів, містити велику та малу літери, цифру та спецсимвол');
      return;
    }

    setLoading(true);
    try {
      await authService.register({ username, email, password });
      setSuccessMsg(
        'Реєстрацію завершено! Перевірте вашу пошту (та папку "Спам") для підтвердження акаунту.',
      );
      setFormData({ username: '', email: '', password: '', confirmPassword: '' });
    } catch (error) {
      setErrorMsg('Помилка реєстрації: ' + (error.response?.data?.msg || 'Невідома помилка'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-main-container">

        {/* ── Left: promo ── */}
        <div className="auth-right-panel">
          <h2>Вже з нами?</h2>
          <p>
            Якщо у вас вже є акаунт — увійдіть, щоб продовжити відстежувати внески та нагороди.
          </p>
          <Link to="/login" className="auth-button ghost">
            Увійти
          </Link>
        </div>

        {/* ── Right: form ── */}
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

          <h1 className="auth-title">Створити акаунт</h1>
          <p className="auth-subtitle">Приєднуйтесь до волонтерської спільноти</p>

          {successMsg && <div className="success-message">{successMsg}</div>}
          {errorMsg   && <div className="error-message">{errorMsg}</div>}

          <form onSubmit={onSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="reg-username">Ім'я користувача</label>
              <input
                id="reg-username"
                type="text"
                name="username"
                value={username}
                onChange={onChange}
                placeholder="volunteer123"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-email">Email</label>
              <input
                id="reg-email"
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
              <label htmlFor="reg-password">Пароль</label>
              <div className="password-input-wrapper">
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={password}
                  onChange={onChange}
                  placeholder="мінімум 8 символів"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <small style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                Мінімум 8 символів: A-z, 0-9, !@#$%...
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="reg-confirm-password">Підтвердіть пароль</label>
              <div className="password-input-wrapper">
                <input
                  id="reg-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={onChange}
                  placeholder="повторіть пароль"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Реєстрація…' : 'Зареєструватись'}
            </button>

            <button type="button" className="auth-button secondary" onClick={handleGuest}>
              Продовжити як гість
            </button>
          </form>

          <p className="auth-toggle">
            Вже є акаунт? <Link to="/login">Увійти</Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default RegisterPage;