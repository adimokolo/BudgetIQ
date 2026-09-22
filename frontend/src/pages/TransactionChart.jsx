import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/format';

const CHART_COLORS = [
  '#2ed47a',
  '#38bdf8',
  '#8b5cf6',
  '#ff9f2f',
  '#ec4899',
  '#14b8a6',
  '#facc15',
  '#64748b',
];

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDateRange(period) {
  const today = new Date();

  if (period === 'last') {
    return {
      from: toDateKey(
        new Date(today.getFullYear(), today.getMonth() - 1, 1),
      ),
      to: toDateKey(
        new Date(today.getFullYear(), today.getMonth(), 0),
      ),
    };
  }

  return {
    from: toDateKey(
      new Date(today.getFullYear(), today.getMonth(), 1),
    ),
    to: toDateKey(today),
  };
}
function formatCompactCurrency(value, currency) {
  const amount = Number(value || 0);
  const absolute = Math.abs(amount);

  let compactValue = amount;
  let suffix = '';

  if (absolute >= 1_000_000_000) {
    compactValue = amount / 1_000_000_000;
    suffix = 'B';
  } else if (absolute >= 1_000_000) {
    compactValue = amount / 1_000_000;
    suffix = 'M';
  } else if (absolute >= 1_000) {
    compactValue = amount / 1_000;
    suffix = 'K';
  } else {
    return formatCurrency(amount, currency);
  }

  const symbol =
    currency === 'NGN'
      ? '₦'
      : currency === 'USD'
        ? '$'
        : currency === 'GBP'
          ? '£'
          : currency === 'EUR'
            ? '€'
            : `${currency} `;

  return `${symbol}${compactValue.toFixed(2)}${suffix}`;
}

function groupTransactions(transactions, key, fallback) {
  const grouped = new Map();

  transactions.forEach((transaction) => {
    const name = transaction[key] || fallback;
    const amount = Number(transaction.amount || 0);
    grouped.set(name, (grouped.get(name) || 0) + amount);
  });

  return Array.from(grouped, ([name, amount]) => ({
    name,
    amount,
  })).sort((a, b) => b.amount - a.amount);
}

