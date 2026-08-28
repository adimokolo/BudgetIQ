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

  // Gmail SMTP port 587 uses STARTTLS
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
| HASH OTP
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
   * Clean email
   */

  const cleanEmail = email.trim().toLowerCase();

  /*
   * Check if account already exists
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
   * Start database transaction
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
      [fullName.trim(), cleanEmail, passwordHash, currency || "NGN"],
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
     * Generate OTP
     */

    const otp = generateOTP();

    const otpHash = hashOTP(otp);

    /*
     * OTP expires in 10 minutes
     */

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    /*
     * Save OTP hash
     */

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

    /*
     * Commit transaction
     */

    await client.query("COMMIT");

    /*
     * IMPORTANT:
     * Print OTP to backend terminal during development.
     *
     * This means even if Gmail fails, you can still
     * continue testing your mobile app.
     */

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

    /*
     * Send email
     */

    try {
      await sendVerificationEmail(cleanEmail, otp);

      console.log(`✅ Verification email sent to ${cleanEmail}`);
    } catch (emailError) {
      console.error("❌ Email sending failed:", emailError.message);

      /*
       * Do not fail registration just because
       * the email service failed during development.
       */

      if (process.env.NODE_ENV !== "production") {
        console.log(`🔐 DEVELOPMENT OTP: ${otp}`);
      }
    }

    /*
     * Do not log the user in yet.
     * User must verify OTP first.
     */

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
| VERIFY OTP
|--------------------------------------------------------------------------
*/

const verifyOTP = asyncHandler(async (req, res) => {
  const { email, code, otp } = req.body;

  /*
   * Accept either:
   * code
   * or
   * otp
   */

  const verificationCode = code || otp;

  if (!email || !verificationCode) {
    return res.status(400).json({
      error: "Email and verification code are required.",
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

  /*
   * Already verified?
   */

  if (user.is_verified) {
    return res.status(400).json({
      error: "This account is already verified.",
    });
  }

  /*
   * Hash submitted OTP
   */

  const codeHash = hashOTP(verificationCode.toString().trim());

  /*
   * Find valid OTP
   */

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

  /*
   * Use one client for the transaction
   */

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    /*
     * Verify user
     */

    await client.query(
      `
      UPDATE users
      SET is_verified = TRUE,
          updated_at = NOW()
      WHERE id = $1
      `,
      [user.id],
    );

    /*
     * Mark OTP as consumed
     */

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

  /*
   * Generate login token
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
    },
  });
});

/*
|--------------------------------------------------------------------------
| RESEND OTP
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
      email,
      is_verified
    FROM users
    WHERE email = $1
    `,
    [cleanEmail],
  );

  /*
   * Don't reveal whether account exists
   */

  if (userResult.rows.length === 0) {
    return res.json({
      message: "If the account exists, a verification code has been sent.",
    });
  }

  const user = userResult.rows[0];

  /*
   * Already verified
   */

  if (user.is_verified) {
    return res.json({
      message: "If the account exists, a verification code has been sent.",
    });
  }

  /*
   * Generate new OTP
   */

  const otp = generateOTP();

  const otpHash = hashOTP(otp);

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  /*
   * Invalidate previous OTPs
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
   * Save new OTP
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
      (
        $1,
        $2,
        'email_verification',
        $3
      )
    `,
    [user.id, otpHash, expiresAt],
  );

  /*
   * Always print OTP in development
   */

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

  /*
   * Send email
   */

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
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  register,
  login,
  me,
  verifyOTP,
  resendOTP,
};
