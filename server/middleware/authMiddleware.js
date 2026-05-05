const jwt = require('jsonwebtoken');
require('dotenv').config(); 

const User = require('../models/User');

const isAuthenticated = async (req, res, next) => {
  const token = req.header('x-auth-token');

  if (!token) {
    return res.status(401).json({ msg: 'Немає токену, авторизацію відхилено' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user; 
    
    // Check if user is verified
    const user = await User.findById(req.user.id);
    if (user && !user.isVerified) {
      return res.status(403).json({ msg: 'Please verify your email' });
    }

    next(); 
  } catch (err) {
    res.status(401).json({ msg: 'Токен недійсний' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Доступ заборонено. Потрібні права адміна.' });
  }
};

module.exports = { isAuthenticated, isAdmin };