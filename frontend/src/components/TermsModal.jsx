import Modal from './Modal';

/**
 * Placeholder terms content. This is NOT real legal copy - it exists so the
 * "I Agree" checkbox has something concrete to point to during development
 * and demos. Before any real production launch, replace this with actual
 * Terms of Service / Privacy Policy text reviewed by a lawyer, and update
 * the checkbox label in Register.jsx accordingly.
 */
export default function TermsModal({ onClose }) {
  return (
    <Modal title="Terms of Service & Privacy Policy" onClose={onClose}>
      <div style={{ maxHeight: 360, overflowY: 'auto', fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-soft)' }}>
        <p style={{ color: 'var(--warning)', fontWeight: 600, marginTop: 0 }}>
          Placeholder content — not final legal copy. Replace before production launch.
        </p>
        <p>
          By creating a BudgetIQ account, you agree to let us store the financial data you
          enter (income, expenses, categories, and budgets) so we can provide the tracking,
          summaries, and forecasts this app is built around.
        </p>
        <p>
          We send account-related emails only: verification codes, password resets, and
          budget-limit alerts you've configured. We do not sell your data to third parties.
        </p>
        <p>
          You're responsible for keeping your password secure and for the accuracy of the
          transactions you record. BudgetIQ's spending forecast is an estimate based on your
          recent history, not financial advice.
        </p>
        <p>
          You can request deletion of your account and associated data at any time by
          contacting support.
        </p>
        <p style={{ marginBottom: 0 }}>
          This placeholder will be replaced with a complete Terms of Service and Privacy
          Policy, reviewed for the jurisdictions BudgetIQ operates in, before any public
          release.
        </p>
      </div>
    </Modal>
  );
}
