const express = require("express");

const {
    requireAuth,
    requireAdmin,
} = require("../middleware/auth");

const {
    getUsers,
    updateUserStatus,
    updateUserRole,
    getAuditLogs,
} = require("../controllers/adminController");

const router = express.Router();

// Get all registered BudgetIQ users
router.get(
    "/users",
    requireAuth,
    requireAdmin,
    getUsers,
);

// Suspend, reactivate, or deactivate a user
router.patch(
    "/users/:id/status",
    requireAuth,
    requireAdmin,
    updateUserStatus,
);
// Promote a user to admin or remove administrator access
router.patch(
    "/users/:id/role",
    requireAuth,
    requireAdmin,
    updateUserRole,
);
// Get administrator audit history
router.get(
    "/audit-logs",
    requireAuth,
    requireAdmin,
    getAuditLogs,
);
module.exports = router;
