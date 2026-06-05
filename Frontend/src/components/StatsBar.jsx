// Stats bar — 4 columns at the bottom of Security Ops.
import React from 'react';

export default function StatsBar({ stats }) {
  return (
    <div className="card" style={{
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
      padding: 0, overflow: 'hidden',
    }}>
      {stats.map((s, i) => (
        <div key={i} style={{
          padding: '20px 24px',
          borderLeft: i > 0 ? '1px solid var(--border)' : 'none',
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--fg-2)' }}>
            {s.icon}
            <span className="eyebrow">{s.label}</span>
          </div>
          {s.fr && <div className="fr" style={{ fontSize: 11 }}>{s.fr}</div>}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 4 }}>
            <div className="num" style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>{s.value}</div>
            {s.delta && (
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 11, color: s.deltaColor || 'var(--green-2)',
                padding: '2px 7px', borderRadius: 99,
                background: `color-mix(in oklab, ${s.deltaColor || 'var(--green)'} 14%, transparent)`,
                border: `1px solid color-mix(in oklab, ${s.deltaColor || 'var(--green)'} 30%, transparent)`,
              }}>{s.delta}</span>
            )}
          </div>
          {s.note && <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)', marginTop: 2,
          }}>{s.note}</div>}
        </div>
      ))}
    </div>
  );
}
