import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import AddTransactionModal, { TRANSACTION_CREATED_EVENT } from '../components/AddTransactionModal';
import Skeleton from '../components/Skeleton';
import { formatCurrency, formatDate } from '../utils/format';
import { exportTransactionsToCsv, exportTransactionsToPdf } from '../utils/exportTransactions';

export default function Transactions() {
  const { user } = useAuth();
  const currency = user?.currency || 'NGN';

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const loadTransactions = (type = filterType) => {
    setLoading(true);
    apiClient
      .get('/transactions', { params: type ? { type } : {} })
      .then((res) => setTransactions(res.data.transactions))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadTransactions(filterType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType]);

  // Picks up transactions added from anywhere - the header button below,
  // or the global floating quick-add button on another page.
  useEffect(() => {
    const handler = () => loadTransactions(filterType);
    window.addEventListener(TRANSACTION_CREATED_EVENT, handler);
    return () => window.removeEventListener(TRANSACTION_CREATED_EVENT, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    await apiClient.delete(`/transactions/${id}`);
    loadTransactions();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Transactions</h1>
          <p>Every naira in, every naira out.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn--ghost"
            onClick={() => exportTransactionsToCsv(transactions, currency)}
            disabled={transactions.length === 0}
          >
            Export CSV
          </button>
          <button
            className="btn btn--ghost"
            onClick={() => exportTransactionsToPdf(transactions, currency)}
            disabled={transactions.length === 0}
          >
            Export PDF
          </button>
          <button className="btn btn--primary" onClick={() => setModalOpen(true)}>
            + Add transaction
          </button>
        </div>
      </div>

      <div className="toolbar">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </div>

      <div className="facet-card facet-card--flush" id="transactions-table-card">
        {loading ? (
          <div style={{ padding: '4px 20px' }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div className="skeleton-row" key={i}>
                <Skeleton width={80} height={12} />
                <Skeleton width="30%" height={12} style={{ marginLeft: 20 }} />
                <Skeleton width={90} height={12} style={{ marginLeft: 'auto' }} />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">No transactions match this filter yet.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td>{formatDate(t.occurred_on)}</td>
                  <td>{t.description || '—'}</td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="cat-dot" style={{ background: t.category_color || '#B9C3D4' }} />
                      {t.category_name || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="mono" style={{ color: t.type === 'income' ? 'var(--income)' : 'var(--expense)' }}>
                    {t.type === 'income' ? '+' : '-'}
                    {formatCurrency(t.amount, currency)}
                  </td>
                  <td>
                    <button className="icon-btn" onClick={() => handleDelete(t.id)} aria-label="Delete">
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && <AddTransactionModal onClose={() => setModalOpen(false)} />}
    </div>
  );
}
