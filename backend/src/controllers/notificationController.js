const pool = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const { sendNotificationEmail } = require("../utils/mailer");

const listNotifications = asyncHandler(async (req, res) => {
  const [notificationsResult, unreadResult] = await Promise.all([
    pool.query(
      `
        SELECT
          id,
          type,
          title,
          body,
          budget_id,
          read_at,
          created_at
        FROM notifications
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 30
      `,
      [req.user.id],
    ),

    pool.query(
      `
        SELECT COUNT(*) AS count
        FROM notifications
        WHERE user_id = $1
          AND read_at IS NULL
      `,
      [req.user.id],
    ),
  ]);

  res.json({
    notifications: notificationsResult.rows,
    unreadCount: Number(unreadResult.rows[0]?.count || 0),
  });
});

const createNotification = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const { type = "info", title, body, budgetId = null } = req.body;

  if (!title?.trim() || !body?.trim()) {
    return res.status(400).json({
      error: "Title and body are required.",
    });
  }

  const notificationResult = await pool.query(
    `
      INSERT INTO notifications (
        user_id,
        type,
        title,
        body,
        budget_id
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id,
        type,
        title,
        body,
        budget_id,
        read_at,
        created_at
    `,
    [userId, type, title.trim(), body.trim(), budgetId],
  );

  const notification = notificationResult.rows[0];

  let recipientEmail = req.user.email;
  let emailSent = false;
  let emailError = null;

  try {
    if (!recipientEmail) {
      const userResult = await pool.query(
        `
          SELECT email
          FROM users
          WHERE id = $1
          LIMIT 1
        `,
        [userId],
      );

      recipientEmail = userResult.rows[0]?.email;
    }

    if (!recipientEmail) {
      emailError = "No email address was found for this user.";

      console.log("Notification email skipped:", {
        userId,
        notificationId: notification.id,
        reason: emailError,
      });
    } else {
      const emailResult = await sendNotificationEmail({
        to: recipientEmail,
        title: notification.title,
        body: notification.body,
      });

      emailSent = emailResult.delivered === true;

      if (!emailSent) {
        emailError =
          emailResult.reason || "Email provider did not deliver the email.";
      }
    }
  } catch (error) {
    emailError = error.message;

    console.error("Notification email failed:", {
      userId,
      recipientEmail,
      notificationId: notification.id,
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
    });
  }

  return res.status(201).json({
    notification,
    email: {
      sent: emailSent,
      recipient: recipientEmail || null,
      error: emailError,
    },
  });
});

const markRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(
    `
      UPDATE notifications
      SET read_at = NOW()
      WHERE id = $1
        AND user_id = $2
      RETURNING id, read_at
    `,
    [id, req.user.id],
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      error: "Notification not found.",
    });
  }

  return res.status(200).json({
    success: true,
    notification: result.rows[0],
  });
});

const markAllRead = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `
      UPDATE notifications
      SET read_at = NOW()
      WHERE user_id = $1
        AND read_at IS NULL
    `,
    [req.user.id],
  );

  return res.status(200).json({
    success: true,
    updatedCount: result.rowCount,
  });
});

const removeNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(
    `
      DELETE FROM notifications
      WHERE id = $1
        AND user_id = $2
      RETURNING id
    `,
    [id, req.user.id],
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      error: "Notification not found.",
    });
  }

  return res.status(200).json({
    success: true,
    deletedId: result.rows[0].id,
  });
});

const removeAllNotifications = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `
      DELETE FROM notifications
      WHERE user_id = $1
    `,
    [req.user.id],
  );

  return res.status(200).json({
    success: true,
    deletedCount: result.rowCount,
  });
});

module.exports = {
  listNotifications,
  createNotification,
  markRead,
  markAllRead,
  removeNotification,
  removeAllNotifications,
};
