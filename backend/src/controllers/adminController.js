const pool = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");

const getUsers = asyncHandler(async (req, res) => {
  const result = await pool.query(`
    SELECT
      id,
      full_name,
      email,
      currency,
      is_verified,
      avatar_url,
      role,
      status,
      created_at,
      updated_at
    FROM users
    ORDER BY created_at DESC
  `);

  return res.json({
    success: true,
    count: result.rows.length,
    users: result.rows,
  });
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowedStatuses = ["active", "suspended", "deactivated"];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      error: "Invalid account status.",
    });
  }

  if (id === req.user.id) {
    return res.status(400).json({
      error: "You cannot change the status of your own administrator account.",
    });
  }

  const result = await pool.query(
    `
    UPDATE users
    SET status = $1
    WHERE id = $2
    RETURNING
      id,
      full_name,
      email,
      role,
      status,
      updated_at
    `,
    [status, id],
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      error: "User not found.",
    });
  }

  return res.json({
    success: true,
    message: `User account ${status} successfully.`,
    user: result.rows[0],
  });
});
module.exports = {
  getUsers,
  updateUserStatus,
};