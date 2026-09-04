const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const pool = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");

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
| EMAIL / SMTP CONFIGURATION
|--------------------------------------------------------------------------
*/

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),

  secure: false,

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },

  tls: {
    rejectUnauthorized: false,
  },
});

/*
|--------------------------------------------------------------------------
| TEST SMTP CONNECTION
|--------------------------------------------------------------------------
*/

transporter.verify((error) => {
  if (error) {
    console.error("❌ SMTP ERROR:", error.message);
  } else {
    console.log("✅ SMTP server is ready");
  }
});

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
| GENERATE OTP
|--------------------------------------------------------------------------
*/

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/*
|--------------------------------------------------------------------------
| HASH OTP / TOKEN
|--------------------------------------------------------------------------
*/

function hashOTP(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

/*
|--------------------------------------------------------------------------
| SEND VERIFICATION EMAIL
|--------------------------------------------------------------------------
*/

async function sendVerificationEmail(email, code) {
  return transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject: "BudgetIQ Email Verification",

    text: `
Your BudgetIQ verification code is ${code}.

This code expires in 10 minutes.

If you did not create this account, you can ignore this email.
    `,

    html: `
      <div
        style="
          font-family: Arial, sans-serif;
          max-width: 500px;
          margin: auto;
          padding: 30px;
        "
      >
        <h2 style="color: #14274E;">
          BudgetIQ
        </h2>

        <p>
          Thank you for creating your BudgetIQ account.
        </p>

        <p>
          Your email verification code is:
        </p>

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
          This code will expire in
          <strong>10 minutes</strong>.
        </p>

        <p>
          If you did not create this account,
          you can ignore this email.
        </p>
      </div>
    `,
  });
}

/*
|--------------------------------------------------------------------------
| SEND PASSWORD RESET OTP EMAIL
|--------------------------------------------------------------------------
*/

async function sendPasswordResetOtpEmail(email, code) {
  return transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject: "BudgetIQ Password Reset Code",

    text: `
Your BudgetIQ password reset code is ${code}.

This code expires in 10 minutes.

If you did not request a password reset, you can ignore this email.
    `,

    html: `
      <div
        style="
          font-family: Arial, sans-serif;
          max-width: 500px;
          margin: auto;
          padding: 30px;
        "
      >
        <h2 style="color: #14274E;">
          BudgetIQ
        </h2>

        <p>
          We received a request to reset your BudgetIQ password.
        </p>

        <p>
          Your password reset code is:
        </p>

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
          This code will expire in
          <strong>10 minutes</strong>.
        </p>

        <p>
          If you did not request this password reset,
          you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

/*
|--------------------------------------------------------------------------
| REGISTER
|--------------------------------------------------------------------------
*/

const register = asyncHandler(async (req, res) => {
  const { fullName, email, password, currency } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({
      error: "Full name, email, and password are required.",
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      error: "Password must be at least 8 characters.",
    });
  }

  const cleanEmail = email.trim().toLowerCase();

  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
    cleanEmail,
  ]);

  if (existing.rows.length > 0) {
    return res.status(409).json({
      error: "An account with this email already exists.",
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

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
      [fullName.trim(), cleanEmail, passwordHash, currency || "NGN"],
    );

    const user = userResult.rows[0];

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

    const otp = generateOTP();
    const otpHash = hashOTP(otp);

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await client.query(
      `
      INSERT INTO otp_codes
        (
          user_id,
          code_hash,
          purpose,
          expires_at
        )
      VALUES
        (
          $1,
          $2,
          'email_verification',
          $3
        )
      `,
      [user.id, otpHash, expiresAt],
    );

    await client.query("COMMIT");

    if (process.env.NODE_ENV !== "production") {
      console.log("");
      console.log("========================================");
      console.log("🔐 BUDGETIQ DEVELOPMENT OTP");
      console.log(`📧 Email: ${cleanEmail}`);
      console.log(`🔢 OTP: ${otp}`);
      console.log("⏰ Expires in: 10 minutes");
      console.log("========================================");
      console.log("");
    }

    try {
      await sendVerificationEmail(cleanEmail, otp);

      console.log(`✅ Verification email sent to ${cleanEmail}`);
    } catch (emailError) {
      console.error("❌ Email sending failed:", emailError.message);

      if (process.env.NODE_ENV !== "production") {
        console.log(`🔐 DEVELOPMENT OTP: ${otp}`);
      }
    }

    return res.status(201).json({
      message: "Account created. Please verify your email.",
      email: cleanEmail,
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

  const userResult = await pool.query(
    `
    SELECT
      id,
      full_name,
      email,
      currency,
      is_verified
    FROM users
    WHERE email = $1
    `,
    [cleanEmail],
  );

  const user = userResult.rows[0];

  if (!user) {
    return res.status(404).json({
      error: "User not found.",
    });
  }

  if (user.is_verified) {
    return res.status(400).json({
      error: "This account is already verified.",
    });
  }

  const codeHash = hashOTP(verificationCode.toString().trim());

  const otpResult = await pool.query(
    `
    SELECT id
    FROM otp_codes
    WHERE user_id = $1
      AND purpose = 'email_verification'
      AND code_hash = $2
      AND consumed_at IS NULL
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [user.id, codeHash],
  );

  if (otpResult.rows.length === 0) {
    return res.status(400).json({
      error: "Invalid or expired verification code.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
      UPDATE users
      SET is_verified = TRUE,
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
      [otpResult.rows[0].id],
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

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
    },
  });
});

