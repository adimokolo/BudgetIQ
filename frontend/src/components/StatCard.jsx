export default function StatCard({ label, value, tone, pill }) {
  const toneColor =
    tone === 'income' ? 'var(--income)' : tone === 'expense' ? 'var(--expense)' : 'var(--ink)';

  return (
    <div className="facet-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color: toneColor }}>
        {value}
      </div>
      {pill && <div style={{ marginTop: 10 }}>{pill}</div>}
    </div>
  );
}
