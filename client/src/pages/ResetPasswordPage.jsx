import React, { useState } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import API_BASE_URL from '../config/api';
import playSound from '../utils/sounds';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePassword = (pass) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d\s]).{8,}$/;
    return regex.test(pass);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!validatePassword(password)) {
      setError('Пароль має бути мін. 8 символів, містити велику та малу літери, цифру та спецсимвол');
      playSound('error');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/reset-password/${token}`, { password });
      setMessage(res.data.msg);
      playSound('success');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Сталася помилка');
      playSound('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-main-container">
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

          <h1 className="auth-title">Новий пароль</h1>
          <p className="auth-subtitle">Встановіть надійний пароль для вашого акаунту</p>

          {message && <div className="success-message">{message}</div>}
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="reset-password">Новий пароль</label>
              <div className="password-input-wrapper">
                <input
                  id="reset-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Введіть новий пароль"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => { setShowPassword(!showPassword); playSound('click', 0.1); }}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <small className="text-muted" style={{ fontSize: '0.7rem', marginTop: '6px', display: 'block', fontFamily: 'var(--font-mono)' }}>
                Мінімум 8 символів: A-z, 0-9, !@#$%...
              </small>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="auth-button"
            >
              {loading ? 'Збереження...' : 'Оновити пароль'}
            </button>
          </form>

          <div className="auth-toggle">
            <Link to="/login">Повернутись до логіну</Link>
          </div>
        </div>

        <div className="auth-right-panel">
          <h2>Крок до безпеки</h2>
          <p>
            Оберіть пароль, який ви раніше не використовували. 
            Це допоможе захистити ваші дані та волонтерські досягнення.
          </p>
          <div style={{ marginTop: 'auto' }}>
            <div className="badge badge-accent">Secure</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Version: 1.0.1 - Forced reload
export default ResetPasswordPage;
