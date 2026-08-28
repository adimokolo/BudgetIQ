import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import MonthlyTrendChart from '../components/MonthlyTrendChart';
import CategoryBreakdownChart from '../components/CategoryBreakdownChart';
import ForecastCard from '../components/ForecastCard';
import RecentTransactions from '../components/RecentTransactions';
import Skeleton from '../components/Skeleton';
import { formatCurrency } from '../utils/format';
import { TRANSACTION_CREATED_EVENT } from '../components/AddTransactionModal';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = () => {
    apiClient
      .get('/dashboard/summary')
      .then((res) => setData(res.data))
      .catch(() => setError('Could not load your dashboard right now.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    const handler = () => loadDashboard();
    window.addEventListener(TRANSACTION_CREATED_EVENT, handler);
    return () => window.removeEventListener(TRANSACTION_CREATED_EVENT, handler);
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

      {loading && (
        <div>
          <div className="grid grid--stats" style={{ marginBottom: 18 }}>
            {[0, 1, 2, 3].map((i) => (
              <div className="facet-card" key={i}>
                <Skeleton width={90} height={11} />
                <Skeleton width="70%" height={26} style={{ marginTop: 10 }} />
              </div>
            ))}
          </div>
          <div className="grid grid--two" style={{ marginBottom: 18 }}>
            <div className="facet-card"><Skeleton height={220} radius={12} /></div>
            <div className="facet-card"><Skeleton height={220} radius={12} /></div>
          </div>
          <div className="facet-card">
            {[0, 1, 2, 3].map((i) => (
              <div className="skeleton-row" key={i}>
                <Skeleton width={32} height={32} radius={8} />
                <div style={{ flex: 1 }}>
                  <Skeleton width="40%" height={12} />
                  <Skeleton width="25%" height={10} style={{ marginTop: 6 }} />
                </div>
                <Skeleton width={70} height={14} />
              </div>
            ))}
          </div>
        </div>
      )}
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
