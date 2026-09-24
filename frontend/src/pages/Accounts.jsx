import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { getAccounts, deleteAccount } from "../services/accounts";
import AccountCard from "../components/AccountCard";
import AccountModal from "../components/AccountModal";
import BankImportModal from "../components/BankImportModal";
import logoMark from "../assets/logo-mark.png";
import { formatCurrency } from "../utils/currency";

const LINKS = [
  { to: "/", label: "Dashboard", icon: "◆", end: true },
  { to: "/transactions", label: "Transactions", icon: "↕" },
  { to: "/categories", label: "Categories", icon: "▤" },
  { to: "/budgets", label: "Budgets", icon: "◈" },
  { to: "/accounts", label: "Accounts", icon: "🏦" },
];

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddChooser, setShowAddChooser] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [importMode, setImportMode] = useState(null);
  const [editingAccount, setEditingAccount] = useState(null);
  const [error, setError] = useState(null);

  const totalBalance = accounts.reduce(
    (sum, account) => sum + Number(account.balance || 0),
    0
  );

  const totalCurrency = accounts[0]?.currency || "NGN";

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await getAccounts();
      setAccounts(data.accounts || data || []);
    } catch (err) {
      setError(err.error || "Failed to load accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleDelete = async (accountId) => {
    if (!window.confirm("Delete this account?")) return;

    try {
      await deleteAccount(accountId);
      setAccounts((prev) => prev.filter((a) => a.id !== accountId));
    } catch (err) {
      setError(err.error || "Failed to delete account.");
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
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="brand">
          <img src={logoMark} alt="BudgetIQ" className="brand-mark" />
          <span>
            <span className="brand-name">BudgetIQ</span>
            <span className="brand-tagline">
              Spend with insight, not guesswork.
            </span>
          </span>
        </div>

        <nav>
          <ul className="nav-list">
            {LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `nav-link${isActive ? " active" : ""}`
                  }
                >
                  <span className="nav-icon">{link.icon}</span>
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <main style={{ flex: 1, padding: "32px 36px", overflowY: "auto" }}>
        <div className="page-header" style={{ marginBottom: 28 }}>
          <div>
            <h1>Accounts</h1>
            <p
              style={{
                color: "var(--ink-soft)",
                fontSize: 14,
                marginTop: 4,
              }}
            >
              Manage your wallets and linked bank accounts.
            </p>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button
              className="btn btn--primary"
              onClick={() => setShowAddChooser(true)}
            >
              + Add Account
            </button>

            <div
              className="facet-card"
              style={{
                padding: "8px 14px",
                minWidth: 140,
                textAlign: "right",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "var(--ink-faint)",
                }}
              >
                Total balance
              </div>

              <div
                className="stat-value"
                style={{
                  fontSize: "clamp(11px, 1.2vw, 14px)",
                  marginTop: 2,
                  whiteSpace: "nowrap",
                }}
              >
                {loading ? "—" : formatCurrency(totalBalance, totalCurrency)}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <p className="error-text" style={{ marginBottom: 16 }}>
            {error}
          </p>
        )}

        {loading ? (
          <p style={{ color: "var(--ink-soft)" }}>Loading accounts...</p>
        ) : accounts.length === 0 ? (
          <div
            className="facet-card"
            style={{ padding: 32, textAlign: "center" }}
          >
            <p style={{ color: "var(--ink-soft)", marginBottom: 16 }}>
              No accounts yet — add one to get started.
            </p>

            <button
              className="btn btn--primary"
              onClick={() => setShowAddChooser(true)}
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

      {showAddChooser && (
        <div className="modal-backdrop">
          <div
            className="modal-card"
            style={{
              maxWidth: 520,
              width: "calc(100% - 32px)",
            }}
          >
            <div className="modal-head">
              <div>
                <h2 style={{ margin: 0 }}>Add Account</h2>
                <p
                  style={{
                    color: "var(--ink-soft)",
                    fontSize: 13,
                    marginTop: 5,
                  }}
                >
                  Choose how you want to add account information to BudgetIQ.
                </p>
              </div>

              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setShowAddChooser(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gap: 10,
                marginTop: 18,
              }}
            >
              <button
                type="button"
                className="facet-card"
                style={{
                  padding: 16,
                  textAlign: "left",
                  cursor: "default",
                  width: "100%",
                }}
                onClick={() => { }}
                aria-disabled="true"
              >
                <strong>⇄ &nbsp; Bank Synchronization</strong>
                <div
                  style={{
                    color: "var(--ink-soft)",
                    fontSize: 13,
                    marginTop: 5,
                  }}
                >
                  Coming Soon — secure automatic bank synchronization will be
                  available in a future BudgetIQ update.
                </div>
              </button>

              <button
                type="button"
                className="facet-card"
                style={{
                  padding: 16,
                  textAlign: "left",
                  cursor: "pointer",
                  width: "100%",
                }}
                onClick={() => {
                  setShowAddChooser(false);
                  setImportMode("statement");
                }}
              >
                <strong>⇩ &nbsp; Import Bank Statement</strong>
                <div
                  style={{
                    color: "var(--ink-soft)",
                    fontSize: 13,
                    marginTop: 5,
                  }}
                >
                  Import PDF, CSV or Excel transactions into an existing
                  account.
                </div>
              </button>

              <button
                type="button"
                className="facet-card"
                style={{
                  padding: 16,
                  textAlign: "left",
                  cursor: "pointer",
                  width: "100%",
                }}
                onClick={() => {
                  setShowAddChooser(false);
                  setImportMode("email");
                }}
              >
                <strong>✉ &nbsp; Email Sync</strong>
                <div
                  style={{
                    color: "var(--ink-soft)",
                    fontSize: 13,
                    marginTop: 5,
                  }}
                >
                  Import bank transaction alerts you explicitly provide.
                  Automatic inbox connection is not enabled.
                </div>
              </button>

              <button
                type="button"
                className="facet-card"
                style={{
                  padding: 16,
                  textAlign: "left",
                  cursor: "pointer",
                  width: "100%",
                }}
                onClick={() => {
                  setShowAddChooser(false);
                  setEditingAccount(null);
                  setShowAddModal(true);
                }}
              >
                <strong>＋ &nbsp; New Account</strong>
                <div
                  style={{
                    color: "var(--ink-soft)",
                    fontSize: 13,
                    marginTop: 5,
                  }}
                >
                  Manually create a new account and enter its details yourself.
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <AccountModal account={editingAccount} onClose={handleModalClose} />
      )}

      {importMode && (
        <BankImportModal
          mode={importMode}
          accounts={accounts}
          onClose={() => setImportMode(null)}
          onImported={async () => {
            await fetchAccounts();
          }}
        />
      )}
    </div>
  );
}