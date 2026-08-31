const express = require("express");
const {
  register,
  verifyOtp,
  resendOtp,
  login,
  forgotPassword,
  resetPassword,
  forgotPasswordOtp,
  verifyResetOtp,
  resetPasswordWithOtp,
  me,
  updateAvatar,
} = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/forgot-password-otp", forgotPasswordOtp);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password-otp", resetPasswordWithOtp);
router.get("/me", requireAuth, me);
router.patch("/avatar", requireAuth, updateAvatar);

module.exports = router;
