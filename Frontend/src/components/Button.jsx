// Button atom — primary / ghost / danger / icon-only variants.
import React from 'react';

const base = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  padding: '10px 16px', borderRadius: 10,
  font: '600 13px/1 var(--font-ui)', letterSpacing: '0.02em',
  cursor: 'pointer', transition: 'all 0.15s', border: '1px solid transparent',
  whiteSpace: 'nowrap', userSelect: 'none',
};

const variants = {
  primary: {
    background: 'linear-gradient(180deg, var(--accent-2), var(--accent-deep))',
    color: 'white',
    boxShadow: '0 6px 16px -4px var(--accent-deep), 0 0 0 1px rgba(255,255,255,0.08) inset',
  },
  danger: {
    background: 'linear-gradient(180deg, var(--red), var(--red-deep))',
    color: 'white',
    boxShadow: '0 6px 16px -4px var(--red-deep), 0 0 0 1px rgba(255,255,255,0.08) inset',
  },
  ghost: {
    background: 'rgba(255,255,255,0.04)',
    borderColor: 'var(--border-strong)',
    color: 'var(--fg-0)',
  },
  outline: {
    background: 'transparent',
    borderColor: 'var(--border-strong)',
    color: 'var(--fg-1)',
  },
};

export function Button({ variant = 'ghost', size, children, style, ...rest }) {
  const v = variants[variant] || variants.ghost;
  const sz = size === 'sm' ? { padding: '7px 12px', fontSize: 12 }
           : size === 'lg' ? { padding: '14px 22px', fontSize: 14 }
           : null;
  return (
    <button {...rest} style={{ ...base, ...v, ...sz, ...style }}
      onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(1px)'}
      onMouseUp={(e) => e.currentTarget.style.transform = ''}
      onMouseLeave={(e) => e.currentTarget.style.transform = ''}>
      {children}
    </button>
  );
}
