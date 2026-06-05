// Mini top-down stadium for the Reports mobile view.
// Highlights one gate (the supporter's gate) with a ring.
import React from 'react';

function statusOf(v) {
  if (v >= 75) return 'var(--red)';
  if (v >= 55) return 'var(--orange)';
  return 'var(--green)';
}

export default function StadiumMini({ sections = [], highlightIdx = 0, size = 200 }) {
  const cx = size / 2, cy = size / 2;
  const rx = size * 0.42, ry = size * 0.32;

  return (
    <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.7}`} style={{ display: 'block' }}>
      <ellipse cx={cx} cy={cy * 0.7} rx={rx} ry={ry} fill="var(--bg-3)" stroke="var(--border-strong)" />
      {[0,1,2,3,4,5].map((i) => {
        const a1 = (i / 6) * Math.PI * 2 - Math.PI / 2 - Math.PI / 6;
        const a2 = ((i + 1) / 6) * Math.PI * 2 - Math.PI / 2 - Math.PI / 6;
        const x1 = cx + Math.cos(a1) * rx, y1 = cy * 0.7 + Math.sin(a1) * ry;
        const x2 = cx + Math.cos(a2) * rx, y2 = cy * 0.7 + Math.sin(a2) * ry;
        const ix1 = cx + Math.cos(a1) * rx * 0.6, iy1 = cy * 0.7 + Math.sin(a1) * ry * 0.6;
        const ix2 = cx + Math.cos(a2) * rx * 0.6, iy2 = cy * 0.7 + Math.sin(a2) * ry * 0.6;
        const v = sections[i] ?? 30;
        const fill = statusOf(v);
        return (
          <path key={i}
            d={`M ${x1} ${y1} A ${rx} ${ry} 0 0 1 ${x2} ${y2} L ${ix2} ${iy2} A ${rx * 0.6} ${ry * 0.6} 0 0 0 ${ix1} ${iy1} Z`}
            fill={fill} fillOpacity="0.55" stroke={fill} strokeWidth={highlightIdx === i ? 2.5 : 1} />
        );
      })}
      <ellipse cx={cx} cy={cy * 0.7} rx={rx * 0.6} ry={ry * 0.6} fill="var(--pitch)" stroke="var(--pitch-line)" />
      <line x1={cx - rx * 0.6} y1={cy * 0.7} x2={cx + rx * 0.6} y2={cy * 0.7} stroke="var(--pitch-line)" strokeDasharray="2 3" />
      {/* highlight ring on user's gate */}
      {(() => {
        const i = highlightIdx;
        const a = (i / 6) * Math.PI * 2 - Math.PI / 2 - Math.PI / 6 + Math.PI / 6;
        const x = cx + Math.cos(a) * rx * 0.85;
        const y = cy * 0.7 + Math.sin(a) * ry * 0.85;
        return (
          <g>
            <circle cx={x} cy={y} r="9" fill="none" stroke="var(--accent-2)" strokeWidth="2">
              <animate attributeName="r" values="6;14;6" dur="1.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0;1" dur="1.6s" repeatCount="indefinite" />
            </circle>
            <circle cx={x} cy={y} r="4" fill="var(--accent-2)" />
          </g>
        );
      })()}
    </svg>
  );
}
