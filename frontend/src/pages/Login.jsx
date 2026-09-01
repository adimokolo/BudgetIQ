import { PasswordInput } from '../components/PasswordInput';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLogo from '../components/AuthLogo';

const REMEMBERED_EMAIL_KEY = 'budgetiq_remembered_email';

export default function Login() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Prefill the email (and check the box) if a previous login remembered it -
  // this only ever stores the email itself, never the password.
  useEffect(() => {
    const remembered = localStorage.getItem(REMEMBERED_EMAIL_KEY);
    if (remembered) {
      setEmail(remembered);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result.ok) {
      if (rememberMe) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
      } else {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }
      navigate('/');
    } else if (result.needsVerification) {
      navigate('/verify-otp', { state: { email: result.email } });
    }
  };

  return (
    <div className="auth-wrap">
      <div className="facet-card auth-card">
        <AuthLogo />
        <h2 className="auth-title">Welcome back</h2>
        <p className="auth-subtitle">Log in to see where your money's been.</p>

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
            <label htmlFor="password">Password</label>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
            <Link
              to="/forgot-password"
              className="helper-text"
              style={{ color: 'var(--brand-mid)', fontWeight: 600, alignSelf: 'flex-end' }}
            >
              Forgot password?
            </Link>
          </div>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span>Remember my email on this device</span>
          </label>

          {error && <p className="error-text" style={{ marginTop: 14, marginBottom: 14 }}>{error}</p>}

          <button className="btn btn--primary btn--block" type="submit" disabled={loading}>
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="helper-text" style={{ marginTop: 18, textAlign: 'center' }}>
          New to BudgetIQ? <Link to="/register" style={{ color: 'var(--brand-mid)', fontWeight: 600 }}>Create an account</Link>
        </p>
      </div>
    </div>
  );
}
