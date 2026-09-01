import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export function PasswordInput({ value, onChange, placeholder = 'Enter password' }) {
    const [visible, setVisible] = useState(false);

    return (
        <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
            <input
                type={visible ? 'text' : 'password'}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                style={{ width: '100%', paddingRight: '40px' }}
            />
            <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    color: '#64748B',
                }}
                aria-label={visible ? 'Hide password' : 'Show password'}
            >
                {visible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
        </div>
    );
}
