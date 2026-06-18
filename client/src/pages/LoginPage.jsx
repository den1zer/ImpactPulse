import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import authService from '../api/authService';
import playSound from '../utils/sounds';
import API_BASE_URL from '../config/api.js';

/**
 * LoginPage Component
 * Handles user authentication via traditional email/password and Google OAuth.
 * Listens for OAuth redirect parameters in the URL to automatically log in the user.
 *
 * @returns {JSX.Element} The rendered login page.
 */
const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { email, password } = formData;

  useEffect(() => {
    const token = searchParams.get('token');
    const role = searchParams.get('role');
    const userId = searchParams.get('userId');
    const error = searchParams.get('error');

    if (error) {
      const errorMessages = {
        google_no_code: 'Помилка авторизації через Google: не отримано код.',
        google_auth_failed: 'Не вдалося увійти через Google. Спробуйте ще раз.',
      };
      setErrorMsg(errorMessages[error] || 'Помилка авторизації через Google.');
      window.history.replaceState({}, '', '/login');
      return;
    }

    // Бізнес-логіка: Якщо після Google Auth ми отримали токен, роль та ID у параметрах URL,
    // зберігаємо їх локально та очищуємо URL з міркувань безпеки перед редіректом.
    if (token && role && userId) {
      localStorage.setItem('userToken', token);
      localStorage.setItem('userRole', role);
      localStorage.setItem('userId', userId);
      playSound('success');
      window.history.replaceState({}, '', '/login');
      navigate('/dashboard');
    }
  }, [searchParams, navigate]);

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  /**
   * Initializes a guest session by clearing persistent user tokens.
   */
  const handleGuestLogin = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userId');
    localStorage.setItem('userRole', 'guest');
    playSound('click');
    navigate('/dashboard');
  };

  /**
   * Redirects the user to the backend Google OAuth flow.
   */
  const handleGoogleLogin = () => {
    playSound('click');
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  };

  /**
   * Handles the standard login form submission.
   *
   * @param {React.FormEvent<HTMLFormElement>} e - The form submission event.
   */
  const onSubmit = async e => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      await authService.login({ email, password });
      playSound('success');
      navigate('/dashboard');
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

        <div className="auth-left-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <img
              src="/impactpulse_logo.png"
              alt="ImpactPulse Logo"
              style={{
                width: 38,
                height: 38,
                objectFit: 'contain',
                borderRadius: 6,
                border: '2px solid var(--black)',
                background: '#fff',
                padding: '2px',
                boxShadow: 'var(--shadow-sm)'
              }}
            />
            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              ImpactPulse
            </span>
          </div>

          <h1 className="auth-title">З поверненням</h1>
          <p className="auth-subtitle">Увійдіть, щоб продовжити</p>

          {errorMsg && <div className="error-message">{errorMsg}</div>}

          <button
            type="button"
            className="auth-button google-btn"
            onClick={handleGoogleLogin}
            id="google-login-btn"
          >
            <FcGoogle size={20} />
            Увійти через Google
          </button>

          <div className="divider">або</div>

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
                  onClick={() => { setShowPassword(!showPassword); playSound('click', 0.1); }}
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

        <div className="auth-right-panel">
          <h2>Разом до кращого майбутнього з ImpactPulse!</h2>
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