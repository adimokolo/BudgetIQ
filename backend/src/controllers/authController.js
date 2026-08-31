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

const DEFAULT_CATEGORIES = [
  { name: "Salary", type: "income", color: "#3DDC97", icon: "wallet" },
  { name: "Freelance", type: "income", color: "#5DD5E8", icon: "briefcase" },
  {
    name: "Food & Groceries",
    type: "expense",
    color: "#FF8FA3",
    icon: "shopping-cart",
  },
  { name: "Transport", type: "expense", color: "#FFC96B", icon: "car" },
  {
    name: "Housing & Utilities",
    type: "expense",
    color: "#8C7CF0",
    icon: "home",
  },
  { name: "Entertainment", type: "expense", color: "#63C7FF", icon: "film" },
  { name: "Health", type: "expense", color: "#FF6B9D", icon: "heart" },
  { name: "Savings", type: "expense", color: "#4FD1C5", icon: "piggy-bank" },
];

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

async function issueOtp(client, userId, email, fullName) {
  const code = generateOtp();
  await client.query(
    `INSERT INTO otp_codes (user_id, code_hash, purpose, expires_at)
     VALUES ($1, $2, 'email_verification', $3)`,
    [userId, hashSecret(code), minutesFromNow(OTP_TTL_MINUTES)],
  );

  await sendEmail({
    to: email,
    subject: "Verify your BudgetIQ account",
    text: `Hi ${fullName}, your BudgetIQ verification code is ${code}. It expires in ${OTP_TTL_MINUTES} minutes.`,
    html: `<p>Hi ${fullName},</p><p>Your BudgetIQ verification code is:</p><h2>${code}</h2><p>It expires in ${OTP_TTL_MINUTES} minutes.</p>`,
  });
}

const register = asyncHandler(async (req, res) => {
  const { fullName, email, password, currency } = req.body;

  if (!fullName || !email || !password) {
    return res
      .status(400)
      .json({ error: "Full name, email, and password are required." });
  }
  if (password.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters." });
  }

  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
    email.toLowerCase(),
  ]);
  if (existing.rows.length > 0) {
    return res
      .status(409)
      .json({ error: "An account with this email already exists." });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const userResult = await client.query(
      `INSERT INTO users (full_name, email, password_hash, currency, is_verified)
       VALUES ($1, $2, $3, $4, FALSE)
       RETURNING id, full_name, email, currency, is_verified, created_at`,
      [fullName, email.toLowerCase(), passwordHash, currency || "NGN"],
    );
    const user = userResult.rows[0];

    const categoryValues = DEFAULT_CATEGORIES.map(
      (c) =>
        `('${user.id}', '${c.name.replace(/'/g, "''")}', '${c.type}', '${c.color}', '${c.icon}')`,
    ).join(",");

    await client.query(
      `INSERT INTO categories (user_id, name, type, color, icon) VALUES ${categoryValues}`,
    );

    await issueOtp(client, user.id, user.email, user.full_name);

    await client.query("COMMIT");

    // No token yet - the account must be verified via OTP before it can log in.
    res.status(201).json({
      message:
        "Account created. Check your email for a 6-digit verification code.",
      email: user.email,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: "Email and code are required." });
  }

  const userResult = await pool.query(
    "SELECT id, full_name, email, currency, is_verified, avatar_url FROM users WHERE email = $1",
    [email.toLowerCase()],
  );
  const user = userResult.rows[0];
  if (!user) {
    return res.status(404).json({ error: "No account found for this email." });
  }
  if (user.is_verified) {
    return res
      .status(400)
      .json({ error: "This account is already verified. Please log in." });
  }

  const otpResult = await pool.query(
    `SELECT id, code_hash, expires_at FROM otp_codes
     WHERE user_id = $1 AND purpose = 'email_verification' AND consumed_at IS NULL
     ORDER BY created_at DESC LIMIT 1`,
    [user.id],
  );
  const otp = otpResult.rows[0];

  if (!otp || otp.code_hash !== hashSecret(code)) {
    return res.status(400).json({ error: "Incorrect verification code." });
  }
  if (new Date(otp.expires_at) < new Date()) {
    return res
      .status(400)
      .json({ error: "This code has expired. Request a new one." });
  }

  await pool.query("UPDATE otp_codes SET consumed_at = now() WHERE id = $1", [
    otp.id,
  ]);
  await pool.query("UPDATE users SET is_verified = TRUE WHERE id = $1", [
    user.id,
  ]);

  const token = signToken(user);
  res.json({
    token,
    user: { ...user, is_verified: true },
  });
});

