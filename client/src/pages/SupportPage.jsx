import React, { useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config/api.js';
import AnimatedPage from '../components/AnimatedPage';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';
import '../styles/Dashboard.css'; 
import '../styles/SupportPage.css'; 
import '../styles/AddHelpPage.css'; 

const FaqItem = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={`faq-item ${isOpen ? 'active' : ''}`}>
      <div className="faq-question" onClick={() => setIsOpen(!isOpen)}>
        <span>{title}</span>
        <span className="faq-icon">{isOpen ? '✕' : '+'}</span>
      </div>
      <div className="faq-answer">
        <div style={{ paddingTop: '15px' }}>{children}</div>
      </div>
    </div>
  );
};

const TicketForm = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', question: '' });
  const [message, setMessage] = useState('');
  
  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  
  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/api/support/ticket`, formData);
      setMessage(res.data.msg); 
      setFormData({ name: '', email: '', phone: '', question: '' }); 
    } catch (err) {
      const errorMsg = err.response?.data?.errors ? err.response.data.errors[0].msg : (err.response?.data?.msg || 'Щось пішло не так');
      setMessage('Помилка: ' + errorMsg);
    }
  };

  return (
    <form className="add-help-form" onSubmit={onSubmit}>
      <div className="form-group">
        <label>Ваше Ім'я</label>
        <input type="text" name="name" value={formData.name} onChange={onChange} className="neumorph-input" required />
      </div>
      <div className="form-group">
        <label>Ваш Email</label>
        <input type="email" name="email" value={formData.email} onChange={onChange} className="neumorph-input" required />
      </div>
      <div className="form-group">
        <label>Ваш Телефон </label>
        <input type="tel" name="phone" value={formData.phone} onChange={onChange} className="neumorph-input" />
      </div>
      <div className="form-group">
        <label>Ваше Питання</label>
        <textarea name="question" value={formData.question} onChange={onChange} className="neumorph-textarea" required></textarea>
      </div>
      <button type="submit" className="neumorph-button">Відправити Тікет</button>
      {message && <p style={{ textAlign: 'center', marginTop: '15px' }}>{message}</p>}
    </form>
  );
};

const FeedbackForm = () => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return alert('Будь ласка, оберіть рейтинг.');
    
    try {
      const token = JSON.parse(localStorage.getItem('userToken'));
      const config = { headers: { 'x-auth-token': token } };
      const res = await axios.post(`${API_BASE_URL}/api/support/feedback`, { rating, comment }, config);
      setMessage(res.data.msg); 
      setRating(0); setComment('');
    } catch (err) {
      setMessage('Ви вже залишали відгук або сталася помилка.');
    }
  };

  return (
    <form className="add-help-form" onSubmit={handleSubmit}>
      <label>Оцініть наш додаток:</label>
      <div className="rating-stars">
        {[1, 2, 3, 4, 5].map(star => (
          <span 
            key={star} 
            className={`star ${rating >= star ? 'active' : ''}`}
            onClick={() => setRating(star)}
          >
            ★
          </span>
        ))}
      </div>
      <div className="form-group">
        <label>Коментар (опціонально)</label>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="neumorph-textarea"></textarea>
      </div>
      <button type="submit" className="neumorph-button">Залишити Відгук</button>
      {message && <p style={{ textAlign: 'center', marginTop: '15px' }}>{message}</p>}
    </form>
  );
};


const SupportPage = () => {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <DashboardHeader />
        <AnimatedPage>
          <div className="support-container">
            <h2>Центр Підтримки</h2>            
            <h3>Зв'язок з адміном (Система Тікетів)</h3>
            <TicketForm />
            <h3>Залишити відгук про проєкт</h3>
            <FeedbackForm /> 
            <h3>Часті Питання (FAQ)</h3>
            <FaqItem title="Як додати заявку на допомогу?">
              <p>1. Перейдіть на сторінку "Додати допомогу".</p>
              <p>2. Заповніть усі поля та прикріпіть файл-підтвердження.</p>
              <p>3. Натисніть "Відправити на верифікацію".</p>
            </FaqItem>
            <FaqItem title="Мою заявку відхилено (Rejected). Що робити?">
              <p>Перейдіть на сторінку "Мої Заявки". Під відхиленою заявкою адмін залишить коментар (напр., "Потрібен чіткіший скріншот"). Створіть нову, правильну заявку.</p>
            </FaqItem>

          </div>
        </AnimatedPage>
      </main>
    </div>
  );
};

export default SupportPage;