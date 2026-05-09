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
    if (user) {
      return res.status(400).json({ msg: 'Користувач з таким email вже існує' });
    }
    user = new User({ username, email, password });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    const verificationToken = crypto.randomBytes(20).toString('hex');
    user.verificationToken = verificationToken;

    await user.save();

    const clientUrl = req.headers.origin || process.env.FRONTEND_URL;
    const verifyUrl = `${clientUrl}/verify-email/${verificationToken}`;
    const message = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h1 style="color: #4F46E5;">Підтвердження Email</h1>
        <p>Дякуємо за реєстрацію на ImpactPulse!</p>
        <p>Будь ласка, перейдіть за посиланням нижче, щоб підтвердити свою пошту:</p>
        <a href="${verifyUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">Підтвердити Email</a>
        <p style="margin-top: 20px; font-size: 12px; color: #777;">Або скопіюйте це посилання: <br> ${verifyUrl}</p>
      </div>
    `;

    let emailSent = true;
    try {
      await sendEmail({
        email: user.email,
        subject: 'Підтвердження реєстрації на ImpactPulse',
        html: message,
      });
    } catch (err) {
      console.error('Помилка відправки email:', err);
      emailSent = false;
    }

    if (!emailSent) {
      return res.status(201).json({ 
        msg: 'Акаунт створено, але виникла помилка з відправкою листа. Спробуйте пізніше' 
      });
    }

    res.status(201).json({ msg: 'Реєстрація успішна! На вашу пошту відправлено лист із посиланням для підтвердження. Будь ласка, перевірте скриньку (та папку Спам).' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Помилка на сервері');
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
    
    const clientUrl = req.headers.origin || process.env.FRONTEND_URL;
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;
    const message = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h1 style="color: #4F46E5;">Скидання пароля</h1>
        <p>Ви отримали цей лист, оскільки зробили запит на скидання пароля.</p>
        <p>Перейдіть за посиланням нижче для встановлення нового пароля (посилання дійсне 1 годину):</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">Скинути пароль</a>
        <p style="margin-top: 20px; font-size: 12px; color: #777;">Або скопіюйте це посилання: <br> ${resetUrl}</p>
      </div>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Скидання пароля на ImpactPulse',
        html: message,
      });
      res.status(200).json({ msg: 'Лист для скидання пароля відправлено' });
    } catch (err) {
      console.error(err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      res.status(500).json({ msg: 'Помилка відправки email' });
    }
  } catch (err) {
    console.error(err);
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