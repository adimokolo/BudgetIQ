import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import Modal from '../components/Modal';
import Skeleton from '../components/Skeleton';
import CustomSelect from '../components/CustomSelect';
import { ICON_MAP, getIcon, fallbackIconFor } from '../utils/categoryIcons';

const ICON_OPTIONS = Object.keys(ICON_MAP);

/*
|--------------------------------------------------------------------------
| CATEGORY PRESETS
|--------------------------------------------------------------------------
*/
const CATEGORY_PRESETS = [
  { name: 'Food & Dining',      type: 'expense', icon: 'fast-food-outline',   color: '#F59E0B' },
  { name: 'Groceries',          type: 'expense', icon: 'basket-outline',       color: '#22C55E' },
  { name: 'Transport',          type: 'expense', icon: 'bus-outline',          color: '#3B82F6' },
  { name: 'Fuel',               type: 'expense', icon: 'car-outline',          color: '#0EA5E9' },
  { name: 'Rent',               type: 'expense', icon: 'home-outline',         color: '#174E78' },
  { name: 'Utilities',          type: 'expense', icon: 'flash-outline',        color: '#EF4444' },
  { name: 'Internet & Airtime', type: 'expense', icon: 'wifi-outline',         color: '#A855F7' },
  { name: 'Shopping',           type: 'expense', icon: 'cart-outline',         color: '#EC4899' },
  { name: 'Subscriptions',      type: 'expense', icon: 'card-outline',         color: '#7C6FF0' },
  { name: 'Entertainment',      type: 'expense', icon: 'film-outline',         color: '#7C6FF0' },
  { name: 'Health',             type: 'expense', icon: 'medkit-outline',       color: '#16A34A' },
  { name: 'Fitness',            type: 'expense', icon: 'barbell-outline',      color: '#F97316' },
  { name: 'Education',          type: 'expense', icon: 'school-outline',       color: '#3B82F6' },
  { name: 'Travel',             type: 'expense', icon: 'airplane-outline',     color: '#2DD4BF' },
  { name: 'Personal Care',      type: 'expense', icon: 'cut-outline',          color: '#F472B6' },
  { name: 'Pets',               type: 'expense', icon: 'paw-outline',          color: '#84CC16' },
  { name: 'Gifts & Donations',  type: 'expense', icon: 'gift-outline',         color: '#EC4899' },
  { name: 'Repairs',            type: 'expense', icon: 'construct-outline',    color: '#F59E0B' },
  { name: 'Salary',             type: 'income',  icon: 'cash-outline',         color: '#16A34A' },
  { name: 'Freelance',          type: 'income',  icon: 'briefcase-outline',    color: '#2DD4BF' },
  { name: 'Business',           type: 'income',  icon: 'business-outline',     color: '#174E78' },
  { name: 'Investment',         type: 'income',  icon: 'trending-up-outline',  color: '#22C55E' },
  { name: 'Gift',               type: 'income',  icon: 'gift-outline',         color: '#F472B6' },
  { name: 'Other Income',       type: 'income',  icon: 'wallet-outline',       color: '#FBBF24' },
];

const SWATCHES = [
  '#F59E0B','#22C55E','#3B82F6','#EF4444','#A855F7',
  '#EC4899','#2DD4BF','#F97316','#0EA5E9','#84CC16',
  '#FBBF24','#7C6FF0','#174E78','#16A34A','#F472B6',
];

/*
|--------------------------------------------------------------------------
| ICON CIRCLE
|--------------------------------------------------------------------------
*/
function IconCircle({ icon, color, size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color || '#647089',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.45, flexShrink: 0,
    }}>
      {getIcon(icon || fallbackIconFor())}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| CATEGORY ROW
|--------------------------------------------------------------------------
*/
function CategoryRow({ category, onDelete }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 0', borderTop: '1px solid var(--surface-border)',
    }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <IconCircle
          icon={category.icon || fallbackIconFor(category.type)}
          color={category.color}
          size={34}
        />
        <span style={{ fontSize: 14, color: 'var(--ink-soft)' }}>{category.name}</span>
      </span>
      <button
        className="icon-btn"
        onClick={() => onDelete(category.id)}
        aria-label={`Delete ${category.name}`}
      >
        ✕
      </button>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| CATEGORY LIST
