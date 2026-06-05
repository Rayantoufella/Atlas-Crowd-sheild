// Status badges + buttons (small reusable atoms).
import React from 'react';

const baseBadge = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '3px 8px', borderRadius: 999,
  fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600,
  letterSpacing: '0.08em', textTransform: 'uppercase',
  border: '1px solid', whiteSpace: 'nowrap',
};

const variants = {
  ok:   { color: 'var(--green-2)',  border: 'color-mix(in oklab, var(--green) 35%, transparent)',  bg: 'color-mix(in oklab, var(--green) 12%, transparent)' },
  warn: { color: 'var(--orange-2)', border: 'color-mix(in oklab, var(--orange) 35%, transparent)', bg: 'color-mix(in oklab, var(--orange) 12%, transparent)' },
  crit: { color: 'var(--red-2)',    border: 'color-mix(in oklab, var(--red) 40%, transparent)',    bg: 'color-mix(in oklab, var(--red) 14%, transparent)' },
  info: { color: 'var(--accent-2)', border: 'color-mix(in oklab, var(--accent) 35%, transparent)', bg: 'color-mix(in oklab, var(--accent) 12%, transparent)' },
  mute: { color: 'var(--fg-2)',     border: 'var(--border-strong)',                                 bg: 'rgba(255,255,255,0.04)' },
};

export function Badge({ variant = 'mute', dot, pulse, children, style }) {
  const v = variants[variant] || variants.mute;
  return (
    <span style={{ ...baseBadge, color: v.color, borderColor: v.border, background: v.bg, ...style }}>
      {dot && (
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: v.color, boxShadow: `0 0 8px ${v.color}`,
          animation: pulse ? 'pulseDot 1.4s ease-in-out infinite' : 'none', flex: 'none',
        }} />
      )}
      {children}
    </span>
  );
}
