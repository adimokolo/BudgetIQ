// frontend/src/pages/Accounts.jsx
import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { getAccounts, deleteAccount } from '../services/accounts';
import AccountCard from '../components/AccountCard';
import AccountModal from '../components/AccountModal';
import BankSyncModal from '../components/BankSyncModal';
import logoMark from '../assets/logo-mark.png';

const LINKS = [
  { to: '/', label: 'Dashboard', icon: '◆', end: true },
  { to: '/transactions', label: 'Transactions', icon: '↕' },
  { to: '/categories', label: 'Categories', icon: '▤' },
  { to: '/budgets', label: 'Budgets', icon: '◈' },
  { to: '/accounts', label: 'Accounts', icon: '🏦' },
];

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [error, setError] = useState(null);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await getAccounts();
      setAccounts(data.accounts || data || []);
    } catch (err) {
      setError(err.error || 'Failed to load accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const handleDelete = async (accountId) => {
    if (!window.confirm('Delete this account?')) return;
    try {
      await deleteAccount(accountId);
      setAccounts((prev) => prev.filter((a) => a.id !== accountId));
    } catch (err) {
      setError(err.error || 'Failed to delete account.');
    }
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setShowAddModal(true);
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setEditingAccount(null);
    fetchAccounts();
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="brand">
          <img src={logoMark} alt="BudgetIQ" className="brand-mark" />
          <span>
            <span className="brand-name">BudgetIQ</span>
            <span className="brand-tagline">Spend with insight, not guesswork.</span>
          </span>
        </div>
        <nav>
          <ul className="nav-list">
            {LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                >
                  <span className="nav-icon">{link.icon}</span>
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* ── Main content ── */}
      <main style={{ flex: 1, padding: '32px 36px', overflowY: 'auto' }}>

        {/* Page header */}
        <div className="page-header" style={{ marginBottom: 28 }}>
          <div>
            <h1>Accounts</h1>
            <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginTop: 4 }}>
              Manage your wallets and linked bank accounts.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              className="btn btn--ghost"
              onClick={() => setShowSyncModal(true)}
            >
              🏦 Sync Bank Account
            </button>
            <button
              className="btn btn--primary"
              onClick={() => setShowAddModal(true)}
            >
              + Add Account
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="error-text" style={{ marginBottom: 16 }}>{error}</p>
        )}

        {/* Accounts list */}
        {loading ? (
          <p style={{ color: 'var(--ink-soft)' }}>Loading accounts...</p>
        ) : accounts.length === 0 ? (
          <div className="facet-card" style={{ padding: 32, textAlign: 'center' }}>
            <p style={{ color: 'var(--ink-soft)', marginBottom: 16 }}>
              No accounts yet — add one to get started.
            </p>
            <button
              className="btn btn--primary"
              onClick={() => setShowAddModal(true)}
            >
              + Add your first account
            </button>
          </div>
        ) : (
          <div className="accounts-grid">
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onEdit={() => handleEdit(account)}
                onDelete={() => handleDelete(account.id)}
              />
            ))}
          </div>
        )}

      </main>

      {/* ── Modals ── */}
      {showAddModal && (
        <AccountModal
          account={editingAccount}
          onClose={handleModalClose}
        />
      )}

      {showSyncModal && (
        <BankSyncModal
          onClose={() => {
            setShowSyncModal(false);
            fetchAccounts();
          }}
        />
      )}

    </div>
  );
}
