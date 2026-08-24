import { formatCurrency, formatDate } from '../utils/format';

export default function RecentTransactions({ transactions, currency }) {
  return (
    <div className="facet-card">
      <h3 className="section-title">Recent activity</h3>
      <p className="section-subtitle">Your last few transactions</p>

      {transactions.length === 0 ? (
        <div className="empty-state">Nothing recorded yet. Add your first transaction to get started.</div>
      ) : (
        <div>
          {transactions.map((t) => (
            <div className="list-row" key={t.id}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="cat-dot" style={{ background: t.category_color || '#B9C3D4' }} />
                <span>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>
                    {t.description || t.category_name || 'Uncategorized'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{formatDate(t.occurred_on)}</div>
                </span>
              </span>
              <span
                className="mono"
                style={{ fontWeight: 600, color: t.type === 'income' ? 'var(--income)' : 'var(--expense)' }}
              >
                {t.type === 'income' ? '+' : '-'}
                {formatCurrency(t.amount, currency)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
