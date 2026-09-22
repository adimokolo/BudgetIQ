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

export default function BudgetExpenseChart({
  monthlyTrend = [],
  budgets = [],
  currency,
}) {
  const totalBudget = budgets.reduce(
    (sum, budget) => sum + Number(budget.monthly_limit || 0),
    0
  );

  const chartData = monthlyTrend.map((d) => ({
    ...d,
    label: formatMonthLabel(d.month),
    budget: totalBudget,
    expense: Number(d.expense || 0),
  }));

  return (
    <div className="facet-card">
      <h3 className="section-title">Budget vs Expense</h3>
      <p className="section-subtitle">Last six months</p>

      {totalBudget <= 0 ? (
        <div className="empty-state">
          No budgets set yet — add one to compare your spending.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={chartData}
            margin={{ top: 6, right: 8, left: 8, bottom: 0 }}
            barGap={4}
            barCategoryGap="30%"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--surface-border)"
              vertical={false}
            />

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
              cursor={{
                fill: 'var(--surface-border)',
                opacity: 0.5,
              }}
              formatter={(value, name) => [
                formatCurrency(value, currency),
                name === 'budget' ? 'Budget' : 'Expense',
              ]}
            />

            <Legend
              formatter={(value) =>
                value === 'budget' ? 'Budget' : 'Expense'
              }
              wrapperStyle={{
                fontSize: 12,
                paddingTop: 8,
              }}
            />

            <Bar
              dataKey="budget"
              fill="#3B82F6"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />

            <Bar
              dataKey="expense"
              fill="var(--expense)"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}