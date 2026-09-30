import { NavLink } from 'react-router-dom';
import logoMark from '../assets/logo-mark.png';


const LINKS = [
  { to: '/', label: 'Dashboard', icon: '◆', end: true },
  { to: '/transactions', label: 'Transactions', icon: '↕' },
  { to: '/categories', label: 'Categories', icon: '▤' },
  { to: '/budgets', label: 'Budgets', icon: '◈' },
  { to: '/accounts', label: 'Accounts', icon: '🏦' },
];

export default function Sidebar() {

  return (
    <aside className="sidebar">
      <div className="brand">
        <img src={logoMark} alt="KashMetrix" className="brand-mark" />
        <span>
          <span className="brand-name">KashMetrix</span>
          <span className="brand-tagline">
            Track smarter. Understand more.
          </span>
        </span>
      </div>

      <nav>
        <ul className="nav-list">
          {LINKS.map((link) => (
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