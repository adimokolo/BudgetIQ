import { formatCurrency } from '../utils/format';

const TREND_COPY = {
  up: { label: 'Trending up', tone: 'warning' },
  down: { label: 'Trending down', tone: 'income' },
  flat: { label: 'Holding steady', tone: 'income' },
};

export default function ForecastCard({ forecast, currency }) {
  const trend = TREND_COPY[forecast?.trend] || TREND_COPY.flat;

  return (
    <div className="facet-card" style={{ position: 'relative', overflow: 'hidden' }}>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: 'var(--prism-gradient)',
          opacity: 0.16,
          filter: 'blur(10px)',
        }}
      />
      <div className="stat-label">Next month's forecast</div>
      <div className="stat-value" style={{ position: 'relative' }}>
        {formatCurrency(forecast?.nextMonthPredictedExpense, currency)}
      </div>
      <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span className={`pill pill--${trend.tone}`}>{trend.label}</span>
        <span className="pill" style={{ background: 'var(--surface-strong)', color: 'var(--ink-faint)' }}>
          {forecast?.confidence === 'low' ? 'Building confidence' : `${forecast?.confidence} confidence`}
        </span>
      </div>
      <p className="helper-text" style={{ marginTop: 12 }}>
        Estimated from your last few months of spending. More history sharpens the forecast.
      </p>
    </div>
  );
}
