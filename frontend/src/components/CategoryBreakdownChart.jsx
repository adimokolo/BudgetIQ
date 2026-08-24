import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../utils/format';

export default function CategoryBreakdownChart({ data, currency }) {
  const hasData = data && data.length > 0;

  return (
    <div className="facet-card">
      <h3 className="section-title">Where it went</h3>
      <p className="section-subtitle">This month's spending by category</p>

      {!hasData ? (
        <div className="empty-state">No spending recorded this month yet.</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                dataKey="total"
                nameKey="name"
                innerRadius={58}
                outerRadius={82}
                paddingAngle={3}
                stroke="none"
              >
                {data.map((entry) => (
                  <Cell key={entry.category_id} fill={entry.color || 'var(--prism-2)'} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'var(--surface-strong)',
                  border: '1px solid var(--surface-border)',
                  borderRadius: 10,
                  fontSize: 13,
                }}
                formatter={(value) => formatCurrency(value, currency)}
              />
            </PieChart>
          </ResponsiveContainer>

          <div style={{ marginTop: 6 }}>
            {data.map((entry) => (
              <div className="list-row" key={entry.category_id}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5 }}>
                  <span className="cat-dot" style={{ background: entry.color }} />
                  {entry.name}
                </span>
                <span className="mono" style={{ fontSize: 13.5 }}>
                  {formatCurrency(entry.total, currency)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
