const express = require("express");

const authController = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

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

  deleteAccount: typeof authController.deleteAccount,

  uploadAvatar: typeof authController.uploadAvatar,
  updateAvatar: typeof authController.updateAvatar,
});

router.post("/register", authController.register);

router.post("/verify-otp", authController.verifyOTP);

router.post("/resend-otp", authController.resendOTP);

router.post("/login", authController.login);

router.post("/forgot-password", authController.forgotPassword);

router.post("/reset-password", authController.resetPassword);

router.post("/forgot-password-otp", authController.forgotPasswordOtp);

router.post("/verify-reset-otp", authController.verifyResetOtp);

router.post("/reset-password-otp", authController.resetPasswordWithOtp);

router.get("/me", requireAuth, authController.me);

router.delete("/account", requireAuth, authController.deleteAccount);

router.post(
  "/avatar",
  requireAuth,
  upload.single("avatar"),
  authController.uploadAvatar,
);

router.patch("/avatar", requireAuth, authController.updateAvatar);

router.patch("/change-password", requireAuth, authController.changePassword);

router.patch("/currency", requireAuth, authController.updateCurrency);

router.delete("/account", requireAuth, authController.deleteAccount);
module.exports = router;
