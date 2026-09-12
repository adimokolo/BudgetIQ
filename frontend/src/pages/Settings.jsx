// frontend/src/pages/Settings.jsx
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import apiClient from '../api/client';
import { resizeImageFile } from '../utils/imageResize';
import { ALL_CURRENCIES, currencyLabel } from '../utils/currency';

// TODO: point this at your real support inbox.
const SUPPORT_EMAIL = 'support@budgetiq.app';

const FAQ_ITEMS = [
    {
        question: 'How do I change my base currency?',
        answer:
            "Go to Settings, tap 'Base currency' and pick the currency you want. All totals and summaries will use this currency going forward. This only changes how amounts are displayed — it doesn't convert past transactions.",
    },
    {
        question: 'How do I reset my password?',
        answer:
            "From Settings, use the 'Change password' section, or use 'Forgot password' from the login screen if you're signed out.",
    },
    {
        question: 'How do budget alerts work?',
        answer:
            "The first time a transaction pushes a budget to or past its monthly limit, you'll get an email and an in-app notification. You'll only be alerted once per budget per month.",
    },
    {
        question: 'How do I delete my account?',
        answer:
            "From Settings, scroll to the bottom and use 'Delete account'. This permanently removes your account and all of your data, and can't be undone.",
    },
];

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] || '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase();
}

