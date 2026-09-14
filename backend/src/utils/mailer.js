const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendNotificationEmail({ to, title, body }) {
  if (!to) {
    console.log("sendNotificationEmail skipped: no recipient email on file.");
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject: title,
      text: body,
      html: `<p>${body}</p>`,
    });

    console.log("Notification email sent to", to);
  } catch (error) {
    console.log("Notification email error:", error.message);
  }
}

module.exports = { sendNotificationEmail };
