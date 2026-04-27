import React, { useState } from 'react';
import './Footer.css';
import axios from 'axios';
import { FiHeart, FiCoffee } from 'react-icons/fi';

const Footer = () => {
  const [amount, setAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const predefinedAmounts = [50, 100, 200, 500];

  const handleSupportProject = async () => {
    const finalAmount = customAmount ? Number(customAmount) : amount;
    if (!finalAmount || finalAmount < 1) {
      alert('Будь ласка, введіть коректну суму.');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/payment/support-project', {
        amount: finalAmount,
        description: 'Підтримка розробників проекту ImpactPulse',
      });
      const { data, signature } = response.data;
      
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://www.liqpay.ua/api/3/checkout';
      form.target = '_blank';
      
      const dataInput = document.createElement('input');
      dataInput.type = 'hidden';
      dataInput.name = 'data';
      dataInput.value = data;
      
      const signatureInput = document.createElement('input');
      signatureInput.type = 'hidden';
      signatureInput.name = 'signature';
      signatureInput.value = signature;
      
      form.appendChild(dataInput);
      form.appendChild(signatureInput);
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    } catch (error) {
      console.error('Error initiating support payment:', error);
      alert('Помилка ініціалізації платежу. Спробуйте пізніше.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <footer className="modern-footer">
      <div className="footer-container">
        <div className="footer-left">
          <div className="footer-brand">
            <span className="brand-icon">⚡</span>
            <h3>ImpactPulse</h3>
          </div>
          <p className="footer-description">
            Створюємо майбутнє разом. Ваш внесок допомагає нам розвивати та покращувати платформу.
          </p>
          <p className="footer-copyright">&copy; {new Date().getFullYear()} ImpactPulse. Всі права захищені.</p>
        </div>
        
        <div className="footer-right">
          <div className="support-card">
            <h4><FiHeart className="heart-icon" /> Підтримати проект</h4>
            <p>Оберіть суму або введіть свою (UAH):</p>
            <div className="amount-selectors">
              {predefinedAmounts.map((val) => (
                <button 
                  key={val} 
                  className={`amount-btn ${amount === val && !customAmount ? 'active' : ''}`}
                  onClick={() => { setAmount(val); setCustomAmount(''); }}
                >
                  {val} ₴
                </button>
              ))}
              <input 
                type="number" 
                className="custom-amount-input" 
                placeholder="Інша" 
                value={customAmount}
                onChange={(e) => { setCustomAmount(e.target.value); setAmount(0); }}
                min="1"
              />
            </div>
            <button 
              onClick={handleSupportProject} 
              className="btn-support-modern"
              disabled={isLoading}
            >
              {isLoading ? 'Зачекайте...' : <><FiCoffee /> Пригостити кавою</>}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