/*
|--------------------------------------------------------------------------
| RESEND EMAIL OTP
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

  const userResult = await pool.query(
    `
    SELECT
      id,
      email,
      is_verified
    FROM users
    WHERE email = $1
    `,
    [cleanEmail],
  );

  if (userResult.rows.length === 0) {
    return res.json({
      message: "If the account exists, a verification code has been sent.",
    });
  }

  const user = userResult.rows[0];

  if (user.is_verified) {
    return res.json({
      message: "If the account exists, a verification code has been sent.",
    });
  }

  const otp = generateOTP();
  const otpHash = hashOTP(otp);

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

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
      (
        $1,
        $2,
        'email_verification',
        $3
      )
    `,
    [user.id, otpHash, expiresAt],
  );

  if (process.env.NODE_ENV !== "production") {
    console.log("");
    console.log("========================================");
    console.log("🔐 BUDGETIQ RESENT OTP");
    console.log(`📧 Email: ${cleanEmail}`);
    console.log(`🔢 OTP: ${otp}`);
    console.log("⏰ Expires in: 10 minutes");
    console.log("========================================");
    console.log("");
  }

  try {
    await sendVerificationEmail(cleanEmail, otp);

    console.log(`✅ New verification email sent to ${cleanEmail}`);
  } catch (emailError) {
    console.error("❌ Email sending failed:", emailError.message);

    if (process.env.NODE_ENV !== "production") {
      console.log(`🔐 DEVELOPMENT OTP: ${otp}`);
    }
  }

  return res.json({
    message: "If the account exists, a verification code has been sent.",
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

  const result = await pool.query(
    `
    SELECT
      id,
      full_name,
      email,
      password_hash,
      currency,
      is_verified
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

  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    return res.status(401).json({
      error: "Incorrect email or password.",
    });
  }

  if (!user.is_verified) {
    return res.status(403).json({
      error: "Please verify your email before logging in.",
      requiresVerification: true,
      email: user.email,
    });
  }

  delete user.password_hash;

  const token = signToken(user);

  return res.json({
    token,
    user,
  });
});

/*
|--------------------------------------------------------------------------
| FORGOT PASSWORD
| Legacy / Link-Based Endpoint
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

  const userResult = await pool.query(
    `
    SELECT id, email
    FROM users
    WHERE email = $1
    `,
    [cleanEmail],
  );

  /*
   * Do not reveal whether an account exists.
   */

  if (userResult.rows.length === 0) {
    return res.json({
      message:
        "If the account exists, a password reset request has been created.",
    });
  }

  const user = userResult.rows[0];

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashOTP(token);

  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await pool.query(
    `
    UPDATE password_resets
    SET consumed_at = NOW()
    WHERE user_id = $1
      AND consumed_at IS NULL
    `,
    [user.id],
  );

  await pool.query(
    `
    INSERT INTO password_resets
      (
        user_id,
        token_hash,
        expires_at
      )
    VALUES
      (
        $1,
        $2,
        $3
      )
    `,
    [user.id, tokenHash, expiresAt],
  );

  /*
   * The token is intentionally not emailed here because
   * the mobile application uses the OTP flow below.
   *
   * It is returned only during development.
   */

  if (process.env.NODE_ENV !== "production") {
    console.log("");
    console.log("========================================");
    console.log("🔐 BUDGETIQ PASSWORD RESET TOKEN");
    console.log(`📧 Email: ${cleanEmail}`);
    console.log(`🔑 Token: ${token}`);
    console.log("⏰ Expires in: 30 minutes");
    console.log("========================================");
    console.log("");
  }

  return res.json({
    message:
      "If the account exists, a password reset request has been created.",
  });
});

