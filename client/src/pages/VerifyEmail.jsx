import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config/api';
import { motion } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 }
};
const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5
};

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); 
  const effectRan = useRef(false);

  useEffect(() => {
    if (effectRan.current) return;
    
    const verify = async () => {
      try {
        await axios.get(`${API_BASE_URL}/api/auth/verify-email/${token}`);
        setStatus('success');
      } catch (error) {
        setStatus('error');
      }
    };
    
    verify();
    effectRan.current = true;
  }, [token]);

  return (
    <motion.div
      className="auth-page" 
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      <div className="auth-main-container" style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', margin: 'auto' }}>
        <h2 className="auth-title" style={{ marginBottom: '20px', textAlign: 'center' }}>Підтвердження Email</h2>
        
        {status === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid var(--accent-blue, #4F46E5)', borderRadius: '50%', width: '50px', height: '50px', animation: 'spin 1s linear infinite', marginBottom: '20px' }}></div>
            <p style={{ color: 'var(--text-color, #fff)', fontSize: '1.2rem' }}>Перевірка вашого email, зачекайте...</p>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {status === 'success' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '60px', marginBottom: '15px' }}>✅</div>
            <p style={{ color: '#28a745', fontSize: '1.2rem', marginBottom: '30px' }}>Ваш email успішно підтверджено!</p>
            <Link to="/login" className="auth-button" style={{ display: 'inline-block', width: 'auto', padding: '12px 40px', textDecoration: 'none' }}>
              Перейти до входу
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '60px', marginBottom: '15px' }}>❌</div>
            <p style={{ color: '#dc3545', fontSize: '1.2rem', marginBottom: '30px' }}>Недійсний або прострочений токен.</p>
            <Link to="/login" className="auth-button guest-button" style={{ display: 'inline-block', width: 'auto', padding: '12px 40px', backgroundColor: 'transparent', border: '1px solid var(--accent-blue, #4F46E5)', color: 'var(--text-color, #fff)', textDecoration: 'none' }}>
              Повернутись до логіну
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default VerifyEmail;