const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  const userResult = await pool.query(
    "SELECT id, full_name, email, is_verified FROM users WHERE email = $1",
    [email.toLowerCase()],
  );
  const user = userResult.rows[0];

  // Always respond the same way whether or not the account exists, so this
  // endpoint can't be used to enumerate registered emails.
  if (user && !user.is_verified) {
    await issueOtp(pool, user.id, user.email, user.full_name);
  }

  res.json({
    message: "If that account needs verifying, a new code has been sent.",
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const result = await pool.query(
    "SELECT id, full_name, email, password_hash, currency, is_verified, avatar_url FROM users WHERE email = $1",
    [email.toLowerCase()],
  );
  const user = result.rows[0];

  if (!user) {
    return res.status(401).json({ error: "Incorrect email or password." });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: "Incorrect email or password." });
  }

  if (!user.is_verified) {
    return res.status(403).json({
      error: "Please verify your email before logging in.",
      code: "EMAIL_NOT_VERIFIED",
      email: user.email,
    });
  }

  const token = signToken(user);
  delete user.password_hash;
  res.json({ token, user });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  const result = await pool.query(
    "SELECT id, full_name, email FROM users WHERE email = $1",
    [email.toLowerCase()],
  );
  const user = result.rows[0];

  // Same response regardless of whether the account exists, to avoid
  // leaking which emails are registered.
  if (user) {
    const rawToken = generateResetToken();
    await pool.query(
      `INSERT INTO password_resets (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, hashSecret(rawToken), minutesFromNow(RESET_TOKEN_TTL_MINUTES)],
    );

    const resetUrl = `${process.env.CLIENT_ORIGIN || "http://localhost:5173"}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;

    await sendEmail({
      to: user.email,
      subject: "Reset your BudgetIQ password",
      text: `Hi ${user.full_name}, reset your password here: ${resetUrl} (expires in ${RESET_TOKEN_TTL_MINUTES} minutes).`,
      html: `<p>Hi ${user.full_name},</p><p>Click below to reset your BudgetIQ password. This link expires in ${RESET_TOKEN_TTL_MINUTES} minutes.</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    });
  }

  res.json({
    message: "If that email is registered, a reset link has been sent.",
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { email, token, newPassword } = req.body;
  if (!email || !token || !newPassword) {
    return res
      .status(400)
      .json({ error: "Email, token, and new password are required." });
  }
  if (newPassword.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters." });
  }

  const userResult = await pool.query("SELECT id FROM users WHERE email = $1", [
    email.toLowerCase(),
  ]);
  const user = userResult.rows[0];
  if (!user) {
    return res.status(400).json({ error: "Invalid or expired reset link." });
  }

  const tokenResult = await pool.query(
    `SELECT id, token_hash, expires_at FROM password_resets
     WHERE user_id = $1 AND consumed_at IS NULL
     ORDER BY created_at DESC LIMIT 1`,
    [user.id],
  );
  const reset = tokenResult.rows[0];

  if (!reset || reset.token_hash !== hashSecret(token)) {
    return res.status(400).json({ error: "Invalid or expired reset link." });
  }
  if (new Date(reset.expires_at) < new Date()) {
    return res
      .status(400)
      .json({ error: "This reset link has expired. Request a new one." });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
      passwordHash,
      user.id,
    ]);
    await client.query(
      "UPDATE password_resets SET consumed_at = now() WHERE id = $1",
      [reset.id],
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  res.json({
    message: "Password updated. You can now log in with your new password.",
  });
});

const forgotPasswordOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required." });

  const result = await pool.query(
    "SELECT id, full_name, email FROM users WHERE email = $1",
    [email.toLowerCase()],
  );
  const user = result.rows[0];

  if (user) {
    await pool.query(
      `UPDATE otp_codes SET consumed_at = now()
       WHERE user_id = $1 AND purpose = 'password_reset' AND consumed_at IS NULL`,
      [user.id],
    );
    const code = generateOtp();
    await pool.query(
      `INSERT INTO otp_codes (user_id, code_hash, purpose, expires_at)
       VALUES ($1, $2, 'password_reset', $3)`,
      [user.id, hashSecret(code), minutesFromNow(OTP_TTL_MINUTES)],
    );
    await sendEmail({
      to: user.email,
      subject: "Reset your BudgetIQ password",
      text: `Hi ${user.full_name}, your password reset code is ${code}. It expires in ${OTP_TTL_MINUTES} minutes.`,
      html: `<p>Hi ${user.full_name},</p><p>Your BudgetIQ password reset code is:</p><h2>${code}</h2><p>It expires in ${OTP_TTL_MINUTES} minutes.</p>`,
    });
  }

  res.json({
    message: "If that email is registered, a reset code has been sent.",
  });
});

const verifyResetOtp = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code)
    return res.status(400).json({ error: "Email and code are required." });

  const userResult = await pool.query("SELECT id FROM users WHERE email = $1", [
    email.toLowerCase(),
  ]);
  const user = userResult.rows[0];
  if (!user) return res.status(400).json({ error: "Invalid or expired code." });

  const otpResult = await pool.query(
    `SELECT id, code_hash, expires_at FROM otp_codes
     WHERE user_id = $1 AND purpose = 'password_reset' AND consumed_at IS NULL
     ORDER BY created_at DESC LIMIT 1`,
    [user.id],
  );
  const otp = otpResult.rows[0];
  if (!otp || otp.code_hash !== hashSecret(code))
    return res.status(400).json({ error: "Incorrect code." });
  if (new Date(otp.expires_at) < new Date())
    return res.status(400).json({ error: "Code expired." });

  res.json({
    message: "Code verified. You may now reset your password.",
    verified: true,
  });
});

const resetPasswordWithOtp = asyncHandler(async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword)
    return res
      .status(400)
      .json({ error: "Email, code, and new password are required." });
  if (newPassword.length < 8)
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters." });

  const userResult = await pool.query("SELECT id FROM users WHERE email = $1", [
    email.toLowerCase(),
  ]);
  const user = userResult.rows[0];
  if (!user) return res.status(400).json({ error: "Invalid request." });

  const otpResult = await pool.query(
    `SELECT id, code_hash, expires_at FROM otp_codes
     WHERE user_id = $1 AND purpose = 'password_reset' AND consumed_at IS NULL
     ORDER BY created_at DESC LIMIT 1`,
    [user.id],
  );
  const otp = otpResult.rows[0];
  if (!otp || otp.code_hash !== hashSecret(code))
    return res.status(400).json({ error: "Incorrect or expired code." });
  if (new Date(otp.expires_at) < new Date())
    return res.status(400).json({ error: "Code expired." });

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
    passwordHash,
    user.id,
  ]);
  await pool.query("UPDATE otp_codes SET consumed_at = now() WHERE id = $1", [
    otp.id,
  ]);

  res.json({ message: "Password updated. You can now log in." });
});

const me = asyncHandler(async (req, res) => {
  const result = await pool.query(
    "SELECT id, full_name, email, currency, is_verified, avatar_url, created_at FROM users WHERE id = $1",
    [req.user.id],
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "User not found." });
  }
  res.json({ user: result.rows[0] });
});

const updateAvatar = asyncHandler(async (req, res) => {
  const { avatarDataUrl } = req.body;

  if (
    !avatarDataUrl ||
    typeof avatarDataUrl !== "string" ||
    !avatarDataUrl.startsWith("data:image/")
  ) {
    return res.status(400).json({ error: "A valid image is required." });
  }
  // Frontend resizes to ~240px before sending, so a well-formed upload should
  // land well under this - this just guards against something malformed/huge.
  if (avatarDataUrl.length > 600000) {
    return res
      .status(413)
      .json({ error: "Image is too large. Please choose a smaller picture." });
  }

  const result = await pool.query(
    `UPDATE users SET avatar_url = $1 WHERE id = $2
     RETURNING id, full_name, email, currency, is_verified, avatar_url`,
    [avatarDataUrl, req.user.id],
  );

  res.json({ user: result.rows[0] });
});

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  login,
  forgotPassword,
  resetPassword,
  forgotPasswordOtp, // new
  verifyResetOtp, // new
  resetPasswordWithOtp, // new
  me,
  updateAvatar,
};
