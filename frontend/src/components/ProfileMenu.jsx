import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export default function ProfileMenu() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const initials = getInitials(user?.full_name);
  const avatarUrl = user?.avatar_url;

  return (
    <button
      className="avatar-trigger"
      onClick={() => navigate('/settings')}
      aria-label="Open settings"
      title="Settings"
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="avatar-img" />
      ) : (
        <span className="avatar-fallback">{initials}</span>
      )}
    </button>
  );
}