import { useEffect, useState } from "react";
import apiClient from "../api/client";

export default function AdminAudit() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAuditLogs = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await apiClient.get("/admin/audit-logs");

        setLogs(response.data.logs || []);
      } catch (err) {
        console.error("Failed to load audit logs:", err);

        setError(
          err.response?.data?.error ||
          "Unable to load administrator audit history.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadAuditLogs();
  }, []);

  const actionLabels = {
    user_suspended: "User Suspended",
    user_reactivated: "User Reactivated",
    user_deactivated: "User Deactivated",
    admin_granted: "Admin Granted",
    admin_removed: "Admin Removed",
  };

  const getChangeDescription = (details = {}) => {
    if (details.previous_status || details.new_status) {
      return `${details.previous_status || "—"} → ${details.new_status || "—"
        }`;
    }

    if (details.previous_role || details.new_role) {
      return `${details.previous_role || "—"} → ${details.new_role || "—"
        }`;
    }

    return "—";
  };

  return (
    <section>
      <div className="admin-page-heading">
        <div>
          <h1>Audit Log</h1>
          <p>Review privileged administrative activity.</p>
        </div>
      </div>

      {loading && <p>Loading audit history...</p>}

      {error && <p>{error}</p>}

      {!loading && !error && (
        <div className="admin-users-table-wrap">
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>Administrator</th>
                <th>Action</th>
                <th>Target User</th>
                <th>Change</th>
                <th>Date &amp; Time</th>
              </tr>
            </thead>

            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <strong>
                      {log.admin_name || "Deleted administrator"}
                    </strong>

                    <span className="admin-user-email">
                      {log.admin_email || "—"}
                    </span>
                  </td>

                  <td>
                    {actionLabels[log.action] || log.action}
                  </td>

                  <td>
                    <strong>
                      {log.target_name || "Deleted user"}
                    </strong>

                    <span className="admin-user-email">
                      {log.target_email || "—"}
                    </span>
                  </td>

                  <td>
                    {getChangeDescription(log.details)}
                  </td>

                  <td>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}

              {logs.length === 0 && (
                <tr>
                  <td colSpan="5">
                    No administrative activity recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}