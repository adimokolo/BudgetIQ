import { useEffect, useState, useRef } from 'react';
import apiClient from '../api/client';
import Modal from './Modal';

const EMPTY_FORM = { type: 'expense', amount: '', categoryId: '', description: '', occurredOn: '' };

export const TRANSACTION_CREATED_EVENT = 'budgetiq:transaction-created';

function safeEval(expr) {
  const cleaned = expr.replace(/÷/g, '/').replace(/×/g, '*');
  const allowed = /^[\d+\-*/.() ]+$/;
  if (!allowed.test(cleaned)) return null;
  try {
    const result = Function('"use strict"; return (' + cleaned + ')')();
    if (!isFinite(result) || result < 0) return null;
    return Number(result.toFixed(2));
  } catch (err) {
    return null;
  }
}

function InlineCalculator({ onResult, onClose }) {
  const [expression, setExpression] = useState('');
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const BUTTONS = [
    ['7', '8', '9', 'D'],
    ['4', '5', '6', 'X'],
    ['1', '2', '3', '-'],
    ['0', '.', 'C', '+'],
  ];

  const handleButton = (val) => {
    if (val === 'C') { setExpression(''); setResult(null); setError(false); return; }
    const symbol = val === 'D' ? '/' : val === 'X' ? '*' : val;
    setExpression((prev) => prev + symbol);
    setError(false);
  };

  const handleEvaluate = () => {
    const val = safeEval(expression);
    if (val === null) { setError(true); setResult(null); }
    else { setResult(val); setError(false); }
  };

  const handleUse = () => {
    const val = safeEval(expression);
    if (val === null) { setError(true); return; }
    onResult(val);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleEvaluate();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div style={{
      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
      background: 'var(--surface)', border: '1px solid var(--surface-border)',
      borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      padding: 12, marginTop: 4,
    }}>
      <input
        ref={inputRef}
        value={expression}
        onChange={(e) => { setExpression(e.target.value); setError(false); }}
        onKeyDown={handleKeyDown}
        placeholder="e.g. 200 + 150 + 50"
        style={{
          width: '100%', fontSize: 16, fontWeight: 600, padding: '8px 10px',
          borderRadius: 6, border: '1px solid var(--surface-border)',
          marginBottom: 8, boxSizing: 'border-box',
          background: 'var(--surface-strong)', color: 'var(--ink)',
        }}
      />

      {result !== null && (
        <div style={{ fontSize: 13, color: 'var(--income)', fontWeight: 700, marginBottom: 8, textAlign: 'right' }}>
          = {result.toLocaleString()}
        </div>
      )}

      {error && (
        <div style={{ fontSize: 12, color: 'var(--expense)', marginBottom: 8 }}>
          Invalid expression
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
        {BUTTONS.flat().map((btn) => (
          <button
            key={btn}
            type="button"
            onClick={() => handleButton(btn)}
            style={{
              padding: '10px 0', borderRadius: 6,
              border: '1px solid var(--surface-border)',
              background: ['D', 'X', '-', '+'].includes(btn)
                ? 'var(--brand-gradient)'
                : btn === 'C' ? 'var(--expense-soft)' : 'var(--surface-strong)',
              color: ['D', 'X', '-', '+'].includes(btn) ? '#fff' : 'var(--ink)',
              fontWeight: 600, fontSize: 15, cursor: 'pointer',
            }}
          >
            {btn === 'D' ? '/' : btn === 'X' ? '*' : btn}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <button type="button" className="btn btn--ghost" onClick={onClose} style={{ fontSize: 13 }}>
          Cancel
        </button>
        <button type="button" className="btn btn--primary" onClick={handleUse} style={{ fontSize: 13 }}>
          Use amount
        </button>
      </div>
    </div>
  );
}

export default function AddTransactionModal({ onClose }) {
  const [categories, setCategories] = useState([]);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [error, setError]           = useState(null);
  const [saving, setSaving]         = useState(false);
  const [showCalc, setShowCalc]     = useState(false);

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
        amount:     Number(form.amount),
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

        <div className="field" style={{ position: 'relative' }}>
          <label htmlFor="txAmount">Amount</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              id="txAmount"
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              style={{ paddingRight: 40, width: '100%' }}
              required
            />
            <button
              type="button"
              onClick={() => setShowCalc((v) => !v)}
              title="Open calculator"
              style={{
                position: 'absolute', right: 10, background: 'none', border: 'none',
                cursor: 'pointer', fontSize: 18, padding: 0, lineHeight: 1,
                color: showCalc ? 'var(--brand)' : 'var(--ink-faint)',
              }}
            >
              🧮
            </button>
          </div>

          {showCalc && (
            <InlineCalculator
              onResult={(val) => setForm((f) => ({ ...f, amount: String(val) }))}
              onClose={() => setShowCalc(false)}
            />
          )}
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

        {error && (
          <p className="error-text" style={{ marginBottom: 12 }}>
            {error}
          </p>
        )}

        <button className="btn btn--primary btn--block" type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save transaction'}
        </button>

      </form>
    </Modal>
  );
}
