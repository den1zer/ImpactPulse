import axios from 'axios';

export const sendEmail = async ({ email, subject, html }) => {
  if (!email || !subject || !html) {
    throw new Error('[SendEmail] Відсутні обов\'язкові поля: email, subject, html');
  }

  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.EMAIL_FROM_ADDRESS;
  const senderName = process.env.EMAIL_FROM_NAME || 'ImpactPulse';

  if (!apiKey || !senderEmail) {
    console.error('[SendEmail] ❌ BREVO_API_KEY або EMAIL_FROM_ADDRESS відсутні в .env');
    throw new Error('Email configuration error: credentials missing');
  }

  console.log(`[SendEmail] 📤 Спроба відправки на ${email} (від: ${senderEmail})`);

  const data = {
    sender: {
      name: senderName,
      email: senderEmail
    },
    to: [{ email }],
    subject: subject,
    htmlContent: html
  };

  try {
    const response = await axios.post('https://api.brevo.com/v3/smtp/email', data, {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log(`[SendEmail] ✅ Успіх! MessageId: ${response.data.messageId}`);
    return response.data;
  } catch (error) {
    console.error(`[SendEmail] ❌ Помилка відправки на ${email}:`);
    if (error.response && error.response.data) {
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    throw error;
  }
};

export default sendEmail;
