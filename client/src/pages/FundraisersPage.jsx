import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import AnimatedPage from '../components/AnimatedPage';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';
import '../styles/Dashboard.css';
import '../styles/FundraisersPage.css';
import API_BASE_URL from '../config/api.js';

const IS_DEV = import.meta.env.DEV;
const getToken = () => localStorage.getItem('userToken') || localStorage.getItem('token') || '';
const authHeaders = () => ({
  'x-auth-token': getToken(),
  'Authorization': `Bearer ${getToken()}`,
});

const DonationForm = ({ fundraiser, onDonation }) => {
  const [amount,  setAmount]  = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error,   setError]   = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setSuccess(''); setError('');
    const num = Number(amount);
    if (!num || num <= 0) { setError('Вкажіть суму'); return; }
    setLoading(true);
    try {
      if (IS_DEV) {
        const res = await axios.post(
          `${API_BASE_URL}/api/fundraisers/${fundraiser._id}/donate`,
          { amount: num },
          { headers: authHeaders() },
        );
        setSuccess(res.data.msg || `Дякуємо! Донат ${num} грн зараховано.`);
        setAmount('');
        await onDonation();
      } else {
        const res = await axios.post(
          `${API_BASE_URL}/api/payment/create`,
          { amount: num, collectionId: fundraiser._id, description: fundraiser.title },
          { headers: authHeaders() },
        );
        const { data, signature } = res.data;
        const form = document.createElement('form');
        form.method = 'POST'; form.action = 'https://www.liqpay.ua/api/3/checkout';
        form.acceptCharset = 'utf-8'; form.target = '_blank';
        [['data', data], ['signature', signature]].forEach(([name, value]) => {
          const inp = document.createElement('input');
          inp.type = 'hidden'; inp.name = name; inp.value = value;
          form.appendChild(inp);
        });
        document.body.appendChild(form); form.submit(); document.body.removeChild(form);
        setAmount('');
        let tries = 0;
        const id = setInterval(async () => {
          tries++;
          if (tries > 24) { clearInterval(id); return; }
          await onDonation();
        }, 5000);
      }
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.msg || err.response?.data?.error || err.message;
      if (status === 401) setError('Сесія закінчилась. Увійдіть знову.');
      else if (status === 403) setError('Доступ заборонено. Перевірте чи підтверджено email.');
      else setError('Помилка: ' + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="fr-donation-form" onSubmit={handleSubmit}>
      {IS_DEV && <div className="fr-dev-badge">DEV — без LiqPay</div>}
      {error   && <div className="fr-msg fr-msg-error">{error}</div>}
      {success && <div className="fr-msg fr-msg-success">{success}</div>}
      <div className="fr-input-group">
        <label className="fr-label">Реквізити картки</label>
        <input className="fr-input" type="text" value={fundraiser.cardNumber} disabled />
      </div>
      <div className="fr-input-group">
        <label className="fr-label">Сума (грн)</label>
        <input
          className="fr-input"
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="500"
          min="1"
          step="1"
        />
      </div>
      <button type="submit" className="fr-donate-btn" disabled={loading}>
        {loading ? 'Обробка...' : IS_DEV ? 'Задонатити (тест)' : 'Підтримати'}
      </button>
    </form>
  );
};

const ProgressBar = ({ collected, goal }) => {
  const pct = goal > 0 ? Math.min((collected / goal) * 100, 100) : 0;
  return (
    <div className="fr-progress-wrap">
      <div className="fr-progress-stats">
        <span className="fr-progress-collected">
          {collected.toLocaleString('uk-UA')} грн
        </span>
        <span className="fr-progress-goal">з {goal.toLocaleString('uk-UA')} грн</span>
      </div>
      <div className="fr-progress-bar">
        <div className="fr-progress-fill" style={{ width: `${pct.toFixed(1)}%` }} />
      </div>
      <div className="fr-progress-pct">{pct.toFixed(1)}% від цілі</div>
    </div>
  );
};

const FundraisersPage = () => {
  const [fundraisers, setFundraisers] = useState([]);
  const [loading,     setLoading]     = useState(true);
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

  useEffect(() => {
    setLoading(true);
    fetchFundraisers().finally(() => setLoading(false));
  }, [fetchFundraisers]);

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') fetchFundraisers(); };
    const onFocus   = () => fetchFundraisers();
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

            {/* Hero */}
            <div className="fr-hero">
              <div className="fr-hero-text">
                <p className="small-title">ImpactPulse / Збори</p>
                <h1>Актуальні збори</h1>
                <p className="fr-hero-desc">
                  Підтримайте ініціативи напряму. Кожен донат підтверджується та зараховується до вашого профілю.
                </p>
              </div>
              <div className="fr-hero-right">
                {lastUpdated && (
                  <span className="fr-updated">Оновлено: {lastUpdated.toLocaleTimeString('uk-UA')}</span>
                )}
                <button className="fr-refresh-btn" onClick={fetchFundraisers} title="Оновити">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 4v6h6M23 20v-6h-6"/>
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/>
                  </svg>
                  Оновити
                </button>
              </div>
            </div>

            {loading ? (
              <div className="fr-state">
                <div className="guilds-spinner" />
                <span>ЗАВАНТАЖЕННЯ...</span>
              </div>
            ) : fundraisers.length === 0 ? (
              <div className="fr-state">Активних зборів немає.</div>
            ) : (
              <div className="fr-grid">
                {fundraisers.map(item => (
                  <div key={item._id} className="fr-card">
                    <div className="fr-card-head">
                      <Link to={`/fundraisers/${item._id}`} className="fr-card-title-link">
                        <h3 className="fr-card-title">{item.title}</h3>
                      </Link>
                      <span className={`fr-card-status ${item.status === 'open' ? 'open' : 'closed'}`}>
                        {item.status === 'open' ? 'Активний' : 'Закрито'}
                      </span>
                    </div>
                    <p className="fr-card-desc">{item.description}</p>
                    <p className="fr-card-date">
                      Стартував: {new Date(item.createdAt).toLocaleDateString('uk-UA')}
                    </p>
                    <ProgressBar collected={item.collectedAmount} goal={item.goalAmount} />
                    <div className="fr-card-footer">
                      {item.status === 'open' ? (
                        isGuest ? (
                          <p className="fr-guest-msg">Увійдіть, щоб підтримати збір.</p>
                        ) : (
                          <DonationForm fundraiser={item} onDonation={fetchFundraisers} />
                        )
                      ) : (
                        <p className="fr-closed-msg">
                          Збір закрито — {new Date(item.updatedAt).toLocaleDateString('uk-UA')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </AnimatedPage>
      </main>
    </div>
  );
};

export default FundraisersPage;