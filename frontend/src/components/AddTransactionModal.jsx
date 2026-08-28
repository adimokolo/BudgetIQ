import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import Modal from './Modal';

const EMPTY_FORM = { type: 'expense', amount: '', categoryId: '', description: '', occurredOn: '' };

/**
 * Dispatched on the window after a transaction is successfully created, so
 * any page (Dashboard, Transactions, Budgets) can refetch its own data
 * without this modal needing to know who's listening.
 */
export const TRANSACTION_CREATED_EVENT = 'budgetiq:transaction-created';

export default function AddTransactionModal({ onClose }) {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiClient.get('/categories').then((res) => setCategories(res.data.categories));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await apiClient.post('/transactions', {
        ...form,
        amount: Number(form.amount),
        categoryId: form.categoryId || null,
      });
      window.dispatchEvent(new CustomEvent(TRANSACTION_CREATED_EVENT));
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save transaction.');
    } finally {
      setSaving(false);
    }
  };

  const filteredCategories = categories.filter((c) => c.type === form.type);

  return (
    <Modal title="Add transaction" onClose={onClose}>
      <form onSubmit={handleSubmit}>
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
        <button className="btn btn--primary btn--block" type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save transaction'}
        </button>
      </form>
    </Modal>
  );
}
