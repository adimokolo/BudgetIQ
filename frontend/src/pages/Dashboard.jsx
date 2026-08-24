import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import MonthlyTrendChart from '../components/MonthlyTrendChart';
import CategoryBreakdownChart from '../components/CategoryBreakdownChart';
import ForecastCard from '../components/ForecastCard';
import RecentTransactions from '../components/RecentTransactions';
import { formatCurrency } from '../utils/format';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    apiClient
      .get('/dashboard/summary')
      .then((res) => {
        if (mounted) setData(res.data);
      })
      .catch(() => {
        if (mounted) setError('Could not load your dashboard right now.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const currency = user?.currency || 'NGN';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Good to see you, {user?.full_name?.split(' ')[0]}</h1>
          <p>Here's the clearest picture of your money this month.</p>
        </div>
      </div>

      {loading && <div className="empty-state">Loading your dashboard…</div>}
      {error && <p className="error-text">{error}</p>}

      {data && (
        <>
          <div className="grid grid--stats" style={{ marginBottom: 18 }}>
            <StatCard
              label="Total income (month)"
              value={formatCurrency(data.summary.totalIncome, currency)}
              tone="income"
            />
            <StatCard
              label="Total expense (month)"
              value={formatCurrency(data.summary.totalExpense, currency)}
              tone="expense"
            />
            <StatCard
              label="Net balance"
              value={formatCurrency(data.summary.netBalance, currency)}
              pill={
                <span className={`pill ${data.summary.netBalance >= 0 ? 'pill--income' : 'pill--expense'}`}>
                  {data.summary.savingsRate}% savings rate
                </span>
              }
            />
            <ForecastCard forecast={data.forecast} currency={currency} />
          </div>

          <div className="grid grid--two" style={{ marginBottom: 18 }}>
            <MonthlyTrendChart data={data.monthlyTrend} currency={currency} />
            <CategoryBreakdownChart data={data.categoryBreakdown} currency={currency} />
          </div>

          <RecentTransactions transactions={data.recentTransactions} currency={currency} />
        </>
      )}
    </div>
  );
}
