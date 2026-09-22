import { NavLink } from 'react-router-dom';
import logoMark from '../assets/logo-mark.png';
import { useAuth } from '../context/AuthContext';

const LINKS = [
  { to: '/', label: 'Dashboard', icon: '◆', end: true },
  { to: '/transactions', label: 'Transactions', icon: '↕' },
  { to: '/categories', label: 'Categories', icon: '▤' },
  { to: '/budgets', label: 'Budgets', icon: '◈' },
  { to: '/accounts', label: 'Accounts', icon: '🏦' },
];

export default function Sidebar() {
  const { user } = useAuth();

  const links =
    user?.role === 'admin'
      ? [
        ...LINKS,
        { to: '/admin/users', label: 'Admin', icon: '♜' },
      ]
      : LINKS;

  return (
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
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `nav-link${isActive ? ' active' : ''}`
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
  );
}