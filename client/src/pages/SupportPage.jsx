import React, { useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config/api.js';
import { Link } from 'react-router-dom';
import AnimatedPage from '../components/AnimatedPage';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';
import '../styles/Dashboard.css'; 
import '../styles/SupportPage.css'; 
import { motion, AnimatePresence } from 'framer-motion';

import { 
  FiMail, FiMessageSquare, FiPhone, FiStar, FiPlus, 
  FiMinus, FiSend, FiHelpCircle, FiArrowRight, FiGithub, FiTwitter
} from 'react-icons/fi';
import playSound from '../utils/sounds';

const FaqItem = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={`sp-faq-card ${isOpen ? 'active' : ''}`} onClick={() => setIsOpen(!isOpen)}>
      <div className="sp-faq-header">
        <h4>{title}</h4>
        <div className="sp-faq-toggle">
          {isOpen ? <FiMinus /> : <FiPlus />}
        </div>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="sp-faq-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="sp-faq-content">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TicketForm = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', question: '' });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  
  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    playSound('click');
    try {
      const res = await axios.post(`${API_BASE_URL}/api/support/ticket`, formData);
      setMessage({ type: 'success', text: res.data.msg }); 
      setFormData({ name: '', email: '', phone: '', question: '' });
      playSound('success');
    } catch (err) {
      const errorMsg = err.response?.data?.errors ? err.response.data.errors[0].msg : (err.response?.data?.msg || 'Щось пішло не так');
      setMessage({ type: 'error', text: 'Помилка: ' + errorMsg });
      playSound('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sp-form-card">
      <div className="sp-card-header">
        <FiMessageSquare className="sp-icon-bg" />
        <h3>Надіслати тікет</h3>
        <p>Наші адміністратори допоможуть вам протягом дня</p>
      </div>
      <form className="sp-form" onSubmit={onSubmit}>
        <div className="sp-form-row">
          <div className="form-group">
            <label>Ім'я</label>
            <input type="text" name="name" value={formData.name} onChange={onChange} placeholder="Ваше ім'я" required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" value={formData.email} onChange={onChange} placeholder="you@example.com" required />
          </div>
        </div>
        <div className="form-group">
          <label>Телефон (необов'язково)</label>
          <input type="tel" name="phone" value={formData.phone} onChange={onChange} placeholder="+380..." />
        </div>
        <div className="form-group">
          <label>Повідомлення</label>
          <textarea name="question" value={formData.question} onChange={onChange} placeholder="Опишіть ваше питання або проблему..." rows={4} required></textarea>
        </div>
        <button type="submit" className="sp-btn-primary" disabled={loading}>
          {loading ? 'Надсилаємо...' : <><FiSend /> Надіслати запит</>}
        </button>
        {message && (
          <motion.div 
            className={`sp-alert ${message.type}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {message.text}
          </motion.div>
        )}
      </form>
    </div>
  );
};

const FeedbackForm = () => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return alert('Будь ласка, оберіть рейтинг.');
    setLoading(true);
    playSound('click');
    try {
      const token = localStorage.getItem('userToken');
      const config = { headers: { 'x-auth-token': token } };
      const res = await axios.post(`${API_BASE_URL}/api/support/feedback`, { rating, comment }, config);
      setMessage({ type: 'success', text: res.data.msg }); 
      setRating(0); setComment('');
      playSound('badge');
    } catch (err) {
      setMessage({ type: 'error', text: 'Ви вже залишали відгук або сталася помилка.' });
      playSound('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sp-form-card sp-feedback-card">
      <div className="sp-card-header">
        <FiStar className="sp-icon-bg" />
        <h3>Ваш відгук</h3>
        <p>Допоможіть нам стати кращими</p>
      </div>
      <form className="sp-form" onSubmit={handleSubmit}>
        <div className="sp-rating-box">
          {[1, 2, 3, 4, 5].map(star => (
            <button 
              type="button"
              key={star} 
              className={`sp-star ${rating >= star ? 'active' : ''}`}
              onClick={() => { setRating(star); playSound('click', 0.1); }}
            >
              ★
            </button>
          ))}
        </div>
        <div className="form-group">
          <label>Що ми можемо покращити?</label>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Поділіться вашими враженнями..." rows={3}></textarea>
        </div>
        <button type="submit" className="sp-btn-secondary" disabled={loading}>
          {loading ? 'Надсилаємо...' : 'Залишити відгук'}
        </button>
        {message && (
          <motion.div 
            className={`sp-alert ${message.type}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {message.text}
          </motion.div>
        )}
      </form>
    </div>
  );
};


const SupportPage = () => {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <DashboardHeader />
        <AnimatedPage>
          <div className="dashboard-content-wrapper sp-wrapper">
            
            {/* ── Hero Section ── */}
            <header className="sp-hero">
              <div className="sp-hero-content">
                <p className="sp-hero-tag">Допомога поруч</p>
                <h1>Центр підтримки <span className="text-accent">ImpactPulse</span></h1>
                <p className="sp-hero-desc">
                  Виникли питання чи пропозиції? Ми завжди на зв’язку, щоб допомогти вам 
                  робити цей світ кращим.
                </p>
              </div>
              <div className="sp-hero-visual">
                <FiHelpCircle className="sp-floating-icon" />
              </div>
            </header>

            <div className="sp-grid">
              {/* ══ LEFT COLUMN: FAQ & CONTACT ══ */}
              <div className="sp-left">
                <section className="sp-section">
                  <h2 className="sp-section-title"><FiHelpCircle /> Часті запитання</h2>
                  <div className="sp-faq-list">
                    <FaqItem title="Як додати заявку на допомогу?">
                      <p>Перейдіть на сторінку "Додати допомогу", заповніть форму та обов'язково додайте фото- чи відео-підтвердження. Після цього адмін перевірить заявку.</p>
                      <Link to="/add-help" className="sp-inline-link">Перейти до додавання <FiArrowRight /></Link>
                    </FaqItem>
                    <FaqItem title="Що таке XP та рівні?">
                      <p>За кожну підтверджену дію ви отримуєте бали досвіду (XP). Більше балів — вищий рівень та доступ до ексклюзивних нагород у магазині.</p>
                    </FaqItem>
                    <FaqItem title="Мою заявку відхилено. Що робити?">
                      <p>Причину відхилення можна знайти у коментарях до заявки. Виправте помилку та надішліть нову заявку.</p>
                    </FaqItem>
                  </div>
                </section>

                <section className="sp-section sp-contact-section">
                  <h2 className="sp-section-title"><FiPhone /> Прямі контакти</h2>
                  <div className="sp-contact-grid">
                    <a href="mailto:denizershar@gmail.com" className="sp-contact-item" onClick={() => playSound('click', 0.1)}>
                      <FiMail />
                      <div>
                        <span>Email</span>
                        <p>denizershar@gmail.com</p>
                      </div>
                    </a>
                    <a href="https://github.com/den1zer" target="_blank" rel="noreferrer" className="sp-contact-item" onClick={() => playSound('click', 0.1)}>
                      <FiGithub />
                      <div>
                        <span>GitHub</span>
                        <p>den1zer</p>
                      </div>
                    </a>
                    <a href="tel:+380972049270" className="sp-contact-item" onClick={() => playSound('click', 0.1)}>
                      <FiPhone />
                      <div>
                        <span>Телефон</span>
                        <p>+380 97 204 92 70</p>
                      </div>
                    </a>
                  </div>
                </section>
              </div>

              {/* ══ RIGHT COLUMN: FORMS ══ */}
              <div className="sp-right">
                <TicketForm />
                <FeedbackForm />
              </div>
            </div>

          </div>
        </AnimatedPage>
      </main>
    </div>
  );
};

export default SupportPage;