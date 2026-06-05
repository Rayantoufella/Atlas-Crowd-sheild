// Radial KPI — circular gauge for the global risk score.
import React from 'react';

export default function RadialKPI({ value = 0, size = 220, threshold = 75 }) {
  const cx = size / 2, cy = size / 2;
  const r = size * 0.38;
  const circ = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  const dash = (v / 100) * circ;

  const tickAngle = (threshold / 100) * 360 - 90;
  const a = (tickAngle * Math.PI) / 180;
  const tickX = cx + Math.cos(a) * (r + 10);
  const tickY = cy + Math.sin(a) * (r + 10);
  const tickXi = cx + Math.cos(a) * (r - 10);
  const tickYi = cy + Math.sin(a) * (r - 10);

  const status = v >= 75 ? 'CRITICAL' : v >= 55 ? 'ELEVATED' : 'NOMINAL';
  const color = v >= 75 ? 'var(--red-2)' : v >= 55 ? 'var(--orange-2)' : 'var(--green-2)';

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ display: 'block' }}>
        <defs>
          <linearGradient id="riskGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--green-2)" />
            <stop offset="55%" stopColor="var(--orange-2)" />
            <stop offset="100%" stopColor="var(--red-2)" />
          </linearGradient>
          <filter id="ringGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg-3)" strokeWidth="14" />
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke="url(#riskGrad)" strokeWidth="14"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dasharray 0.6s cubic-bezier(0.4,0,0.2,1)' }}
        />
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke="url(#riskGrad)" strokeWidth="14" opacity="0.35"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`} filter="url(#ringGlow)"
          style={{ transition: 'stroke-dasharray 0.6s cubic-bezier(0.4,0,0.2,1)' }}
        />
        <line x1={tickXi} y1={tickYi} x2={tickX} y2={tickY}
          stroke="var(--fg-2)" strokeWidth="2" strokeLinecap="round" />
        <text x={tickX + Math.cos(a) * 10} y={tickY + Math.sin(a) * 10 + 3}
          textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" fill="var(--fg-2)">
          {threshold}
        </text>
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
      }}>
        <div className="num" style={{
          fontSize: 56, fontWeight: 700, lineHeight: 1, color, letterSpacing: '-0.04em',
        }}>{Math.round(v)}<span style={{ fontSize: 24, opacity: 0.6, marginLeft: 2 }}>%</span></div>
        <div className="eyebrow" style={{ marginTop: 6 }}>{status}</div>
      </div>
    </div>
  );
}
