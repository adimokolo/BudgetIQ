import { useEffect, useState, useRef } from 'react';
import apiClient from '../api/client';
import Modal from './Modal';
import CustomSelect from './CustomSelect';
import { ALL_CURRENCIES, formatCurrency as formatCurr } from '../utils/currency';
import { convertCurrency } from '../services/convertCurrency';
import { getAccounts } from '../services/accounts';
import { useAuth } from '../context/AuthContext';

const EMPTY_FORM = { type: 'expense', amount: '', categoryId: '', description: '', occurredOn: '', accountId: '' };

export const TRANSACTION_CREATED_EVENT = 'budgetiq:transaction-created';

const CURRENCY_OPTIONS = ALL_CURRENCIES.map((c) => ({
  value: c.code,
  label: `${c.code} — ${c.name}`,
}));

/*
|--------------------------------------------------------------------------
| SAFE EVALUATE
|--------------------------------------------------------------------------
*/
function safeEval(expr) {
  const cleaned = expr.replace(/D/g, '/').replace(/X/g, '*');
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

/*
|--------------------------------------------------------------------------
| INLINE CALCULATOR
|--------------------------------------------------------------------------
*/
function InlineCalculator({ onResult, onClose }) {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(false);
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
        onKeyDown={(e) => { if (e.key === 'Enter') handleEvaluate(); if (e.key === 'Escape') onClose(); }}
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
      {error && <div style={{ fontSize: 12, color: 'var(--expense)', marginBottom: 8 }}>Invalid expression</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
        {BUTTONS.flat().map((btn) => (
          <button key={btn} type="button" onClick={() => handleButton(btn)} style={{
            padding: '10px 0', borderRadius: 6,
            border: '1px solid var(--surface-border)',
            background: ['D', 'X', '-', '+'].includes(btn) ? 'var(--brand-gradient)' : btn === 'C' ? 'var(--expense-soft)' : 'var(--surface-strong)',
            color: ['D', 'X', '-', '+'].includes(btn) ? '#fff' : 'var(--ink)',
            fontWeight: 600, fontSize: 15, cursor: 'pointer',
          }}>
            {btn === 'D' ? '/' : btn === 'X' ? '*' : btn}
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <button type="button" className="btn btn--ghost" onClick={onClose} style={{ fontSize: 13 }}>Cancel</button>
        <button type="button" className="btn btn--primary" onClick={handleUse} style={{ fontSize: 13 }}>Use amount</button>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| ACCOUNT PICKER MODAL
|--------------------------------------------------------------------------
*/
function AccountPickerModal({ accounts, selectedId, onSelect, onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div className="facet-card" style={{ width: '100%', maxWidth: 400, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Select account</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        {accounts.length === 0 ? (
          <p style={{ color: 'var(--ink-faint)', textAlign: 'center', padding: '20px 0' }}>
            No accounts yet — add one from the Accounts page first.
          </p>
        ) : (
          <div>
            {accounts.map((acc) => (
              <div
                key={acc.id}
                onClick={() => { onSelect(acc); onClose(); }}
                style={{
                  padding: '12px 14px', borderRadius: 8, marginBottom: 8,
                  border: `1px solid ${selectedId === acc.id ? 'var(--brand-mid)' : 'var(--surface-border)'}`,
                  background: selectedId === acc.id ? 'var(--surface-strong)' : 'var(--surface)',
                  cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>👛 {acc.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 2 }}>{acc.currency}</div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--income)', fontSize: 14 }}>
                  {Number(acc.balance || 0).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
        <button type="button" className="btn btn--ghost" onClick={onClose} style={{ width: '100%', marginTop: 8 }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| INLINE CURRENCY CONVERTER
|--------------------------------------------------------------------------
*/
function InlineConverter({ userCurrency, onAddToTransaction }) {
  const [amount, setAmount] = useState('');
  const [fromCurrency, setFromCurrency] = useState(userCurrency || 'NGN');
  const [toCurrency, setToCurrency] = useState('USD');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConvert = async (e) => {
    e.preventDefault();
    setError(null); setResult(null);
    const value = Number(amount);
    if (!amount || Number.isNaN(value) || value <= 0) { setError('Enter a valid amount.'); return; }
    setLoading(true);
    try {
      const converted = await convertCurrency(value, fromCurrency, toCurrency);
      setResult(converted);
    } catch (err) {
      setError(err.message || 'Could not fetch rates.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'var(--surface-strong)', borderRadius: 10,
      border: '1px solid var(--surface-border)', padding: 14, marginBottom: 16,
    }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-faint)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
        Currency Converter
      </p>

      <div className="field">
        <label>Amount</label>
        <input
          type="number" min="0" step="0.01" value={amount}
          onChange={(e) => { setAmount(e.target.value); setResult(null); }}
          placeholder="0.00"
        />
      </div>

      <div className="field">
        <label>From</label>
        <CustomSelect
          value={fromCurrency}
          onChange={(val) => { setFromCurrency(val); setResult(null); }}
          options={CURRENCY_OPTIONS}
          searchPlaceholder="Search currency..."
        />
      </div>

      <div style={{ textAlign: 'center', margin: '6px 0' }}>
        <button type="button" className="btn btn--ghost"
          onClick={() => { setFromCurrency(toCurrency); setToCurrency(fromCurrency); setResult(null); }}
          style={{ fontSize: 16, padding: '4px 16px' }}>
          ⇅ Swap
        </button>
      </div>

      <div className="field">
        <label>To</label>
        <CustomSelect
          value={toCurrency}
          onChange={(val) => { setToCurrency(val); setResult(null); }}
          options={CURRENCY_OPTIONS}
          searchPlaceholder="Search currency..."
        />
      </div>

      {error && <p className="error-text" style={{ marginBottom: 8 }}>{error}</p>}

      <button type="button" className="btn btn--primary btn--block" onClick={handleConvert} disabled={loading}>
        {loading ? 'Converting…' : 'Convert'}
      </button>

      {result !== null && !error && (
        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--ink-faint)', marginBottom: 4 }}>
            {fromCurrency} {Number(amount).toLocaleString()} ≈
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--income)', marginBottom: 10 }}>
            {toCurrency} {result.toLocaleString()}
          </div>
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={() => onAddToTransaction({ amount: result, currency: toCurrency, fromAmount: Number(amount), fromCurrency })}
          >
            + Add to transaction
          </button>
        </div>
      )}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| ADD TRANSACTION MODAL
|--------------------------------------------------------------------------
*/
export default function AddTransactionModal({ onClose, prefillAmount = '', prefillAccountId = '' }) {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({ ...EMPTY_FORM, amount: prefillAmount, accountId: prefillAccountId });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [showConverter, setShowConverter] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [pendingConvert, setPendingConvert] = useState(null);

  useEffect(() => {
    apiClient.get('/categories')
      .then((res) => setCategories(res.data.categories || []))
      .catch(() => setCategories([]));

    getAccounts()
      .then((res) => {
        const loadedAccounts = res.accounts || res || [];

        setAccounts(Array.isArray(loadedAccounts) ? loadedAccounts : []);

        // Automatically select the first available account
        // only if no account is already selected.
        if (
          !prefillAccountId &&
          Array.isArray(loadedAccounts) &&
          loadedAccounts.length > 0
        ) {
          setForm((current) => ({
            ...current,
            accountId: current.accountId || loadedAccounts[0].id,
          }));
        }
      })
      .catch(() => setAccounts([]));
  }, [prefillAccountId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // A transaction must reference an existing account.
    if (!form.accountId) {
      setError('Please select an account before saving the transaction.');
      return;
    }

    const accountExists = accounts.some(
      (account) => String(account.id) === String(form.accountId)
    );

    if (!accountExists) {
      setError('The selected account is no longer available. Please select an account again.');
      return;
    }

    setSaving(true);
    try {
      await apiClient.post('/transactions', {
        ...form,
        amount: Number(form.amount),
        categoryId: form.categoryId || null,
        accountId: form.accountId || null,
      });
      window.dispatchEvent(new CustomEvent(TRANSACTION_CREATED_EVENT));
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save transaction.');
    } finally {
      setSaving(false);
    }
  };

  // Called when user clicks "+ Add to transaction" inside the converter
  const handleConverterAdd = (convertedResult) => {
    const roundedAmount =
      Math.round((Number(convertedResult.amount) + Number.EPSILON) * 100) / 100;

    const roundedResult = {
      ...convertedResult,
      amount: roundedAmount,
    };

    setPendingConvert(roundedResult);

    if (accounts.length > 0) {
      setShowAccountPicker(true);
    } else {
      setForm((f) => ({
        ...f,
        amount: roundedAmount.toFixed(2),
      }));
      setShowConverter(false);
    }
  };

  const handleAccountSelected = (acc) => {
    setForm((f) => ({
      ...f,
      amount:
        pendingConvert?.amount != null
          ? Number(pendingConvert.amount).toFixed(2)
          : f.amount,
      accountId: acc.id,
    }));

    setPendingConvert(null);
    setShowConverter(false);
  };

  const selectedAccount = accounts.find((a) => a.id === form.accountId);
  const filteredCategories = categories.filter((c) => c.type === form.type);

  return (

    <>
      <Modal title="Add transaction" onClose={onClose}>
        <form onSubmit={handleSubmit}>

          {/* Type */}
          <div className="field">
            <label>Type</label>
            <CustomSelect
              value={form.type}
              onChange={(val) => setForm({ ...form, type: val, categoryId: '' })}
              options={[
                { value: 'expense', label: 'Expense' },
                { value: 'income', label: 'Income' },
              ]}
            />
          </div>

          {/* Amount with calculator */}
          <div className="field" style={{ position: 'relative' }}>
            <label>Amount</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="number" min="0.01" step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                style={{ paddingRight: 40, width: '100%' }}
                required
              />
              <button type="button" onClick={() => setShowCalc((v) => !v)} title="Calculator"
                style={{
                  position: 'absolute', right: 10, background: 'none', border: 'none',
                  cursor: 'pointer', fontSize: 18, padding: 0, lineHeight: 1,
                  color: showCalc ? 'var(--brand-mid)' : 'var(--ink-faint)',
                }}>
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

          {/* Account selector */}
          <div className="field">
            <label>Account <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>(optional)</span></label>
            <div
              onClick={() => setShowAccountPicker(true)}
              style={{
                background: 'var(--surface-strong)', border: '1px solid var(--surface-border)',
                borderRadius: 'var(--radius-sm)', padding: '11px 13px', cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                fontSize: 14.5, color: selectedAccount ? 'var(--ink)' : 'var(--ink-faint)',
              }}
            >
              <span>{selectedAccount ? `👛 ${selectedAccount.name}` : 'Select account...'}</span>
              <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>▼</span>
            </div>
            {selectedAccount && (
              <button type="button" onClick={() => setForm((f) => ({ ...f, accountId: '' }))}
                style={{ fontSize: 11, color: 'var(--ink-faint)', background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}>
                ✕ Remove account
              </button>
            )}
          </div>

          {/* Category */}
          <div className="field">
            <label>Category</label>
            <CustomSelect
              value={form.categoryId}
              onChange={(val) => setForm({ ...form, categoryId: val })}
              options={[
                { value: '', label: 'Uncategorized' },
                ...filteredCategories.map((c) => ({ value: c.id, label: c.name })),
              ]}
              placeholder="Uncategorized"
            />
          </div>

          {/* Description */}
          <div className="field">
            <label>Description</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional note"
            />
          </div>

          {/* Date */}
          <div className="field">
            <label>Date</label>
            <input
              type="date"
              value={form.occurredOn}
              onChange={(e) => setForm({ ...form, occurredOn: e.target.value })}
            />
          </div>

          {/* Converter toggle */}
          <button
            type="button"
            className="btn btn--ghost btn--block"
            onClick={() => setShowConverter((v) => !v)}
            style={{ marginBottom: 12, fontSize: 13 }}
          >
            {showConverter ? '✕ Hide converter' : '⇄ Currency converter'}
          </button>

          {/* Inline converter */}
          {showConverter && (
            <InlineConverter
              userCurrency={user?.currency || 'NGN'}
              onAddToTransaction={handleConverterAdd}
            />
          )}

          {error && <p className="error-text" style={{ marginBottom: 12 }}>{error}</p>}

          <button className="btn btn--primary btn--block" type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save transaction'}
          </button>

        </form>
      </Modal>

      {/* Account picker overlay */}
      {showAccountPicker && (
        <AccountPickerModal
          accounts={accounts}
          selectedId={form.accountId}
          onSelect={handleAccountSelected}
          onClose={() => setShowAccountPicker(false)}
        />
      )}
    </>
  );
}
