const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const pool = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const { sendEmail } = require("../utils/email");

const {
  OTP_TTL_MINUTES,
  RESET_TOKEN_TTL_MINUTES,
  generateOtp,
  generateResetToken,
  hashSecret,
  minutesFromNow,
} = require("../utils/otp");

/*
|--------------------------------------------------------------------------
| DEFAULT CATEGORIES
|--------------------------------------------------------------------------
*/

const DEFAULT_CATEGORIES = [
  {
    name: "Salary",
    type: "income",
    color: "#3DDC97",
    icon: "wallet",
  },
  {
    name: "Freelance",
    type: "income",
    color: "#5DD5E8",
    icon: "briefcase",
  },
  {
    name: "Food & Groceries",
    type: "expense",
    color: "#FF8FA3",
    icon: "shopping-cart",
  },
  {
    name: "Transport",
    type: "expense",
    color: "#FFC96B",
    icon: "car",
  },
  {
    name: "Housing & Utilities",
    type: "expense",
    color: "#8C7CF0",
    icon: "home",
  },
  {
    name: "Entertainment",
    type: "expense",
    color: "#63C7FF",
    icon: "film",
  },
  {
    name: "Health",
    type: "expense",
    color: "#FF6B9D",
    icon: "heart",
  },
  {
    name: "Savings",
    type: "expense",
    color: "#4FD1C5",
    icon: "piggy-bank",
  },
];

/*
|--------------------------------------------------------------------------
| JWT
|--------------------------------------------------------------------------
*/

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
  );
}

/*
|--------------------------------------------------------------------------
| ISSUE EMAIL VERIFICATION OTP
|--------------------------------------------------------------------------
*/

async function issueOtp(client, userId, email, fullName) {
  const code = generateOtp();

  await client.query(
    `INSERT INTO otp_codes
      (user_id, code_hash, purpose, expires_at)
     VALUES
      ($1, $2, 'email_verification', $3)`,
    [userId, hashSecret(code), minutesFromNow(OTP_TTL_MINUTES)],
  );

  /*
   * Log OTP during development.
   * This allows mobile testing even when SMTP is unavailable.
   */

  if (process.env.NODE_ENV !== "production") {
    console.log("");
    console.log("========================================");
    console.log("🔐 BUDGETIQ DEVELOPMENT OTP");
    console.log(`📧 Email: ${email}`);
    console.log(`🔢 OTP: ${code}`);
    console.log(`⏰ Expires in: ${OTP_TTL_MINUTES} minutes`);
    console.log("========================================");
    console.log("");
  }

  /*
   * Send email.
   *
   * In development, don't prevent registration if SMTP fails.
   * The OTP is already available in the terminal.
   */

  try {
    await sendEmail({
      to: email,
      subject: "Verify your BudgetIQ account",
      text: `Hi ${fullName}, your BudgetIQ verification code is ${code}. It expires in ${OTP_TTL_MINUTES} minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 30px;">
          <h2 style="color: #14274E;">BudgetIQ</h2>

          <p>Hi ${fullName},</p>

          <p>Your BudgetIQ email verification code is:</p>

          <div
            style="
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              color: #14274E;
              margin: 20px 0;
            "
          >
            ${code}
          </div>

          <p>
            This code expires in
            <strong>${OTP_TTL_MINUTES} minutes</strong>.
          </p>

          <p>If you did not create this account, you can ignore this email.</p>
        </div>
      `,
    });

    console.log(`✅ Verification email sent to ${email}`);
  } catch (emailError) {
    console.error("❌ Email sending failed:", emailError.message);

    if (process.env.NODE_ENV === "production") {
      throw emailError;
    }

    console.log(`🔐 DEVELOPMENT OTP: ${code}`);
  }
}

/*
|--------------------------------------------------------------------------
| REGISTER
|--------------------------------------------------------------------------
*/

