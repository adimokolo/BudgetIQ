const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const listCategories = asyncHandler(async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM categories WHERE user_id = $1 ORDER BY type, name',
    [req.user.id]
  );
  res.json({ categories: result.rows });
});

const createCategory = asyncHandler(async (req, res) => {
  const { name, type, color, icon } = req.body;
  if (!name || !type) {
    return res.status(400).json({ error: 'Category name and type are required.' });
  }
  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: "Type must be 'income' or 'expense'." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO categories (user_id, name, type, color, icon)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, name.trim(), type, color || '#6C63FF', icon || 'tag']
    );
    res.status(201).json({ category: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A category with this name and type already exists.' });
    }
    throw err;
  }
});

const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, color, icon } = req.body;

  const result = await pool.query(
    `UPDATE categories SET
       name = COALESCE($1, name),
       color = COALESCE($2, color),
       icon = COALESCE($3, icon)
     WHERE id = $4 AND user_id = $5
     RETURNING *`,
    [name, color, icon, id, req.user.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Category not found.' });
  }
  res.json({ category: result.rows[0] });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query(
    'DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, req.user.id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Category not found.' });
  }
  res.status(204).send();
});

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };
