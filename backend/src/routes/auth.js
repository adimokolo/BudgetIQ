const express = require("express");

const authController = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| DEBUG — Check controller functions
|--------------------------------------------------------------------------
|
| This is useful for confirming that every controller function is loaded.
|
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| REGISTRATION
|--------------------------------------------------------------------------
*/

router.post("/register", authController.register);

/*
|--------------------------------------------------------------------------
| EMAIL VERIFICATION
|--------------------------------------------------------------------------
*/

router.post("/verify-otp", authController.verifyOTP);

router.post("/resend-otp", authController.resendOTP);

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

router.post("/login", authController.login);

/*
|--------------------------------------------------------------------------
| PASSWORD RESET — LEGACY LINK
|--------------------------------------------------------------------------
*/

router.post("/forgot-password", authController.forgotPassword);

router.post("/reset-password", authController.resetPassword);

/*
|--------------------------------------------------------------------------
| PASSWORD RESET — OTP
|--------------------------------------------------------------------------
*/

router.post("/forgot-password-otp", authController.forgotPasswordOtp);

router.post("/verify-reset-otp", authController.verifyResetOtp);

router.post("/reset-password-otp", authController.resetPasswordWithOtp);

/*
|--------------------------------------------------------------------------
| CURRENT USER
|--------------------------------------------------------------------------
*/

router.get("/me", requireAuth, authController.me);

/*
|--------------------------------------------------------------------------
| DELETE ACCOUNT
|--------------------------------------------------------------------------
|
| DELETE /api/auth/account
|
| requireAuth gets the user ID from the JWT.
|
| The mobile app does NOT send a user ID.
|
|--------------------------------------------------------------------------
*/

router.delete("/account", requireAuth, authController.deleteAccount);

/*
|--------------------------------------------------------------------------
| PROFILE AVATAR — MOBILE
|--------------------------------------------------------------------------
|
| Mobile sends multipart/form-data:
|
| avatar: image file
|
|--------------------------------------------------------------------------
*/

router.post(
  "/avatar",
  requireAuth,
  upload.single("avatar"),
  authController.uploadAvatar,
);

/*
|--------------------------------------------------------------------------
| PROFILE AVATAR — WEB
|--------------------------------------------------------------------------
|
| Web sends:
|
| {
|   avatarDataUrl: "data:image/..."
| }
|
|--------------------------------------------------------------------------
*/

router.patch("/avatar", requireAuth, authController.updateAvatar);

module.exports = router;
