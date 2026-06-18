import React, { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { Link } from 'react-router-dom';
import AnimatedPage from '../components/AnimatedPage';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';
import '../styles/Dashboard.css';
import '../styles/FundraisersPage.css';
import API_BASE_URL from '../config/api.js';

const getToken = () => localStorage.getItem('userToken') || localStorage.getItem('token') || '';
const authHeaders = () => ({
  'x-auth-token': getToken(),
  'Authorization': `Bearer ${getToken()}`,
});

/**
 * DonationForm Component
 * Renders the form allowing users to submit financial donations to a specific fundraiser via LiqPay.
 *
 * @param {Object} props - Component properties.
 * @param {Object} props.fundraiser - The fundraiser object being donated to.
 * @param {Function} props.onDonation - Callback triggered to refresh data after donation processing.
 * @returns {JSX.Element} The rendered donation form.
 */
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

    // Бізнес-логіка: Відкриття вікна синхронно з подією кліку для обходу блокування спливаючих вікон (Safari/iOS PWA).
    const paymentWindow = window.open('', '_blank');
    
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/payment/create`,
        { amount: num, collectionId: fundraiser._id, description: fundraiser.title },
        { headers: authHeaders() },
      );
      const { data, signature, orderId } = res.data;
      
      if (paymentWindow) {
        const formHtml = `
          <html>
            <head><title>Перенаправлення на LiqPay...</title></head>
            <body>
              <p>Зачекайте, перенаправляємо на сторінку оплати...</p>
              <form id="liqpayForm" method="POST" action="https://www.liqpay.ua/api/3/checkout" accept-charset="utf-8">
                <input type="hidden" name="data" value="${data}" />
                <input type="hidden" name="signature" value="${signature}" />
              </form>
              <script>
                document.getElementById('liqpayForm').submit();
              </script>
            </body>
          </html>
        `;
        paymentWindow.document.write(formHtml);
        paymentWindow.document.close();
      } else {
        const form = document.createElement('form');
        form.method = 'POST'; form.action = 'https://www.liqpay.ua/api/3/checkout';
        form.acceptCharset = 'utf-8'; form.target = '_blank';
        [['data', data], ['signature', signature]].forEach(([name, value]) => {
          const inp = document.createElement('input');
          inp.type = 'hidden'; inp.name = name; inp.value = value;
          form.appendChild(inp);
        });
        document.body.appendChild(form); form.submit(); document.body.removeChild(form);
      }

      setAmount('');
      let tries = 0;
      const id = setInterval(async () => {
        tries++;
        if (tries > 20) { clearInterval(id); return; }
        
        try {
          const statusRes = await axios.get(`${API_BASE_URL}/api/payment/status/${orderId}`, { headers: authHeaders() });
          if (statusRes.data.success) {
            clearInterval(id);
          }
        } catch (e) {
          // Ignore polling errors
        }
        
        await onDonation();
      }, 5000);
    } catch (err) {
      if (paymentWindow) paymentWindow.close();
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
        {loading ? 'Обробка...' : 'Підтримати'}
      </button>
    </form>
  );
};

/**
 * ProgressBar Component
 * Visualizes the progression towards a fundraising goal.
 *
 * @param {Object} props - Component properties.
 * @param {number} props.collected - The current collected amount.
 * @param {number} props.goal - The target goal amount.
 * @returns {JSX.Element} The rendered progress bar.
 */
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

/**
 * Lightbox Component
 * A fullscreen overlay for viewing report photos with keyboard navigation.
 *
 * @param {Object} props - Component properties.
 * @param {Array<string>} props.images - List of image URLs.
 * @param {number} props.currentIndex - The currently displayed image index.
 * @param {Function} props.onClose - Callback to close the lightbox.
 * @param {Function} props.onPrev - Callback to view the previous image.
 * @param {Function} props.onNext - Callback to view the next image.
 * @returns {JSX.Element} The rendered lightbox.
 */
const Lightbox = ({ images, currentIndex, onClose, onPrev, onNext }) => {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, onPrev, onNext]);

  const imgSrc = images[currentIndex];
  const resolvedSrc = imgSrc?.startsWith('http') ? imgSrc : `${API_BASE_URL}/${imgSrc}`;

  return (
    <div className="fr-lightbox-overlay" onClick={onClose}>
      <div className="fr-lightbox-content" onClick={e => e.stopPropagation()}>
        <button className="fr-lightbox-close" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
        {images.length > 1 && (
          <button className="fr-lightbox-nav fr-lightbox-prev" onClick={onPrev}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
        )}
        <img src={resolvedSrc} alt={`Фото звіту ${currentIndex + 1}`} className="fr-lightbox-img" />
        {images.length > 1 && (
          <button className="fr-lightbox-nav fr-lightbox-next" onClick={onNext}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        )}
        {images.length > 1 && (
          <div className="fr-lightbox-counter">{currentIndex + 1} / {images.length}</div>
        )}
      </div>
    </div>
  );
};

/**
 * ReportSection Component
 * Displays the organizer's report once a fundraiser has been completed and reported on.
 *
 * @param {Object} props - Component properties.
 * @param {Object} props.report - The report data object.
 * @returns {JSX.Element} The rendered report section.
 */
const ReportSection = ({ report }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const images = report?.images || [];

  const openLightbox = (idx) => {
    setLightboxIndex(idx);
    setLightboxOpen(true);
  };

  return (
    <div className="fr-report">
      <div className="fr-report-header">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <span>Звіт про використання коштів</span>
      </div>
      <p className="fr-report-desc">{report.description}</p>
      {images.length > 0 && (
        <div className="fr-report-gallery">
          {images.map((img, i) => {
            const src = img.startsWith('http') ? img : `${API_BASE_URL}/${img}`;
            return (
              <button
                key={i}
                className="fr-report-thumb"
                onClick={() => openLightbox(i)}
                aria-label={`Відкрити фото ${i + 1}`}
              >
                <img src={src} alt={`Звіт фото ${i + 1}`} />
                <div className="fr-report-thumb-overlay">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    <line x1="11" y1="8" x2="11" y2="14"/>
                    <line x1="8" y1="11" x2="14" y2="11"/>
                  </svg>
                </div>
              </button>
            );
          })}
        </div>
      )}
      <div className="fr-report-date">
        Звіт від: {new Date(report.reportedAt).toLocaleDateString('uk-UA')}
      </div>

      {lightboxOpen && (
        <Lightbox
          images={images}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onPrev={() => setLightboxIndex((lightboxIndex - 1 + images.length) % images.length)}
          onNext={() => setLightboxIndex((lightboxIndex + 1) % images.length)}
        />
      )}
    </div>
  );
};

const statusLabel = (status) => {
  if (status === 'open') return 'Активний';
  if (status === 'reported') return 'Звітовано';
  return 'Закрито';
};

const statusClass = (status) => {
  if (status === 'open') return 'open';
  if (status === 'reported') return 'reported';
  return 'closed';
};

/**
 * FundraisersPage Component
 * Displays a list of active and completed fundraising campaigns.
 * Allows users to donate directly or view usage reports for closed campaigns.
 *
 * @returns {JSX.Element} The rendered fundraisers directory page.
 */
const FundraisersPage = () => {
  const [fundraisers, setFundraisers] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeTab,   setActiveTab]   = useState('active'); 
  const isGuest = localStorage.getItem('userRole') === 'guest';

  const fetchFundraisers = useCallback(async () => {
    try {
      const filter = activeTab === 'completed' ? 'completed' : undefined;
      const params = filter ? { filter } : {};
      const res = await axios.get(`${API_BASE_URL}/api/fundraisers`, {
        headers: { 'x-auth-token': getToken() },
        params,
      });
      setFundraisers(res.data);
      setLastUpdated(new Date());
      return res.data;
    } catch (err) {
      console.error('Помилка завантаження зборів:', err);
    }
  }, [activeTab]);

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

  useEffect(() => {
    const socket = io(API_BASE_URL, { withCredentials: true });
    socket.on('fundraiser_updated', () => {
      fetchFundraisers();
    });
    return () => {
      socket.disconnect();
    };
  }, [fetchFundraisers]);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <DashboardHeader />
        <AnimatedPage>
          <div className="dashboard-content-wrapper">

            <div className="fr-hero">
              <div className="fr-hero-text">
                <p className="small-title">ImpactPulse / Збори</p>
                <h1>{activeTab === 'active' ? 'Актуальні збори' : 'Завершені збори'}</h1>
                <p className="fr-hero-desc">
                  {activeTab === 'active'
                    ? 'Підтримайте ініціативи напряму. Кожен донат підтверджується та зараховується до вашого профілю.'
                    : 'Результати завершених зборів. Дізнайтесь, куди пішли ваші кошти.'}
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

            <div className="fr-tabs">
              <button
                className={`fr-tab ${activeTab === 'active' ? 'fr-tab-active' : ''}`}
                onClick={() => setActiveTab('active')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                Активні
              </button>
              <button
                className={`fr-tab ${activeTab === 'completed' ? 'fr-tab-active' : ''}`}
                onClick={() => setActiveTab('completed')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                Завершені
              </button>
            </div>

            {loading ? (
              <div className="fr-state">
                <div className="guilds-spinner" />
                <span>ЗАВАНТАЖЕННЯ...</span>
              </div>
            ) : fundraisers.length === 0 ? (
              <div className="fr-state">
                {activeTab === 'active' ? 'Активних зборів немає.' : 'Завершених зборів поки немає.'}
              </div>
            ) : (
              <div className="fr-grid">
                {fundraisers.map(item => (
                  <div key={item._id} className={`fr-card ${item.status === 'reported' ? 'fr-card-reported' : ''}`}>
                    {item.coverImage && (
                      <div className="fr-card-cover">
                        <img src={item.coverImage.startsWith('http') ? item.coverImage : `${API_BASE_URL}/${item.coverImage}`} alt={item.title} />
                      </div>
                    )}
                    <div className="fr-card-head">
                      <Link to={`/fundraisers/${item._id}`} className="fr-card-title-link">
                        <h3 className="fr-card-title">{item.title}</h3>
                      </Link>
                      <span className={`fr-card-status ${statusClass(item.status)}`}>
                        {statusLabel(item.status)}
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
                      ) : item.status === 'reported' && item.report ? (
                        <ReportSection report={item.report} />
                      ) : (
                        <div className="fr-awaiting-report">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                          <div>
                            <p className="fr-awaiting-title">Очікується звіт</p>
                            <p className="fr-awaiting-desc">Організатор готує звіт про використання коштів</p>
                          </div>
                        </div>
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