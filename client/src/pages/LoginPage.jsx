import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../api/authService';
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

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate();
  const { email, password } = formData;
  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleGuestLogin = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userId');
    localStorage.setItem('userRole', 'guest');
    navigate('/');
  };

  const onLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const { role } = await authService.login({ email, password });
      alert('Вхід успішний!');
      if (role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (error) {
      alert('Помилка входу: ' + (error.response?.data?.msg || 'Невідома помилка'));
    }
  };

  return (
    <motion.div
      className="auth-page" 
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      <div className="auth-main-container">
        <div className="auth-left-panel">
          <h2 className="auth-title">Sign in to Website</h2>
          <div className="social-icons">
            <img className='social-icon' src="/assets/images/icon-facebook.png" alt="facebook_logo" />
            <img className='social-icon' src="/assets/images/icon-instagram.png" alt="instagram_logo" /> 
            <img className='social-icon' src="/assets/images/icon-telegram.png" alt="telegram_logo" /> 
          </div>
          <p className="divider">or use your email account</p>

          <form onSubmit={onLoginSubmit} className="auth-form">
            <div className="form-group">
              <input type="email" name="email" value={email} onChange={onChange} placeholder="Email" required />
            </div>
            <div className="form-group">
              <input type="password" name="password" value={password} onChange={onChange} placeholder="Password" required />
            </div>
            <Link to="/forgot-password" className="forgot-password-link">Forgot your password?</Link>
            <button type="submit" className="auth-button">УВІЙТИ</button>
            <button type="button" className="auth-button guest-button" onClick={handleGuestLogin} style={{ marginTop: '10px', backgroundColor: 'transparent', border: '1px solid var(--accent-blue)', color: 'var(--text-color)' }}>ПРОДОВЖИТИ ЯК ГІСТЬ</button>
          </form>
        </div>

        <div className="auth-right-panel">
          <div className="circle-decoration top-right"></div>
          <div className="circle-decoration bottom-left"></div>
          <h2 className="auth-title">Welcome back!</h2>
          <p>To keep connected with us please login with your personal info</p>
          <Link to="/register" className="auth-button">SIGN UP</Link>
        </div>
      </div>
    </motion.div>
  );
};

export default LoginPage;