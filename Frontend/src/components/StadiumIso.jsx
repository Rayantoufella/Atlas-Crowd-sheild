// Stadium isometric — 6 colored wedges + center pitch + gate labels.
import React from 'react';

function statusOf(v) {
  if (v >= 75) return { fill: 'var(--red)', stroke: 'var(--red-2)' };
  if (v >= 55) return { fill: 'var(--orange)', stroke: 'var(--orange-2)' };
  return { fill: 'var(--green)', stroke: 'var(--green-2)' };
}

export default function StadiumIso({ sections = [], activeAlertIdx = null, width = 560, height = 300 }) {
  const cx = width / 2;
  const cy = height / 2 + 18;
  const rx = width * 0.4;
  const ry = height * 0.32;
  const depth = 22;

  const wedge = (i) => {
    const a1 = (i / 6) * Math.PI * 2 - Math.PI / 2 - Math.PI / 6;
    const a2 = ((i + 1) / 6) * Math.PI * 2 - Math.PI / 2 - Math.PI / 6;
    const innerR = 0.62;
    const x1 = cx + Math.cos(a1) * rx, y1 = cy + Math.sin(a1) * ry;
    const x2 = cx + Math.cos(a2) * rx, y2 = cy + Math.sin(a2) * ry;
    const ix1 = cx + Math.cos(a1) * rx * innerR, iy1 = cy + Math.sin(a1) * ry * innerR;
    const ix2 = cx + Math.cos(a2) * rx * innerR, iy2 = cy + Math.sin(a2) * ry * innerR;
    const mid = (a1 + a2) / 2;
    const lx = cx + Math.cos(mid) * (rx + 22);
    const ly = cy + Math.sin(mid) * (ry + 18);
    const cxM = cx + Math.cos(mid) * rx * 0.8;
    const cyM = cy + Math.sin(mid) * ry * 0.8;
    return { x1, y1, x2, y2, ix1, iy1, ix2, iy2, lx, ly, cxM, cyM, innerR };
  };

  const gateNames = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6'];

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <radialGradient id="pitchGrad" cx="50%" cy="50%">
          <stop offset="0%" stopColor="var(--pitch)" />
          <stop offset="100%" stopColor="var(--pitch)" stopOpacity="0.7" />
        </radialGradient>
        <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        {[0,1,2,3,4,5].map((i) => {
          const v = sections[i] ?? 30;
          const c = statusOf(v);
          return (
            <linearGradient key={i} id={`stadWedge-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c.fill} stopOpacity="0.55" />
              <stop offset="100%" stopColor={c.fill} stopOpacity="0.18" />
            </linearGradient>
          );
        })}
      </defs>

      <ellipse cx={cx} cy={cy + depth} rx={rx + 6} ry={ry + 4} fill="rgba(0,0,0,0.35)" />
      <ellipse cx={cx} cy={cy} rx={rx + 6} ry={ry + 4} fill="var(--bg-3)" stroke="var(--border-strong)" />

      {[0,1,2,3,4,5].map((i) => {
        const v = sections[i] ?? 30;
        const c = statusOf(v);
        const w = wedge(i);
        return (
          <g key={i}>
            <path
              d={`M ${w.x1} ${w.y1} A ${rx} ${ry} 0 0 1 ${w.x2} ${w.y2} L ${w.ix2} ${w.iy2} A ${rx * w.innerR} ${ry * w.innerR} 0 0 0 ${w.ix1} ${w.iy1} Z`}
              fill={`url(#stadWedge-${i})`} stroke={c.stroke} strokeOpacity="0.55" strokeWidth="1"
            />
            <circle cx={w.cxM} cy={w.cyM} r="3" fill={c.stroke} opacity="0.85" />
          </g>
        );
      })}

      <ellipse cx={cx} cy={cy} rx={rx * 0.62} ry={ry * 0.62} fill="url(#pitchGrad)" stroke="var(--pitch-line)" />
      <ellipse cx={cx} cy={cy} rx={rx * 0.14} ry={ry * 0.14} fill="none" stroke="var(--pitch-line)" />
      <line x1={cx - rx * 0.62} y1={cy} x2={cx + rx * 0.62} y2={cy} stroke="var(--pitch-line)" strokeWidth="0.8" strokeDasharray="3 3" />
      <circle cx={cx} cy={cy} r="2" fill="var(--pitch-line)" />
      <line x1={cx - rx * 0.62 - 6} y1={cy} x2={cx - rx * 0.62} y2={cy} stroke="var(--pitch-line)" strokeWidth="2" />
      <line x1={cx + rx * 0.62} y1={cy} x2={cx + rx * 0.62 + 6} y2={cy} stroke="var(--pitch-line)" strokeWidth="2" />

      {[0,1,2,3,4,5].map((i) => {
        const w = wedge(i);
        const v = sections[i] ?? 30;
        const c = statusOf(v);
        return (
          <g key={i}>
            <rect x={w.lx - 22} y={w.ly - 12} width="44" height="24" rx="12"
              fill="var(--bg-elev)" stroke={c.stroke} strokeOpacity="0.5" />
            <circle cx={w.lx - 12} cy={w.ly} r="3" fill={c.stroke} />
            <text x={w.lx + 4} y={w.ly + 4} textAnchor="middle"
              fontFamily="var(--font-mono)" fontSize="11" fontWeight="600" fill="var(--fg-0)">
              {gateNames[i]}
            </text>
          </g>
        );
      })}

      {activeAlertIdx !== null && (() => {
        const w = wedge(activeAlertIdx);
        return (
          <g>
            <circle cx={w.cxM} cy={w.cyM} r="18" fill="none" stroke="var(--red-2)" strokeWidth="2" opacity="0.9">
              <animate attributeName="r" values="14;28;14" dur="1.8s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9;0;0.9" dur="1.8s" repeatCount="indefinite" />
            </circle>
            <circle cx={w.cxM} cy={w.cyM} r="6" fill="var(--red-2)" filter="url(#softGlow)" />
            <circle cx={w.cxM} cy={w.cyM} r="3" fill="white" />
          </g>
        );
      })()}

      <g transform={`translate(${width - 36} 30)`}>
        <circle r="14" fill="var(--bg-2)" stroke="var(--border)" />
        <path d="M 0 -8 L 3 0 L 0 8 L -3 0 Z" fill="var(--accent-2)" />
        <text y="-18" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" fill="var(--fg-3)" letterSpacing="1">N</text>
      </g>
    </svg>
  );
}
