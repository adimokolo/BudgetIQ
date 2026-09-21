const pool = require("../config/db");

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
        color,
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

async function createAccount(req, res) {
  // Using a single client so the account insert and the matching income
  // transaction either both succeed or both roll back together.
  const client = await pool.connect();

  try {
    const userId = req.user.id;

    const { name, currency, initialAmount, notes, color } = req.body;

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

    // Allow empty amount and default it to 0.00
    const amount =
      initialAmount === undefined ||
      initialAmount === null ||
      String(initialAmount).trim() === ""
        ? 0
        : Number(initialAmount);

    if (Number.isNaN(amount)) {
      return res.status(400).json({
        error: "Initial amount must be a valid number.",
      });
    }

    if (amount < 0) {
      return res.status(400).json({
        error: "Initial amount cannot be negative.",
      });
    }

    const isValidHexColor =
      typeof color === "string" && /^#[0-9A-Fa-f]{6}$/.test(color.trim());

    const trimmedName = name.trim();

    await client.query("BEGIN");

    const accountResult = await client.query(
      `
      INSERT INTO accounts (
        user_id,
        name,
        currency,
        balance,
        notes,
        color
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id,
        name,
        currency,
        balance,
        notes,
        color,
        created_at,
        updated_at
      `,
      [
        userId,
        trimmedName,
        currency.trim().toUpperCase(),
        amount,
        notes ? notes.trim() : null,
        isValidHexColor ? color.trim() : "#6366F1",
      ],
    );

    const account = accountResult.rows[0];

    // Record the opening balance as an income transaction so it shows up
    // in transaction history and counts toward dashboard income totals.
    // A zero-balance account (e.g. a fresh wallet) doesn't need one.
    if (amount > 0) {
      await client.query(
        `
        INSERT INTO transactions (
          user_id,
          type,
          amount,
          description,
          category_id,
          account_id,
          occurred_on
        )
        VALUES ($1, 'income', $2, $3, NULL, $4, NOW())
        `,
        [userId, amount, trimmedName, account.id],
      );
    }

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Account created successfully.",
      account,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create account error:", error);

    return res.status(500).json({
      error: "Unable to create account.",
    });
  } finally {
    client.release();
  }
}

async function updateAccount(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { name, currency, initialAmount, notes, color } = req.body;

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

    // Allow blank balance and treat it as 0.00
    const amount =
      initialAmount === undefined ||
      initialAmount === null ||
      String(initialAmount).trim() === ""
        ? 0
        : Number(initialAmount);

    if (Number.isNaN(amount)) {
      return res.status(400).json({
        error: "Balance must be a valid number.",
      });
    }

    if (amount < 0) {
      return res.status(400).json({
        error: "Balance cannot be negative.",
      });
    }

    const isValidHexColor =
      typeof color === "string" && /^#[0-9A-Fa-f]{6}$/.test(color.trim());

    const result = await pool.query(
      `
      UPDATE accounts
      SET
        name = $1,
        currency = $2,
        balance = $3,
        notes = $4,
        color = COALESCE($5, color),
        updated_at = NOW()
      WHERE id = $6
        AND user_id = $7
      RETURNING
        id,
        name,
        currency,
        balance,
        notes,
        color,
        created_at,
        updated_at
      `,
      [
        name.trim(),
        currency.trim().toUpperCase(),
        amount,
        notes ? notes.trim() : null,
        isValidHexColor ? color.trim() : null,
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

async function deleteAccount(req, res) {
  // Deleting an account shouldn't erase the money-movement history tied to
  // it, and a naive DELETE would either violate the transactions.account_id
  // foreign key or leave it dangling. So: detach (null out) account_id on
  // every transaction that points at this account, then delete the account,
  // both inside one DB transaction.
  const client = await pool.connect();

  try {
    const userId = req.user.id;
    const { id } = req.params;

    await client.query("BEGIN");

    // Ownership check happens implicitly: the UPDATE and DELETE below both
    // filter on user_id, so a user can't detach or delete another user's data.
    await client.query(
      `
      UPDATE transactions
      SET account_id = NULL
      WHERE account_id = $1
        AND user_id = $2
      `,
      [id, userId],
    );

    const result = await client.query(
      `
      DELETE FROM accounts
      WHERE id = $1
        AND user_id = $2
      RETURNING id
      `,
      [id, userId],
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        error: "Account not found.",
      });
    }

    await client.query("COMMIT");

    return res.status(200).json({
      message: "Account deleted successfully.",
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Delete account error:", error);

    return res.status(500).json({
      error: "Unable to delete account.",
    });
  } finally {
    client.release();
  }
}

module.exports = {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
};
