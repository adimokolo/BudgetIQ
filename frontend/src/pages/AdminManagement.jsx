import { useEffect, useMemo, useState } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function AdminManagement() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState(null);

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
          'Unable to load administrator information.',
        );
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const handleRoleChange = async (targetUser, nextRole) => {
    const promoting = nextRole === 'admin';

    const confirmed = window.confirm(
      promoting
        ? `Grant administrator access to ${targetUser.full_name || targetUser.email}?\n\nThey will be able to access BudgetIQ administration features.`
        : `Remove administrator access from ${targetUser.full_name || targetUser.email}?\n\nTheir BudgetIQ account will remain active as a regular user.`,
    );

    if (!confirmed) return;

    try {
      setUpdatingUserId(targetUser.id);
      setActionError('');

      const response = await apiClient.patch(
        `/admin/users/${targetUser.id}/role`,
        { role: nextRole },
      );

      const updatedUser = response.data.user;

      setUsers((currentUsers) =>
        currentUsers.map((item) =>
          item.id === updatedUser.id
            ? { ...item, ...updatedUser }
            : item,
        ),
      );
    } catch (err) {
      setActionError(
        err.response?.data?.error ||
        'Unable to update administrator access.',
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

  const adminCount = users.filter(
    (user) => user.role === 'admin',
  ).length;

  return (
    <div className="admin-users-page">
      <div className="page-header">
        <div>
          <h1>Admin Management</h1>
          <p>
            Control administrator access to the BudgetIQ console.
          </p>
        </div>
      </div>

      {actionError && (
        <div className="admin-action-error">
          {actionError}
        </div>
      )}

      <div className="admin-user-stats">
        <div className="facet-card admin-stat-card">
          <span>Administrators</span>
          <strong>{adminCount}</strong>
        </div>

        <div className="facet-card admin-stat-card">
          <span>Regular users</span>
          <strong>{users.length - adminCount}</strong>
        </div>

        <div className="facet-card admin-stat-card">
          <span>Total accounts</span>
          <strong>{users.length}</strong>
        </div>
      </div>

      <div className="facet-card admin-users-card">
        <div className="admin-users-toolbar">
          <div>
            <h2>Administrator access</h2>
            <p>
              Promote registered users or remove administrator access.
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
          <div className="empty-state">Loading accounts...</div>
        ) : error ? (
          <div className="empty-state">{error}</div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">No accounts found.</div>
        ) : (
          <div className="admin-users-table-wrap">
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Admin access</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => {
                  const isCurrentAdmin =
                    user.id === currentUser?.id;

                  return (
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
                          className={`admin-role-badge admin-role-badge--${user.role || 'user'}`}
                        >
                          {user.role || 'user'}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`admin-status-badge admin-status-badge--${user.status || 'active'}`}
                        >
                          {user.status || 'active'}
                        </span>
                      </td>

                      <td>
                        {isCurrentAdmin ? (
                          <span className="admin-action-placeholder">
                            Current admin
                          </span>
                        ) : user.role === 'admin' ? (
                          <button
                            type="button"
                            className="admin-user-action admin-user-action--suspend"
                            disabled={updatingUserId === user.id}
                            onClick={() =>
                              handleRoleChange(user, 'user')
                            }
                          >
                            {updatingUserId === user.id
                              ? 'Updating...'
                              : 'Remove Admin'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="admin-user-action admin-user-action--activate"
                            disabled={
                              updatingUserId === user.id ||
                              user.status !== 'active'
                            }
                            onClick={() =>
                              handleRoleChange(user, 'admin')
                            }
                          >
                            {updatingUserId === user.id
                              ? 'Updating...'
                              : 'Make Admin'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
