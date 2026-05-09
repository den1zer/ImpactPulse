import express from 'express';
const router = express.Router();
import { body } from 'express-validator';
import { validate } from '../middleware/validation.js';
import { registerUser, loginUser, verifyEmail, forgotPassword, resetPassword } from '../controllers/authController.js';

router.post(
  '/register',
  [
    body('username', 'Username є обов\'язковим').not().isEmpty(),
    body('email', 'Введіть коректний email').isEmail(),
    body('password', 'Пароль має бути мін. 8 символів, містити велику та малу літери, цифру та спецсимвол')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d\s]).{8,}$/),
  ],
  validate,
  registerUser
);

router.post(
  '/login',
  [
    body('email', 'Введіть email').isEmail(),
    body('password', 'Пароль є обов\'язковим').exists(),
  ],
  validate,
  loginUser
);

router.get('/verify-email/:token', verifyEmail);

router.post(
  '/forgot-password',
  [
    body('email', 'Введіть коректний email').isEmail(),
  ],
  validate,
  forgotPassword
);

router.post(
  '/reset-password/:token',
  [
    body('password', 'Пароль має бути мін. 8 символів, містити велику та малу літери, цифру та спецсимвол')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/),
  ],
  validate,
  resetPassword
);

export default router;