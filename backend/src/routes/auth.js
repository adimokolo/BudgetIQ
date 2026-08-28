const express = require("express");

const {
  register,
  login,
  me,
  verifyOTP,
  resendOTP,
} = require("../controllers/authController");

const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);

router.post("/verify-otp", verifyOTP);

router.post("/resend-otp", resendOTP);

router.post("/login", login);

router.get("/me", requireAuth, me);

module.exports = router;
