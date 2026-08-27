const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    // No SMTP configured - fall back to logging emails to the console so
    // registration/reset flows are fully testable on a fresh local setup
    // before anyone wires up a real mail provider.
    transporter = null;
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

/**
 * Sends an email, or logs it to the console if SMTP isn't configured yet.
 * @param {{ to: string, subject: string, html: string, text: string }} opts
 */
async function sendEmail({ to, subject, html, text }) {
  const t = getTransporter();

  if (!t) {
    console.log('\n--- SMTP not configured: email logged instead of sent ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(text || html);
    console.log('-----------------------------------------------------------\n');
    return { delivered: false, logged: true };
  }

  await t.sendMail({
    from: process.env.EMAIL_FROM || 'BudgetIQ <no-reply@budgetiq.app>',
    to,
    subject,
    html,
    text,
  });
  return { delivered: true, logged: false };
}

module.exports = { sendEmail };
