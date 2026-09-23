import { useNavigate } from 'react-router-dom';

export default function AdminOverview() {
  const navigate = useNavigate();

  const handleKeyDown = (event, path) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      navigate(path);
    }
  };

  return (
    <div>
      <div className="admin-page-heading">
        <div>
          <h1>Overview</h1>
          <p>Monitor and manage BudgetIQ administration.</p>
        </div>
      </div>

      <div className="admin-overview-grid">
        <div
          className="admin-overview-card admin-overview-card--clickable"
          onClick={() => navigate('/admin/users')}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => handleKeyDown(event, '/admin/users')}
        >
          <span>USER MANAGEMENT</span>
          <h2>Users</h2>
          <p>View registered users and manage account access.</p>
        </div>

        <div
          className="admin-overview-card admin-overview-card--clickable"
          onClick={() => navigate('/admin/admins')}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => handleKeyDown(event, '/admin/admins')}
        >
          <span>ACCESS CONTROL</span>
          <h2>Admin Management</h2>
          <p>Manage authorised BudgetIQ administrators.</p>
        </div>

        <div
          className="admin-overview-card admin-overview-card--clickable"
          onClick={() => navigate('/admin/audit')}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => handleKeyDown(event, '/admin/audit')}
        >
          <span>SECURITY</span>
          <h2>Audit Log</h2>
          <p>Review privileged administrative activity.</p>
        </div>
      </div>
    </div>
  );
}