const register = asyncHandler(async (req, res) => {
  const { fullName, email, password, currency } = req.body;

  /*
   * Validate required fields
   */

  if (!fullName || !email || !password) {
    return res.status(400).json({
      error: "Full name, email, and password are required.",
    });
  }

  /*
   * Validate password
   */

  if (password.length < 8) {
    return res.status(400).json({
      error: "Password must be at least 8 characters.",
    });
  }

  /*
   * Clean input
   */

  const cleanEmail = email.trim().toLowerCase();
  const cleanFullName = fullName.trim();

  /*
   * Check existing account
   */

  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
    cleanEmail,
  ]);

  if (existing.rows.length > 0) {
    return res.status(409).json({
      error: "An account with this email already exists.",
    });
  }

  /*
   * Hash password
   */

  const passwordHash = await bcrypt.hash(password, 12);

  /*
   * Database transaction
   */

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    /*
     * Create user
     */

    const userResult = await client.query(
      `
      INSERT INTO users
        (
          full_name,
          email,
          password_hash,
          currency,
          is_verified
        )
      VALUES
        ($1, $2, $3, $4, FALSE)
      RETURNING
        id,
        full_name,
        email,
        currency,
        is_verified,
        created_at
      `,
      [cleanFullName, cleanEmail, passwordHash, currency || "NGN"],
    );

    const user = userResult.rows[0];

    /*
     * Create default categories
     */

    for (const category of DEFAULT_CATEGORIES) {
      await client.query(
        `
        INSERT INTO categories
          (
            user_id,
            name,
            type,
            color,
            icon
          )
        VALUES
          ($1, $2, $3, $4, $5)
        `,
        [user.id, category.name, category.type, category.color, category.icon],
      );
    }

    /*
     * Create verification OTP
     */

    await issueOtp(client, user.id, user.email, user.full_name);

    await client.query("COMMIT");

    /*
     * User must verify before logging in.
     */

    return res.status(201).json({
      message:
        "Account created. Check your email for a 6-digit verification code.",
      email: user.email,
      requiresVerification: true,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("❌ Registration database error:", error);

    throw error;
  } finally {
    client.release();
  }
});

/*
|--------------------------------------------------------------------------
| VERIFY EMAIL OTP
|--------------------------------------------------------------------------
|
| Accepts both:
|
| { email, code }
|
| and:
|
| { email, otp }
|
| This keeps web and mobile clients compatible.
|--------------------------------------------------------------------------
*/

const verifyOTP = asyncHandler(async (req, res) => {
  const { email, code, otp } = req.body;

  const verificationCode = code || otp;

  if (!email || !verificationCode) {
    return res.status(400).json({
      error: "Email and verification code are required.",
    });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = verificationCode.toString().trim();

  /*
   * Find user
   */

  const userResult = await pool.query(
    `
    SELECT
      id,
      full_name,
      email,
      currency,
      is_verified,
      avatar_url
    FROM users
    WHERE email = $1
    `,
    [cleanEmail],
  );

  const user = userResult.rows[0];

  if (!user) {
    return res.status(404).json({
      error: "No account found for this email.",
    });
  }

  /*
   * Already verified
   */

  if (user.is_verified) {
    return res.status(400).json({
      error: "This account is already verified. Please log in.",
    });
  }

  /*
   * Hash submitted code
   */

  const codeHash = hashSecret(cleanCode);

  /*
   * Find matching active OTP
   */

  const otpResult = await pool.query(
    `
    SELECT
      id,
      code_hash,
      expires_at
    FROM otp_codes
    WHERE user_id = $1
      AND purpose = 'email_verification'
      AND consumed_at IS NULL
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [user.id],
  );

  const otpRecord = otpResult.rows[0];

  if (!otpRecord || otpRecord.code_hash !== codeHash) {
    return res.status(400).json({
      error: "Invalid or expired verification code.",
    });
  }

  /*
   * Verify user + consume OTP atomically
   */

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
      UPDATE users
      SET
        is_verified = TRUE,
        updated_at = NOW()
      WHERE id = $1
      `,
      [user.id],
    );

    await client.query(
      `
      UPDATE otp_codes
      SET consumed_at = NOW()
      WHERE id = $1
      `,
      [otpRecord.id],
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  /*
   * Generate JWT
   */

  const token = signToken(user);

  return res.json({
    message: "Email verified successfully.",
    token,
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      currency: user.currency,
      is_verified: true,
      avatar_url: user.avatar_url,
    },
  });
});

/*
|--------------------------------------------------------------------------
| RESEND EMAIL VERIFICATION OTP
|--------------------------------------------------------------------------
*/

const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      error: "Email is required.",
    });
  }

  const cleanEmail = email.trim().toLowerCase();

  /*
   * Find user
   */

  const userResult = await pool.query(
    `
    SELECT
      id,
      full_name,
      email,
      is_verified
    FROM users
    WHERE email = $1
    `,
    [cleanEmail],
  );

  /*
   * Don't reveal whether an account exists.
   */

  if (userResult.rows.length === 0) {
    return res.json({
      message: "If that account needs verifying, a new code has been sent.",
    });
  }

  const user = userResult.rows[0];

  /*
   * Already verified
   */

  if (user.is_verified) {
    return res.json({
      message: "If that account needs verifying, a new code has been sent.",
    });
  }

  /*
   * Invalidate previous verification OTPs
   */

  await pool.query(
    `
    UPDATE otp_codes
    SET consumed_at = NOW()
    WHERE user_id = $1
      AND purpose = 'email_verification'
      AND consumed_at IS NULL
    `,
    [user.id],
  );

  /*
   * Create and send new OTP
   */

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await issueOtp(client, user.id, user.email, user.full_name);

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return res.json({
    message: "If that account needs verifying, a new code has been sent.",
  });
});

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: "Email and password are required.",
    });
  }

  const cleanEmail = email.trim().toLowerCase();

  /*
   * Find user
   */

  const result = await pool.query(
    `
    SELECT
      id,
      full_name,
      email,
      password_hash,
      currency,
      is_verified,
      avatar_url
    FROM users
    WHERE email = $1
    `,
    [cleanEmail],
  );

  const user = result.rows[0];

  if (!user) {
    return res.status(401).json({
      error: "Incorrect email or password.",
    });
  }

  /*
   * Check password
   */

  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    return res.status(401).json({
      error: "Incorrect email or password.",
    });
  }

  /*
   * Check email verification
   */

  if (!user.is_verified) {
    return res.status(403).json({
      error: "Please verify your email before logging in.",
      code: "EMAIL_NOT_VERIFIED",
      requiresVerification: true,
      email: user.email,
    });
  }

  /*
   * Remove password hash
   */

  delete user.password_hash;

  /*
   * Generate JWT
   */

  const token = signToken(user);

  return res.json({
    token,
    user,
  });
});

