// Zone card — single gate KPI with sparkline + occupancy bar.
import React from 'react';
import { Badge } from './Badge.jsx';
import Sparkline from './Sparkline.jsx';

export default function ZoneCard({ idx, name, fr, capacity, occupancy, risk, status, trend }) {
  const color = status === 'crit' ? 'var(--red-2)' : status === 'warn' ? 'var(--orange-2)' : 'var(--green-2)';
  const label = status === 'crit' ? 'CRITICAL' : status === 'warn' ? 'ELEVATED' : 'NOMINAL';
  const variant = status === 'crit' ? 'crit' : status === 'warn' ? 'warn' : 'ok';

  return (
    <div className="card card-pad zone-card" style={{
      padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8,
      transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = 'var(--border-strong)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 22, height: 22, borderRadius: 6, background: 'var(--bg-3)',
            border: '1px solid var(--border)', display: 'grid', placeItems: 'center',
            fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: 'var(--fg-2)',
          }}>G{idx + 1}</span>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: '-0.01em' }}>{name}</div>
            <div className="fr" style={{ fontSize: 11 }}>{fr}</div>
          </div>
        </div>
        <Badge variant={variant} dot pulse={variant === 'crit'}>{label}</Badge>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div className="eyebrow" style={{ fontSize: 9 }}>RISK</div>
          <div className="num" style={{
            fontSize: 28, fontWeight: 700, color, lineHeight: 1, letterSpacing: '-0.02em',
          }}>{risk}<span style={{ fontSize: 14, opacity: 0.6 }}>%</span></div>
        </div>
        <Sparkline width={86} height={32} color={color} trend={trend} seed={idx + 1} />
      </div>

      <div>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)', marginBottom: 4,
        }}>
          <span>OCCUPANCY</span>
          <span>{occupancy.toLocaleString()} / {capacity.toLocaleString()}</span>
        </div>
        <div style={{ position: 'relative', height: 4, borderRadius: 99, background: 'var(--bg-3)', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', inset: 0,
            width: `${(occupancy / capacity) * 100}%`,
            background: color, opacity: 0.85,
          }} />
        </div>
      </div>
    </div>
  );
}
