// Live area chart — 30 datapoints over 90s, regenerates every 3s.
import React, { useState, useEffect } from 'react';

function useLiveSeries(length = 30, base = 55) {
  const [series, setSeries] = useState(() => {
    const a = []; let v = base;
    for (let i = 0; i < length; i++) {
      v += (Math.random() - 0.45) * 8;
      v = Math.max(20, Math.min(90, v));
      a.push(v);
    }
    return a;
  });
  useEffect(() => {
    const t = setInterval(() => {
      setSeries((prev) => {
        let last = prev[prev.length - 1];
        last += (Math.random() - 0.5 + 0.04) * 9;
        last = Math.max(20, Math.min(95, last));
        return [...prev.slice(1), last];
      });
    }, 3000);
    return () => clearInterval(t);
  }, []);
  return series;
}

export default function AreaChart({ width = 700, height = 220, threshold = 75, current = null }) {
  const series = useLiveSeries();
  const data = current != null ? [...series.slice(0, -1), current] : series;

  const padL = 36, padR = 16, padT = 12, padB = 28;
  const w = width - padL - padR;
  const h = height - padT - padB;

  const pts = data.map((v, i) => [
    padL + (i / (data.length - 1)) * w,
    padT + h - (v / 100) * h,
  ]);

  const smooth = (p) => {
    let d = `M ${p[0][0]} ${p[0][1]}`;
    for (let i = 0; i < p.length - 1; i++) {
      const x0 = p[Math.max(0, i - 1)];
      const x1 = p[i];
      const x2 = p[i + 1];
      const x3 = p[Math.min(p.length - 1, i + 2)];
      const cp1x = x1[0] + (x2[0] - x0[0]) / 6;
      const cp1y = x1[1] + (x2[1] - x0[1]) / 6;
      const cp2x = x2[0] - (x3[0] - x1[0]) / 6;
      const cp2y = x2[1] - (x3[1] - x1[1]) / 6;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2[0]} ${x2[1]}`;
    }
    return d;
  };

  const linePath = smooth(pts);
  const areaPath = `${linePath} L ${padL + w} ${padT + h} L ${padL} ${padT + h} Z`;
  const thY = padT + h - (threshold / 100) * h;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent-2)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--accent-2)" />
          <stop offset="100%" stopColor="var(--red-2)" />
        </linearGradient>
      </defs>
      {[0, 25, 50, 75, 100].map((y) => {
        const yp = padT + h - (y / 100) * h;
        return (
          <g key={y}>
            <line x1={padL} x2={padL + w} y1={yp} y2={yp}
              stroke="var(--grid)" strokeWidth="1"
              strokeDasharray={y === 0 || y === 100 ? '' : '3 5'} />
            <text x={padL - 8} y={yp + 4} textAnchor="end"
              fontFamily="var(--font-mono)" fontSize="10" fill="var(--fg-3)">{y}</text>
          </g>
        );
      })}
      {[0, 30, 60, 90].map((s, i) => {
        const x = padL + (i / 3) * w;
        return (
          <text key={s} x={x} y={padT + h + 18} textAnchor="middle"
            fontFamily="var(--font-mono)" fontSize="10" fill="var(--fg-3)">
            {s === 0 ? '-90s' : s === 90 ? 'now' : `-${90 - s}s`}
          </text>
        );
      })}
      <line x1={padL} x2={padL + w} y1={thY} y2={thY}
        stroke="var(--red-2)" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.8" />
      <text x={padL + w - 6} y={thY - 6} textAnchor="end"
        fontFamily="var(--font-mono)" fontSize="10" fill="var(--red-2)" letterSpacing="0.08em">
        THRESHOLD 75
      </text>
      <path d={areaPath} fill="url(#areaGrad)" style={{ transition: 'd 0.5s ease' }} />
      <path d={linePath} fill="none" stroke="url(#lineGrad)" strokeWidth="2.2"
        strokeLinejoin="round" strokeLinecap="round" style={{ transition: 'd 0.5s ease' }} />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="7" fill="var(--red)" opacity="0.25" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="4" fill="var(--red-2)" stroke="white" strokeWidth="1.5" />
    </svg>
  );
}
