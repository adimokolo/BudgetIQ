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

  const currentUserResult = await pool.query(
    `
    SELECT status
    FROM users
    WHERE id = $1
    `,
    [id],
  );

  if (currentUserResult.rows.length === 0) {
    return res.status(404).json({
      error: "User not found.",
    });
  }

  const previousStatus = currentUserResult.rows[0].status;

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
  await pool.query(
    `
    INSERT INTO admin_audit_logs (
      admin_user_id,
      target_user_id,
      action,
      details
    )
    VALUES ($1, $2, $3, $4::jsonb)
    `,
    [
      req.user.id,
      result.rows[0].id,
      status === "active"
        ? "user_reactivated"
        : status === "suspended"
          ? "user_suspended"
          : "user_deactivated",
      JSON.stringify({
        previous_status: previousStatus,
        new_status: status,
      }),
    ],
  );

  return res.json({
    success: true,
    message: `User account ${status} successfully.`,
    user: result.rows[0],
  });
});
const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  const allowedRoles = ["user", "admin"];

  if (!allowedRoles.includes(role)) {
    return res.status(400).json({
      error: "Invalid user role.",
    });
  }

  if (id === req.user.id) {
    return res.status(400).json({
      error: "You cannot change your own administrator role.",
    });
  }

  const targetResult = await pool.query(
    `
    SELECT id, full_name, email, role, status
    FROM users
    WHERE id = $1
    `,
    [id],
  );

  if (targetResult.rows.length === 0) {
    return res.status(404).json({
      error: "User not found.",
    });
  }

  const targetUser = targetResult.rows[0];

  if (targetUser.role === "admin" && role === "user") {
    const adminCountResult = await pool.query(`
      SELECT COUNT(*)::int AS count
      FROM users
      WHERE role = 'admin'
        AND status = 'active'
    `);

    const activeAdminCount = adminCountResult.rows[0].count;

    if (targetUser.status === "active" && activeAdminCount <= 1) {
      return res.status(400).json({
        error: "The last active administrator cannot be demoted.",
      });
    }
  }

  const result = await pool.query(
    `
    UPDATE users
    SET role = $1
    WHERE id = $2
    RETURNING
      id,
      full_name,
      email,
      role,
      status,
      updated_at
    `,
    [role, id],
  );

  await pool.query(
    `
    INSERT INTO admin_audit_logs (
      admin_user_id,
      target_user_id,
      action,
      details
    )
    VALUES ($1, $2, $3, $4::jsonb)
    `,
    [
      req.user.id,
      result.rows[0].id,
      role === "admin"
        ? "admin_granted"
        : "admin_removed",
      JSON.stringify({
        previous_role: targetUser.role,
        new_role: role,
      }),
    ],
  );

  return res.json({
    success: true,
    message:
      role === "admin"
        ? "Administrator access granted successfully."
        : "Administrator access removed successfully.",
    user: result.rows[0],
  });
});
const getAuditLogs = asyncHandler(async (req, res) => {
  const result = await pool.query(`
    SELECT
      logs.id,
      logs.action,
      logs.details,
      logs.created_at,

      logs.admin_user_id,
      admin.full_name AS admin_name,
      admin.email AS admin_email,

      logs.target_user_id,
      target.full_name AS target_name,
      target.email AS target_email

    FROM admin_audit_logs AS logs

    LEFT JOIN users AS admin
      ON admin.id = logs.admin_user_id

    LEFT JOIN users AS target
      ON target.id = logs.target_user_id

    ORDER BY logs.created_at DESC
    LIMIT 200
  `);

  return res.json({
    success: true,
    count: result.rows.length,
    logs: result.rows,
  });
});
module.exports = {
  getUsers,
  updateUserStatus,
  updateUserRole,
  getAuditLogs,
};