/*
|--------------------------------------------------------------------------
| FORGOT PASSWORD — RESET LINK
|--------------------------------------------------------------------------
*/

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      error: "Email is required.",
    });
  }

  const cleanEmail = email.trim().toLowerCase();

  const result = await pool.query(
    `
    SELECT
      id,
      full_name,
      email
    FROM users
    WHERE email = $1
    `,
    [cleanEmail],
  );

  const user = result.rows[0];

  /*
   * Same response regardless of account existence.
   */

  if (user) {
    const rawToken = generateResetToken();

    await pool.query(
      `
      INSERT INTO password_resets
        (
          user_id,
          token_hash,
          expires_at
        )
      VALUES
        ($1, $2, $3)
      `,
      [user.id, hashSecret(rawToken), minutesFromNow(RESET_TOKEN_TTL_MINUTES)],
    );

    const resetUrl =
      `${process.env.CLIENT_ORIGIN || "http://localhost:5173"}` +
      `/reset-password?token=${rawToken}` +
      `&email=${encodeURIComponent(user.email)}`;

    await sendEmail({
      to: user.email,
      subject: "Reset your BudgetIQ password",
      text: `
Hi ${user.full_name},

Reset your BudgetIQ password here:

${resetUrl}

This link expires in ${RESET_TOKEN_TTL_MINUTES} minutes.
      `,
      html: `
        <p>Hi ${user.full_name},</p>

        <p>
          Click below to reset your BudgetIQ password.
        </p>

        <p>
          <a href="${resetUrl}">
            Reset your password
          </a>
        </p>

        <p>
          This link expires in
          ${RESET_TOKEN_TTL_MINUTES} minutes.
        </p>
      `,
    });
  }

  return res.json({
    message: "If that email is registered, a reset link has been sent.",
  });
});

/*
|--------------------------------------------------------------------------
| RESET PASSWORD — RESET LINK
|--------------------------------------------------------------------------
*/

