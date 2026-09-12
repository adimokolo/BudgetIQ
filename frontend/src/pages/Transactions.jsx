import { useEffect, useState, useMemo } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import AddTransactionModal, { TRANSACTION_CREATED_EVENT } from '../components/AddTransactionModal';
import CurrencyConverterModal from '../components/CurrencyConverterModal';
import Skeleton from '../components/Skeleton';
import { formatCurrency, formatDate } from '../utils/format';
import { exportTransactionsToCsv, exportTransactionsToPdf } from '../utils/exportTransactions';
import { getIcon } from '../utils/categoryIcons';

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function toDateKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function TransactionCalendar({ transactions, selectedDate, onSelectDate, onShowAll, currency }) {
  const today = new Date();
  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [dailyData, setDailyData] = useState({});

  const DAYS   = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

  useEffect(() => {
    const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
    apiClient.get(`/dashboard/daily?month=${monthStr}`)
      .then((res) => {
        const map = {};
        (res.data.daily || []).forEach((d) => { map[d.date] = d; });
        setDailyData(map);
      })
      .catch(() => {});
  }, [viewYear, viewMonth]);

  const txDates = useMemo(() => {
    const set = new Set();
    transactions.forEach((t) => { if (t.occurred_on) set.add(toDateKey(t.occurred_on)); });
    return set;
  }, [transactions]);

  const daysInMonth  = getDaysInMonth(viewYear, viewMonth);
  const firstDaySlot = getFirstDayOfMonth(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const selectedDay = dailyData[selectedDate];

  return (
    <div className="facet-card" style={{ marginTop: 20, padding: '16px 20px' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 15 }}>
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {selectedDate && (
            <button
              className="btn btn--ghost"
              style={{ fontSize: 12, padding: '4px 10px' }}
              onClick={onShowAll}
            >
              Show all
            </button>
          )}
          <button className="icon-btn" onClick={prevMonth}>&#8249;</button>
          <button className="icon-btn" onClick={nextMonth}>&#8250;</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {DAYS.map((d) => (
          <div key={d} style={{
            textAlign: 'center', fontSize: 11, fontWeight: 600,
            color: 'var(--ink-faint)', padding: '2px 0',
          }}>
            {d}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {Array.from({ length: firstDaySlot }).map((_, i) => <div key={`empty-${i}`} />)}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day        = i + 1;
          const dateKey    = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isToday    = dateKey === toDateKey(today);
          const hasTx      = txDates.has(dateKey);
          const isSelected = selectedDate === dateKey;

          return (
            <div
              key={day}
              onClick={() => hasTx && onSelectDate(isSelected ? null : dateKey)}
              style={{
                textAlign: 'center', padding: '6px 2px', borderRadius: 6,
                cursor: hasTx ? 'pointer' : 'default',
                background: isSelected
                  ? 'var(--brand-gradient)'
                  : isToday
                  ? 'rgba(46, 143, 209, 0.18)'
                  : 'transparent',
                color: isSelected ? '#fff' : 'var(--ink)',
                fontWeight: isToday || isSelected ? 700 : 400,
                fontSize: 13,
              }}
            >
              {day}
              {hasTx && !isSelected && (
                <span style={{
                  display: 'block', width: 4, height: 4, borderRadius: '50%',
                  background: 'var(--brand-mid)', margin: '2px auto 0',
                }} />
              )}
            </div>
          );
        })}
      </div>

      {selectedDate && selectedDay && (
        <div style={{
          marginTop: 16, padding: '12px 16px', borderRadius: 8,
          background: 'var(--surface-strong)',
          border: '1px solid var(--surface-border)',
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-faint)', marginBottom: 10 }}>
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric',
            })}
          </p>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: 'var(--ink-faint)', marginBottom: 4 }}>Income</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--income)' }}>
                {formatCurrency(selectedDay.income, currency)}
              </p>
            </div>
            <div style={{ width: 1, background: 'var(--surface-border)' }} />
            <div style={{ flex: 1, textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: 'var(--ink-faint)', marginBottom: 4 }}>Expense</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--expense)' }}>
                {formatCurrency(selectedDay.expense, currency)}
              </p>
            </div>
            <div style={{ width: 1, background: 'var(--surface-border)' }} />
            <div style={{ flex: 1, textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: 'var(--ink-faint)', marginBottom: 4 }}>Net</p>
              <p style={{
                fontSize: 18, fontWeight: 700,
                color: selectedDay.income - selectedDay.expense >= 0 ? 'var(--income)' : 'var(--expense)',
              }}>
                {formatCurrency(selectedDay.income - selectedDay.expense, currency)}
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function Transactions() {
  const { user } = useAuth();
  const currency = user?.currency || 'NGN';

  const [transactions, setTransactions]   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [filterType, setFilterType]       = useState('');
  const [selectedDate, setSelectedDate]   = useState(null);
  const [modalOpen, setModalOpen]         = useState(false);
  const [converterOpen, setConverterOpen] = useState(false);

  const loadTransactions = (type = filterType) => {
    setLoading(true);
    apiClient
      .get('/transactions', { params: type ? { type } : {} })
      .then((res) => setTransactions(res.data.transactions))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadTransactions(); }, []);
  useEffect(() => { loadTransactions(filterType); }, [filterType]);

  useEffect(() => {
    const handler = () => loadTransactions(filterType);
    window.addEventListener(TRANSACTION_CREATED_EVENT, handler);
    return () => window.removeEventListener(TRANSACTION_CREATED_EVENT, handler);
  }, [filterType]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    await apiClient.delete(`/transactions/${id}`);
    loadTransactions();
  };

  const displayedTransactions = useMemo(() => {
    if (!selectedDate) return transactions;
    return transactions.filter((t) => toDateKey(t.occurred_on) === selectedDate);
  }, [transactions, selectedDate]);

  return (
    <div>

      <div className="page-header">
        <div>
          <h1>Transactions</h1>
          <p>Every money in, every money out.</p>
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
          <button
            className="btn btn--primary"
            onClick={() => setConverterOpen(true)}
          >
            Convert
          </button>
          <button className="btn btn--primary" onClick={() => setModalOpen(true)}>
            + Add transaction
          </button>
        </div>
      </div>

      <div className="toolbar">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{ maxWidth: 180 }}
        >
          <option value="">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        {selectedDate && (
          <span style={{ fontSize: 13, color: 'var(--ink-soft)', marginLeft: 12 }}>
            Showing: {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
              month: 'long', day: 'numeric', year: 'numeric',
            })}
          </span>
        )}
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
        ) : displayedTransactions.length === 0 ? (
          <div className="empty-state">
            {selectedDate ? 'No transactions on this date.' : 'No transactions match this filter yet.'}
          </div>
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
              {displayedTransactions.map((t) => (
                <tr key={t.id}>
                  <td>{formatDate(t.occurred_on)}</td>
                  <td>{t.description || '—'}</td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: t.category_color || '#B9C3D4',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 13, flexShrink: 0,
                      }}>
                        {getIcon(t.category_icon)}
                      </span>
                      {t.category_name || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="mono" style={{
                    color: t.type === 'income' ? 'var(--income)' : 'var(--expense)',
                  }}>
                    {t.type === 'income' ? '+' : '-'}
                    {formatCurrency(t.amount, currency)}
                  </td>
                  <td>
                    <button className="icon-btn" onClick={() => handleDelete(t.id)} aria-label="Delete">
                      x
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <TransactionCalendar
        transactions={transactions}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onShowAll={() => setSelectedDate(null)}
        currency={currency}
      />

      {modalOpen && <AddTransactionModal onClose={() => setModalOpen(false)} />}

      {converterOpen && (
        <CurrencyConverterModal
          defaultFrom={currency}
          onClose={() => setConverterOpen(false)}
        />
      )}

    </div>
  );
}
