// frontend/src/components/BankSyncModal.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { initiateSync } from '../services/bankSync';

export default function BankSyncModal({ onClose }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const handleConnect = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await initiateSync({
        name: user.full_name || user.fullName || user.name,
        email: user.email,
      });

      // Mono returns a link — open it in a new tab
      if (data.link) {
        window.open(data.link, '_blank');
        onClose();
      }
    } catch (err) {
      setError(err.error || 'Unable to connect bank. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h2>🏦 Sync Your Bank Account</h2>
        <p>
          Connect your Nigerian bank account securely via Mono.
          Your credentials are never stored by BudgetIQ.
        </p>

        {error && <p className="error-text">{error}</p>}

        <div className="modal__actions">
          <button className="btn btn--outline" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn--primary"
            onClick={handleConnect}
            disabled={loading}
          >
            {loading ? 'Connecting…' : 'Connect Bank'}
          </button>
        </div>
      </div>
    </div>
  );
}