|--------------------------------------------------------------------------
*/
function CategoryList({ items, onDelete }) {
  if (items.length === 0) return <div className="empty-state">None yet.</div>;
  return (
    <div>
      {items.map((c) => (
        <CategoryRow key={c.id} category={c} onDelete={onDelete} />
      ))}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| CATEGORIES PAGE
|--------------------------------------------------------------------------
*/
export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modalOpen, setModalOpen]   = useState(false);
  const [tab, setTab]               = useState('presets');
  const [form, setForm]             = useState({
    name: '', type: 'expense', color: SWATCHES[0], icon: ICON_OPTIONS[0],
  });
  const [error, setError] = useState(null);

  const loadCategories = () => {
    setLoading(true);
    apiClient
      .get('/categories')
      .then((res) => setCategories(res.data.categories))
      .finally(() => setLoading(false));
  };

  useEffect(loadCategories, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await apiClient.post('/categories', form);
      setModalOpen(false);
      setForm({ name: '', type: 'expense', color: SWATCHES[0], icon: ICON_OPTIONS[0] });
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create category.');
    }
  };

  const handlePreset = async (preset) => {
    setError(null);
    try {
      await apiClient.post('/categories', {
        name: preset.name, type: preset.type,
        color: preset.color, icon: preset.icon,
      });
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add preset.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category? Existing transactions will keep their history but lose the tag.')) return;
    await apiClient.delete(`/categories/${id}`);
    loadCategories();
  };

  const income  = categories.filter((c) => c.type === 'income');
  const expense = categories.filter((c) => c.type === 'expense');
  const existingNames = new Set(categories.map((c) => c.name.toLowerCase()));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Categories</h1>
          <p>Organize income and spending so patterns are easy to spot.</p>
        </div>
        <button className="btn btn--primary" onClick={() => setModalOpen(true)}>
          + New category
        </button>
      </div>

      {loading ? (
        <div className="grid grid--two">
          {[0, 1].map((col) => (
            <div className="facet-card" key={col}>
              <Skeleton width="30%" height={15} />
              <Skeleton width="20%" height={11} style={{ marginTop: 8, marginBottom: 14 }} />
              {[0, 1, 2].map((i) => (
                <div className="skeleton-row" key={i}>
                  <Skeleton width={34} height={34} radius={17} />
                  <Skeleton width="50%" height={12} style={{ marginLeft: 10 }} />
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid--two">
          <div className="facet-card">
            <h3 className="section-title">Income</h3>
            <p className="section-subtitle">{income.length} {income.length === 1 ? 'category' : 'categories'}</p>
            <CategoryList items={income} onDelete={handleDelete} />
          </div>
          <div className="facet-card">
            <h3 className="section-title">Expense</h3>
            <p className="section-subtitle">{expense.length} {expense.length === 1 ? 'category' : 'categories'}</p>
            <CategoryList items={expense} onDelete={handleDelete} />
          </div>
        </div>
      )}

      {modalOpen && (
        <Modal title="New category" onClose={() => setModalOpen(false)}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {['presets', 'custom'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={tab === t ? 'btn btn--primary' : 'btn btn--ghost'}
                style={{ flex: 1, fontSize: 13, padding: '8px 0' }}
              >
                {t === 'presets' ? '⚡ Quick add' : '✏️ Custom'}
              </button>
            ))}
          </div>

          {error && <p className="error-text" style={{ marginBottom: 12 }}>{error}</p>}

          {tab === 'presets' && (
            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
              {['expense', 'income'].map((type) => (
                <div key={type} style={{ marginBottom: 16 }}>
                  <p style={{
                    fontSize: 11, fontWeight: 700, color: 'var(--ink-faint)',
                    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
                  }}>
                    {type}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                    {CATEGORY_PRESETS.filter((p) => p.type === type).map((preset) => {
                      const alreadyAdded = existingNames.has(preset.name.toLowerCase());
                      return (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => !alreadyAdded && handlePreset(preset)}
                          disabled={alreadyAdded}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 12px', borderRadius: 8,
                            border: '1px solid var(--surface-border)',
                            background: alreadyAdded ? 'var(--surface-strong)' : 'var(--surface)',
                            cursor: alreadyAdded ? 'default' : 'pointer',
                            opacity: alreadyAdded ? 0.5 : 1,
                            textAlign: 'left',
                          }}
                        >
                          <IconCircle icon={preset.icon} color={preset.color} size={30} />
                          <span style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>
                            {preset.name}
                            {alreadyAdded && (
                              <span style={{ fontSize: 11, color: 'var(--ink-faint)', display: 'block' }}>
                                Added
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'custom' && (
            <form onSubmit={handleCreate}>
              <div className="field">
                <label>Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Data & Airtime"
                  required
                />
              </div>

              <div className="field">
                <label>Type</label>
                <CustomSelect
                  value={form.type}
                  onChange={(val) => setForm({ ...form, type: val })}
                  options={[
                    { value: 'expense', label: 'Expense' },
                    { value: 'income', label: 'Income' },
                  ]}
                />
              </div>

              <div className="field">
                <label>Icon</label>
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)',
                  gap: 6, maxHeight: 140, overflowY: 'auto',
                  padding: 8, background: 'var(--surface-strong)',
                  borderRadius: 8, border: '1px solid var(--surface-border)',
                }}>
                  {ICON_OPTIONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setForm({ ...form, icon })}
                      title={icon}
                      style={{
                        width: 36, height: 36, borderRadius: 8, fontSize: 18,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: form.icon === icon ? '2px solid var(--prism-1)' : '2px solid transparent',
                        background: form.icon === icon ? 'var(--surface-border)' : 'transparent',
                        cursor: 'pointer',
                      }}
                    >
                      {getIcon(icon)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <label>Color</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {SWATCHES.map((color) => (
                    <button
                      type="button"
                      key={color}
                      onClick={() => setForm({ ...form, color })}
                      style={{
                        width: 28, height: 28, borderRadius: 8, background: color,
                        border: form.color === color ? '2px solid var(--ink)' : '2px solid transparent',
                        cursor: 'pointer',
                      }}
                      aria-label={`Choose color ${color}`}
                    />
                  ))}
                </div>
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', borderRadius: 8, marginBottom: 16,
                background: 'var(--surface-strong)',
                border: '1px solid var(--surface-border)',
              }}>
                <IconCircle icon={form.icon} color={form.color} size={36} />
                <span style={{ fontWeight: 600, color: 'var(--ink)' }}>
                  {form.name || 'Category preview'}
                </span>
              </div>

              <button className="btn btn--primary btn--block" type="submit">
                Save category
              </button>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
