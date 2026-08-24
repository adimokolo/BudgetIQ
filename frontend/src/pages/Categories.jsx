import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import Modal from '../components/Modal';

const SWATCHES = ['#38C6FF', '#8C6BFF', '#35E6C0', '#FF8FA3', '#FFC96B', '#63C7FF', '#4FD1C5', '#FF6B9D'];

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'expense', color: SWATCHES[0] });
  const [error, setError] = useState(null);

  const loadCategories = () => {
    setLoading(true);
    apiClient
      .get('/categories')
      .then((res) => setCategories(res.data.categories))
      .finally(() => setLoading(false));
  };

  useEffect(loadCategories, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await apiClient.post('/categories', form);
      setModalOpen(false);
      setForm({ name: '', type: 'expense', color: SWATCHES[0] });
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create category.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category? Existing transactions will keep their history but lose the tag.')) return;
    await apiClient.delete(`/categories/${id}`);
    loadCategories();
  };

  const income = categories.filter((c) => c.type === 'income');
  const expense = categories.filter((c) => c.type === 'expense');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Categories</h1>
          <p>Organize income and spending so patterns are easy to spot.</p>
        </div>
        <button className="btn btn--primary" onClick={() => setModalOpen(true)}>
          + New category
        </button>
      </div>

      {loading ? (
        <div className="empty-state">Loading categories…</div>
      ) : (
        <div className="grid grid--two">
          <div className="facet-card">
            <h3 className="section-title">Income</h3>
            <p className="section-subtitle">{income.length} categories</p>
            <CategoryList items={income} onDelete={handleDelete} />
          </div>
          <div className="facet-card">
            <h3 className="section-title">Expense</h3>
            <p className="section-subtitle">{expense.length} categories</p>
            <CategoryList items={expense} onDelete={handleDelete} />
          </div>
        </div>
      )}

      {modalOpen && (
        <Modal title="New category" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleCreate}>
            <div className="field">
              <label htmlFor="catName">Name</label>
              <input
                id="catName"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Data & Airtime"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="catType">Type</label>
              <select
                id="catType"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div className="field">
              <label>Color</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {SWATCHES.map((color) => (
                  <button
                    type="button"
                    key={color}
                    onClick={() => setForm({ ...form, color })}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 8,
                      background: color,
                      border: form.color === color ? '2px solid var(--ink)' : '2px solid transparent',
                      cursor: 'pointer',
                    }}
                    aria-label={`Choose color ${color}`}
                  />
                ))}
              </div>
            </div>
            {error && <p className="error-text" style={{ marginBottom: 12 }}>{error}</p>}
            <button className="btn btn--primary btn--block" type="submit">
              Save category
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function CategoryList({ items, onDelete }) {
  if (items.length === 0) return <div className="empty-state">None yet.</div>;
  return (
    <div>
      {items.map((c) => (
        <div className="list-row" key={c.id}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="cat-dot" style={{ background: c.color }} />
            {c.name}
          </span>
          <button className="icon-btn" onClick={() => onDelete(c.id)} aria-label={`Delete ${c.name}`}>
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
