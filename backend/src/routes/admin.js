const express = require("express");

const {
    requireAuth,
    requireAdmin,
} = require("../middleware/auth");

const {
    getUsers,
    updateUserStatus,
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

module.exports = router;