const resetPassword = asyncHandler(async (req, res) => {
  const { email, token, newPassword } = req.body;

  if (!email || !token || !newPassword) {
    return res.status(400).json({
      error: "Email, token, and new password are required.",
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      error: "Password must be at least 8 characters.",
    });
  }

  const cleanEmail = email.trim().toLowerCase();

  const userResult = await pool.query("SELECT id FROM users WHERE email = $1", [
    cleanEmail,
  ]);

  const user = userResult.rows[0];

  if (!user) {
    return res.status(400).json({
      error: "Invalid or expired reset link.",
    });
  }

  const tokenResult = await pool.query(
    `
    SELECT
      id,
      token_hash,
      expires_at
    FROM password_resets
    WHERE user_id = $1
      AND consumed_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [user.id],
  );

  const reset = tokenResult.rows[0];

  if (!reset || reset.token_hash !== hashSecret(token)) {
    return res.status(400).json({
      error: "Invalid or expired reset link.",
    });
  }

  if (new Date(reset.expires_at) < new Date()) {
    return res.status(400).json({
      error: "This reset link has expired. Request a new one.",
    });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
      UPDATE users
      SET
        password_hash = $1,
        updated_at = NOW()
      WHERE id = $2
      `,
      [passwordHash, user.id],
    );

    await client.query(
      `
      UPDATE password_resets
      SET consumed_at = NOW()
      WHERE id = $1
      `,
      [reset.id],
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return res.json({
    message: "Password updated. You can now log in with your new password.",
  });
});

/*
|--------------------------------------------------------------------------
| FORGOT PASSWORD — OTP
|--------------------------------------------------------------------------
*/

const forgotPasswordOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      error: "Email is required.",
    });
  }

  const cleanEmail = email.trim().toLowerCase();

  const result = await pool.query(
    `
    SELECT
      id,
      full_name,
      email
    FROM users
    WHERE email = $1
    `,
    [cleanEmail],
  );

  const user = result.rows[0];

  /*
   * Don't reveal whether account exists.
   */

  if (user) {
    /*
     * Invalidate old reset OTPs
     */

    await pool.query(
      `
      UPDATE otp_codes
      SET consumed_at = NOW()
      WHERE user_id = $1
        AND purpose = 'password_reset'
        AND consumed_at IS NULL
      `,
      [user.id],
    );

    /*
     * Generate new reset OTP
     */

    const code = generateOtp();

    /*
     * Save OTP
     */

    await pool.query(
      `
      INSERT INTO otp_codes
        (
          user_id,
          code_hash,
          purpose,
          expires_at
        )
      VALUES
        ($1, $2, 'password_reset', $3)
      `,
      [user.id, hashSecret(code), minutesFromNow(OTP_TTL_MINUTES)],
    );

    /*
     * Development OTP
     */

    if (process.env.NODE_ENV !== "production") {
      console.log("");
      console.log("========================================");
      console.log("🔐 BUDGETIQ PASSWORD RESET OTP");
      console.log(`📧 Email: ${user.email}`);
      console.log(`🔢 OTP: ${code}`);
      console.log(`⏰ Expires in: ${OTP_TTL_MINUTES} minutes`);
      console.log("========================================");
      console.log("");
    }

    /*
     * Send email
     */

    try {
      await sendEmail({
        to: user.email,
        subject: "Reset your BudgetIQ password",
        text: `
Hi ${user.full_name},

Your BudgetIQ password reset code is ${code}.

It expires in ${OTP_TTL_MINUTES} minutes.
        `,
        html: `
          <p>Hi ${user.full_name},</p>

          <p>Your BudgetIQ password reset code is:</p>

          <h2>${code}</h2>

          <p>
            It expires in
            ${OTP_TTL_MINUTES} minutes.
          </p>
        `,
      });

      console.log(`✅ Password reset email sent to ${user.email}`);
    } catch (emailError) {
      console.error("❌ Password reset email failed:", emailError.message);

      if (process.env.NODE_ENV === "production") {
        throw emailError;
      }

      console.log(`🔐 DEVELOPMENT PASSWORD RESET OTP: ${code}`);
    }
  }

  return res.json({
    message: "If that email is registered, a reset code has been sent.",
  });
});

/*
|--------------------------------------------------------------------------
| VERIFY PASSWORD RESET OTP
|--------------------------------------------------------------------------
*/

