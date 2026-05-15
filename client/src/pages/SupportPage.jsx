import React, { useState, useEffect, useRef } from 'react';
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
import { io } from 'socket.io-client';

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

const SupportChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('userToken');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/support/chat`, {
          headers: { 'x-auth-token': token }
        });
        setMessages(res.data);
      } catch (err) {
        console.error('Chat history error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchHistory();

      // Initialize Socket
      socketRef.current = io(API_BASE_URL, {
        transports: ['websocket', 'polling'],
        withCredentials: true
      });

      socketRef.current.emit('join_support', userId);

      socketRef.current.on('support_message', (msg) => {
        setMessages(prev => [...prev, msg]);
        if (msg.isAdmin) playSound('success', 0.2);
      });
    }

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [token, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const text = input;
    setInput('');
    playSound('click', 0.1);

    try {
      await axios.post(`${API_BASE_URL}/api/support/chat`, 
        { text },
        { headers: { 'x-auth-token': token } }
      );
      // Message will come back via Socket
    } catch (err) {
      console.error('Send message error:', err);
    }
  };

  if (!token) {
    return (
      <div className="sp-form-card sp-chat-locked">
        <FiMessageSquare className="sp-icon-bg" />
        <h3>Чат з підтримкою</h3>
        <p>Будь ласка, увійдіть, щоб спілкуватися з нами в реальному часі.</p>
        <Link to="/login" className="sp-btn-primary" style={{marginTop: '15px'}}>Увійти</Link>
      </div>
    );
  }

  return (
    <div className="sp-form-card sp-chat-card">
      <div className="sp-card-header">
        <FiMessageSquare className="sp-icon-bg" />
        <div className="sp-chat-status">
          <span className="sp-status-dot online"></span>
          <div>
            <h3>Чат з адміном</h3>
            <p>Онлайн • Відповідаємо швидко</p>
          </div>
        </div>
      </div>

      <div className="sp-chat-messages">
        {loading ? (
          <div className="sp-chat-loading">Завантаження повідомлень...</div>
        ) : messages.length === 0 ? (
          <div className="sp-chat-empty">Привіт! Чим ми можемо вам допомогти?</div>
        ) : (
          messages.map((m, idx) => (
            <div key={idx} className={`sp-msg ${m.isAdmin ? 'admin' : 'user'}`}>
              <div className="sp-msg-bubble">
                {m.text}
                <span className="sp-msg-time">
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="sp-chat-input" onSubmit={handleSend}>
        <input 
          type="text" 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Напишіть повідомлення..."
        />
        <button type="submit" disabled={!input.trim()}>
          <FiSend />
        </button>
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
                <SupportChat />
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