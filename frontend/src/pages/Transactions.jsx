import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import AddTransactionModal, {
  TRANSACTION_CREATED_EVENT,
} from '../components/AddTransactionModal';
import Skeleton from '../components/Skeleton';
import { formatCurrency, formatDate } from '../utils/format';
import {
  exportTransactionsToCsv,
  exportTransactionsToPdf,
} from '../utils/exportTransactions';
import { getIcon } from '../utils/categoryIcons';
import KebabMenu from '../components/KebabMenu';

function toDateKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function TransactionCalendar({
  transactions,
  selectedDate,
  onSelectDate,
  onShowAll,
  currency,
}) {
  const today = new Date();

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [dailyData, setDailyData] = useState({});

  const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  useEffect(() => {
    const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;

    apiClient
      .get(`/dashboard/daily?month=${monthStr}`)
      .then((res) => {
        const map = {};

        (res.data.daily || []).forEach((day) => {
          map[day.date] = day;
        });

        setDailyData(map);
      })
      .catch(() => { });
  }, [viewYear, viewMonth]);

  const dailyBalances = useMemo(() => {
    const map = {};

    transactions.forEach((transaction) => {
      if (!transaction.occurred_on) return;

      const key = toDateKey(transaction.occurred_on);

      const amount =
        transaction.type === 'income'
          ? Number(transaction.amount)
          : -Number(transaction.amount);

      map[key] = (map[key] || 0) + amount;
    });

    return map;
  }, [transactions]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDaySlot = getFirstDayOfMonth(viewYear, viewMonth);
  const todayKey = toDateKey(today);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((year) => year - 1);
    } else {
      setViewMonth((month) => month - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((year) => year + 1);
    } else {
      setViewMonth((month) => month + 1);
    }
  };

  const goToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    onSelectDate(todayKey);
  };

  const selectedDay = dailyData[selectedDate];

  return (
    <div
      className="facet-card"
      style={{
        marginTop: 20,
        padding: '16px 20px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 4,
        }}
      >
        <div>
          <h3 className="section-title" style={{ margin: 0 }}>
            Calendar
          </h3>

          <p
            style={{
              fontSize: 11,
              color: 'var(--ink-faint)',
              margin: '2px 0 0',
            }}
          >
            Daily net balance
          </p>
        </div>

        <button
          type="button"
          onClick={goToToday}
          style={{
            fontSize: 12,
            color: 'var(--brand-mid)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Today
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '12px 0',
        }}
      >
        <button
          type="button"
          className="icon-btn"
          onClick={prevMonth}
        >
          &#8249;
        </button>

        <span style={{ fontWeight: 700, fontSize: 14 }}>
          {MONTHS[viewMonth]} {viewYear}
        </span>

        <div style={{ display: 'flex', gap: 8 }}>
          {selectedDate && (
            <button
              type="button"
              className="btn btn--ghost"
              style={{
                fontSize: 11,
                padding: '3px 10px',
              }}
              onClick={onShowAll}
            >
              Show all
            </button>
          )}

          <button
            type="button"
            className="icon-btn"
            onClick={nextMonth}
          >
            &#8250;
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 2,
          marginBottom: 4,
        }}
      >
        {DAYS.map((day, index) => (
          <div
            key={day}
            style={{
              textAlign: 'center',
              fontSize: 10,
              fontWeight: 700,
              color:
                index === 0 || index === 6
                  ? 'var(--brand-mid)'
                  : 'var(--ink-faint)',
              padding: '2px 0',
              textTransform: 'uppercase',
            }}
          >
            {day}
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 3,
        }}
      >
        {Array.from({ length: firstDaySlot }).map((_, index) => (
          <div key={`empty-${index}`} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;

          const dateKey =
            `${viewYear}-` +
            `${String(viewMonth + 1).padStart(2, '0')}-` +
            `${String(day).padStart(2, '0')}`;

          const isToday = dateKey === todayKey;
          const isSelected = selectedDate === dateKey;
          const balance = dailyBalances[dateKey];
          const hasActivity = balance !== undefined;

          let background = 'transparent';
          let textColor = 'var(--ink)';

          if (isToday) {
            background = 'var(--brand-mid)';
            textColor = '#fff';
          } else if (isSelected) {
            background = 'var(--surface-strong)';
          } else if (hasActivity && balance > 0) {
            background = 'var(--income-soft)';
          } else if (hasActivity && balance < 0) {
            background = 'var(--expense-soft)';
          }

          const balanceColor = isToday
            ? '#fff'
            : balance > 0
              ? 'var(--income)'
              : balance < 0
                ? 'var(--expense)'
                : 'var(--ink-faint)';

          return (
            <div
              key={day}
              onClick={() => {
                if (hasActivity) {
                  onSelectDate(isSelected ? null : dateKey);
                }
              }}
              style={{
                borderRadius: 8,
                cursor: hasActivity ? 'pointer' : 'default',
                background,
                padding: '5px 2px',
                minHeight: 48,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border:
                  isSelected && !isToday
                    ? '1px solid var(--brand-mid)'
                    : '1px solid transparent',
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isToday ? '#fff' : 'transparent',
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: isToday || isSelected ? 700 : 400,
                    color: isToday ? 'var(--brand-mid)' : textColor,
                  }}
                >
                  {day}
                </span>
              </div>

              {hasActivity ? (
                <span
                  style={{
                    fontSize: 8,
                    fontWeight: 600,
                    color: balanceColor,
                    marginTop: 2,
                    maxWidth: '90%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {balance > 0 ? '+' : ''}
                  {Math.abs(balance) >= 1000
                    ? `${(balance / 1000).toFixed(1)}k`
                    : balance.toFixed(0)}
                </span>
              ) : (
                <div
                  style={{
                    width: 3,
                    height: 3,
                    borderRadius: '50%',
                    background: 'var(--surface-border)',
                    marginTop: 3,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          marginTop: 14,
          paddingTop: 12,
          borderTop: '1px solid var(--surface-border)',
        }}
      >
        {[
          {
            color: 'var(--income)',
            label: 'Positive',
          },
          {
            color: 'var(--expense)',
            label: 'Negative',
          },
          {
            color: 'var(--brand-mid)',
            label: 'Today',
          },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: item.color,
              }}
            />

            <span
              style={{
                fontSize: 10,
                color: 'var(--ink-faint)',
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {selectedDate && selectedDay && (
        <div
          style={{
            marginTop: 14,
            padding: '12px 16px',
            borderRadius: 8,
            background: 'var(--surface-strong)',
            border: '1px solid var(--surface-border)',
          }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--ink-faint)',
              marginBottom: 10,
            }}
          >
            {new Date(
              `${selectedDate}T00:00:00`,
            ).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>

          <div style={{ display: 'flex', gap: 16 }}>
            {[
              {
                label: 'Income',
                value: selectedDay.income,
                color: 'var(--income)',
              },
              {
                label: 'Expense',
                value: selectedDay.expense,
                color: 'var(--expense)',
              },
              {
                label: 'Net',
                value: selectedDay.income - selectedDay.expense,
                color:
                  selectedDay.income - selectedDay.expense >= 0
                    ? 'var(--income)'
                    : 'var(--expense)',
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  flex: 1,
                  textAlign: 'center',
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    color: 'var(--ink-faint)',
                    marginBottom: 4,
                  }}
                >
                  {item.label}
                </p>

                <p
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: item.color,
                  }}
                >
                  {formatCurrency(item.value, currency)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Transactions() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const currency = user?.currency || 'NGN';

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportFrom, setExportFrom] = useState('');
  const [exportTo, setExportTo] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  const loadTransactions = (type = filterType) => {
    setLoading(true);

    apiClient
      .get('/transactions', {
        params: type ? { type } : {},
      })
      .then((res) => {
        setTransactions(res.data.transactions || []);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const fetchTransactionsForExport = async (from, to) => {
    const limit = 100;

    let page = 1;
    let allTransactions = [];
    let total = 0;

    do {
      const response = await apiClient.get('/transactions', {
        params: {
          from,
          to,
          page,
          limit,
          ...(filterType ? { type: filterType } : {}),
        },
      });

      const batch = response.data.transactions || [];

      allTransactions = [
        ...allTransactions,
        ...batch,
      ];

      total = Number(
        response.data.pagination?.total || 0,
      );

      page += 1;
    } while (allTransactions.length < total);

    return allTransactions;
  };

  const handleRangeExport = async (format) => {
    setExportError('');

    if (!exportFrom || !exportTo) {
      setExportError(
        'Please select both From and To dates.',
      );
      return;
    }

    if (exportFrom > exportTo) {
      setExportError(
        'From date cannot be later than To date.',
      );
      return;
    }

    try {
      setExporting(true);

      const rangeTransactions =
        await fetchTransactionsForExport(
          exportFrom,
          exportTo,
        );

      if (rangeTransactions.length === 0) {
        setExportError(
          'No transactions found within the selected date range.',
        );
        return;
      }

      if (format === 'csv') {
        exportTransactionsToCsv(
          rangeTransactions,
          currency,
        );
      } else if (format === 'pdf') {
        exportTransactionsToPdf(
          rangeTransactions,
          currency,
        );
      }

      setExportModalOpen(false);
    } catch (error) {
      console.error(
        'Transaction export failed:',
        error,
      );

      setExportError(
        'Unable to export transactions. Please try again.',
      );
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    loadTransactions(filterType);
  }, [filterType]);

  useEffect(() => {
    const handler = () => {
      loadTransactions(filterType);
    };

    window.addEventListener(
      TRANSACTION_CREATED_EVENT,
      handler,
    );

    return () => {
      window.removeEventListener(
        TRANSACTION_CREATED_EVENT,
        handler,
      );
    };
  }, [filterType]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) {
      return;
    }

    await apiClient.delete(`/transactions/${id}`);

    loadTransactions();
  };

  const displayedTransactions = useMemo(() => {
    if (!selectedDate) {
      return transactions;
    }

    return transactions.filter(
      (transaction) =>
        toDateKey(transaction.occurred_on) ===
        selectedDate,
    );
  }, [transactions, selectedDate]);

  const totalIncome = useMemo(
    () =>
      transactions
        .filter(
          (transaction) =>
            transaction.type === 'income',
        )
        .reduce(
          (sum, transaction) =>
            sum + Number(transaction.amount),
          0,
        ),
    [transactions],
  );

  const totalExpense = useMemo(
    () =>
      transactions
        .filter(
          (transaction) =>
            transaction.type === 'expense',
        )
        .reduce(
          (sum, transaction) =>
            sum + Number(transaction.amount),
          0,
        ),
    [transactions],
  );

  const openExport = (format) => {
    setExportFormat(format);
    setExportError('');
    setExportModalOpen(true);
  };

  const openNewTransaction = () => {
    setEditingTransaction(null);
    setModalOpen(true);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Transactions</h1>
          <p>Every money in, every money out.</p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
          }}
        >
          <KebabMenu
            ariaLabel="Transaction page actions"
            items={[
              {
                label: 'Export CSV',
                onClick: () => openExport('csv'),
              },
              {
                label: 'Export PDF',
                onClick: () => openExport('pdf'),
              },
              {
                label: 'View chart',
                onClick: () =>
                  navigate('/transactions/chart'),
              },
            ]}
          />

          <button
            type="button"
            className="btn btn--primary"
            onClick={openNewTransaction}
          >
            + Add transaction
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div
          className="facet-card"
          style={{ padding: '14px 18px' }}
        >
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--ink-faint)',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Total Income
          </p>

          <p
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: 'var(--income)',
            }}
          >
            {formatCurrency(totalIncome, currency)}
          </p>
        </div>

        <div
          className="facet-card"
          style={{ padding: '14px 18px' }}
        >
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--ink-faint)',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Total Expense
          </p>

          <p
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: 'var(--expense)',
            }}
          >
            {formatCurrency(totalExpense, currency)}
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 16,
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: 'var(--ink-soft)',
            marginRight: 4,
          }}
        >
          Filter:
        </span>

        {[
          {
            value: '',
            label: 'All types',
          },
          {
            value: 'income',
            label: 'Income',
          },
          {
            value: 'expense',
            label: 'Expense',
          },
        ].map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() =>
              setFilterType(filter.value)
            }
            style={{
              padding: '7px 16px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 500,
              border:
                '1px solid var(--surface-border)',
              cursor: 'pointer',
              background:
                filterType === filter.value
                  ? 'var(--brand-gradient)'
                  : 'var(--surface-strong)',
              color:
                filterType === filter.value
                  ? '#fff'
                  : 'var(--ink)',
              transition: 'all 0.15s',
            }}
          >
            {filter.label}
          </button>
        ))}

        {selectedDate && (
          <span
            style={{
              fontSize: 12,
              color: 'var(--ink-soft)',
              marginLeft: 8,
            }}
          >
            ·{' '}
            {new Date(
              `${selectedDate}T00:00:00`,
            ).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        )}
      </div>

      <div
        className="facet-card facet-card--flush"
        id="transactions-table-card"
      >
        {loading ? (
          <div style={{ padding: '4px 20px' }}>
            {[0, 1, 2, 3, 4].map((index) => (
              <div
                className="skeleton-row"
                key={index}
              >
                <Skeleton width={80} height={12} />

                <Skeleton
                  width="30%"
                  height={12}
                  style={{ marginLeft: 20 }}
                />

                <Skeleton
                  width={90}
                  height={12}
                  style={{ marginLeft: 'auto' }}
                />
              </div>
            ))}
          </div>
        ) : displayedTransactions.length === 0 ? (
          <div className="empty-state">
            {selectedDate
              ? 'No transactions on this date.'
              : 'No transactions match this filter yet.'}
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Account</th>
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {displayedTransactions.map((transaction, index) => (
                <tr key={transaction.id}>
                  <td>
                    {formatDate(
                      transaction.occurred_on,
                    )}
                  </td>

                  <td>
                    {transaction.description || '—'}
                  </td>

                  <td>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background:
                            transaction.category_color ||
                            '#B9C3D4',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 13,
                          flexShrink: 0,
                        }}
                      >
                        {getIcon(
                          transaction.category_icon,
                        )}
                      </span>

                      {transaction.category_name ||
                        'Uncategorized'}
                    </span>
                  </td>

                  <td>
                    <span style={{ fontWeight: 500 }}>
                      {transaction.account_name ||
                        '—'}
                    </span>
                  </td>

                  <td
                    className="mono"
                    style={{
                      color:
                        transaction.type === 'income'
                          ? 'var(--income)'
                          : 'var(--expense)',
                    }}
                  >
                    {transaction.type === 'income'
                      ? '+'
                      : '-'}
                    {formatCurrency(
                      transaction.amount,
                      currency,
                    )}
                  </td>

                  <td>
                    <KebabMenu
                      ariaLabel="Transaction actions"
                      placement={
                        index === displayedTransactions.length - 1
                          ? "up"
                          : "down"
                      }
                      items={[
                        {
                          label: 'Edit',
                          onClick: () => {
                            setEditingTransaction(
                              transaction,
                            );
                            setModalOpen(true);
                          },
                        },
                        {
                          label: 'Delete',
                          danger: true,
                          onClick: () =>
                            handleDelete(
                              transaction.id,
                            ),
                        },
                      ]}
                    />
                  </td>
                </tr>
              ),
              )}
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

      {exportModalOpen && (
        <div
          className="modal-backdrop"
          onClick={() => {
            if (!exporting) {
              setExportModalOpen(false);
            }
          }}
        >
          <div
            className="facet-card modal-card"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-head">
              <div>
                <h3>
                  Export Transactions —{' '}
                  {exportFormat === 'csv'
                    ? 'CSV'
                    : 'PDF'}
                </h3>

                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: 12,
                    color: 'var(--ink-faint)',
                  }}
                >
                  Select the transaction history
                  period to export.
                </p>
              </div>

              <button
                type="button"
                className="icon-btn"
                onClick={() =>
                  setExportModalOpen(false)
                }
                disabled={exporting}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
              }}
            >
              <div className="field">
                <label htmlFor="export-from">
                  From
                </label>

                <input
                  id="export-from"
                  type="date"
                  value={exportFrom}
                  max={exportTo || undefined}
                  onChange={(event) => {
                    setExportFrom(
                      event.target.value,
                    );
                    setExportError('');
                  }}
                />
              </div>

              <div className="field">
                <label htmlFor="export-to">
                  To
                </label>

                <input
                  id="export-to"
                  type="date"
                  value={exportTo}
                  min={exportFrom || undefined}
                  onChange={(event) => {
                    setExportTo(
                      event.target.value,
                    );
                    setExportError('');
                  }}
                />
              </div>
            </div>

            {exportError && (
              <p
                style={{
                  margin: '10px 0 0',
                  fontSize: 12,
                  color: 'var(--expense)',
                }}
              >
                {exportError}
              </p>
            )}

            <div
              style={{
                display: 'flex',
                marginTop: 20,
              }}
            >
              <button
                type="button"
                className="btn btn--primary"
                style={{ width: '100%' }}
                disabled={exporting}
                onClick={() =>
                  handleRangeExport(exportFormat)
                }
              >
                {exporting
                  ? 'Exporting...'
                  : exportFormat === 'csv'
                    ? 'Export CSV'
                    : 'Export PDF'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <AddTransactionModal
          editingTransaction={editingTransaction}
          onClose={() => {
            setModalOpen(false);
            setEditingTransaction(null);
          }}
        />
      )}
    </div>
  );
}