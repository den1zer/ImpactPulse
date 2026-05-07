const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const emailUser = (process.env.EMAIL_USER || '').trim();
  const emailPass = (process.env.EMAIL_PASS || '').trim();

  if (!emailUser || !emailPass) {
    console.error('Email credentials are missing in .env');
    throw new Error('Email configuration error');
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // false for port 587
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    logger: true, // Log SMTP traffic to console
    debug: true,  // Include debug output
    tls: {
      rejectUnauthorized: false, // Avoid certificate issues
    },
    family: 4, // Force IPv4
    connectionTimeout: 30000, // 30 seconds
    greetingTimeout: 30000,
    socketTimeout: 30000,
  });

  const message = {
    from: `${process.env.FROM_NAME || 'ImpactPulse'} <${emailUser}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(message);
    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Nodemailer Error:', error);
    throw error;
  }
};

module.exports = sendEmail;
