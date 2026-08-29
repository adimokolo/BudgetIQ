const express = require("express");

const {
  register,
  login,
  me,
  verifyOTP,
  resendOTP,
  uploadAvatar,
} = require("../controllers/authController");

const { requireAuth } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| AUTH ROUTES
|--------------------------------------------------------------------------
*/

// Register
router.post("/register", register);

// Verify registration OTP
router.post("/verify-otp", verifyOTP);

// Resend registration OTP
router.post("/resend-otp", resendOTP);

// Login
router.post("/login", login);

// Upload profile picture
router.post("/avatar", requireAuth, upload.single("avatar"), uploadAvatar);

// Current logged-in user
router.get("/me", requireAuth, me);

module.exports = router;
