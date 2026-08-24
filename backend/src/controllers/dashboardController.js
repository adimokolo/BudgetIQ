const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { predictNextMonth } = require('../utils/predict');

// One combined payload for the dashboard: current-month summary, a 6-month
// trend line, category breakdown for the current month, and a next-month
// spending forecast derived from that trend.
const getSummary = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [currentMonth, monthlyTrend, categoryBreakdown, recentTransactions] = await Promise.all([
    pool.query(
      `SELECT
         COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0) AS total_income,
         COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) AS total_expense
       FROM transactions
       WHERE user_id = $1 AND date_trunc('month', occurred_on) = date_trunc('month', CURRENT_DATE)`,
      [userId]
    ),
    pool.query(
      `SELECT
         to_char(date_trunc('month', occurred_on), 'YYYY-MM') AS month,
         COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0) AS income,
         COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) AS expense
       FROM transactions
       WHERE user_id = $1 AND occurred_on >= date_trunc('month', CURRENT_DATE) - INTERVAL '5 months'
       GROUP BY 1
       ORDER BY 1`,
      [userId]
    ),
    pool.query(
      `SELECT
         c.id AS category_id, c.name, c.color, c.icon,
         COALESCE(SUM(t.amount), 0) AS total
       FROM categories c
       LEFT JOIN transactions t ON t.category_id = c.id
         AND t.type = 'expense'
         AND date_trunc('month', t.occurred_on) = date_trunc('month', CURRENT_DATE)
       WHERE c.user_id = $1 AND c.type = 'expense'
       GROUP BY c.id, c.name, c.color, c.icon
       HAVING COALESCE(SUM(t.amount), 0) > 0
       ORDER BY total DESC`,
      [userId]
    ),
    pool.query(
      `SELECT t.*, c.name AS category_name, c.color AS category_color, c.icon AS category_icon
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.user_id = $1
       ORDER BY t.occurred_on DESC, t.created_at DESC
       LIMIT 8`,
      [userId]
    ),
  ]);

  const trend = monthlyTrend.rows.map((r) => ({
    month: r.month,
    income: Number(r.income),
    expense: Number(r.expense),
  }));

  const expenseHistory = trend.map((t) => t.expense);
  const forecast = predictNextMonth(expenseHistory);

  const income = Number(currentMonth.rows[0].total_income);
  const expense = Number(currentMonth.rows[0].total_expense);

  res.json({
    summary: {
      totalIncome: income,
      totalExpense: expense,
      netBalance: round2(income - expense),
      savingsRate: income > 0 ? round2(((income - expense) / income) * 100) : 0,
    },
    monthlyTrend: trend,
    categoryBreakdown: categoryBreakdown.rows.map((r) => ({ ...r, total: Number(r.total) })),
    recentTransactions: recentTransactions.rows,
    forecast: {
      nextMonthPredictedExpense: forecast.predictedAmount,
      trend: forecast.trend,
      confidence: forecast.confidence,
    },
  });
});

function round2(n) {
  return Math.round(n * 100) / 100;
}

module.exports = { getSummary };
