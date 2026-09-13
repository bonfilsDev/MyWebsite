const nodemailer = require('nodemailer');

let transporter = null;

if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'Stream Pharmacy <no-reply@streampharmacy.com>';

async function sendMail(to, subject, html) {
  if (!transporter) {
    console.warn('[mailer] SMTP not configured, email not sent to ' + to);
    return false;
  }
  try {
    await transporter.sendMail({ from, to, subject, html });
    return true;
  } catch (e) {
    console.error('[mailer] sendMail error:', e.message);
    return false;
  }
}

module.exports = { sendMail };