export default function Settings() {
    const { user, logout, updateAvatar, refreshUser } = useAuth();
    const { preference, setThemePreference } = useTheme();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [uploading, setUploading] = useState(false);
    const [avatarError, setAvatarError] = useState(null);

    const [currencyModalOpen, setCurrencyModalOpen] = useState(false);
    const [currencySaving, setCurrencySaving] = useState(false);
    const [currencyError, setCurrencyError] = useState(null);

    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordError, setPasswordError] = useState(null);
    const [passwordSuccess, setPasswordSuccess] = useState(null);

    const [faqModalOpen, setFaqModalOpen] = useState(false);
    const [expandedFaqIndex, setExpandedFaqIndex] = useState(null);

    const [contactModalOpen, setContactModalOpen] = useState(false);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteError, setDeleteError] = useState(null);
    const [deleting, setDeleting] = useState(false);

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

    const handleSelectCurrency = async (code) => {
        setCurrencyError(null);
        setCurrencySaving(true);
        try {
            await apiClient.patch('/auth/currency', { currency: code });
            await refreshUser?.();
            setCurrencyModalOpen(false);
        } catch (err) {
            setCurrencyError(err.response?.data?.error || 'Could not update currency.');
        } finally {
            setCurrencySaving(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(null);

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError('New password and confirmation do not match.');
            return;
        }
        if (passwordForm.newPassword.length < 8) {
            setPasswordError('New password must be at least 8 characters.');
            return;
        }

        setPasswordSaving(true);
        try {
            await apiClient.patch('/auth/change-password', {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            });
            setPasswordSuccess('Password updated successfully.');
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setPasswordError(err.response?.data?.error || 'Could not update password.');
        } finally {
            setPasswordSaving(false);
        }
    };

    const handleContactEmail = () => {
        window.location.href = `mailto:${SUPPORT_EMAIL}`;
    };

    const handleDeleteAccount = async (e) => {
        e.preventDefault();
        setDeleteError(null);

        if (!deletePassword) {
            setDeleteError('Enter your password to confirm.');
            return;
        }

        setDeleting(true);
        try {
            await apiClient.delete('/auth/account', { data: { password: deletePassword } });
            logout();
            navigate('/login');
        } catch (err) {
            setDeleteError(err.response?.data?.error || 'Could not delete your account.');
        } finally {
            setDeleting(false);
        }
    };

    const initials = getInitials(user?.full_name);
    const avatarUrl = user?.avatar_url;

    return (
        <div className="settings-page">
            <div className="page-header">
                <div>
                    <h1>Settings</h1>
                    <p>Your account, your preferences, all in one place.</p>
                </div>
            </div>

            {/* LOGOUT — kept near the top since there's no dropdown shortcut anymore */}
            <button className="btn btn--danger" onClick={handleLogout} style={{ marginBottom: 20 }}>
                Log out
            </button>

            {/* PROFILE */}
            <div className="facet-card settings-profile-card">
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
                <div className="settings-profile-info">
                    <div className="settings-profile-name">{user?.full_name}</div>
                    <div className="settings-profile-email">{user?.email}</div>
                </div>
                {avatarError && <p className="error-text" style={{ marginTop: 10 }}>{avatarError}</p>}
            </div>

            {/* APPEARANCE */}
            <div className="facet-card" style={{ marginTop: 18 }}>
                <h3 className="section-title">Appearance</h3>
                <p className="section-subtitle">Choose how BudgetIQ looks on this device.</p>
                <div className="theme-segmented" role="radiogroup" aria-label="Theme" style={{ marginTop: 14 }}>
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
            </div>

            {/* BASE CURRENCY */}
            <div className="facet-card" style={{ marginTop: 18 }}>
                <h3 className="section-title">Base currency</h3>
                <p className="section-subtitle">
                    Changes how amounts are displayed going forward. Past transactions are not converted.
                </p>
                <button
                    className="settings-row-button"
                    onClick={() => setCurrencyModalOpen(true)}
                    style={{ marginTop: 14 }}
                >
                    <span>{currencyLabel(user?.currency || 'NGN')}</span>
                    <span aria-hidden="true">›</span>
                </button>
            </div>

            {/* CHANGE PASSWORD */}
            <div className="facet-card" style={{ marginTop: 18 }}>
                <h3 className="section-title">Change password</h3>
                <form onSubmit={handleChangePassword} style={{ marginTop: 14 }}>
                    <div className="field">
                        <label htmlFor="currentPassword">Current password</label>
                        <input
                            id="currentPassword"
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            required
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="newPassword">New password</label>
                        <input
                            id="newPassword"
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            required
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="confirmPassword">Confirm new password</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            required
                        />
                    </div>
                    {passwordError && <p className="error-text" style={{ marginBottom: 12 }}>{passwordError}</p>}
                    {passwordSuccess && <p style={{ color: 'var(--income)', marginBottom: 12, fontSize: 13.5 }}>{passwordSuccess}</p>}
                    <button className="btn btn--primary" type="submit" disabled={passwordSaving}>
                        {passwordSaving ? 'Updating…' : 'Update password'}
                    </button>
                </form>
            </div>

            {/* SUPPORT */}
            <div className="facet-card" style={{ marginTop: 18 }}>
                <h3 className="section-title">Support</h3>
                <button className="settings-row-button" onClick={() => setFaqModalOpen(true)} style={{ marginTop: 14 }}>
                    <span>FAQ</span>
                    <span aria-hidden="true">›</span>
                </button>
                <button className="settings-row-button" onClick={() => setContactModalOpen(true)}>
                    <span>Contact us</span>
                    <span aria-hidden="true">›</span>
                </button>
            </div>

            {/* DELETE ACCOUNT */}
            <div className="facet-card" style={{ marginTop: 18, marginBottom: 40 }}>
                <h3 className="section-title" style={{ color: 'var(--expense)' }}>Delete account</h3>
                <p className="section-subtitle">
                    This permanently deletes your account and all of your transactions, budgets, and categories. This cannot be undone.
                </p>
                <button
                    className="btn btn--danger"
                    style={{ marginTop: 14 }}
                    onClick={() => setDeleteModalOpen(true)}
                >
                    Delete account
                </button>
            </div>

            {/* BASE CURRENCY MODAL */}
            {currencyModalOpen && (
                <div className="modal-backdrop" onClick={() => setCurrencyModalOpen(false)}>
                    <div className="facet-card modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <h2>Base currency</h2>
                            <button className="icon-btn" onClick={() => setCurrencyModalOpen(false)} aria-label="Close">✕</button>
                        </div>
                        {currencyError && <p className="error-text" style={{ marginBottom: 10 }}>{currencyError}</p>}
                        <div className="currency-picker-list">
                            {ALL_CURRENCIES.map((c) => {
                                const isSelected = c.code === (user?.currency || 'NGN');
                                return (
                                    <button
                                        key={c.code}
                                        className={`currency-picker-row${isSelected ? ' currency-picker-row--selected' : ''}`}
                                        onClick={() => handleSelectCurrency(c.code)}
                                        disabled={currencySaving}
                                    >
                                        <span>{c.code} — {c.name}</span>
                                        {isSelected && <span aria-hidden="true">✓</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* FAQ MODAL */}
            {faqModalOpen && (
                <div className="modal-backdrop" onClick={() => setFaqModalOpen(false)}>
                    <div className="facet-card modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <h2>FAQ</h2>
                            <button className="icon-btn" onClick={() => setFaqModalOpen(false)} aria-label="Close">✕</button>
                        </div>
                        <div className="faq-list">
                            {FAQ_ITEMS.map((item, index) => {
                                const expanded = expandedFaqIndex === index;
                                return (
                                    <div className="faq-item" key={item.question}>
                                        <button
                                            className="faq-question-row"
                                            onClick={() => setExpandedFaqIndex(expanded ? null : index)}
                                        >
                                            <span>{item.question}</span>
                                            <span aria-hidden="true">{expanded ? '−' : '+'}</span>
                                        </button>
                                        {expanded && <p className="faq-answer">{item.answer}</p>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* CONTACT US MODAL */}
            {contactModalOpen && (
                <div className="modal-backdrop" onClick={() => setContactModalOpen(false)}>
                    <div className="facet-card modal-card" style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <h2>Contact us</h2>
                        <p className="section-subtitle" style={{ marginTop: 8 }}>
                            Have a question or ran into an issue? Reach our team and we'll get back to you as soon as we can.
                        </p>
                        <button className="btn btn--primary" style={{ marginTop: 18 }} onClick={handleContactEmail}>
                            {SUPPORT_EMAIL}
                        </button>
                        <div style={{ marginTop: 12 }}>
                            <button className="link-btn" onClick={() => setContactModalOpen(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE ACCOUNT MODAL */}
            {deleteModalOpen && (
                <div className="modal-backdrop" onClick={() => !deleting && setDeleteModalOpen(false)}>
                    <div className="facet-card modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <h2>Delete account</h2>
                            <button
                                className="icon-btn"
                                onClick={() => setDeleteModalOpen(false)}
                                aria-label="Close"
                                disabled={deleting}
                            >
                                ✕
                            </button>
                        </div>
                        <p className="section-subtitle">
                            This permanently deletes your account and all of your data — transactions, budgets, categories,
                            and accounts. <strong>This cannot be undone.</strong> Enter your password to confirm.
                        </p>
                        <form onSubmit={handleDeleteAccount} style={{ marginTop: 14 }}>
                            <div className="field">
                                <label htmlFor="deletePassword">Password</label>
                                <input
                                    id="deletePassword"
                                    type="password"
                                    value={deletePassword}
                                    onChange={(e) => setDeletePassword(e.target.value)}
                                    autoFocus
                                    required
                                />
                            </div>
                            {deleteError && <p className="error-text" style={{ marginBottom: 12 }}>{deleteError}</p>}
                            <div className="modal__actions">
                                <button
                                    type="button"
                                    className="btn btn--ghost"
                                    onClick={() => setDeleteModalOpen(false)}
                                    disabled={deleting}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn--danger" disabled={deleting}>
                                    {deleting ? 'Deleting…' : 'Yes, delete my account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}