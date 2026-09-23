import { NavLink, useNavigate } from 'react-router-dom';
import logoMark from '../assets/logo-mark.png';
import { useAuth } from '../context/AuthContext';

const ADMIN_LINKS = [
  { to: '/admin', label: 'Overview', icon: '◆', end: true },
  { to: '/admin/users', label: 'Users', icon: '♟' },
  { to: '/admin/admins', label: 'Admin Management', icon: '♜' },
  { to: '/admin/audit', label: 'Audit Log', icon: '▤' },
];

export default function AdminLayout({ children }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <img src={logoMark} alt="BudgetIQ" className="brand-mark" />

          <div>
            <div className="brand-name">BudgetIQ</div>
            <div className="admin-brand-label">Administration</div>
          </div>
        </div>

        <nav>
          <ul className="admin-nav-list">
            {ADMIN_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `admin-nav-link${isActive ? ' active' : ''}`
                  }
                >
                  <span className="admin-nav-icon">{link.icon}</span>
                  <span>{link.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user">
            <strong>{user?.fullName || user?.full_name || 'Administrator'}</strong>
            <span>{user?.email}</span>
          </div>

          <button
            type="button"
            className="admin-return-button"
            onClick={() => navigate('/')}
          >
            ← Return to BudgetIQ
          </button>
        </div>
      </aside>

      <div className="admin-content">
        <header className="admin-topbar">
          <div>
            <strong>Administration Console</strong>
            <span>BudgetIQ management</span>
          </div>
        </header>

        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