/*
|--------------------------------------------------------------------------
| RESET PASSWORD
| Legacy / Token-Based Endpoint
|--------------------------------------------------------------------------
*/

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password, newPassword } = req.body;

  const finalPassword = newPassword || password;

  if (!token || !finalPassword) {
    return res.status(400).json({
      error: "Reset token and new password are required.",
    });
  }

  if (finalPassword.length < 8) {
    return res.status(400).json({
      error: "Password must be at least 8 characters.",
    });
  }

  const tokenHash = hashOTP(token.trim());

  const resetResult = await pool.query(
    `
    SELECT
      id,
      user_id
    FROM password_resets
    WHERE token_hash = $1
      AND consumed_at IS NULL
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [tokenHash],
  );

  if (resetResult.rows.length === 0) {
    return res.status(400).json({
      error: "Invalid or expired reset token.",
    });
  }

  const reset = resetResult.rows[0];

  const passwordHash = await bcrypt.hash(finalPassword, 12);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
      UPDATE users
      SET password_hash = $1,
          updated_at = NOW()
      WHERE id = $2
      `,
      [passwordHash, reset.user_id],
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
    message: "Password reset successfully.",
  });
});

/*
|--------------------------------------------------------------------------
| FORGOT PASSWORD OTP
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

  const userResult = await pool.query(
    `
    SELECT
      id,
      email
    FROM users
    WHERE email = $1
    `,
    [cleanEmail],
  );

  /*
   * Always return the same response so we do not
   * reveal whether an email is registered.
   */

  if (userResult.rows.length === 0) {
    return res.json({
      message: "If the account exists, a password reset code has been sent.",
    });
  }

  const user = userResult.rows[0];

  /*
   * Generate six-digit reset OTP.
   */

  const otp = generateOTP();
  const tokenHash = hashOTP(otp);

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  /*
   * Invalidate previous reset codes.
   */

  await pool.query(
    `
    UPDATE password_resets
    SET consumed_at = NOW()
    WHERE user_id = $1
      AND consumed_at IS NULL
    `,
    [user.id],
  );

  /*
   * Store hashed OTP.
   */

  await pool.query(
    `
    INSERT INTO password_resets
      (
        user_id,
        token_hash,
        expires_at
      )
    VALUES
      (
        $1,
        $2,
        $3
      )
    `,
    [user.id, tokenHash, expiresAt],
  );

  /*
   * Print OTP in development.
   */

  if (process.env.NODE_ENV !== "production") {
    console.log("");
    console.log("========================================");
    console.log("🔐 BUDGETIQ PASSWORD RESET OTP");
    console.log(`📧 Email: ${cleanEmail}`);
    console.log(`🔢 OTP: ${otp}`);
    console.log("⏰ Expires in: 10 minutes");
    console.log("========================================");
    console.log("");
  }

  /*
   * Send email.
   */

  try {
    await sendPasswordResetOtpEmail(cleanEmail, otp);

    console.log(`✅ Password reset OTP sent to ${cleanEmail}`);
  } catch (emailError) {
    console.error("❌ Password reset email failed:", emailError.message);

    if (process.env.NODE_ENV !== "production") {
      console.log(`🔐 DEVELOPMENT PASSWORD RESET OTP: ${otp}`);
    }
  }

  return res.json({
    message: "If the account exists, a password reset code has been sent.",
    email: cleanEmail,
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
      error: "Email and verification code are required.",
    });
  }

  const cleanEmail = email.trim().toLowerCase();

  const userResult = await pool.query(
    `
    SELECT id, email
    FROM users
    WHERE email = $1
    `,
    [cleanEmail],
  );

  if (userResult.rows.length === 0) {
    return res.status(400).json({
      error: "Invalid or expired reset code.",
    });
  }

  const user = userResult.rows[0];

  const tokenHash = hashOTP(verificationCode.toString().trim());

  const resetResult = await pool.query(
    `
    SELECT id
    FROM password_resets
    WHERE user_id = $1
      AND token_hash = $2
      AND consumed_at IS NULL
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [user.id, tokenHash],
  );

  if (resetResult.rows.length === 0) {
    return res.status(400).json({
      error: "Invalid or expired reset code.",
    });
  }

  /*
   * The OTP remains valid until the password is changed.
   *
   * We return a temporary reset token.
   *
   * This prevents the client from needing to send the
   * actual OTP again during password reset.
   */

  const resetToken = crypto.randomBytes(32).toString("hex");

  const resetTokenHash = hashOTP(resetToken);

  await pool.query(
    `
    UPDATE password_resets
    SET token_hash = $1
    WHERE id = $2
    `,
    [resetTokenHash, resetResult.rows[0].id],
  );

  return res.json({
    message: "Reset code verified successfully.",
    resetToken,
    email: cleanEmail,
  });
});

/*
|--------------------------------------------------------------------------
| RESET PASSWORD WITH OTP
|--------------------------------------------------------------------------
*/

const resetPasswordWithOtp = asyncHandler(async (req, res) => {
  const { email, resetToken, token, password, newPassword } = req.body;

  const finalToken = resetToken || token;
  const finalPassword = newPassword || password;

  if (!email || !finalToken || !finalPassword) {
    return res.status(400).json({
      error: "Email, reset token, and new password are required.",
    });
  }

  if (finalPassword.length < 8) {
    return res.status(400).json({
      error: "Password must be at least 8 characters.",
    });
  }

  const cleanEmail = email.trim().toLowerCase();

  const userResult = await pool.query(
    `
      SELECT id, email
      FROM users
      WHERE email = $1
      `,
    [cleanEmail],
  );

  if (userResult.rows.length === 0) {
    return res.status(400).json({
      error: "Invalid or expired reset request.",
    });
  }

  const user = userResult.rows[0];

  const tokenHash = hashOTP(finalToken.trim());

  const resetResult = await pool.query(
    `
      SELECT id
      FROM password_resets
      WHERE user_id = $1
        AND token_hash = $2
        AND consumed_at IS NULL
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
      `,
    [user.id, tokenHash],
  );

  if (resetResult.rows.length === 0) {
    return res.status(400).json({
      error: "Invalid or expired reset request.",
    });
  }

  const passwordHash = await bcrypt.hash(finalPassword, 12);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    /*
     * Update password.
     */

    await client.query(
      `
        UPDATE users
        SET password_hash = $1,
            updated_at = NOW()
        WHERE id = $2
        `,
      [passwordHash, user.id],
    );

    /*
     * Consume reset token.
     */

    await client.query(
      `
        UPDATE password_resets
        SET consumed_at = NOW()
        WHERE id = $1
        `,
      [resetResult.rows[0].id],
    );

    /*
     * Invalidate any other active reset tokens.
     */

    await client.query(
      `
        UPDATE password_resets
        SET consumed_at = NOW()
        WHERE user_id = $1
          AND consumed_at IS NULL
        `,
      [user.id],
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return res.json({
    message: "Password reset successfully.",
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

  res.json({
    user: result.rows[0],
  });
});

/*
|--------------------------------------------------------------------------
| UPLOAD PROFILE AVATAR
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

  res.json({
    message: "Profile picture uploaded successfully.",
    user: result.rows[0],
  });
});

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  register,
  login,
  me,

  // Email verification
  verifyOTP,
  resendOTP,

  // Password reset
  forgotPassword,
  resetPassword,
  forgotPasswordOtp,
  verifyResetOtp,
  resetPasswordWithOtp,

  // Profile
  uploadAvatar,
};
