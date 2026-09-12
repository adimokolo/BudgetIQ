import { formatCurrency } from '../utils/currency';

export default function AccountCard({ account, onEdit, onDelete }) {
  const isSynced = account.provider === 'mono';

  return (
    <div className="facet-card" style={{ marginBottom: 16, padding: '20px 24px' }}>

      {/* Account name + sync badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{account.name}</h3>
          {isSynced && (
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 8px',
              borderRadius: 20, background: 'var(--income-soft)', color: 'var(--income)',
            }}>
              🏦 Synced
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          {!isSynced && (
            <button className="btn btn--ghost" onClick={onEdit}
              style={{ fontSize: 13, padding: '6px 14px' }}>
              Edit
            </button>
          )}
          <button className="btn btn--danger" onClick={onDelete}
            style={{ fontSize: 13, padding: '6px 14px' }}>
            Delete
          </button>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid var(--surface-border)', marginBottom: 12 }} />

      {/* Balance */}
      <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>
        {formatCurrency(account.balance ?? account.initialAmount ?? 0, account.currency)}
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'var(--ink-soft)' }}>
        <span>{account.currency}</span>
        {account.account_type && <span>{account.account_type}</span>}
        {account.bank_name && <span>{account.bank_name}</span>}
        {account.last_synced_at && (
          <span>Synced {new Date(account.last_synced_at).toLocaleDateString()}</span>
        )}
        {account.notes && <span style={{ fontStyle: 'italic' }}>{account.notes}</span>}
      </div>

    </div>
  );
}
