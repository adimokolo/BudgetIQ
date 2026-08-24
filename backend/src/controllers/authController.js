const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const DEFAULT_CATEGORIES = [
  { name: 'Salary', type: 'income', color: '#3DDC97', icon: 'wallet' },
  { name: 'Freelance', type: 'income', color: '#5DD5E8', icon: 'briefcase' },
  { name: 'Food & Groceries', type: 'expense', color: '#FF8FA3', icon: 'shopping-cart' },
  { name: 'Transport', type: 'expense', color: '#FFC96B', icon: 'car' },
  { name: 'Housing & Utilities', type: 'expense', color: '#8C7CF0', icon: 'home' },
  { name: 'Entertainment', type: 'expense', color: '#63C7FF', icon: 'film' },
  { name: 'Health', type: 'expense', color: '#FF6B9D', icon: 'heart' },
  { name: 'Savings', type: 'expense', color: '#4FD1C5', icon: 'piggy-bank' },
];

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

const register = asyncHandler(async (req, res) => {
  const { fullName, email, password, currency } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ error: 'Full name, email, and password are required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userResult = await client.query(
      `INSERT INTO users (full_name, email, password_hash, currency)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, email, currency, created_at`,
      [fullName, email.toLowerCase(), passwordHash, currency || 'NGN']
    );
    const user = userResult.rows[0];

    const categoryValues = DEFAULT_CATEGORIES.map(
      (c) => `('${user.id}', '${c.name.replace(/'/g, "''")}', '${c.type}', '${c.color}', '${c.icon}')`
    ).join(',');

    await client.query(
      `INSERT INTO categories (user_id, name, type, color, icon) VALUES ${categoryValues}`
    );

    await client.query('COMMIT');

    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const result = await pool.query(
    'SELECT id, full_name, email, password_hash, currency FROM users WHERE email = $1',
    [email.toLowerCase()]
  );
  const user = result.rows[0];

  if (!user) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }

  const token = signToken(user);
  delete user.password_hash;
  res.json({ token, user });
});

const me = asyncHandler(async (req, res) => {
  const result = await pool.query(
    'SELECT id, full_name, email, currency, created_at FROM users WHERE id = $1',
    [req.user.id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'User not found.' });
  }
  res.json({ user: result.rows[0] });
});

module.exports = { register, login, me };
