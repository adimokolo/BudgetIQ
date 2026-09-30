const express = require("express");

const { requireAuth, requireAdmin } = require("../middleware/auth");

const {
  getUsers,
  updateUserStatus,
  updateUserRole,
  getAuditLogs,
} = require("../controllers/adminController");

const router = express.Router();

router.get("/users", requireAuth, requireAdmin, getUsers);

router.patch("/users/:id/status", requireAuth, requireAdmin, updateUserStatus);

router.patch("/users/:id/role", requireAuth, requireAdmin, updateUserRole);

router.get("/audit-logs", requireAuth, requireAdmin, getAuditLogs);
module.exports = router;
