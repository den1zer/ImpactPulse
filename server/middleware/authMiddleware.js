import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

import User from '../models/User.js';

export const isAuthenticated = async (req, res, next) => {
  // Accept token from either x-auth-token header or Authorization: Bearer <token>
  let token = req.header('x-auth-token');

  if (!token) {
    const authHeader = req.header('Authorization') || req.header('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
  }

  if (!token) {
    return res.status(401).json({ msg: 'Немає токену, авторизацію відхилено' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;

    // Check if user is verified
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ msg: 'Користувача не знайдено' });
    }
    if (!user.isVerified) {
      return res.status(403).json({ msg: 'Будь ласка, підтвердіть email перед використанням цієї функції' });
    }

    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    res.status(401).json({ msg: 'Токен недійсний або прострочений' });
  }
};

export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Доступ заборонено. Потрібні права адміна.' });
  }
};