import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { formatCurrency, formatDate } from '../utils/format';

const EMPTY_FORM = { type: 'expense', amount: '', categoryId: '', description: '', occurredOn: '' };

export default function Transactions() {
  const { user } = useAuth();
  const currency = user?.currency || 'NGN';

  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);

  const loadTransactions = (type = filterType) => {
    setLoading(true);
    apiClient
      .get('/transactions', { params: type ? { type } : {} })
      .then((res) => setTransactions(res.data.transactions))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    apiClient.get('/categories').then((res) => setCategories(res.data.categories));
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadTransactions(filterType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await apiClient.post('/transactions', {
        ...form,
        amount: Number(form.amount),
        categoryId: form.categoryId || null,
      });
      setModalOpen(false);
      setForm(EMPTY_FORM);
      loadTransactions();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save transaction.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    await apiClient.delete(`/transactions/${id}`);
    loadTransactions();
  };

  const filteredCategories = categories.filter((c) => c.type === form.type);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Transactions</h1>
          <p>Every naira in, every naira out.</p>
        </div>
        <button className="btn btn--primary" onClick={() => setModalOpen(true)}>
          + Add transaction
        </button>
      </div>

      <div className="toolbar">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </div>

      <div className="facet-card facet-card--flush">
        {loading ? (
          <div className="empty-state">Loading transactions…</div>
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

      {modalOpen && (
        <Modal title="Add transaction" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleCreate}>
            <div className="field">
              <label htmlFor="txType">Type</label>
              <select
                id="txType"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value, categoryId: '' })}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="txAmount">Amount</label>
              <input
                id="txAmount"
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="txCategory">Category</label>
              <select
                id="txCategory"
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              >
                <option value="">Uncategorized</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="txDescription">Description</label>
              <input
                id="txDescription"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional note"
              />
            </div>
            <div className="field">
              <label htmlFor="txDate">Date</label>
              <input
                id="txDate"
                type="date"
                value={form.occurredOn}
                onChange={(e) => setForm({ ...form, occurredOn: e.target.value })}
              />
            </div>
            {error && <p className="error-text" style={{ marginBottom: 12 }}>{error}</p>}
            <button className="btn btn--primary btn--block" type="submit">
              Save transaction
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
