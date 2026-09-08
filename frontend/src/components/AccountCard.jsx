// frontend/src/components/AccountCard.jsx
import { formatCurrency } from '../utils/currency';

export default function AccountCard({ account, onEdit, onDelete }) {
  const isSynced = account.provider === 'mono';

  return (
    <div className="account-card">
      <div className="account-card__header">
        <div>
          <h3 className="account-card__name">{account.name}</h3>
          {isSynced && (
            <span className="account-card__badge">
              🏦 {account.bank_name || 'Synced'}
            </span>
          )}
        </div>
        <div className="account-card__actions">
          {!isSynced && (
            <button onClick={onEdit} className="btn btn--ghost">
              Edit
            </button>
          )}
          <button onClick={onDelete} className="btn btn--danger">
            Delete
          </button>
        </div>
      </div>

      <div className="account-card__balance">
        {formatCurrency(account.balance || account.initialAmount || 0, account.currency)}
      </div>

      <div className="account-card__meta">
        <span>{account.currency}</span>
        {account.last_synced_at && (
          <span>Last synced: {new Date(account.last_synced_at).toLocaleDateString()}</span>
        )}
        {account.status && (
          <span className={`account-card__status account-card__status--${account.status}`}>
            {account.status}
          </span>
        )}
      </div>
    </div>
  );
}
