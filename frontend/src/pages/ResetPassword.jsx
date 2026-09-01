import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLogo from '../components/AuthLogo';
import { PasswordInput } from '../components/PasswordInput';

export default function ResetPassword() {
  const { resetPassword, loading, error } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState(searchParams.get('email') || '');
  const token = searchParams.get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    if (!token) {
      setLocalError('This reset link is missing its token. Please request a new one.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    const ok = await resetPassword(email, token, newPassword);
    if (ok) navigate('/login');
  };

  return (
    <div className="auth-wrap">
      <div className="facet-card auth-card">
        <AuthLogo />
        <h2 className="auth-title">Set a new password</h2>
        <p className="auth-subtitle">Choose a new password for your account.</p>

        <form onSubmit={handleSubmit}>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="newPassword">New password</label>
            <PasswordInput
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>

          <div className="field">
            <label htmlFor="confirmPassword">Confirm new password</label>
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>

          {(localError || error) && (
            <p className="error-text" style={{ marginBottom: 14 }}>
              {localError || error}
            </p>
          )}

          <button
            className="btn btn--primary btn--block"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Saving…' : 'Reset password'}
          </button>

        </form>

        <p className="helper-text" style={{ marginTop: 18, textAlign: 'center' }}>
          <Link to="/login" style={{ color: 'var(--ink-faint)' }}>
            Back to log in
          </Link>
        </p>

      </div>
    </div>
  );
}