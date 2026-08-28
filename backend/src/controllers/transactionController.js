const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { sendEmail } = require('../utils/email');

const listTransactions = asyncHandler(async (req, res) => {
  const { type, categoryId, from, to, page = 1, limit = 20 } = req.query;

  const conditions = ['t.user_id = $1'];
  const values = [req.user.id];

  if (type) {
    values.push(type);
    conditions.push(`t.type = $${values.length}`);
  }
  if (categoryId) {
    values.push(categoryId);
    conditions.push(`t.category_id = $${values.length}`);
  }
  if (from) {
    values.push(from);
    conditions.push(`t.occurred_on >= $${values.length}`);
  }
  if (to) {
    values.push(to);
    conditions.push(`t.occurred_on <= $${values.length}`);
  }

  const whereClause = conditions.join(' AND ');
  const offset = (Math.max(1, Number(page)) - 1) * Number(limit);

  const dataQuery = `
    SELECT t.*, c.name AS category_name, c.color AS category_color, c.icon AS category_icon
    FROM transactions t
    LEFT JOIN categories c ON c.id = t.category_id
    WHERE ${whereClause}
    ORDER BY t.occurred_on DESC, t.created_at DESC
    LIMIT $${values.length + 1} OFFSET $${values.length + 2}
  `;
  const countQuery = `SELECT COUNT(*) FROM transactions t WHERE ${whereClause}`;

  const [dataResult, countResult] = await Promise.all([
    pool.query(dataQuery, [...values, Number(limit), offset]),
    pool.query(countQuery, values),
  ]);

  res.json({
    transactions: dataResult.rows,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: Number(countResult.rows[0].count),
    },
  });
});

const createTransaction = asyncHandler(async (req, res) => {
  const { type, amount, categoryId, description, occurredOn } = req.body;

  if (!type || !amount) {
    return res.status(400).json({ error: 'Type and amount are required.' });
  }
  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: "Type must be 'income' or 'expense'." });
  }
  if (Number(amount) <= 0) {
    return res.status(400).json({ error: 'Amount must be greater than zero.' });
  }

  const result = await pool.query(
    `INSERT INTO transactions (user_id, category_id, type, amount, description, occurred_on)
     VALUES ($1, $2, $3, $4, $5, COALESCE($6, CURRENT_DATE))
     RETURNING *`,
    [req.user.id, categoryId || null, type, amount, description || null, occurredOn || null]
  );

  if (type === 'expense') {
    // Fire-and-checked, not fire-and-forget: awaited so it completes before the
    // process could exit, but its own try/catch means a failed email never
    // fails the transaction request itself.
    await checkBudgetAlerts(req.user.id, categoryId || null);
  }

  res.status(201).json({ transaction: result.rows[0] });
});

// Emails the user once per budget per calendar month the first time their
// spend crosses that budget's limit. Covers both category-specific budgets
// and the "overall" budget (category_id IS NULL).
async function checkBudgetAlerts(userId, categoryId) {
  try {
    const budgetsResult = await pool.query(
      `SELECT b.id, b.monthly_limit, b.category_id, b.last_alert_month, c.name AS category_name
       FROM budgets b
       LEFT JOIN categories c ON c.id = b.category_id
       WHERE b.user_id = $1 AND (b.category_id = $2 OR b.category_id IS NULL)`,
      [userId, categoryId]
    );
    if (budgetsResult.rows.length === 0) return;

    const currentMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

    const userResult = await pool.query(
      'SELECT full_name, email, currency FROM users WHERE id = $1',
      [userId]
    );
    const user = userResult.rows[0];
    if (!user) return;

    for (const budget of budgetsResult.rows) {
      if (budget.last_alert_month === currentMonth) continue; // already alerted this month

      const spentQuery = budget.category_id
        ? {
            text: `SELECT COALESCE(SUM(amount), 0) AS spent FROM transactions
                   WHERE user_id = $1 AND type = 'expense' AND category_id = $2
                     AND date_trunc('month', occurred_on) = date_trunc('month', CURRENT_DATE)`,
            values: [userId, budget.category_id],
          }
        : {
            text: `SELECT COALESCE(SUM(amount), 0) AS spent FROM transactions
                   WHERE user_id = $1 AND type = 'expense'
                     AND date_trunc('month', occurred_on) = date_trunc('month', CURRENT_DATE)`,
            values: [userId],
          };

      const spentResult = await pool.query(spentQuery.text, spentQuery.values);
      const spent = Number(spentResult.rows[0].spent);
      const limit = Number(budget.monthly_limit);

      if (spent >= limit) {
        const label = budget.category_name || 'your overall spending';
        const currency = user.currency || 'NGN';

        await sendEmail({
          to: user.email,
          subject: `Budget alert: you've exceeded your ${label} limit`,
          text: `Hi ${user.full_name}, you've spent ${currency} ${spent.toFixed(2)} against your ${currency} ${limit.toFixed(2)} monthly limit for ${label}.`,
          html: `<p>Hi ${user.full_name},</p><p>You've exceeded your monthly budget for <strong>${label}</strong>.</p><p>Spent: <strong>${currency} ${spent.toFixed(2)}</strong> / Limit: <strong>${currency} ${limit.toFixed(2)}</strong></p><p>You can review and adjust this budget any time in BudgetIQ.</p>`,
        });

        await pool.query(
          `INSERT INTO notifications (user_id, type, title, body)
           VALUES ($1, 'budget_exceeded', $2, $3)`,
          [
            userId,
            `Budget exceeded: ${label}`,
            `You've spent ${currency} ${spent.toFixed(2)} of your ${currency} ${limit.toFixed(2)} monthly limit.`,
          ]
        );

        await pool.query('UPDATE budgets SET last_alert_month = $1 WHERE id = $2', [
          currentMonth,
          budget.id,
        ]);
      }
    }
  } catch (err) {
    // Never let an alert-email failure break transaction creation itself.
    console.error('Budget alert check failed:', err.message);
  }
}

const updateTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { categoryId, amount, description, occurredOn } = req.body;

  const result = await pool.query(
    `UPDATE transactions SET
       category_id = COALESCE($1, category_id),
       amount = COALESCE($2, amount),
       description = COALESCE($3, description),
       occurred_on = COALESCE($4, occurred_on)
     WHERE id = $5 AND user_id = $6
     RETURNING *`,
    [categoryId, amount, description, occurredOn, id, req.user.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Transaction not found.' });
  }
  res.json({ transaction: result.rows[0] });
});

const deleteTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query(
    'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, req.user.id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Transaction not found.' });
  }
  res.status(204).send();
});

module.exports = { listTransactions, createTransaction, updateTransaction, deleteTransaction };
