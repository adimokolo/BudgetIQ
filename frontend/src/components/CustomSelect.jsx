import { useState, useRef, useEffect } from 'react';

export default function CustomSelect({ value, onChange, options, placeholder = 'Select...' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = options.find((o) => String(o.value) === String(value));

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>

      {/* Trigger */}
      <div
        onClick={() => setOpen((v) => !v)}
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
        <span>{selected ? selected.label : placeholder}</span>
        <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{open ? '▲' : '▼'}</span>
      </div>

      {/* Dropdown list */}
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
          maxHeight: 220,
          overflowY: 'auto',
        }}>
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{
                padding: '10px 14px',
                fontSize: 14,
                color: String(opt.value) === String(value) ? 'var(--prism-1)' : 'var(--ink)',
                background: String(opt.value) === String(value) ? 'var(--surface-strong)' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-strong)'}
              onMouseLeave={(e) => e.currentTarget.style.background = String(opt.value) === String(value) ? 'var(--surface-strong)' : 'transparent'}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