const verifyResetOtp = asyncHandler(async (req, res) => {
  const { email, code, otp } = req.body;

  const verificationCode = code || otp;

  if (!email || !verificationCode) {
    return res.status(400).json({
      error: "Email and code are required.",
    });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = verificationCode.toString().trim();

  const userResult = await pool.query("SELECT id FROM users WHERE email = $1", [
    cleanEmail,
  ]);

  const user = userResult.rows[0];

  if (!user) {
    return res.status(400).json({
      error: "Invalid or expired code.",
    });
  }

  const otpResult = await pool.query(
    `
    SELECT
      id,
      code_hash,
      expires_at
    FROM otp_codes
    WHERE user_id = $1
      AND purpose = 'password_reset'
      AND consumed_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [user.id],
  );

  const otpRecord = otpResult.rows[0];

  if (!otpRecord || otpRecord.code_hash !== hashSecret(cleanCode)) {
    return res.status(400).json({
      error: "Incorrect code.",
    });
  }

  if (new Date(otpRecord.expires_at) < new Date()) {
    return res.status(400).json({
      error: "Code expired.",
    });
  }

  return res.json({
    message: "Code verified. You may now reset your password.",
    verified: true,
  });
});

/*
|--------------------------------------------------------------------------
| RESET PASSWORD — OTP
|--------------------------------------------------------------------------
*/

const resetPasswordWithOtp = asyncHandler(async (req, res) => {
  const { email, code, otp, newPassword } = req.body;

  const resetCode = code || otp;

  if (!email || !resetCode || !newPassword) {
    return res.status(400).json({
      error: "Email, code, and new password are required.",
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      error: "Password must be at least 8 characters.",
    });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = resetCode.toString().trim();

  const userResult = await pool.query("SELECT id FROM users WHERE email = $1", [
    cleanEmail,
  ]);

  const user = userResult.rows[0];

  if (!user) {
    return res.status(400).json({
      error: "Invalid request.",
    });
  }

  const otpResult = await pool.query(
    `
      SELECT
        id,
        code_hash,
        expires_at
      FROM otp_codes
      WHERE user_id = $1
        AND purpose = 'password_reset'
        AND consumed_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
      `,
    [user.id],
  );

  const otpRecord = otpResult.rows[0];

  if (!otpRecord || otpRecord.code_hash !== hashSecret(cleanCode)) {
    return res.status(400).json({
      error: "Incorrect or expired code.",
    });
  }

  if (new Date(otpRecord.expires_at) < new Date()) {
    return res.status(400).json({
      error: "Code expired.",
    });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  /*
   * Update password and consume OTP atomically
   */

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
        UPDATE users
        SET
          password_hash = $1,
          updated_at = NOW()
        WHERE id = $2
        `,
      [passwordHash, user.id],
    );

    await client.query(
      `
        UPDATE otp_codes
        SET consumed_at = NOW()
        WHERE id = $1
        `,
      [otpRecord.id],
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return res.json({
    message: "Password updated. You can now log in.",
  });
});

/*
|--------------------------------------------------------------------------
| CURRENT USER
|--------------------------------------------------------------------------
*/

const me = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `
    SELECT
      id,
      full_name,
      email,
      currency,
      is_verified,
      avatar_url,
      created_at
    FROM users
    WHERE id = $1
    `,
    [req.user.id],
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      error: "User not found.",
    });
  }

  return res.json({
    user: result.rows[0],
  });
});

/*
|--------------------------------------------------------------------------
| MOBILE PROFILE AVATAR
|--------------------------------------------------------------------------
|
| Used by mobile multipart/form-data upload.
|--------------------------------------------------------------------------
*/

const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: "Please select an image to upload.",
    });
  }

  const avatarUrl = `/uploads/${req.file.filename}`;

  const result = await pool.query(
    `
    UPDATE users
    SET avatar_url = $1
    WHERE id = $2
    RETURNING
      id,
      full_name,
      email,
      currency,
      is_verified,
      avatar_url
    `,
    [avatarUrl, req.user.id],
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      error: "User not found.",
    });
  }

  console.log(`✅ Avatar uploaded for ${result.rows[0].email}: ${avatarUrl}`);

  return res.json({
    message: "Profile picture uploaded successfully.",
    user: result.rows[0],
  });
});

/*
|--------------------------------------------------------------------------
| WEB PROFILE AVATAR
|--------------------------------------------------------------------------
|
| Existing web frontend sends a base64 data URL.
|--------------------------------------------------------------------------
*/

const updateAvatar = asyncHandler(async (req, res) => {
  const { avatarDataUrl } = req.body;

  if (
    !avatarDataUrl ||
    typeof avatarDataUrl !== "string" ||
    !avatarDataUrl.startsWith("data:image/")
  ) {
    return res.status(400).json({
      error: "A valid image is required.",
    });
  }

  /*
   * Guard against excessively large images.
   */

  if (avatarDataUrl.length > 600000) {
    return res.status(413).json({
      error: "Image is too large. Please choose a smaller picture.",
    });
  }

  const result = await pool.query(
    `
    UPDATE users
    SET avatar_url = $1
    WHERE id = $2
    RETURNING
      id,
      full_name,
      email,
      currency,
      is_verified,
      avatar_url
    `,
    [avatarDataUrl, req.user.id],
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      error: "User not found.",
    });
  }

  return res.json({
    user: result.rows[0],
  });
});

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
|
| These names must match the routes.
|--------------------------------------------------------------------------
*/

module.exports = {
  register,

  // Email verification
  verifyOTP,
  resendOTP,

  // Login
  login,

  // Password reset — link
  forgotPassword,
  resetPassword,

  // Password reset — OTP
  forgotPasswordOtp,
  verifyResetOtp,
  resetPasswordWithOtp,

  // Current user
  me,

  // Avatars
  uploadAvatar,
  updateAvatar,
};
