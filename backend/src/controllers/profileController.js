const pool = require("../config/db");

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "Please select an image.",
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

    res.json({
      message: "Profile picture uploaded successfully.",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Avatar upload error:", error);

    res.status(500).json({
      error: "Unable to upload profile picture.",
    });
  }
};

const updateBaseCurrency = async (req, res) => {
  try {
    const { currency } = req.body;

    if (!currency || typeof currency !== "string" || !currency.trim()) {
      return res.status(400).json({
        error: "Currency is required.",
      });
    }

    const result = await pool.query(
      `
      UPDATE users
      SET currency = $1
      WHERE id = $2
      RETURNING
        id,
        full_name,
        email,
        currency,
        is_verified,
        avatar_url
      `,
      [currency.trim().toUpperCase(), req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "User not found.",
      });
    }

    res.json({
      message: "Base currency updated successfully.",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Update base currency error:", error);

    res.status(500).json({
      error: "Unable to update base currency.",
    });
  }
};

module.exports = {
  uploadAvatar,
  updateBaseCurrency,
};
