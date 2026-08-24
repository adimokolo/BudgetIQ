import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoFull from '../assets/logo-full.png';

export default function Login() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await login(email, password);
    if (ok) navigate('/');
  };

  return (
    <div className="auth-wrap">
      <div className="facet-card auth-card">
        <div className="auth-logo">
          <img src={logoFull} alt="BudgetIQ — Spend with insight, not guesswork." />
        </div>
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
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="error-text" style={{ marginBottom: 14 }}>{error}</p>}

          <button className="btn btn--primary btn--block" type="submit" disabled={loading}>
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="helper-text" style={{ marginTop: 18, textAlign: 'center' }}>
          New to BudgetIQ? <Link to="/register" style={{ color: 'var(--prism-2)', fontWeight: 600 }}>Create an account</Link>
        </p>
      </div>
    </div>
  );
}
