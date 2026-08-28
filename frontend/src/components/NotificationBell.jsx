import { useEffect, useRef, useState, useCallback } from 'react';
import apiClient from '../api/client';
import { TRANSACTION_CREATED_EVENT } from './AddTransactionModal';

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const POLL_INTERVAL_MS = 60000;

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef(null);

  const load = useCallback(() => {
    apiClient
      .get('/notifications')
      .then((res) => {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      })
      .catch(() => {
        // Notifications are a nice-to-have overlay - a failed fetch here
        // shouldn't disrupt the rest of the app.
      });
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  // A transaction that just triggered a budget-exceeded alert should show
  // up here right away, not on the next 60s poll.
  useEffect(() => {
    window.addEventListener(TRANSACTION_CREATED_EVENT, load);
    return () => window.removeEventListener(TRANSACTION_CREATED_EVENT, load);
  }, [load]);

  useEffect(() => {
    if (!open) return undefined;
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const handleOpen = () => {
    setOpen((o) => !o);
  };

  const markOneRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id && !n.read_at ? { ...n, read_at: new Date().toISOString() } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await apiClient.patch(`/notifications/${id}/read`);
    } catch {
      load(); // resync on failure
    }
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
    setUnreadCount(0);
    try {
      await apiClient.post('/notifications/read-all');
    } catch {
      load();
    }
  };

  return (
    <div className="notification-menu" ref={panelRef}>
      <button
        className="avatar-trigger notification-trigger"
        onClick={handleOpen}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={open}
      >
        <span aria-hidden="true">🔔</span>
        {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="profile-panel notification-panel facet-card" role="menu">
          <div className="notification-panel-head">
            <h3 style={{ fontSize: 15 }}>Notifications</h3>
            {unreadCount > 0 && (
              <button className="notification-mark-all" onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="helper-text" style={{ padding: '16px 0', textAlign: 'center' }}>
              You're all caught up.
            </p>
          ) : (
            <div className="notification-list">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  className={`notification-item${!n.read_at ? ' unread' : ''}`}
                  onClick={() => !n.read_at && markOneRead(n.id)}
                >
                  <div className="notification-item-title">{n.title}</div>
                  {n.body && <div className="notification-item-body">{n.body}</div>}
                  <div className="notification-item-time">{timeAgo(n.created_at)}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
