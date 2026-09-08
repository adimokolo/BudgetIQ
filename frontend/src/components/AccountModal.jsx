// frontend/src/components/AccountModal.jsx
import { useState } from 'react';
import { createAccount, updateAccount } from '../services/accounts';
import { ALL_CURRENCIES } from '../utils/currency';

export default function AccountModal({ account, onClose }) {
  const isEditing = !!account;

  const [form, setForm] = useState({
    name: account?.name || '',
    currency: account?.currency || 'NGN',
    initialAmount: account?.initialAmount || '',
    notes: account?.notes || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isEditing) {
        await updateAccount(account.id, form);
      } else {
        await createAccount(form);
      }
      onClose();
    } catch (err) {
      setError(err.error || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h2>{isEditing ? 'Edit Account' : 'Add Account'}</h2>

        {error && <p className="error-text">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Account Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Main Wallet"
              required
            />
          </div>

          <div className="field">
            <label>Currency</label>
            <select name="currency" value={form.currency} onChange={handleChange}>
              {ALL_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Opening Balance</label>
            <input
              name="initialAmount"
              type="number"
              value={form.initialAmount}
              onChange={handleChange}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>

          <div className="field">
            <label>Notes (optional)</label>
            <input
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Any extra details"
            />
          </div>

          <div className="modal__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={loading}>
              {loading ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
