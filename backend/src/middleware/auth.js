const jwt = require('jsonwebtoken');
const pool = require('../config/db');

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required. Please log in.',
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const result = await pool.query(
      `SELECT id, email, role, status
       FROM users
       WHERE id = $1`,
      [payload.sub]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'User account no longer exists.',
      });
    }

    const user = result.rows[0];

    if (user.status === 'suspended') {
      return res.status(403).json({
        error: 'This account has been suspended.',
      });
    }

    if (user.status === 'deactivated') {
      return res.status(403).json({
        error: 'This account is deactivated.',
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Your session has expired. Please log in again.',
      });
    }

    console.error('Authentication middleware error:', err);
    return res.status(500).json({
      error: 'Unable to authenticate request.',
    });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Administrator access required.',
    });
  }

  next();
}

module.exports = { requireAuth, requireAdmin };