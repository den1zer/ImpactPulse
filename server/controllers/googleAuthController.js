import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

// Build redirect URI from BASE_URL (strip trailing slash for safety)
const getRedirectUri = () => {
  const base = (process.env.BASE_URL || 'http://localhost:5000').replace(/\/+$/, '');
  return `${base}/api/auth/google/callback`;
};

/**
 * GET /api/auth/google
 * Redirects user to Google consent screen
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
 * GET /api/auth/google/callback
 * Handles Google callback, finds or creates user, issues JWT and redirects to frontend
 */
export const googleAuthCallback = async (req, res) => {
  const { code } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (!code) {
    return res.redirect(`${frontendUrl}/login?error=google_no_code`);
  }

  try {
    // Exchange authorization code for tokens — must use same redirect_uri
    const redirectUri = getRedirectUri();
    const { tokens } = await client.getToken({ code, redirect_uri: redirectUri });
    client.setCredentials(tokens);

    // Verify the ID token and extract user info
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    const { sub: googleId, email, name, picture } = payload;

    // Find existing user by googleId OR email
    let user = await User.findOne({
      $or: [{ googleId }, { email }],
    });

    if (user) {
      // Link Google account if user exists by email but has no googleId yet
      if (!user.googleId) {
        user.googleId = googleId;
      }
      // Update avatar from Google if user doesn't have one
      if (!user.avatarUrl && picture) {
        user.avatarUrl = picture;
      }
    } else {
      // Create a new user — no password needed for Google auth
      // Generate unique username from Google name
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
        isVerified: true, // Google email is already verified
      });
    }

    // Update streak on login
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

    // Issue JWT — same payload structure as existing loginUser
    const jwtPayload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    const token = jwt.sign(jwtPayload, process.env.JWT_SECRET, {
      expiresIn: '5h',
    });

    // Redirect to frontend with token, role, and userId in query params
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

/**
 * GET /api/auth/google/debug
 * Temporary debug endpoint — shows what redirect_uri the server is using.
 * DELETE THIS after OAuth is working!
 */
export const googleAuthDebug = (req, res) => {
  res.json({
    BASE_URL: process.env.BASE_URL || '❌ NOT SET',
    redirect_uri: getRedirectUri(),
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? `✅ ...${process.env.GOOGLE_CLIENT_ID.slice(-15)}` : '❌ NOT SET',
    FRONTEND_URL: process.env.FRONTEND_URL || '❌ NOT SET',
    instruction: 'This redirect_uri MUST exactly match what is in Google Cloud Console → Authorized redirect URIs',
  });
};
