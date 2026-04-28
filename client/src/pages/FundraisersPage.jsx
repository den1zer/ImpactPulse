import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AnimatedPage from '../components/AnimatedPage';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';
import '../styles/Dashboard.css'; 
import '../styles/AddHelpPage.css'; 
import '../styles/FundraisersPage.css'; 
import API_BASE_URL from '../config/api.js';


const LiqPayPaymentForm = ({ fundraiser, onDonation }) => {
  const [amount, setAmount] = useState('');
  const [card, setCard] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      alert('Вкажіть суму');
      return;
    }
    
    try {
      const token = JSON.parse(localStorage.getItem('userToken'));
      const config = { headers: { 'x-auth-token': token } };
      
      const res = await axios.post(
        `${API_BASE_URL}/api/payment/create`, 
        { amount, collectionId: fundraiser._id, description: fundraiser.title }, 
        config
      );
      
      const { data, signature } = res.data;

      // Створюємо приховану форму для редіректу на сторінку оплати LiqPay
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://www.liqpay.ua/api/3/checkout';
      form.acceptCharset = 'utf-8';
      
      const dataInput = document.createElement('input');
      dataInput.type = 'hidden';
      dataInput.name = 'data';
      dataInput.value = data;
      form.appendChild(dataInput);
      
      const signatureInput = document.createElement('input');
      signatureInput.type = 'hidden';
      signatureInput.name = 'signature';
      signatureInput.value = signature;
      form.appendChild(signatureInput);
      
      document.body.appendChild(form);
      form.submit();
      
      setAmount('');
      setCard('');
    } catch (err) {
      alert('Помилка ініціалізації платежу: ' + (err.response?.data?.msg || err.message));
    }
  };

  return (
    <form className="fundraiser-form" onSubmit={handleSubmit}>
      <hr style={{ margin: '20px 0', border: '1px solid #ccc' }}/>
      <div className="form-group">
        <label>Реквізити (Карта):</label>
        <input type="text" className="neumorph-input" value={fundraiser.cardNumber} disabled />
      </div>
      <div className="form-group">
        <label>Сума (UAH):</label>
        <input 
          type="number" 
          className="neumorph-input" 
          value={amount} 
          onChange={(e) => setAmount(e.target.value)}
          placeholder="500" 
        />
      </div>
      <button type="submit" className="neumorph-button">
        Підтримати 
      </button>
    </form>
  );
};

const FundraisersPage = () => {
  const [fundraisers, setFundraisers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFundraisers = async () => {
    setLoading(true); 
    try {
      const token = localStorage.getItem('userToken') ? JSON.parse(localStorage.getItem('userToken')) : '';
      const config = { headers: { 'x-auth-token': token } };
      const res = await axios.get(`${API_BASE_URL}/api/fundraisers`, config);
      setFundraisers(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFundraisers();
  }, []);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <DashboardHeader />
        <AnimatedPage>
          <div className="fundraisers-container">
            <h2>Актуальні Збори</h2>
            
            {loading && <p>Завантаження...</p>}
            
            <div className="fundraisers-grid">
              {!loading && fundraisers.map(item => (
                <div key={item._id} className="fundraiser-card">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <p style={{fontSize: '0.85em', color: '#999', marginBottom: '15px'}}>
                    📅 Збір стартував: {new Date(item.createdAt).toLocaleDateString('uk-UA')}
                  </p>
                  
                  <div className="progress-stats">
                    <span>Зібрано: <strong className="amount">{item.collectedAmount} грн</strong></span>
                    <span>Ціль: {item.goalAmount} грн</span>
                  </div>
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar-fill" 
                      style={{ width: `${(item.collectedAmount / item.goalAmount) * 100}%` }}
                    ></div>
                  </div>
                  
                  {item.status === 'open' ? (
                    localStorage.getItem('userRole') !== 'guest' ? (
                      <LiqPayPaymentForm fundraiser={item} onDonation={fetchFundraisers} />
                    ) : (
                      <p style={{marginTop: '20px', fontWeight: 600, color: '#ffc107', textAlign: 'center'}}>
                        Увійдіть, щоб підтримати збір.
                      </p>
                    )
                  ) : (
                    <p style={{marginTop: '20px', fontWeight: 600, color: '#28a745', textAlign: 'center'}}>
                      ✅ ЗБІР ЗАКРИТО! ({new Date(item.updatedAt).toLocaleDateString('uk-UA')})
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </AnimatedPage>
      </main>
    </div>
  );
};

export default FundraisersPage;