const express = require("express");

const authController = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

// --------------------------------------------------
// DEBUG: Check that all controller functions exist
// --------------------------------------------------

console.log("Auth controller functions:", {
  register: typeof authController.register,
  verifyOTP: typeof authController.verifyOTP,
  resendOTP: typeof authController.resendOTP,
  login: typeof authController.login,

  forgotPassword: typeof authController.forgotPassword,
  resetPassword: typeof authController.resetPassword,

  forgotPasswordOtp: typeof authController.forgotPasswordOtp,
  verifyResetOtp: typeof authController.verifyResetOtp,
  resetPasswordWithOtp: typeof authController.resetPasswordWithOtp,

  me: typeof authController.me,
  uploadAvatar: typeof authController.uploadAvatar,
});

// --------------------------------------------------
// AUTH ROUTES
// --------------------------------------------------

router.post("/register", authController.register);

router.post("/verify-otp", authController.verifyOTP);

router.post("/resend-otp", authController.resendOTP);

router.post("/login", authController.login);

// --------------------------------------------------
// PASSWORD RESET
// --------------------------------------------------

// Legacy token-based reset
router.post("/forgot-password", authController.forgotPassword);

router.post("/reset-password", authController.resetPassword);

// OTP-based reset
router.post("/forgot-password-otp", authController.forgotPasswordOtp);

router.post("/verify-reset-otp", authController.verifyResetOtp);

router.post("/reset-password-otp", authController.resetPasswordWithOtp);

// --------------------------------------------------
// PROFILE
// --------------------------------------------------

router.post(
  "/avatar",
  requireAuth,
  upload.single("avatar"),
  authController.uploadAvatar,
);

router.get("/me", requireAuth, authController.me);

// --------------------------------------------------

module.exports = router;
