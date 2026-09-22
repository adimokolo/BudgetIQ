import { useEffect, useMemo, useState } from 'react';
import apiClient from '../api/client';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [actionError, setActionError] = useState('');
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await apiClient.get('/admin/users');

        setUsers(
          Array.isArray(response.data)
            ? response.data
            : response.data?.users || [],
        );
      } catch (err) {
        setError(
          err.response?.data?.error ||
          'Unable to load users.',
        );
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);
  const handleStatusChange = async (user, nextStatus) => {
    if (nextStatus === 'suspended') {
      const confirmed = window.confirm(
        `Suspend ${user.full_name || user.email}?\n\nThey will be unable to access BudgetIQ until reactivated.`
      );

      if (!confirmed) return;
    }

    try {
      setUpdatingUserId(user.id);
      setActionError('');

      const response = await apiClient.patch(
        `/admin/users/${user.id}/status`,
        { status: nextStatus }
      );

      const updatedUser = response.data.user;

      setUsers((currentUsers) =>
        currentUsers.map((item) =>
          item.id === updatedUser.id
            ? { ...item, ...updatedUser }
            : item
        )
      );
    } catch (err) {
      setActionError(
        err.response?.data?.error ||
        'Unable to update this user.'
      );
    } finally {
      setUpdatingUserId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return users;

    return users.filter((user) =>
      [user.full_name, user.email]
        .filter(Boolean)
        .some((value) =>
          value.toLowerCase().includes(query),
        ),
    );
  }, [users, search]);

  return (
    <div className="admin-users-page">
      <div className="page-header">
        <div>
          <h1>Admin</h1>
          <p>Manage BudgetIQ users and account access.</p>
        </div>
      </div>
      {actionError && (
        <div className="admin-action-error">
          {actionError}
        </div>
      )}
      <div className="admin-user-stats">
        <div className="facet-card admin-stat-card">
          <span>Total users</span>
          <strong>{users.length}</strong>
        </div>

        <div className="facet-card admin-stat-card">
          <span>Active users</span>
          <strong>
            {users.filter((user) => user.status === 'active').length}
          </strong>
        </div>

        <div className="facet-card admin-stat-card">
          <span>Suspended</span>
          <strong>
            {users.filter((user) => user.status === 'suspended').length}
          </strong>
        </div>
      </div>

      <div className="facet-card admin-users-card">
        <div className="admin-users-toolbar">
          <div>
            <h2>User management</h2>
            <p>
              {users.length} {users.length === 1 ? 'user' : 'users'}
            </p>
          </div>

          <input
            type="search"
            className="admin-user-search"
            placeholder="Search name or email..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {loading ? (
          <div className="empty-state">Loading users...</div>
        ) : error ? (
          <div className="empty-state">{error}</div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">
            No users found.
          </div>
        ) : (
          <div className="admin-users-table-wrap">
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="admin-user-identity">
                        <strong>
                          {user.full_name || 'Unnamed user'}
                        </strong>
                        <span>{user.email}</span>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`admin-role-badge admin-role-badge--${user.role || 'user'
                          }`}
                      >
                        {user.role || 'user'}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`admin-status-badge admin-status-badge--${user.status || 'active'
                          }`}
                      >
                        {user.status || 'active'}
                      </span>
                    </td>

                    <td>
                      {user.created_at
                        ? new Date(
                          user.created_at,
                        ).toLocaleDateString()
                        : '—'}
                    </td>

                    <td>
                      {user.role === 'admin' ? (
                        <span className="admin-action-placeholder">
                          —
                        </span>
                      ) : user.status === 'active' ? (
                        <button
                          type="button"
                          className="admin-user-action admin-user-action--suspend"
                          disabled={updatingUserId === user.id}
                          onClick={() =>
                            handleStatusChange(user, 'suspended')
                          }
                        >
                          {updatingUserId === user.id
                            ? 'Updating...'
                            : 'Suspend'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="admin-user-action admin-user-action--activate"
                          disabled={updatingUserId === user.id}
                          onClick={() =>
                            handleStatusChange(user, 'active')
                          }
                        >
                          {updatingUserId === user.id
                            ? 'Updating...'
                            : 'Reactivate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
