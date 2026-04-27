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

const RegisterPage = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const navigate = useNavigate();
  const { username, email, password } = formData;
  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleGuestLogin = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userId');
    localStorage.setItem('userRole', 'guest');
    navigate('/');
  };

  const onRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      await authService.register({ username, email, password });
      alert('Реєстрація успішна! Тепер увійдіть.');
      navigate('/login'); 
    } catch (error) {
      alert('Помилка реєстрації: ' + (error.response?.data?.msg || 'Невідома помилка'));
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
        <div className="auth-right-panel">
          <div className="circle-decoration top-right"></div>
          <div className="circle-decoration bottom-left"></div>
          <h2 className="auth-title">Hello Friend!</h2>
          <p>Enter your personal details and start journey with us</p>
          <Link to="/login" className="auth-button">SIGN IN</Link>
        </div>

        <div className="auth-left-panel">
          <h2 className="auth-title">Create Account</h2>
          <div className="social-icons">
            <img className='social-icon' src="/assets/images/icon-facebook.png" alt="facebook_logo" />
            <img className='social-icon' src="/assets/images/icon-instagram.png" alt="instagram_logo" /> 
            <img className='social-icon' src="/assets/images/icon-telegram.png" alt="telegram_logo" /> 
          </div>
          <p className="divider">or use your email for registration</p>

          <form onSubmit={onRegisterSubmit} className="auth-form">
            <div className="form-group">
              <input type="text" name="username" value={username} onChange={onChange} placeholder="Username" required />
            </div>
            <div className="form-group">
              <input type="email" name="email" value={email} onChange={onChange} placeholder="Email" required />
            </div>
            <div className="form-group">
              <input type="password" name="password" value={password} onChange={onChange} placeholder="Password" required minLength="6" />
            </div>
            <button type="submit" className="auth-button">ЗАРЕЄСТРУВАТИСЬ</button>
            <button type="button" className="auth-button guest-button" onClick={handleGuestLogin} style={{ marginTop: '10px', backgroundColor: 'transparent', border: '1px solid var(--accent-blue)', color: 'var(--text-color)' }}>ПРОДОВЖИТИ ЯК ГІСТЬ</button>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default RegisterPage;