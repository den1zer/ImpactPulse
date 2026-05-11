import nodemailer from 'nodemailer';
import dns from 'node:dns';

// ─── Singleton transporter (pool re-uses connections) ────────────────────────
let _transporter = null;

/**
 * Returns a verified, pooled SMTP transporter.
 * Created once and reused across calls (singleton).
 */
const getTransporter = async () => {
  if (_transporter) return _transporter;

  const emailUser = (process.env.EMAIL_USER || '').trim();
  const emailPass = (process.env.EMAIL_PASS || '').trim();

  if (!emailUser || !emailPass) {
    console.error('[SendEmail] ❌ EMAIL_USER або EMAIL_PASS відсутні в .env');
    throw new Error('Email configuration error: credentials missing');
  }

  console.log('[SendEmail] 🔧 Ініціалізація SMTP транспорту...');
  console.log(`[SendEmail]    host    : smtp.gmail.com:587`);
  console.log(`[SendEmail]    user    : ${emailUser}`);
  console.log(`[SendEmail]    pool    : true`);
  console.log(`[SendEmail]    family  : 4 (IPv4 forced — required on Render)`);

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,           // STARTTLS on port 587

    auth: {
      user: emailUser,
      pass: emailPass,       // Gmail App Password (16-char, no spaces)
    },

    // ── Render-critical: force IPv4 ──────────────────────────────────────────
    family: 4,               // Prevents ENETUNREACH on Render's dual-stack infra
    lookup: (hostname, options, callback) => {
      dns.lookup(hostname, { family: 4 }, callback);
    },

    // ── Connection pooling ───────────────────────────────────────────────────
    pool: true,              // Re-use TCP connections — avoids repeated TLS handshakes
    maxConnections: 3,       // Max simultaneous SMTP connections in the pool
    maxMessages: 50,         // Messages per connection before it's recycled

    // ── Timeouts ─────────────────────────────────────────────────────────────
    connectionTimeout: 10_000,   // 10 s — fail fast if port 587 is blocked
    greetingTimeout: 8_000,     // 8 s  — wait for EHLO/HELO
    socketTimeout: 15_000,    // 15 s — idle socket timeout

    // ── TLS ──────────────────────────────────────────────────────────────────
    tls: {
      rejectUnauthorized: true,  // Keep true in production (security)
    },

    // ── Diagnostics (disable in production if logs are too noisy) ───────────
    logger: process.env.NODE_ENV !== 'production',
    debug: process.env.NODE_ENV !== 'production',
  });

  // Verify connection before caching as singleton
  console.log('[SendEmail] 🔍 Перевірка SMTP з\'єднання (verify)...');
  try {
    await transporter.verify();
    console.log('[SendEmail] ✅ SMTP з\'єднання підтверджено успішно');
  } catch (verifyErr) {
    console.error('[SendEmail] ❌ SMTP verify() провалився:');
    console.error('  ├─ name   :', verifyErr.name);
    console.error('  ├─ message:', verifyErr.message);
    console.error('  ├─ code   :', verifyErr.code);
    console.error('  └─ stack  :', verifyErr.stack);
    // Don't cache a broken transporter
    throw verifyErr;
  }

  _transporter = transporter;
  return _transporter;
};

/**
 * Sends an email via Gmail SMTP with automatic retry on transient errors.
 *
 * @param {{ email: string, subject: string, html: string }} options
 * @param {number} [retries=2] - Number of retry attempts on failure
 * @returns {Promise<object>} Nodemailer info object
 */
export const sendEmail = async (options, retries = 2) => {
  const { email, subject, html } = options;

  if (!email || !subject || !html) {
    throw new Error('[SendEmail] Відсутні обов\'язкові поля: email, subject, html');
  }

  const emailUser = (process.env.EMAIL_USER || '').trim();
  const fromName = (process.env.FROM_NAME || 'ImpactPulse').trim();

  const message = {
    from: `${fromName} <${emailUser}>`,
    to: email,
    subject: subject,
    html: html,
  };

  let lastError;

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    console.log(`[SendEmail] 📤 Спроба ${attempt}/${retries + 1} — відправка на: ${email}`);
    console.log(`[SendEmail]    subject: ${subject}`);

    try {
      const transporter = await getTransporter();
      const info = await transporter.sendMail(message);

      console.log(`[SendEmail] ✅ Успіх (спроба ${attempt})!`);
      console.log(`[SendEmail]    messageId   : ${info.messageId}`);
      console.log(`[SendEmail]    response    : ${info.response}`);
      console.log(`[SendEmail]    accepted    : ${info.accepted?.join(', ')}`);
      console.log(`[SendEmail]    rejected    : ${info.rejected?.join(', ') || 'none'}`);

      return info;
    } catch (err) {
      lastError = err;

      console.error(`[SendEmail] ❌ Помилка на спробі ${attempt}/${retries + 1}:`);
      console.error('  ├─ name      :', err.name);
      console.error('  ├─ message   :', err.message);
      console.error('  ├─ code      :', err.code);
      console.error('  ├─ command   :', err.command);
      console.error('  └─ responseCode:', err.responseCode);

      // Reset singleton on connection-level errors so next attempt re-creates it
      const isConnectionError = ['ECONNREFUSED', 'ETIMEDOUT', 'ECONNRESET',
        'ENETUNREACH', 'ENOTFOUND'].includes(err.code);
      if (isConnectionError) {
        console.warn('[SendEmail] ⚠️  Connection error detected — скидання транспорту для наступної спроби...');
        _transporter = null;
      }

      if (attempt <= retries) {
        const delay = attempt * 2000; // 2 s, 4 s back-off
        console.log(`[SendEmail] ⏳ Повтор через ${delay / 1000} с...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  console.error('[SendEmail] 💀 Всі спроби вичерпано. Кидаємо помилку.');
  throw lastError;
};

// Default export for backward-compatibility
export default sendEmail;
