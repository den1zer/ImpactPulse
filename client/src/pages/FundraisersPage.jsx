import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AnimatedPage from '../components/AnimatedPage';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';
import '../styles/Dashboard.css';
import '../styles/FundraisersPage.css';
import API_BASE_URL from '../config/api.js';

// true під час `npm run dev`, false після `npm run build` (production)
const IS_DEV = import.meta.env.DEV;

/* ── Auth helpers ── */
const getToken = () => localStorage.getItem('userToken') || localStorage.getItem('token') || '';
const authHeaders = () => ({
  'x-auth-token': getToken(),
  'Authorization': `Bearer ${getToken()}`,
});

/* ── Payment sub-form ── */
const DonationForm = ({ fundraiser, onDonation }) => {
  const [amount, setAmount]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState('');
  const [error, setError]       = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setSuccess('');
    setError('');

    const num = Number(amount);
    if (!num || num <= 0) { setError('Вкажіть суму'); return; }

    setLoading(true);
    try {
      if (IS_DEV) {
        // ── DEV MODE: call simulate endpoint directly ──
        // This bypasses LiqPay completely and updates the DB right away
        const res = await axios.post(
          `${API_BASE_URL}/api/fundraisers/${fundraiser._id}/donate`,
          { amount: num },
          { headers: authHeaders() },
        );
        setSuccess(res.data.msg || `Дякуємо! Донат ${num} грн зараховано.`);
        setAmount('');
        // Update progress bar immediately
        await onDonation();
      } else {
        // ── PROD MODE: generate LiqPay form and redirect ──
        const res = await axios.post(
          `${API_BASE_URL}/api/payment/create`,
          { amount: num, collectionId: fundraiser._id, description: fundraiser.title },
          { headers: authHeaders() },
        );
        const { data, signature } = res.data;

        const form = document.createElement('form');
        form.method        = 'POST';
        form.action        = 'https://www.liqpay.ua/api/3/checkout';
        form.acceptCharset = 'utf-8';
        form.target        = '_blank';

        [['data', data], ['signature', signature]].forEach(([name, value]) => {
          const inp = document.createElement('input');
          inp.type  = 'hidden';
          inp.name  = name;
          inp.value = value;
          form.appendChild(inp);
        });

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
        setAmount('');

        // Poll every 5 s for up to 2 min waiting for LiqPay callback
        let tries = 0;
        const id = setInterval(async () => {
          tries++;
          if (tries > 24) { clearInterval(id); return; }
          await onDonation();
        }, 5000);
      }
    } catch (err) {
      const status = err.response?.status;
      const msg    = err.response?.data?.msg || err.response?.data?.error || err.message;

      if (status === 401) {
        setError('Сесія закінчилась. Будь ласка, увійдіть знову.');
      } else if (status === 403) {
        setError('Доступ заборонено. Перевірте чи підтверджено email.');
      } else {
        setError('Помилка: ' + msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="fundraiser-form" onSubmit={handleSubmit}>
      <div className="card-sep" />

      {IS_DEV && (
        <p className="fundraiser-dev-badge">🛠 Dev-режим: донат без LiqPay</p>
      )}

      {error   && <p className="fundraiser-error-msg">{error}</p>}
      {success && <p className="fundraiser-success-msg">{success}</p>}

      <div>
        <label>Реквізити картки</label>
        <input className="neumorph-input" type="text" value={fundraiser.cardNumber} disabled />
      </div>

      <div>
        <label>Сума (грн)</label>
        <input
          className="neumorph-input"
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="500"
          min="1"
          step="1"
        />
      </div>

      <button type="submit" className="neumorph-button" disabled={loading}>
        {loading ? 'Обробка…' : IS_DEV ? '⚡ Задонатити (тест)' : 'Підтримати →'}
      </button>
    </form>
  );
};

/* ── Animated progress bar ── */
const ProgressBar = ({ collected, goal }) => {
  const pct = goal > 0 ? Math.min((collected / goal) * 100, 100) : 0;
  return (
    <div>
      <div className="progress-stats">
        <span>Зібрано: <strong className="amount">{collected.toLocaleString('uk-UA')} грн</strong></span>
        <span>Ціль: {goal.toLocaleString('uk-UA')} грн</span>
      </div>
      <div className="progress-bar-container">
        <div
          className="progress-bar-fill"
          style={{ width: `${pct.toFixed(1)}%` }}
        />
      </div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
        {pct.toFixed(1)}% від цілі
      </div>
    </div>
  );
};

/* ── Main page ── */
const FundraisersPage = () => {
  const [fundraisers, setFundraisers] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const isGuest = localStorage.getItem('userRole') === 'guest';

  const fetchFundraisers = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/fundraisers`, {
        headers: { 'x-auth-token': getToken() },
      });
      setFundraisers(res.data);
      setLastUpdated(new Date());
      return res.data;
    } catch (err) {
      console.error('Помилка завантаження зборів:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    setLoading(true);
    fetchFundraisers().finally(() => setLoading(false));
  }, [fetchFundraisers]);

  // Auto-refresh when user returns to tab (after LiqPay redirect in prod)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchFundraisers();
    };
    const onFocus = () => fetchFundraisers();

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchFundraisers]);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <DashboardHeader />
        <AnimatedPage>
          <div className="dashboard-content-wrapper">
            <div className="fundraisers-container">

              <div className="fundraisers-header">
                <h2>
                  Актуальні збори{' '}
                  <span className="text-muted" style={{ fontWeight: 400 }}>
                    ({fundraisers.length})
                  </span>
                </h2>
                <button
                  className="neumorph-button"
                  style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                  onClick={fetchFundraisers}
                  title="Оновити"
                >
                  ↻ Оновити
                </button>
              </div>

              {lastUpdated && (
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                  Оновлено: {lastUpdated.toLocaleTimeString('uk-UA')}
                </p>
              )}

              {loading && <div className="fundraisers-empty">Завантаження…</div>}

              {!loading && fundraisers.length === 0 && (
                <div className="fundraisers-empty">Активних зборів немає.</div>
              )}

              {!loading && fundraisers.length > 0 && (
                <div className="fundraisers-grid">
                  {fundraisers.map(item => (
                    <div key={item._id} className="fundraiser-card">
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                      <p className="fundraiser-date">
                        📅 Стартував: {new Date(item.createdAt).toLocaleDateString('uk-UA')}
                      </p>

                      <ProgressBar
                        collected={item.collectedAmount}
                        goal={item.goalAmount}
                      />

                      {item.status === 'open' ? (
                        isGuest ? (
                          <p className="fundraiser-guest-msg">Увійдіть, щоб підтримати збір.</p>
                        ) : (
                          <DonationForm
                            fundraiser={item}
                            onDonation={fetchFundraisers}
                          />
                        )
                      ) : (
                        <p className="fundraiser-closed">
                          ✓ Збір закрито — {new Date(item.updatedAt).toLocaleDateString('uk-UA')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </AnimatedPage>
      </main>
    </div>
  );
};

export default FundraisersPage;