import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLogo from '../components/AuthLogo';

export default function VerifyOtp() {
  const { verifyOtp, resendOtp, loading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromNav = location.state?.email || '';

  const [email, setEmail] = useState(emailFromNav);
  const [code, setCode] = useState('');
  const [resent, setResent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await verifyOtp(email, code);
    if (ok) navigate('/');
  };

  const handleResend = async () => {
    setResent(false);
    const ok = await resendOtp(email);
    if (ok) setResent(true);
  };

  return (
    <div className="auth-wrap">
      <div className="facet-card auth-card">
        <AuthLogo />
        <h2 className="auth-title">Verify your email</h2>
        <p className="auth-subtitle">
          Enter the 6-digit code we sent to your inbox. It expires in 10 minutes.
        </p>

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
            <label htmlFor="code">Verification code</label>
            <input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              inputMode="numeric"
              maxLength={6}
              style={{ letterSpacing: '0.3em', fontFamily: 'var(--font-mono)', fontSize: 18 }}
              required
            />
          </div>

          {error && <p className="error-text" style={{ marginBottom: 14 }}>{error}</p>}
          {resent && !error && (
            <p className="helper-text" style={{ marginBottom: 14, color: 'var(--income)' }}>
              A new code has been sent.
            </p>
          )}

          <button className="btn btn--primary btn--block" type="submit" disabled={loading}>
            {loading ? 'Verifying…' : 'Verify account'}
          </button>
        </form>

        <p className="helper-text" style={{ marginTop: 18, textAlign: 'center' }}>
          Didn't get a code?{' '}
          <button
            type="button"
            onClick={handleResend}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: 'var(--brand-mid)',
              fontWeight: 600,
              cursor: 'pointer',
              font: 'inherit',
            }}
          >
            Resend it
          </button>
        </p>
        <p className="helper-text" style={{ marginTop: 6, textAlign: 'center' }}>
          <Link to="/login" style={{ color: 'var(--ink-faint)' }}>Back to log in</Link>
        </p>
      </div>
    </div>
  );
}
