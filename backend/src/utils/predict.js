/**
 * Predicts next month's spending from a short history of monthly totals
 * using simple linear regression (least squares), with a fallback to a
 * weighted moving average when there isn't enough history for a stable trend.
 *
 * @param {number[]} monthlyTotals - ordered oldest -> newest, e.g. last 6 months of spend
 * @returns {{ predictedAmount: number, trend: 'up'|'down'|'flat', confidence: 'low'|'medium'|'high' }}
 */
function predictNextMonth(monthlyTotals) {
  const values = (monthlyTotals || []).filter((v) => typeof v === 'number' && !Number.isNaN(v));

  if (values.length === 0) {
    return { predictedAmount: 0, trend: 'flat', confidence: 'low' };
  }

  if (values.length < 3) {
    // Not enough history for a trend line - use a simple average as a safe estimate.
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return { predictedAmount: round2(avg), trend: 'flat', confidence: 'low' };
  }

  // Least squares linear regression: y = a + b*x
  const n = values.length;
  const xs = values.map((_, i) => i);
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((acc, x, i) => acc + x * values[i], 0);
  const sumXX = xs.reduce((acc, x) => acc + x * x, 0);

  const denominator = n * sumXX - sumX * sumX;
  const slope = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  const nextX = n; // the next, unseen month
  let predicted = intercept + slope * nextX;
  predicted = Math.max(0, predicted); // spending can't be negative

  const avg = sumY / n;
  const trend = Math.abs(slope) < avg * 0.02 ? 'flat' : slope > 0 ? 'up' : 'down';
  const confidence = n >= 6 ? 'high' : 'medium';

  return { predictedAmount: round2(predicted), trend, confidence };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

module.exports = { predictNextMonth };
