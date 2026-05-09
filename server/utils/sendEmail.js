import nodemailer from 'nodemailer';

export const sendEmail = async (options) => {
  const emailUser = (process.env.EMAIL_USER || '').trim();
  const emailPass = (process.env.EMAIL_PASS || '').trim();

  if (!emailUser || !emailPass) {
    console.error('[SendEmail] ❌ EMAIL_USER або EMAIL_PASS відсутні в .env');
    throw new Error('Email configuration error: credentials missing');
  }

  console.log(`[SendEmail] 📡 Спроба підключення до smtp.gmail.com:587 (IPv4)...`);

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    // ── Render-critical settings ──
    family: 4,                  // Force IPv4 — fixes ENETUNREACH on Render
    connectionTimeout: 10000,   // 10 s — fail fast if port blocked
    greetingTimeout: 5000,      // 5 s  — don't wait forever for EHLO
    socketTimeout: 15000,       // 15 s — overall socket idle timeout
    // ── Diagnostics ──
    logger: true,
    debug: true,
    tls: {
      rejectUnauthorized: false,
    },
  });

  const message = {
    from: `${process.env.FROM_NAME || 'ImpactPulse'} <${emailUser}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  try {
    console.log(`[SendEmail] 📤 Відправка листа на ${options.email}...`);
    const info = await transporter.sendMail(message);
    console.log(`[SendEmail] ✅ Успіх! messageId=${info.messageId}`);
    return info;
  } catch (error) {
    console.error('[SendEmail] ❌ Помилка відправки:');
    console.error('  ├─ name   :', error.name);
    console.error('  ├─ message:', error.message);
    console.error('  ├─ code   :', error.code);
    console.error('  ├─ command:', error.command);
    console.error('  └─ stack  :', error.stack);
    throw error;
  }
};

// Default export kept for backward-compatibility with any other importers
export default sendEmail;
