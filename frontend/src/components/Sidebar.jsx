import { useState } from 'react';
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
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <aside className="sidebar">
      <div className="mobile-nav-header">
        <div className="brand">
          <img src={logoMark} alt="" className="brand-mark" />
          <span>
            <span className="brand-name">KashMetrix</span>
            <span className="brand-tagline">
              Track smarter. Understand more.
            </span>
          </span>
        </div>

        <button
          type="button"
          className="mobile-menu-toggle"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="kashmetrix-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span aria-hidden="true">{menuOpen ? '✕' : '☰'}</span>
        </button>
      </div>

      <nav
        id="kashmetrix-navigation"
        className={menuOpen ? 'sidebar-nav is-open' : 'sidebar-nav'}
        aria-label="Main navigation"
      >
        <ul className="nav-list">
          {LINKS.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `nav-link${isActive ? ' active' : ''}`
                }
              >
                <span className="nav-icon" aria-hidden="true">
                  {link.icon}
                </span>
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
