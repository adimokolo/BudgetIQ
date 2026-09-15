// frontend/src/components/AccountModal.jsx

import { useState } from 'react';
import { createAccount, updateAccount } from '../services/accounts';
import { ALL_CURRENCIES } from '../utils/currency';

const ACCOUNT_COLORS = [
  '#6366F1',
  '#2563EB',
  '#06B6D4',
  '#10B981',
  '#22C55E',
  '#84CC16',
  '#EAB308',
  '#F97316',
  '#EF4444',
  '#EC4899',
  '#A855F7',
  '#64748B',
];

export default function AccountModal({ account, onClose }) {
  const isEditing = !!account;

  const [form, setForm] = useState({
    name: account?.name || '',
    currency: account?.currency || 'NGN',
    initialAmount: account?.initialAmount || '',
    notes: account?.notes || '',
    color: account?.color || '#6366F1',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
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
          {/* Account Name */}
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

          {/* Currency */}
          <div className="field">
            <label>Currency</label>
            <select
              name="currency"
              value={form.currency}
              onChange={handleChange}
            >
              {ALL_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Account Color */}
          <div className="field">
            <label>Account Color</label>

            <div className="account-color-info">
              <span
                className="account-color-preview"
                style={{ backgroundColor: form.color }}
              />

              <span>
                Choose a color to help identify this account.
              </span>
            </div>

            <div className="account-color-picker">
              {ACCOUNT_COLORS.map((color) => {
                const isSelected = form.color === color;

                return (
                  <button
                    key={color}
                    type="button"
                    className={`account-color-swatch${isSelected
                        ? ' account-color-swatch--selected'
                        : ''
                      }`}
                    style={{ backgroundColor: color }}
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        color,
                      }))
                    }
                    aria-label={`Select ${color}`}
                    aria-pressed={isSelected}
                  />
                );
              })}
            </div>
          </div>

          {/* Opening Balance */}
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

          {/* Notes */}
          <div className="field">
            <label>Notes (optional)</label>
            <input
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Any extra details"
            />
          </div>

          {/* Actions */}
          <div className="modal__actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn--primary"
              disabled={loading}
            >
              {loading
                ? 'Saving…'
                : isEditing
                  ? 'Save Changes'
                  : 'Add Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}