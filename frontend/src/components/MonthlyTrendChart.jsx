import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatMonthLabel, formatCurrency } from '../utils/format';

export default function MonthlyTrendChart({ data, currency }) {
  const chartData = data.map((d) => ({ ...d, label: formatMonthLabel(d.month) }));

  return (
    <div className="facet-card">
      <h3 className="section-title">Income vs. spending</h3>
      <p className="section-subtitle">Last six months</p>

      {chartData.length === 0 ? (
        <div className="empty-state">No transactions yet — add one to see your trend.</div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--income)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--income)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--expense)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--expense)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: 'var(--ink-faint)', fontSize: 12.5 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--ink-faint)', fontSize: 12 }} axisLine={false} tickLine={false} width={54} />
            <Tooltip
              contentStyle={{
                background: 'var(--surface-strong)',
                border: '1px solid var(--surface-border)',
                borderRadius: 10,
                fontSize: 13,
              }}
              formatter={(value, name) => [formatCurrency(value, currency), name === 'income' ? 'Income' : 'Expense']}
            />
            <Area type="monotone" dataKey="income" stroke="var(--income)" strokeWidth={2} fill="url(#incomeFill)" />
            <Area type="monotone" dataKey="expense" stroke="var(--expense)" strokeWidth={2} fill="url(#expenseFill)" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
