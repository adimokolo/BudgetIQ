const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

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

  res.status(201).json({ transaction: result.rows[0] });
});

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