function BreakdownCard({
  title,
  subtitle,
  data,
  total,
  currency,
  icon,
}) {
  return (
    <section className="tx-chart-card tx-breakdown-card">
      <div className="tx-breakdown-heading">
        <div className="tx-breakdown-icon">{icon}</div>

        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className="tx-breakdown-list">
        {data.map((item, index) => {
          const percentage =
            total > 0 ? (item.amount / total) * 100 : 0;

          return (
            <div className="tx-breakdown-item" key={item.name}>
              <div className="tx-breakdown-row">
                <div className="tx-breakdown-name">
                  <span
                    className="tx-breakdown-dot"
                    style={{
                      backgroundColor:
                        CHART_COLORS[
                        index % CHART_COLORS.length
                        ],
                    }}
                  />
                  <span>{item.name}</span>
                </div>

                <strong>
                  {formatCurrency(item.amount, currency)}
                </strong>

                <span className="tx-breakdown-percent">
                  {percentage.toFixed(1)}%
                </span>
              </div>

              <div className="tx-breakdown-track">
                <div
                  className="tx-breakdown-fill"
                  style={{
                    width: `${Math.min(percentage, 100)}%`,
                    backgroundColor:
                      CHART_COLORS[
                      index % CHART_COLORS.length
                      ],
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function TransactionChart() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [type, setType] = useState('expense');
  const [period, setPeriod] = useState('current');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currency = user?.currency || 'NGN';

  useEffect(() => {
    let cancelled = false;

    async function loadTransactions() {
      setLoading(true);
      setError('');

      try {
        const { from, to } = getDateRange(period);

        const limit = 100;
        let page = 1;
        let allTransactions = [];
        let totalRows = 0;

        do {
          const response = await apiClient.get('/transactions', {
            params: {
              type,
              from,
              to,
              page,
              limit,
            },
          });

          const batch = response.data.transactions || [];

          allTransactions = [...allTransactions, ...batch];

          totalRows = Number(
            response.data.pagination?.total || 0,
          );

          page += 1;
        } while (allTransactions.length < totalRows);

        if (!cancelled) {
          setTransactions(allTransactions);
        }
      } catch (err) {
        if (!cancelled) {
          setTransactions([]);
          setError(
            err.response?.data?.error ||
            'Unable to load transaction chart.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTransactions();

    return () => {
      cancelled = true;
    };
  }, [type, period]);

  const total = useMemo(
    () =>
      transactions.reduce(
        (sum, transaction) =>
          sum + Number(transaction.amount || 0),
        0,
      ),
    [transactions],
  );

  const categoryData = useMemo(
    () =>
      groupTransactions(
        transactions,
        'category_name',
        'Uncategorised',
      ),
    [transactions],
  );

  const accountData = useMemo(
    () =>
      groupTransactions(
        transactions,
        'account_name',
        'No account',
      ),
    [transactions],
  );

  const chartData = categoryData.map((item, index) => ({
    ...item,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const periodLabel =
    period === 'current' ? 'This Month' : 'Last Month';

  const typeLabel =
    type === 'expense' ? 'Expenses' : 'Income';

  return (
    <div className="tx-chart-page">
      <div className="page-header tx-chart-page-header">
        <div>
          <h1>Transaction Charts</h1>
          <p>
            See where your money is coming from and where it goes.
          </p>
        </div>

        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => navigate('/transactions')}
        >
          ← Transactions
        </button>
      </div>

      <div className="tx-chart-filters">
        <div className="tx-segmented">
          <button
            type="button"
            className={type === 'expense' ? 'active' : ''}
            onClick={() => setType('expense')}
          >
            <span className="tx-segment-icon">◔</span>
            Expenses
          </button>

          <button
            type="button"
            className={type === 'income' ? 'active' : ''}
            onClick={() => setType('income')}
          >
            <span className="tx-segment-icon">▥</span>
            Income
          </button>
        </div>

        <div className="tx-segmented">
          <button
            type="button"
            className={period === 'last' ? 'active' : ''}
            onClick={() => setPeriod('last')}
          >
            <span className="tx-segment-icon">▣</span>
            Last Month
          </button>

          <button
            type="button"
            className={period === 'current' ? 'active' : ''}
            onClick={() => setPeriod('current')}
          >
            <span className="tx-segment-icon">▣</span>
            This Month
          </button>
        </div>
      </div>

      {loading ? (
        <div className="tx-chart-state">
          Loading chart…
        </div>
      ) : error ? (
        <div className="tx-chart-state tx-chart-state--error">
          {error}
        </div>
      ) : transactions.length === 0 ? (
        <div className="tx-chart-state">
          <h3>No {type} transactions</h3>
          <p>
            There are no {type} transactions for{' '}
            {periodLabel.toLowerCase()}.
          </p>
        </div>
      ) : (
        <>
          <section className="tx-chart-card tx-overview-card">
            <div className="tx-overview-heading">
              <div>
                <span className="tx-overview-label">
                  Total {typeLabel}
                </span>

                <strong className="tx-overview-amount">
                  {formatCurrency(total, currency)}
                </strong>
              </div>

              <span className="tx-period-pill">
                {periodLabel}
              </span>
            </div>

            <div className="tx-overview-body">
              <div className="tx-donut-wrap">
                <ResponsiveContainer width="100%" height={330}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={95}
                      outerRadius={135}
                      paddingAngle={1.5}
                      stroke="none"
                    >
                      {chartData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={entry.color}
                        />
                      ))}
                    </Pie>

                    <Tooltip
                      formatter={(value) =>
                        formatCurrency(
                          Number(value),
                          currency,
                        )
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="tx-donut-center">
                  <strong title={formatCurrency(total, currency)}>
                    {formatCompactCurrency(total, currency)}
                  </strong>
                  <span>Total {typeLabel}</span>
                  <small>{periodLabel}</small>
                </div>
              </div>

              <div className="tx-chart-legend">
                {categoryData.map((item, index) => {
                  const percentage =
                    total > 0
                      ? (item.amount / total) * 100
                      : 0;

                  return (
                    <div
                      className="tx-chart-legend-row"
                      key={item.name}
                    >
                      <span
                        className="tx-chart-legend-dot"
                        style={{
                          backgroundColor:
                            CHART_COLORS[
                            index % CHART_COLORS.length
                            ],
                        }}
                      />

                      <span className="tx-chart-legend-name">
                        {item.name}
                      </span>

                      <strong>
                        {formatCurrency(
                          item.amount,
                          currency,
                        )}
                      </strong>

                      <span className="tx-chart-legend-percent">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <div className="tx-breakdown-grid">
            <BreakdownCard
              title="By Category"
              subtitle={
                type === 'expense'
                  ? 'Where your money went'
                  : 'Where your money came from'
              }
              data={categoryData}
              total={total}
              currency={currency}
              icon="▰"
            />

            <BreakdownCard
              title="By Account"
              subtitle="Activity across your accounts"
              data={accountData}
              total={total}
              currency={currency}
              icon="▣"
            />
          </div>
        </>
      )}
    </div>
  );
}
