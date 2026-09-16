const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } =
    process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.log("SMTP is not configured.", {
      hasHost: Boolean(SMTP_HOST),
      hasUser: Boolean(SMTP_USER),
      hasPassword: Boolean(SMTP_PASS),
    });

    return null;
  }

  const port = Number(SMTP_PORT || 587);

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: SMTP_SECURE === "true" || port === 465,

    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },

    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });

  return transporter;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function verifyEmailConnection() {
  const emailTransporter = getTransporter();

  if (!emailTransporter) {
    return false;
  }

  try {
    await emailTransporter.verify();
    console.log("SMTP connection is ready.");
    return true;
  } catch (error) {
    console.error("SMTP verification failed:", {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
    });

    return false;
  }
}

async function sendEmail({ to, subject, text, html }) {
  if (!to) {
    throw new Error("Recipient email address is required.");
  }

  const emailTransporter = getTransporter();

  if (!emailTransporter) {
    console.log("Email not sent because SMTP is not configured.");
    console.log({
      to,
      subject,
      text,
    });

    return {
      delivered: false,
      logged: true,
      reason: "smtp_not_configured",
    };
  }

  const result = await emailTransporter.sendMail({
    from: process.env.EMAIL_FROM || `BudgetIQ <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  });

  console.log("Email sent successfully:", {
    to,
    subject,
    messageId: result.messageId,
  });

  return {
    delivered: true,
    logged: false,
    messageId: result.messageId,
  };
}

async function sendNotificationEmail({ to, title, body }) {
  const safeTitle = escapeHtml(title);
  const safeBody = escapeHtml(body).replaceAll("\n", "<br />");

  return sendEmail({
    to,
    subject: title,
    text: body,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>

        <body
          style="
            margin: 0;
            padding: 24px;
            background-color: #f5f7fb;
            font-family: Arial, sans-serif;
            color: #14274e;
          "
        >
          <div
            style="
              max-width: 560px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 16px;
              padding: 32px;
              border: 1px solid #e5e7eb;
            "
          >
            <h2
              style="
                margin: 0 0 8px;
                color: #174e78;
              "
            >
              BudgetIQ
            </h2>

            <h3
              style="
                margin: 24px 0 12px;
                color: #14274e;
              "
            >
              ${safeTitle}
            </h3>

            <p
              style="
                margin: 0;
                color: #4b5563;
                line-height: 1.6;
              "
            >
              ${safeBody}
            </p>

            <p
              style="
                margin: 28px 0 0;
                color: #9ca3af;
                font-size: 12px;
              "
            >
              This notification was sent by BudgetIQ.
            </p>
          </div>
        </body>
      </html>
    `,
  });
}

module.exports = {
  sendEmail,
  sendNotificationEmail,
  verifyEmailConnection,
};
