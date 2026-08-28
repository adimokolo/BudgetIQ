import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import Skeleton from '../components/Skeleton';
import { formatCurrency } from '../utils/format';
import { TRANSACTION_CREATED_EVENT } from '../components/AddTransactionModal';

export default function Budgets() {
  const { user } = useAuth();
  const currency = user?.currency || 'NGN';

  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ categoryId: '', monthlyLimit: '' });
  const [error, setError] = useState(null);

  const loadBudgets = () => {
    setLoading(true);
    apiClient
      .get('/budgets')
      .then((res) => setBudgets(res.data.budgets))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    apiClient.get('/categories').then((res) =>
      setCategories(res.data.categories.filter((c) => c.type === 'expense'))
    );
    loadBudgets();
  }, []);

  useEffect(() => {
    const handler = () => loadBudgets();
    window.addEventListener(TRANSACTION_CREATED_EVENT, handler);
    return () => window.removeEventListener(TRANSACTION_CREATED_EVENT, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await apiClient.post('/budgets', {
        categoryId: form.categoryId || null,
        monthlyLimit: Number(form.monthlyLimit),
      });
      setModalOpen(false);
      setForm({ categoryId: '', monthlyLimit: '' });
      loadBudgets();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save budget.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this budget limit?')) return;
    await apiClient.delete(`/budgets/${id}`);
    loadBudgets();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Budgets</h1>
          <p>Set monthly limits and see how close you are to them.</p>
        </div>
        <button className="btn btn--primary" onClick={() => setModalOpen(true)}>
          + Set budget
        </button>
      </div>

      {loading ? (
        <div className="grid grid--stats">
          {[0, 1, 2].map((i) => (
            <div className="facet-card" key={i}>
              <Skeleton width="60%" height={13} />
              <Skeleton width="80%" height={22} style={{ marginTop: 12 }} />
              <Skeleton height={8} radius={999} style={{ marginTop: 12 }} />
            </div>
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="facet-card empty-state">No budgets yet — set a monthly limit to start tracking.</div>
      ) : (
        <div className="grid grid--stats">
          {budgets.map((b) => {
            const over = b.percent_used >= 100;
            return (
              <div className="facet-card" key={b.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 14.5 }}>
                    <span className="cat-dot" style={{ background: b.category_color || '#B9C3D4' }} />
                    {b.category_name || 'Overall'}
                  </span>
                  <button className="icon-btn" onClick={() => handleDelete(b.id)} aria-label="Delete budget">
                    ✕
                  </button>
                </div>

                <div className="stat-value" style={{ fontSize: 20, marginTop: 12 }}>
                  {formatCurrency(b.spent_this_month, currency)}{' '}
                  <span style={{ fontSize: 13, color: 'var(--ink-faint)', fontWeight: 400 }}>
                    / {formatCurrency(b.monthly_limit, currency)}
                  </span>
                </div>

                <div className="progress-track">
                  <div
                    className={`progress-fill${over ? ' progress-fill--over' : ''}`}
                    style={{ width: `${Math.min(100, b.percent_used)}%` }}
                  />
                </div>
                <p className="helper-text" style={{ marginTop: 8 }}>
                  {over ? `${b.percent_used}% used — over limit` : `${b.percent_used}% of monthly limit used`}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <Modal title="Set a budget limit" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleCreate}>
            <div className="field">
              <label htmlFor="budgetCategory">Category</label>
              <select
                id="budgetCategory"
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              >
                <option value="">Overall spending</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="budgetLimit">Monthly limit</label>
              <input
                id="budgetLimit"
                type="number"
                min="1"
                step="0.01"
                value={form.monthlyLimit}
                onChange={(e) => setForm({ ...form, monthlyLimit: e.target.value })}
                required
              />
            </div>
            {error && <p className="error-text" style={{ marginBottom: 12 }}>{error}</p>}
            <button className="btn btn--primary btn--block" type="submit">
              Save budget
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
