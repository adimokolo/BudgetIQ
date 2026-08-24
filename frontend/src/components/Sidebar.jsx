import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import logoMark from '../assets/logo-mark.png';

const LINKS = [
  { to: '/', label: 'Dashboard', icon: '◆', end: true },
  { to: '/transactions', label: 'Transactions', icon: '↕' },
  { to: '/categories', label: 'Categories', icon: '▤' },
  { to: '/budgets', label: 'Budgets', icon: '◈' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <img src={logoMark} alt="BudgetIQ" className="brand-mark" />
        <span>
          <span className="brand-name">BudgetIQ</span>
          <span className="brand-tagline">Spend with insight, not guesswork.</span>
        </span>
      </div>

      <nav>
        <ul className="nav-list">
          {LINKS.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.end}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                <span className="nav-icon">{link.icon}</span>
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button className="theme-toggle" onClick={toggleTheme}>
          <span>{theme === 'light' ? 'Light mode' : 'Dark mode'}</span>
          <span aria-hidden="true">{theme === 'light' ? '☀' : '☾'}</span>
        </button>
        <div className="facet-card" style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>{user?.full_name}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginBottom: 10 }}>
            {user?.email}
          </div>
          <button className="btn btn--ghost btn--block" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>
    </aside>
  );
}
