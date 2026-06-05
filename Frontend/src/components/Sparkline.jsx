// Sparkline — small filled line for zone cards.
import React, { useMemo } from 'react';

export default function Sparkline({ width = 80, height = 28, color = 'var(--fg-2)', trend = 'flat', seed = 1 }) {
  const data = useMemo(() => {
    const a = []; let v = 50;
    const r = (i) => Math.sin(seed * 9.7 + i * 1.3) * 0.5 + Math.sin(seed * 3.1 + i * 0.7) * 0.3;
    for (let i = 0; i <= 14; i++) {
      const drift = trend === 'up' ? 0.18 : trend === 'down' ? -0.18 : 0;
      v += r(i) * 8 + drift * 6;
      v = Math.max(15, Math.min(90, v));
      a.push(v);
    }
    return a;
  }, [seed, trend]);

  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * width,
    height - (v / 100) * (height - 6) - 3,
  ]);
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = `${d} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg width={width} height={height}>
      <path d={area} fill={color} opacity="0.12" />
      <path d={d} stroke={color} strokeWidth="1.5" fill="none" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
