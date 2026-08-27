import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoFull from '../assets/logo-full.png';

export default function Register() {
  const { register, loading, error } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currency, setCurrency] = useState('NGN');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await register(fullName, email, password, currency);
    if (ok) navigate('/verify-otp', { state: { email } });
  };

  return (
    <div className="auth-wrap">
      <div className="facet-card auth-card">
        <div className="auth-logo">
          <img src={logoFull} alt="BudgetIQ — Spend with insight, not guesswork." />
        </div>
        <h2 className="auth-title">Create your account</h2>
        <p className="auth-subtitle">Clarity for your income and spending starts here.</p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="fullName">Full name</label>
            <input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Adim Barnabas Okolo"
              required
            />
          </div>
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
              placeholder="At least 8 characters"
              minLength={8}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="currency">Currency</label>
            <select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="NGN">NGN — Naira</option>
              <option value="USD">USD — US Dollar</option>
              <option value="GBP">GBP — Pound Sterling</option>
              <option value="EUR">EUR — Euro</option>
            </select>
          </div>

          {error && <p className="error-text" style={{ marginBottom: 14 }}>{error}</p>}

          <button className="btn btn--primary btn--block" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="helper-text" style={{ marginTop: 18, textAlign: 'center' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--brand-mid)', fontWeight: 600 }}>Log in</Link>
        </p>
      </div>
    </div>
  );
}
