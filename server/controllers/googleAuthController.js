import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

const getRedirectUri = () => {
  const base = (process.env.BASE_URL || 'http://localhost:5000').replace(/\/+$/, '');
  return `${base}/api/auth/google/callback`;
};

/**
 * Initiates the Google OAuth 2.0 consent flow.
 * Generates the authorization URL and redirects the client to Google.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @returns {void} Redirects the response.
 */
export const googleAuthRedirect = (req, res) => {
  const redirectUri = getRedirectUri();
  const authorizeUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'profile', 'email'],
    prompt: 'consent',
    redirect_uri: redirectUri,
  });
  res.redirect(authorizeUrl);
};

/**
 * Handles the OAuth 2.0 callback from Google.
 * Exchanges the authorization code for tokens, verifies the ID token,
 * manages the user session (creation/login), recalculates daily streaks,
 * and redirects back to the frontend with an authentication token.
 *
 * @param {import('express').Request} req - The Express request object, containing the authorization code in query.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} Redirects the response to the frontend URL.
 * @throws Will log an error and redirect to the frontend with an error parameter if the OAuth flow fails.
 */
export const googleAuthCallback = async (req, res) => {
  const { code } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (!code) {
    return res.redirect(`${frontendUrl}/login?error=google_no_code`);
  }

  try {
    const redirectUri = getRedirectUri();
    const { tokens } = await client.getToken({ code, redirect_uri: redirectUri });
    client.setCredentials(tokens);

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({
      $or: [{ googleId }, { email }],
    });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (!user.avatarUrl && picture) {
        user.avatarUrl = picture;
      }
    } else {
      // Генерація унікального username: Google повертає ім'я з пробілами, тому ми їх видаляємо.
      // Якщо такий username вже існує, додаємо таймстемп, щоб уникнути колізій у базі.
      let username = name.replace(/\s+/g, '_').toLowerCase();
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        username = `${username}_${Date.now().toString(36)}`;
      }

      user = new User({
        username,
        email,
        googleId,
        avatarUrl: picture || '',
        isVerified: true,
      });
    }

    // Логіка перерахунку щоденного стріка активності:
    // Перевіряємо різницю в днях між останньою активністю та сьогоднішньою датою (без врахування часу).
    // Якщо різниця 1 день — продовжуємо стрік. Якщо більше (або це новий юзер) — скидаємо до 1.
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActivity = user.streak?.lastActivityDate
      ? new Date(user.streak.lastActivityDate)
      : null;
    if (lastActivity) lastActivity.setHours(0, 0, 0, 0);

    const diffTime = lastActivity ? today - lastActivity : -1;
    const diffDays = lastActivity
      ? Math.round(diffTime / (1000 * 60 * 60 * 24))
      : -1;

    if (!user.streak || !user.streak.lastActivityDate) {
      user.streak = { current: 1, longest: 1, lastActivityDate: new Date() };
    } else if (diffDays === 1) {
      user.streak.current += 1;
      if (user.streak.current > user.streak.longest)
        user.streak.longest = user.streak.current;
      user.streak.lastActivityDate = new Date();
    } else if (diffDays > 1 || diffDays === -1) {
      user.streak.current = 1;
      if (user.streak.current > user.streak.longest)
        user.streak.longest = user.streak.current;
      user.streak.lastActivityDate = new Date();
    }

    await user.save();

    const jwtPayload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    const token = jwt.sign(jwtPayload, process.env.JWT_SECRET, {
      expiresIn: '5h',
    });

    const params = new URLSearchParams({
      token,
      role: user.role,
      userId: user.id,
    });

    res.redirect(`${frontendUrl}/login?${params.toString()}`);
  } catch (err) {
    console.error('[Google OAuth] Error:', err.message);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
  }
};
