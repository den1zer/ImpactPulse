import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';
import dotenv from 'dotenv';
dotenv.config();

export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    
    if (user && user.isVerified) {
      return res.status(400).json({ msg: 'Користувач з таким email вже існує та підтверджений' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const verificationToken = crypto.randomBytes(20).toString('hex');

    if (user && !user.isVerified) {
      // Update existing unverified user
      user.username = username;
      user.password = hashedPassword;
      user.verificationToken = verificationToken;
    } else {
      // Create new user
      user = new User({ 
        username, 
        email, 
        password: hashedPassword,
        verificationToken 
      });
    }

    await user.save();

    const clientUrl = req.headers.origin || process.env.FRONTEND_URL || 'http://localhost:3000';
    const verifyUrl = `${clientUrl}/verify-email/${verificationToken}`;
    const message = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1f2937; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
        <h1 style="color: #4F46E5; font-size: 24px; font-weight: bold; margin-bottom: 24px;">Підтвердження Email</h1>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Дякуємо за реєстрацію на <strong>ImpactPulse</strong>!</p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Будь ласка, натисніть на кнопку нижче, щоб підтвердити свою поштову адресу та активувати акаунт:</p>
        <a href="${verifyUrl}" style="display: inline-block; padding: 14px 28px; background-color: #4F46E5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; transition: background-color 0.2s;">Підтвердити Email</a>
        <p style="margin-top: 32px; font-size: 14px; color: #6b7280; border-top: 1px solid #f3f4f6; pt: 20px;">
          Якщо кнопка не працює, скопіюйте це посилання у браузер: <br> 
          <span style="color: #4F46E5; word-break: break-all;">${verifyUrl}</span>
        </p>
      </div>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Підтвердження реєстрації - ImpactPulse',
        html: message,
      });
      
      res.status(201).json({ 
        msg: 'Реєстрація успішна! На вашу пошту відправлено лист із посиланням для підтвердження. Перевірте папку Спам, якщо лист не надійшов.' 
      });
    } catch (err) {
      console.error('Email send error:', err);
      res.status(201).json({ 
        msg: 'Акаунт створено, але не вдалося відправити лист підтвердження через технічні проблеми. Будь ласка, зверніться в підтримку.' 
      });
    }
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).send('Помилка на сервері під час реєстрації');
  }
};


export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ msg: 'Невірні дані для входу' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Невірні дані для входу' });
    }

    if (!user.isVerified) {
      return res.status(401).json({ msg: 'Please verify your email before logging in.' });
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, role: user.role, userId: user.id });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Помилка на сервері');
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const user = await User.findOne({ verificationToken: req.params.token });
    if (!user) {
      return res.status(400).json({ msg: 'Невірний токен підтвердження' });
    }
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();
    res.status(200).json({ msg: 'Email успішно підтверджено' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Помилка сервера' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ msg: 'Користувача з таким email не знайдено' });
    }
    
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hr
    await user.save();
    
    const clientUrl = req.headers.origin || process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;
    const message = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1f2937; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
        <h1 style="color: #4F46E5; font-size: 24px; font-weight: bold; margin-bottom: 24px;">Скидання пароля</h1>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Ви отримали цей лист, оскільки зробили запит на скидання пароля для вашого акаунта на <strong>ImpactPulse</strong>.</p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Натисніть на кнопку нижче, щоб встановити новий пароль. Посилання дійсне протягом 1 години:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 14px 28px; background-color: #4F46E5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; transition: background-color 0.2s;">Скинути пароль</a>
        <p style="margin-top: 32px; font-size: 14px; color: #6b7280; border-top: 1px solid #f3f4f6; padding-top: 20px;">
          Якщо ви не робили цього запиту, просто ігноруйте цей лист. <br><br>
          Або скопіюйте це посилання: <br> 
          <span style="color: #4F46E5; word-break: break-all;">${resetUrl}</span>
        </p>
      </div>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Скидання пароля - ImpactPulse',
        html: message,
      });
      res.status(200).json({ msg: 'Лист для скидання пароля відправлено! Перевірте пошту.' });
    } catch (err) {
      console.error('Forgot password email error:', err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      res.status(500).json({ msg: 'Помилка відправки листа для скидання пароля' });
    }
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ msg: 'Помилка сервера' });
  }
};


export const resetPassword = async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ msg: 'Невірний токен або його термін дії минув' });
    }
    
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
    
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    
    res.status(200).json({ msg: 'Пароль успішно оновлено' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Помилка сервера' });
  }
};