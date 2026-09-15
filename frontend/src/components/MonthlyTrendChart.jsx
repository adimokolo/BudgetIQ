import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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
          <BarChart data={chartData} margin={{ top: 6, right: 8, left: -18, bottom: 0 }} barGap={4} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: 'var(--ink-faint)', fontSize: 12.5 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'var(--ink-faint)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={54}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--surface-strong)',
                border: '1px solid var(--surface-border)',
                borderRadius: 10,
                fontSize: 13,
              }}
              cursor={{ fill: 'var(--surface-border)', opacity: 0.5 }}
              formatter={(value, name) => [
                formatCurrency(value, currency),
                name === 'income' ? 'Income' : 'Expense',
              ]}
            />
            <Legend
              formatter={(value) => value === 'income' ? 'Income' : 'Expense'}
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            />
            <Bar dataKey="income"  fill="var(--income)"  radius={[4, 4, 0, 0]} maxBarSize={32} />
            <Bar dataKey="expense" fill="var(--expense)" radius={[4, 4, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
