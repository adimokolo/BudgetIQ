const pool = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");

const listNotifications = asyncHandler(async (req, res) => {
  const [notificationsResult, unreadResult] = await Promise.all([
    pool.query(
      `SELECT id, type, title, body, read_at, created_at
       FROM notifications WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 30`,
      [req.user.id],
    ),
    pool.query(
      `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read_at IS NULL`,
      [req.user.id],
    ),
  ]);

  res.json({
    notifications: notificationsResult.rows,
    unreadCount: Number(unreadResult.rows[0].count),
  });
});

const createNotification = asyncHandler(async (req, res) => {
  const { type = "info", title, body, budgetId = null } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: "Title and body are required." });
  }

  const result = await pool.query(
    `INSERT INTO notifications (user_id, type, title, body, budget_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, type, title, body, read_at, created_at`,
    [req.user.id, type, title, body, budgetId],
  );

  res.status(201).json({ notification: result.rows[0] });
});

const markRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query(
    `UPDATE notifications SET read_at = now()
     WHERE id = $1 AND user_id = $2 AND read_at IS NULL
     RETURNING id`,
    [id, req.user.id],
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Notification not found." });
  }
  res.status(204).send();
});

const markAllRead = asyncHandler(async (req, res) => {
  await pool.query(
    `UPDATE notifications SET read_at = now() WHERE user_id = $1 AND read_at IS NULL`,
    [req.user.id],
  );
  res.status(204).send();
});

const removeNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(
    `DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id`,
    [id, req.user.id],
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Notification not found." });
  }

  res.status(204).send();
});

const removeAllNotifications = asyncHandler(async (req, res) => {
  await pool.query(`DELETE FROM notifications WHERE user_id = $1`, [
    req.user.id,
  ]);
  res.status(204).send();
});

module.exports = {
  listNotifications,
  createNotification,
  markRead,
  markAllRead,
  removeNotification,
  removeAllNotifications,
};
