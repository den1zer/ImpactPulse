import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import API_BASE_URL from '../config/api';
import playSound from '../utils/sounds';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email });
      setMessage(res.data.msg);
      playSound('success');
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

          <h2 className="auth-title">Забули пароль?</h2>
          <p className="auth-subtitle">Введіть ваш email, і ми надішлемо посилання для відновлення</p>

          {message && <div className="success-message">{message}</div>}
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="forgot-email">Email</label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="auth-button"
            >
              {loading ? 'Відправка...' : 'Надіслати посилання'}
            </button>
          </form>

          <div className="auth-toggle">
            Пам'ятаєте пароль? <Link to="/login">Увійти</Link>
          </div>
        </div>

        <div className="auth-right-panel">
          <h2>Безпека понад усе</h2>
          <p>
            Ми допоможемо вам повернути доступ до вашого профілю ImpactPulse. 
            Просто дотримуйтесь інструкцій у листі.
          </p>
          <Link to="/login" className="auth-button ghost">
            Назад до входу
          </Link>
        </div>
      </div>
    </div>
  );
};

// Version: 1.0.1 - Forced reload
export default ForgotPasswordPage;
