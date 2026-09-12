import { useState, useRef, useEffect, useMemo } from 'react';

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  searchable = false,
  searchPlaceholder = 'Search...',
}) {
  const [open, setOpen]       = useState(false);
  const [query, setQuery]     = useState('');
  const ref                   = useRef(null);
  const searchRef             = useRef(null);
  const listRef               = useRef(null);

  const selected = options.find((o) => String(o.value) === String(value));

  // Auto-enable search for large lists (e.g. currency lists)
  const isSearchable = searchable || options.length > 20;

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open && isSearchable && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
    // Scroll selected item into view
    if (open && listRef.current) {
      setTimeout(() => {
        const active = listRef.current?.querySelector('[data-selected="true"]');
        if (active) active.scrollIntoView({ block: 'nearest' });
      }, 60);
    }
  }, [open, isSearchable]);

  // Filter options by search query
  const filteredOptions = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) =>
      String(o.label).toLowerCase().includes(q) ||
      String(o.value).toLowerCase().includes(q)
    );
  }, [options, query]);

  const handleOpen = () => {
    setOpen((v) => !v);
    setQuery('');
  };

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>

      {/* Trigger */}
      <div
        onClick={handleOpen}
        style={{
          background: 'var(--surface-strong)',
          border: '1px solid var(--surface-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '11px 13px',
          fontSize: '14.5px',
          color: selected ? 'var(--ink)' : 'var(--ink-faint)',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          userSelect: 'none',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {selected ? selected.label : placeholder}
        </span>
        <span style={{ fontSize: 11, color: 'var(--ink-faint)', marginLeft: 8, flexShrink: 0 }}>
          {open ? '▲' : '▼'}
        </span>
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          zIndex: 200,
          background: 'var(--bg)',
          border: '1px solid var(--surface-border)',
          borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--surface-shadow)',
          overflow: 'hidden',
        }}>

          {/* Search bar */}
          {isSearchable && (
            <div style={{
              padding: '8px 10px',
              borderBottom: '1px solid var(--surface-border)',
              background: 'var(--surface-strong)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <span style={{ fontSize: 14, color: 'var(--ink-faint)', flexShrink: 0 }}>🔍</span>
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                onKeyDown={(e) => { if (e.key === 'Escape') { setOpen(false); setQuery(''); } }}
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  fontSize: 13.5,
                  color: 'var(--ink)',
                  fontFamily: 'var(--font-body)',
                }}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 14, color: 'var(--ink-faint)', padding: 0, flexShrink: 0,
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* Options list */}
          <div
            ref={listRef}
            style={{ maxHeight: 220, overflowY: 'auto' }}
          >
            {filteredOptions.length === 0 ? (
              <div style={{
                padding: '14px', fontSize: 13,
                color: 'var(--ink-faint)', textAlign: 'center',
              }}>
                No results for "{query}"
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <div
                    key={opt.value}
                    data-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    style={{
                      padding: '10px 14px',
                      fontSize: 14,
                      color: isSelected ? 'var(--prism-1)' : 'var(--ink)',
                      background: isSelected ? 'var(--surface-strong)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.1s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'var(--surface-strong)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isSelected ? 'var(--surface-strong)' : 'transparent';
                    }}
                  >
                    <span>{opt.label}</span>
                    {isSelected && (
                      <span style={{ fontSize: 12, color: 'var(--prism-1)', flexShrink: 0 }}>✓</span>
                    )}
                  </div>
                );
              })
            )}
          </div>

        </div>
      )}
    </div>
  );
}
