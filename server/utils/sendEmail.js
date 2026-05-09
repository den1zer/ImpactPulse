import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends an email using Resend REST API
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 */
const sendEmail = async (options) => {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is missing in .env');
    throw new Error('Email configuration error: Missing API Key');
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'ImpactPulse <onboarding@resend.dev>',
      to: options.email,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      console.error('Resend API Error:', error);
      throw new Error(error.message);
    }

    console.log('Email sent successfully:', data.id);
    return data;
  } catch (error) {
    console.error('Resend SDK Error:', error);
    throw error;
  }
};

export default sendEmail;


