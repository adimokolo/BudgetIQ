import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLogo from '../components/AuthLogo';

export default function ForgotPassword() {
  const { forgotPassword, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await forgotPassword(email);
    if (ok) setSubmitted(true);
  };

  return (
    <div className="auth-wrap">
      <div className="facet-card auth-card">
        <AuthLogo />
        <h2 className="auth-title">Reset your password</h2>
        <p className="auth-subtitle">
          Enter the email on your account and we'll send a reset link.
        </p>

        {submitted ? (
          <div className="empty-state" style={{ padding: '20px 0' }}>
            If that email is registered, a reset link is on its way. Check your inbox.
          </div>
        ) : (
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

            {error && <p className="error-text" style={{ marginBottom: 14 }}>{error}</p>}

            <button className="btn btn--primary btn--block" type="submit" disabled={loading}>
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}

        <p className="helper-text" style={{ marginTop: 18, textAlign: 'center' }}>
          <Link to="/login" style={{ color: 'var(--brand-mid)', fontWeight: 600 }}>Back to log in</Link>
        </p>
      </div>
    </div>
  );
}
