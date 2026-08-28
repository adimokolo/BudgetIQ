import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { resizeImageFile } from '../utils/imageResize';

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export default function ProfileMenu() {
  const { user, logout, updateAvatar } = useAuth();
  const { preference, setThemePreference } = useTheme();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState(null);
  const panelRef = useRef(null);
  const fileInputRef = useRef(null);

  // Close on outside click or Escape - standard, expected dropdown behavior.
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(null);

    if (!file.type.startsWith('image/')) {
      setAvatarError('Please choose an image file.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setAvatarError('Image must be under 8MB.');
      return;
    }

    setUploading(true);
    try {
      const dataUrl = await resizeImageFile(file);
      const ok = await updateAvatar(dataUrl);
      if (!ok) setAvatarError('Could not save your photo. Please try again.');
    } catch (err) {
      setAvatarError(err.message || 'Could not process that image.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const initials = getInitials(user?.full_name);
  const avatarUrl = user?.avatar_url;

  return (
    <div className="profile-menu" ref={panelRef}>
      <button
        className="avatar-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open profile menu"
        aria-expanded={open}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="avatar-img" />
        ) : (
          <span className="avatar-fallback">{initials}</span>
        )}
      </button>

      {open && (
        <div className="profile-panel facet-card" role="menu">
          <div className="profile-panel-header">
            <button
              className="avatar-trigger avatar-trigger--large"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Change profile picture"
              disabled={uploading}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="avatar-img" />
              ) : (
                <span className="avatar-fallback avatar-fallback--large">{initials}</span>
              )}
              <span className="avatar-edit-overlay">{uploading ? 'Uploading…' : 'Change'}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <div className="profile-panel-name">{user?.full_name}</div>
            <div className="profile-panel-email">{user?.email}</div>
            {avatarError && <p className="error-text" style={{ marginTop: 6 }}>{avatarError}</p>}
          </div>

          <div className="prism-rule" style={{ margin: '12px 0' }} />

          <div className="theme-segmented" role="radiogroup" aria-label="Theme">
            {[
              { value: 'light', label: 'Light', icon: '☀' },
              { value: 'dark', label: 'Dark', icon: '☾' },
              { value: 'system', label: 'System', icon: '◐' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={preference === opt.value}
                className={`theme-segmented-btn${preference === opt.value ? ' active' : ''}`}
                onClick={() => setThemePreference(opt.value)}
              >
                <span aria-hidden="true">{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>

          <button className="btn btn--danger btn--block" style={{ marginTop: 10 }} onClick={handleLogout}>
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
