const pool = require("../config/db");

/*
|--------------------------------------------------------------------------
| GET ACCOUNTS
|--------------------------------------------------------------------------
*/

async function getAccounts(req, res) {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        id,
        name,
        currency,
        balance,
        notes,
        created_at,
        updated_at
      FROM accounts
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId],
    );

    return res.status(200).json({
      accounts: result.rows,
    });
  } catch (error) {
    console.error("Get accounts error:", error);

    return res.status(500).json({
      error: "Unable to get accounts.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| CREATE ACCOUNT
|--------------------------------------------------------------------------
*/

async function createAccount(req, res) {
  try {
    const userId = req.user.id;

    const { name, currency, initialAmount, notes } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        error: "Account name is required.",
      });
    }

    if (!currency || !currency.trim()) {
      return res.status(400).json({
        error: "Account currency is required.",
      });
    }

    if (
      initialAmount === undefined ||
      initialAmount === null ||
      initialAmount === "" ||
      Number.isNaN(Number(initialAmount))
    ) {
      return res.status(400).json({
        error: "Initial amount is required.",
      });
    }

    const amount = Number(initialAmount);

    if (amount < 0) {
      return res.status(400).json({
        error: "Initial amount cannot be negative.",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO accounts (
        user_id,
        name,
        currency,
        balance,
        notes
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id,
        name,
        currency,
        balance,
        notes,
        created_at,
        updated_at
      `,
      [
        userId,
        name.trim(),
        currency.trim().toUpperCase(),
        amount,
        notes ? notes.trim() : null,
      ],
    );

    return res.status(201).json({
      message: "Account created successfully.",
      account: result.rows[0],
    });
  } catch (error) {
    console.error("Create account error:", error);

    return res.status(500).json({
      error: "Unable to create account.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE ACCOUNT
|--------------------------------------------------------------------------
*/

async function updateAccount(req, res) {
  try {
    const userId = req.user.id;

    const { id } = req.params;

    const { name, currency, initialAmount, notes } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        error: "Account name is required.",
      });
    }

    if (!currency || !currency.trim()) {
      return res.status(400).json({
        error: "Account currency is required.",
      });
    }

    if (
      initialAmount === undefined ||
      initialAmount === null ||
      initialAmount === "" ||
      Number.isNaN(Number(initialAmount))
    ) {
      return res.status(400).json({
        error: "Balance is required.",
      });
    }

    const amount = Number(initialAmount);

    if (amount < 0) {
      return res.status(400).json({
        error: "Balance cannot be negative.",
      });
    }

    const result = await pool.query(
      `
      UPDATE accounts
      SET
        name = $1,
        currency = $2,
        balance = $3,
        notes = $4,
        updated_at = NOW()
      WHERE id = $5
        AND user_id = $6
      RETURNING
        id,
        name,
        currency,
        balance,
        notes,
        created_at,
        updated_at
      `,
      [
        name.trim(),
        currency.trim().toUpperCase(),
        amount,
        notes ? notes.trim() : null,
        id,
        userId,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Account not found.",
      });
    }

    return res.status(200).json({
      message: "Account updated successfully.",
      account: result.rows[0],
    });
  } catch (error) {
    console.error("Update account error:", error);

    return res.status(500).json({
      error: "Unable to update account.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| DELETE ACCOUNT
|--------------------------------------------------------------------------
*/

async function deleteAccount(req, res) {
  try {
    const userId = req.user.id;

    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM accounts
      WHERE id = $1
        AND user_id = $2
      RETURNING id
      `,
      [id, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Account not found.",
      });
    }

    return res.status(200).json({
      message: "Account deleted successfully.",
    });
  } catch (error) {
    console.error("Delete account error:", error);

    return res.status(500).json({
      error: "Unable to delete account.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
};
