const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

// Returns each budget alongside how much has been spent this month against it,
// so the frontend can render progress bars without a second round trip.
const listBudgets = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT
       b.id, b.monthly_limit, b.category_id,
       c.name AS category_name, c.color AS category_color, c.icon AS category_icon,
       COALESCE(SUM(t.amount) FILTER (
         WHERE t.type = 'expense'
           AND date_trunc('month', t.occurred_on) = date_trunc('month', CURRENT_DATE)
       ), 0) AS spent_this_month
     FROM budgets b
     LEFT JOIN categories c ON c.id = b.category_id
     LEFT JOIN transactions t ON t.category_id = b.category_id AND t.user_id = b.user_id
     WHERE b.user_id = $1
     GROUP BY b.id, c.name, c.color, c.icon
     ORDER BY c.name NULLS FIRST`,
    [req.user.id]
  );

  const budgets = result.rows.map((row) => ({
    ...row,
    spent_this_month: Number(row.spent_this_month),
    monthly_limit: Number(row.monthly_limit),
    percent_used: row.monthly_limit
      ? Math.min(999, Math.round((Number(row.spent_this_month) / Number(row.monthly_limit)) * 100))
      : 0,
  }));

  res.json({ budgets });
});

const createBudget = asyncHandler(async (req, res) => {
  const { categoryId, monthlyLimit } = req.body;

  if (!monthlyLimit || Number(monthlyLimit) <= 0) {
    return res.status(400).json({ error: 'Monthly limit must be greater than zero.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO budgets (user_id, category_id, monthly_limit)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.user.id, categoryId || null, monthlyLimit]
    );
    res.status(201).json({ budget: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A budget already exists for this category.' });
    }
    throw err;
  }
});

const updateBudget = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { monthlyLimit } = req.body;

  const result = await pool.query(
    `UPDATE budgets SET monthly_limit = COALESCE($1, monthly_limit)
     WHERE id = $2 AND user_id = $3 RETURNING *`,
    [monthlyLimit, id, req.user.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Budget not found.' });
  }
  res.json({ budget: result.rows[0] });
});

const deleteBudget = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query(
    'DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, req.user.id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Budget not found.' });
  }
  res.status(204).send();
});

module.exports = { listBudgets, createBudget, updateBudget, deleteBudget };
