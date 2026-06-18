import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendEmail } from '../utils/sendEmail.js';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Registers a new user with email and password.
 * Generates a verification token and sends an email.
 *
 * @param {import('express').Request} req - The Express request object containing username, email, and password.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} Returns a JSON response with success or error message.
 */
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
      console.error('[Register] ❌ Email НЕ відправлено:', err.message);
      emailSent = false;
    }

    if (!emailSent) {
      return res.status(201).json({
        msg: 'Акаунт створено, але лист не надійшов, зверніться в підтримку'
      });
    }

    res.status(201).json({ msg: 'Реєстрація успішна! На вашу пошту відправлено лист із посиланням для підтвердження. Будь ласка, перевірте скриньку (та папку Спам).' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Помилка на сервері');
  }
};

/**
 * Authenticates a user and issues a JWT token.
 * Validates credentials and recalculates activity streak.
 *
 * @param {import('express').Request} req - The Express request object containing email and password.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} Returns a JSON response with token and user details, or an error.
 */
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ msg: 'Невірні дані для входу' });
    }

    // Блокування входу: користувачі, які зареєструвались через Google, не мають пароля в БД.
    // Забороняємо їм вхід через стандартну форму, направляємо на OAuth.
    if (!user.password) {
      return res.status(400).json({ msg: 'Цей акаунт використовує Google-авторизацію. Увійдіть через Google.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Невірні дані для входу' });
    }

    if (!user.isVerified) {
      return res.status(401).json({ msg: 'Please verify your email before logging in.' });
    }

    // Логіка перерахунку щоденного стріка активності:
    // Перевіряємо різницю в днях між останньою активністю та сьогоднішньою датою (без врахування часу).
    // Якщо різниця 1 день — продовжуємо стрік. Якщо більше (або це новий юзер) — скидаємо до 1.
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActivity = user.streak?.lastActivityDate ? new Date(user.streak.lastActivityDate) : null;
    if (lastActivity) {
      lastActivity.setHours(0, 0, 0, 0);
    }

    const diffTime = lastActivity ? today - lastActivity : -1;
    const diffDays = lastActivity ? Math.round(diffTime / (1000 * 60 * 60 * 24)) : -1;

    if (!user.streak || !user.streak.lastActivityDate) {
      user.streak = { current: 1, longest: 1, lastActivityDate: new Date() };
    } else if (diffDays === 1) {
      user.streak.current += 1;
      if (user.streak.current > user.streak.longest) user.streak.longest = user.streak.current;
      user.streak.lastActivityDate = new Date();
    } else if (diffDays > 1 || diffDays === -1) {
      user.streak.current = 1;
      if (user.streak.current > user.streak.longest) user.streak.longest = user.streak.current;
      user.streak.lastActivityDate = new Date();
    }

    await user.save();

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

/**
 * Verifies a user's email address using a token.
 *
 * @param {import('express').Request} req - The Express request object containing the token in params.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} Returns a JSON response with success or error message.
 */
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

/**
 * Initiates the password reset process.
 * Generates a reset token and sends it via email.
 *
 * @param {import('express').Request} req - The Express request object containing the email.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} Returns a JSON response indicating the email was sent.
 */
export const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ msg: 'Користувача з таким email не знайдено' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000;
    await user.save();

    const clientUrl = req.headers.origin || process.env.FRONTEND_URL;
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;
    const message = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          .container { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; line-height: 1.6; }
          .header { background: #5B1FA0; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
          .content { padding: 30px; background: #f9f9f9; border: 1px solid #eeeeee; border-top: none; border-radius: 0 0 8px 8px; }
          .btn { display: inline-block; padding: 14px 28px; background-color: #5B1FA0; color: #ffffff !important; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .footer { margin-top: 30px; font-size: 12px; color: #888; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>ImpactPulse</h1></div>
          <div class="content">
            <h2>Відновлення пароля</h2>
            <p>Вітаємо! Ви отримали цей лист, оскільки було зроблено запит на скидання пароля для вашого акаунту в системі ImpactPulse.</p>
            <p>Будь ласка, натисніть на кнопку нижче, щоб встановити новий пароль. Посилання дійсне протягом 1 години.</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="btn">Встановити новий пароль</a>
            </div>
            <p>Якщо ви не робили цього запиту, просто ігноруйте цей лист.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 11px;">Або скопіюйте це посилання у браузер:<br>${resetUrl}</p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} ImpactPulse Team. Всі права захищено.
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'ImpactPulse: Відновлення пароля',
        html: message,
      });
      res.status(200).json({ msg: 'Лист для скидання пароля відправлено' });
    } catch (err) {
      console.error('[ForgotPassword] ❌ Email НЕ відправлено:', err.message);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      res.status(500).json({ msg: 'Помилка відправки email. Спробуйте пізніше або зверніться в підтримку.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Помилка сервера' });
  }
};

/**
 * Resets a user's password using a valid token.
 *
 * @param {import('express').Request} req - The Express request object containing the token in params and new password in body.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} Returns a JSON response with success or error message.
 */
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
