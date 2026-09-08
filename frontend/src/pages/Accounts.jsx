// frontend/src/pages/Accounts.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAccounts, deleteAccount } from '../services/accounts';
import AccountCard from '../components/AccountCard';
import AccountModal from '../components/AccountModal';
import BankSyncModal from '../components/BankSyncModal';

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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

  useEffect(() => {
    fetchAccounts();
  }, []);

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
    <div className="accounts-page">
      <div className="accounts-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => navigate('/')}
          >
            ← Home
          </button>
          <h1>Accounts</h1>
        </div>
        <div className="accounts-actions">
          <button
            className="btn btn--primary"
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

      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <p>Loading accounts...</p>
      ) : accounts.length === 0 ? (
        <div className="accounts-empty">
          <p>No accounts yet — add one to get started.</p>
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
