const express = require("express");

const {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
} = require("../controllers/accountController");

const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, getAccounts);
router.post("/", requireAuth, createAccount);
router.put("/:id", requireAuth, updateAccount);
router.delete("/:id", requireAuth, deleteAccount);

module.exports = router;
