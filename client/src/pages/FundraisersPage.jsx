import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AnimatedPage from '../components/AnimatedPage';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';
import '../styles/Dashboard.css';
import '../styles/FundraisersPage.css';
import API_BASE_URL from '../config/api.js';

/* ── Payment sub-form ── */
const LiqPayPaymentForm = ({ fundraiser }) => {
  const [amount, setAmount] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    if (!amount || amount <= 0) { alert('Вкажіть суму'); return; }
    try {
      const token  = localStorage.getItem('userToken');
      const config = { headers: { 'x-auth-token': token } };
      const res    = await axios.post(
        `${API_BASE_URL}/api/payment/create`,
        { amount, collectionId: fundraiser._id, description: fundraiser.title },
        config,
      );
      const { data, signature } = res.data;
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://www.liqpay.ua/api/3/checkout';
      form.acceptCharset = 'utf-8';
      ['data', 'signature'].forEach((name, i) => {
        const inp = document.createElement('input');
        inp.type  = 'hidden';
        inp.name  = name;
        inp.value = [data, signature][i];
        form.appendChild(inp);
      });
      document.body.appendChild(form);
      form.submit();
      setAmount('');
    } catch (err) {
      alert('Помилка: ' + (err.response?.data?.msg || err.message));
    }
  };

  return (
    <form className="fundraiser-form" onSubmit={handleSubmit}>
      <div className="card-sep" />

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
        />
      </div>

      <button type="submit" className="neumorph-button">Підтримати →</button>
    </form>
  );
};

/* ── Main page ── */
const FundraisersPage = () => {
  const [fundraisers, setFundraisers] = useState([]);
  const [loading, setLoading]         = useState(true);
  const isGuest = localStorage.getItem('userRole') === 'guest';

  const fetchFundraisers = async () => {
    setLoading(true);
    try {
      const token  = localStorage.getItem('userToken') || '';
      const config = { headers: { 'x-auth-token': token } };
      const res    = await axios.get(`${API_BASE_URL}/api/fundraisers`, config);
      setFundraisers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFundraisers(); }, []);

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
              </div>

              {loading && <div className="fundraisers-empty">Завантаження…</div>}

              {!loading && fundraisers.length === 0 && (
                <div className="fundraisers-empty">Активних зборів немає.</div>
              )}

              {!loading && fundraisers.length > 0 && (
                <div className="fundraisers-grid">
                  {fundraisers.map(item => {
                    const pct = Math.min((item.collectedAmount / item.goalAmount) * 100, 100);
                    return (
                      <div key={item._id} className="fundraiser-card">
                        <h3>{item.title}</h3>
                        <p>{item.description}</p>
                        <p className="fundraiser-date">
                          📅 Стартував: {new Date(item.createdAt).toLocaleDateString('uk-UA')}
                        </p>

                        <div>
                          <div className="progress-stats">
                            <span>Зібрано: <strong className="amount">{item.collectedAmount} грн</strong></span>
                            <span>Ціль: {item.goalAmount} грн</span>
                          </div>
                          <div className="progress-bar-container">
                            <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                          </div>
                        </div>

                        {item.status === 'open' ? (
                          isGuest ? (
                            <p className="fundraiser-guest-msg">Увійдіть, щоб підтримати збір.</p>
                          ) : (
                            <LiqPayPaymentForm fundraiser={item} onDonation={fetchFundraisers} />
                          )
                        ) : (
                          <p className="fundraiser-closed">
                            ✓ Збір закрито — {new Date(item.updatedAt).toLocaleDateString('uk-UA')}
                          </p>
                        )}
                      </div>
                    );
                  })}
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