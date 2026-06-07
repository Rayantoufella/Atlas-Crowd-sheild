// StadiumMap — high-fidelity 2D top-down (drone/satellite-style) view of
// Stade Moulay Abdellah, Rabat as a modern OVAL bowl stadium. Pure SVG +
// scoped CSS, no external deps.
//
// Layered for realism (outer → center):
//   roof ring (gradient + radial trusses + shadow) → 3 seating tiers built
//   from real curved seat-rows, split into 6 angular gate sectors separated
//   by vomitory gaps and density-colored → inner concourse ring → striped
//   pitch with gradient turf + full markings.
// Overlays: large clear gate badges, camera dots, deployed agents, P3 East
//   critical pulsing halo, lighting vignette.
// Interaction: click the map (or a gate) to open a full-size modal with a
//   detail panel; click a gate to inspect its live metrics.
import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useHashRouter } from '../lib/router.js';

const CSS = `
.sm-wrap { position: relative; width: 100%; height: 100%; min-height: 0;
  display: flex; align-items: center; justify-content: center; flex: 1; }
.sm-svg { width: 100%; height: 100%; max-height: 100%; display: block;
  border-radius: 10px; background:
    radial-gradient(120% 120% at 50% 30%, #0e2036 0%, #0a1628 55%, #060e1c 100%); }
.sm-clickable { cursor: zoom-in; }
.sm-expand-hint { position: absolute; bottom: 12px; left: 12px; pointer-events: none;
  display: flex; align-items: center; gap: 6px; padding: 5px 10px; border-radius: 7px;
  background: rgba(10,22,40,0.78); border: 1px solid rgba(255,255,255,0.1);
  font: 600 10px var(--sans, sans-serif); letter-spacing: 0.06em; color: #9aa7bc; }

/* gate sector hit-areas + hover */
.sm-hit { cursor: pointer; fill: transparent; transition: fill 0.15s; }
.sm-hit:hover { fill: rgba(255,255,255,0.06); }

/* critical halo + agents */
.sm-crit-halo { transform-box: fill-box; transform-origin: center;
  animation: sm-crit 1.9s ease-in-out infinite; }
@keyframes sm-crit { 0%,100% { opacity: 0.16; transform: scale(1); } 50% { opacity: 0.46; transform: scale(1.16); } }
.sm-agent { animation: sm-breathe 2.6s ease-in-out infinite; }
@keyframes sm-breathe { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }

.sm-title { position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
  font: 700 14px/1 "JetBrains Mono", ui-monospace, monospace; letter-spacing: 0.14em;
  color: rgba(170,200,240,0.85); text-align: center; white-space: nowrap;
  pointer-events: none; text-shadow: 0 2px 8px rgba(0,0,0,0.8); }
.sm-legend { position: absolute; top: 12px; right: 24px; display: flex; gap: 16px;
  padding: 8px 14px; border-radius: 9px; background: rgba(10,22,40,0.5);
  border: 1px solid rgba(255,255,255,0.12); pointer-events: none; backdrop-filter: blur(8px); }
.sm-legend span { display: inline-flex; align-items: center; gap: 7px;
  font: 600 11px var(--sans, sans-serif); letter-spacing: 0.04em; color: #aab8d0; }
.sm-legend i { width: 8px; height: 8px; border-radius: 50%; }

/* ---- full-size GLASS modal ---- */
.sm-modal { position: fixed; inset: 0; z-index: 200; display: flex; align-items: center;
  justify-content: center; padding: 20px; background: rgba(4,8,16,0.55);
  backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); animation: sm-fade 0.2s ease; }
@keyframes sm-fade { from { opacity: 0; } to { opacity: 1; } }
.sm-dialog { display: flex; gap: 0; width: min(1500px, 98vw); height: min(880px, 96vh);
  background: linear-gradient(180deg, rgba(20,30,52,0.72), rgba(10,16,32,0.78));
  border: 1px solid rgba(255,255,255,0.16); border-radius: 20px;
  backdrop-filter: blur(26px) saturate(140%); -webkit-backdrop-filter: blur(26px) saturate(140%);
  overflow: hidden; box-shadow: 0 40px 120px -15px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.08);
  animation: sm-pop 0.22s cubic-bezier(.2,.9,.3,1.2); }
@keyframes sm-pop { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: none; } }
.sm-stage { flex: 1; position: relative; min-width: 0; display: flex; flex-direction: column; padding: 24px; }
.sm-close { position: absolute; top: 14px; right: 14px; z-index: 3; width: 34px; height: 34px;
  border-radius: 8px; border: 1px solid rgba(255,255,255,0.18); background: rgba(255,255,255,0.08);
  backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
  color: #cdd8ea; font: 700 18px var(--sans, sans-serif); cursor: pointer; transition: all 0.15s; }
.sm-close:hover { background: rgba(255,255,255,0.16); color: #fff; }

/* detail panel — glass */
.sm-panel { width: 420px; flex-shrink: 0; border-left: 1px solid rgba(255,255,255,0.12);
  background: linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015));
  backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
  display: flex; flex-direction: column; padding: 28px; overflow-y: auto;
  font-family: var(--sans, sans-serif); color: #e9eef7; gap: 20px; }
.sm-panel h2 { font-size: 18px; font-weight: 800; letter-spacing: 0.1em; margin: 0; }
.sm-panel .sub { font-size: 12px; color: #5e6b81; letter-spacing: 0.08em; text-transform: uppercase; margin: 0; }
.sm-gatecard { border: 1px solid rgba(255,255,255,0.12); border-radius: 14px; padding: 20px;
  background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015));
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
.sm-gatecard .gc-top { display: flex; align-items: baseline; justify-content: space-between; }
.sm-gatecard .gc-id { font: 800 24px "JetBrains Mono", monospace; }
.sm-gatecard .gc-dir { font-size: 13px; color: #9aa7bc; letter-spacing: 0.1em; text-transform: uppercase; margin-left: 8px; }
.sm-gatecard .gc-pct { font: 800 36px "JetBrains Mono", monospace; line-height: 1; }
.sm-gatecard .gc-badge { display: inline-block; margin-top: 12px; font-size: 11px; font-weight: 800;
  letter-spacing: 0.12em; padding: 6px 12px; border-radius: 6px; }
.sm-gatecard .gc-bar { height: 8px; border-radius: 4px; background: rgba(255,255,255,0.08); margin: 16px 0 16px; overflow: hidden; }
.sm-gatecard .gc-bar > i { display: block; height: 100%; border-radius: 4px; }
.sm-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.sm-stat { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; padding: 12px 14px; }
.sm-stat .k { font-size: 10px; color: #5e6b81; letter-spacing: 0.08em; text-transform: uppercase; }
.sm-stat .v { font: 700 16px "JetBrains Mono", monospace; margin-top: 6px; }
.sm-list { display: flex; flex-direction: column; gap: 2px; margin-top: auto; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.08); }
.sm-list .lh { display: grid; grid-template-columns: 12px 58px 1fr 46px 64px; align-items: center; gap: 10px;
  padding: 4px 12px 8px; font-size: 9px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: #5e6b81; }
.sm-list .lh .r { text-align: right; }
.sm-list .li { display: grid; grid-template-columns: 12px 58px 1fr 46px 64px; align-items: center; gap: 10px;
  padding: 9px 12px; border-radius: 10px; cursor: pointer; transition: background 0.15s; }
.sm-list .li:hover { background: rgba(255,255,255,0.05); }
.sm-list .li.active { background: rgba(255,255,255,0.08); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.14); }
.sm-list .li i { width: 10px; height: 10px; border-radius: 50%; }
.sm-list .li .nm { font-size: 13px; font-weight: 700; white-space: nowrap; }
.sm-list .li .dr { font-size: 11px; color: #8a98b0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sm-list .li .pc { font: 700 13px "JetBrains Mono", monospace; text-align: right; }
.sm-list .li .st { font-size: 9.5px; font-weight: 800; letter-spacing: 0.06em; text-align: right; }
/* sm-crit-halo is used on the SVG halo ring for critical zones */

/* detection button inside the gate detail card */
.sm-detect-btn { display: flex; align-items: center; justify-content: center; gap: 9px;
  width: 100%; margin-top: 16px; padding: 13px 16px; border: none; border-radius: 11px;
  color: #fff; font: 800 12.5px var(--sans, sans-serif); letter-spacing: 0.06em;
  text-transform: uppercase; cursor: pointer; transition: transform 0.14s, filter 0.14s; }
.sm-detect-btn:hover { transform: translateY(-1px); filter: brightness(1.08); }
.sm-detect-btn:active { transform: translateY(0); }
`;

const C = {
  line: 'rgba(255,255,255,0.85)',
  safe: '#22c55e',
  warn: '#f59e0b',
  crit: '#ef4444',
  gateBg: '#1a2744',
};
function sectorStatus(pct, riskThreshold, warnThreshold) {
  if (pct >= riskThreshold) return { label: 'CRITICAL', color: C.crit };
  if (pct >= warnThreshold) return { label: 'WARNING', color: C.warn };
  if (pct >= 50) return { label: 'WATCH', color: C.warn };
  return { label: 'SAFE', color: C.safe };
}

// Geometry (SVG user units, viewBox 0 0 900 620).
const CX = 450, CY = 305;
const A = 360, B = 242;          // outer seating-tier semi-axes
const AS = 396, BS = 268;        // roof / structure outer semi-axes
const RI = 0.50, RO = 1.0;
const PW = 240, PH = 144;
const PX = CX - PW / 2, PY = CY - PH / 2;

const D2R = Math.PI / 180;
const pt = (a, rr) => [CX + rr * A * Math.cos(a * D2R), CY + rr * B * Math.sin(a * D2R)];

const rng = (seed) => {
  let s = seed;
  return () => {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const HALF = 27;
const BASE_SECTORS = [
  { id: 'P1', n: 1, gate: 'Nord',       c: -90, cams: 8, agents: 342, cap: 11200, cameraIndices: [0, 1] },
  { id: 'P2', n: 2, gate: 'Nord-Est',   c: -30, cams: 8, agents: 210, cap: 11200, cameraIndices: [3, 4, 5] },
  { id: 'P3', n: 3, gate: 'Est',        c: 30,  cams: 9, agents: 89,  cap: 11600, cameraIndices: [7, 8, 9] },
  { id: 'P4', n: 4, gate: 'Sud',        c: 90,  cams: 8, agents: 280, cap: 11600, cameraIndices: [11, 12, 13] },
  { id: 'P5', n: 5, gate: 'Ouest',      c: 150, cams: 7, agents: 256, cap: 11200, cameraIndices: [15, 16, 17] },
  { id: 'P6', n: 6, gate: 'Nord-Ouest', c: 210, cams: 8, agents: 168, cap: 11200, cameraIndices: [19, 20, 21] },
];
const HARDCODED_PCTS = [28, 39, 82, 61, 35, 71];
const DFLT_RISK = 80, DFLT_WARN = 65;
const DEFAULT_SECTORS = BASE_SECTORS.map((s, i) => {
  const pct = HARDCODED_PCTS[i];
  const st = sectorStatus(pct, DFLT_RISK, DFLT_WARN);
  return { ...s, pct, color: st.color, critical: st.label === 'CRITICAL', label: st.label };
});

function buildSectors(zones, riskThreshold = DFLT_RISK, warnThreshold = DFLT_WARN) {
  if (!zones || zones.length === 0) return DEFAULT_SECTORS;
  return BASE_SECTORS.map((s, i) => {
    const pct = zones[i]?.risk ?? HARDCODED_PCTS[i];
    const st = sectorStatus(pct, riskThreshold, warnThreshold);
    return { ...s, pct, color: st.color, critical: st.label === 'CRITICAL', label: st.label };
  });
}
const TIERS = [[0.50, 0.66], [0.68, 0.83], [0.85, 1.0]];

function wedge(a0, a1, ri, ro) {
  const [ox0, oy0] = pt(a0, ro), [ox1, oy1] = pt(a1, ro);
  const [ix1, iy1] = pt(a1, ri), [ix0, iy0] = pt(a0, ri);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${ox0} ${oy0} A ${ro * A} ${ro * B} 0 ${large} 1 ${ox1} ${oy1}`
    + ` L ${ix1} ${iy1} A ${ri * A} ${ri * B} 0 ${large} 0 ${ix0} ${iy0} Z`;
}
function arc(a0, a1, rr) {
  const [x0, y0] = pt(a0, rr), [x1, y1] = pt(a1, rr);
  return `M ${x0} ${y0} A ${rr * A} ${rr * B} 0 0 1 ${x1} ${y1}`;
}
function dotsInSector(s, seed) {
  const r = rng(seed);
  const out = [];
  TIERS.forEach(([ri, ro]) => {
    const count = Math.round((2 * HALF) * (ro - ri) * (s.pct / 100) * 12);
    for (let i = 0; i < count; i++) {
      const a = s.c - HALF + 3 + r() * (2 * HALF - 6);
      const rr = ri + 0.012 + r() * (ro - ri - 0.024);
      const [x, y] = pt(a, rr);
      out.push({ x, y, r: 1.1 + r() * 0.6, o: 0.45 + r() * 0.5, color: s.color });
    }
  });
  return out;
}

// ---------------------------------------------------------------------------
// The stadium scene (reused at inline size and full-size modal).
// onGateClick(sector) — optional; selectedId highlights a gate.
// ---------------------------------------------------------------------------
function StadiumScene({ onGateClick, selectedId, sectors, onCameraClick }) {
  const sec = sectors || DEFAULT_SECTORS;
  const crowd = useMemo(() => sec.map((s, i) => ({ ...s, dots: dotsInSector(s, 1000 + i * 131) })), [sec]);
  const agents = useMemo(() => {
    const out = [];
    sec.forEach((s, si) => {
      const r = rng(7000 + si * 53);
      for (let i = 0; i < 3; i++) {
        const a = s.c - HALF + 6 + r() * (2 * HALF - 12);
        const rr = RI + 0.08 + r() * (RO - RI - 0.18);
        const [x, y] = pt(a, rr);
        out.push({ x, y, delay: (r() * 2.4).toFixed(2) });
      }
    });
    return out;
  }, []);
  const cameras = useMemo(() => {
    const n = 24;
    return Array.from({ length: n }, (_, i) => {
      const a = (i / n) * 360 - 90;
      return { x: CX + 1.015 * AS * Math.cos(a * D2R), y: CY + 1.015 * BS * Math.sin(a * D2R), off: i === 7 };
    });
  }, []);
  const stripes = useMemo(() => {
    const n = 9, w = PW / n;
    return Array.from({ length: n }, (_, i) => ({ x: PX + i * w, w, even: i % 2 === 0 }));
  }, []);
  const seatRows = useMemo(() => {
    const rows = [];
    sec.forEach((s) => {
      TIERS.forEach(([ri, ro], ti) => {
        const n = 6 + ti * 2;
        for (let k = 1; k < n; k++) rows.push({ id: `${s.id}-${ti}-${k}`, d: arc(s.c - HALF + 1.5, s.c + HALF - 1.5, ri + (ro - ri) * (k / n)) });
      });
    });
    return rows;
  }, []);

  const fline = { fill: 'none', stroke: C.line, strokeWidth: 1.5 };
  const interactive = !!onGateClick;

  return (
    <svg className="sm-svg" viewBox="-45 -55 990 720" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="sm-turf" cx="50%" cy="36%" r="80%">
          <stop offset="0%" stopColor="#258a3c" /><stop offset="70%" stopColor="#1c6e2f" /><stop offset="100%" stopColor="#155726" />
        </radialGradient>
        <radialGradient id="sm-sheen" cx="50%" cy="30%" r="75%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.14)" /><stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        <radialGradient id="sm-roof" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#2a3c52" /><stop offset="78%" stopColor="#1b2738" /><stop offset="100%" stopColor="#10192a" />
        </radialGradient>
        <radialGradient id="sm-bowl" cx="50%" cy="38%" r="72%">
          <stop offset="0%" stopColor="#243246" /><stop offset="100%" stopColor="#161f30" />
        </radialGradient>
        <radialGradient id="sm-vignette" cx="50%" cy="42%" r="62%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.06)" /><stop offset="60%" stopColor="rgba(255,255,255,0)" /><stop offset="100%" stopColor="rgba(0,0,0,0.4)" />
        </radialGradient>
        <clipPath id="sm-pitchClip"><rect x={PX} y={PY} width={PW} height={PH} rx="9" /></clipPath>
        <filter id="sm-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#000" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* ---- roof / structure ---- */}
      <ellipse cx={CX} cy={CY} rx={AS} ry={BS} fill="url(#sm-roof)" stroke="rgba(255,255,255,0.12)" strokeWidth="2" filter="url(#sm-shadow)" />
      {Array.from({ length: 72 }, (_, i) => {
        const a = (i / 72) * 360;
        const x0 = CX + RO * A * Math.cos(a * D2R), y0 = CY + RO * B * Math.sin(a * D2R);
        const x1 = CX + AS * Math.cos(a * D2R), y1 = CY + BS * Math.sin(a * D2R);
        return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke="rgba(255,255,255,0.05)" strokeWidth="0.8" />;
      })}
      <ellipse cx={CX} cy={CY} rx={(RO * A + AS) / 2} ry={(RO * B + BS) / 2} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

      {/* ---- bowl base + sectors ---- */}
      <ellipse cx={CX} cy={CY} rx={RO * A} ry={RO * B} fill="url(#sm-bowl)" />
      {crowd.map((s) => (
        <g key={s.id} opacity={selectedId && selectedId !== s.id ? 0.5 : 1}>
          {TIERS.map(([ri, ro], ti) => (
            <path key={ti} d={wedge(s.c - HALF, s.c + HALF, ri, ro)} fill={s.color}
              opacity={(s.critical ? 0.26 : 0.14) - ti * 0.015} stroke="rgba(0,0,0,0.28)" strokeWidth="0.8" />
          ))}
        </g>
      ))}
      {seatRows.map((r) => <path key={r.id} d={r.d} fill="none" stroke="rgba(0,0,0,0.22)" strokeWidth="0.7" />)}
      {crowd.map((s) => (
        <g key={`d-${s.id}`} opacity={selectedId && selectedId !== s.id ? 0.45 : 1}>
          {s.dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.color} opacity={d.o} />)}
        </g>
      ))}
      {[0.66, 0.83].map((rr, i) => (
        <ellipse key={i} cx={CX} cy={CY} rx={rr * A} ry={rr * B} fill="none" stroke="rgba(0,0,0,0.32)" strokeWidth="1.4" />
      ))}

      {/* selected sector highlight ring */}
      {selectedId && (() => {
        const s = sec.find((x) => x.id === selectedId);
        if (!s) return null;
        return <path d={wedge(s.c - HALF, s.c + HALF, RI, RO)} fill="none" stroke="#fff" strokeWidth="2.2" opacity="0.85" />;
      })()}

      {/* ---- concourse ring + pitch ---- */}
      <ellipse cx={CX} cy={CY} rx={RI * A} ry={RI * B} fill="#11202f" stroke="rgba(0,0,0,0.35)" strokeWidth="1.6" />
      <ellipse cx={CX} cy={CY} rx={RI * A - 6} ry={RI * B - 6} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

      {(() => { const [hx, hy] = pt(30, (RI + RO) / 2); return <circle className="sm-crit-halo" cx={hx} cy={hy} r="56" fill={C.crit} opacity="0.3" />; })()}

      <rect x={PX - 7} y={PY - 7} width={PW + 14} height={PH + 14} rx="12" fill="#0e3a1a" filter="url(#sm-shadow)" />
      <g clipPath="url(#sm-pitchClip)">
        <rect x={PX} y={PY} width={PW} height={PH} fill="url(#sm-turf)" />
        {stripes.map((s, i) => <rect key={i} x={s.x} y={PY} width={s.w} height={PH} fill={s.even ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'} />)}
        <rect x={PX} y={PY} width={PW} height={PH} fill="url(#sm-sheen)" />
      </g>
      <rect x={PX} y={PY} width={PW} height={PH} rx="9" {...fline} />
      <line x1={CX} y1={PY} x2={CX} y2={PY + PH} {...fline} />
      <circle cx={CX} cy={CY} r="29" {...fline} /><circle cx={CX} cy={CY} r="2.4" fill={C.line} />
      <rect x={PX} y={CY - 45} width="33" height="90" {...fline} /><rect x={PX + PW - 33} y={CY - 45} width="33" height="90" {...fline} />
      <rect x={PX} y={CY - 21} width="13" height="42" {...fline} /><rect x={PX + PW - 13} y={CY - 21} width="13" height="42" {...fline} />
      <rect x={PX - 5} y={CY - 11} width="5" height="22" {...fline} /><rect x={PX + PW} y={CY - 11} width="5" height="22" {...fline} />

      {/* ---- cameras / agents ---- */}
      {cameras.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={c.off ? 3 : 2.2} fill={c.off ? C.crit : '#e6edf7'}
          onClick={(e) => { e.stopPropagation(); onCameraClick?.(i); }}
          style={{ cursor: 'pointer', filter: c.off ? `drop-shadow(0 0 3px ${C.crit})` : 'drop-shadow(0 0 2px rgba(230,237,247,0.8))' }} />
      ))}
      {agents.map((a, i) => (
        <circle key={i} className="sm-agent" cx={a.x} cy={a.y} r="2.3" fill={C.safe}
          style={{ animationDelay: `${a.delay}s`, filter: `drop-shadow(0 0 3px ${C.safe})` }} />
      ))}

      <ellipse cx={CX} cy={CY} rx={AS} ry={BS} fill="url(#sm-vignette)" pointerEvents="none" />

      {/* ---- clickable sector hit-areas ---- */}
      {interactive && sec.map((s) => (
        <path key={`hit-${s.id}`} className="sm-hit" d={wedge(s.c - HALF, s.c + HALF, RI, RO)}
          onClick={(e) => { e.stopPropagation(); onGateClick(s); }}>
          <title>{`Porte ${s.n} · ${s.gate} — ${s.pct}%`}</title>
        </path>
      ))}

      {/* ---- LARGE, CLEAR gate badges ---- */}
      {sec.map((g) => {
        const ex = CX + RO * A * Math.cos(g.c * D2R), ey = CY + RO * B * Math.sin(g.c * D2R);
        const bx = CX + 1.16 * AS * Math.cos(g.c * D2R), by = CY + 1.12 * BS * Math.sin(g.c * D2R);
        const w = 154, h = 54;
        const padX = 13;
        const colR = 50;                // fixed width of the right (% / status) column
        const divX = bx + w / 2 - colR; // vertical divider: left = name column, right = % column
        return (
          <g key={g.id} style={interactive ? { cursor: 'pointer' } : undefined}
            onClick={interactive ? (e) => { e.stopPropagation(); onGateClick(g); } : undefined}>
            <line x1={ex} y1={ey} x2={bx} y2={by} stroke={g.color} strokeWidth="1.6" opacity="0.6" />
            <circle cx={ex} cy={ey} r="3.5" fill={g.color} style={{ filter: `drop-shadow(0 0 4px ${g.color})` }} />
            <rect x={bx - w / 2} y={by - h / 2} width={w} height={h} rx="9"
              fill={C.gateBg} stroke={g.color} strokeWidth={selectedId === g.id ? 2.6 : 1.8} />
            <line x1={divX} y1={by - h / 2 + 8} x2={divX} y2={by + h / 2 - 8}
              stroke={g.color} strokeWidth="1" opacity="0.3" />
            {/* port name + direction (left column) */}
            <text x={bx - w / 2 + padX} y={by - 8} fill="#fff" fontSize="16" fontWeight="800"
              fontFamily='"JetBrains Mono", monospace'>{`PORTE ${g.n}`}</text>
            <text x={bx - w / 2 + padX} y={by + 10} fill={g.color} fontSize="10" fontWeight="800"
              letterSpacing="0.03em" fontFamily='var(--sans, sans-serif)'>{g.gate.toUpperCase()}</text>
            {/* percentage + status (right column) */}
            <text x={bx + w / 2 - padX} y={by - 5} textAnchor="end" fill={g.color} fontSize="20"
              fontWeight="800" fontFamily='"JetBrains Mono", monospace'>{g.pct}%</text>
            <text x={bx + w / 2 - padX} y={by + 11} textAnchor="end" fill="rgba(255,255,255,0.6)"
              fontSize="8" fontWeight="800" letterSpacing="0.06em">{g.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
function GateDetail({ s, onCameraClick }) {
  const inside = Math.round(s.cap * s.pct / 100);
  const flow = s.critical ? '+14%' : s.pct >= 60 ? '+9%' : '−3%';
  return (
    <div className="sm-gatecard" style={{ borderColor: `${s.color}55` }}>
      <div className="gc-top">
        <div><span className="gc-id" style={{ color: s.color }}>{`PORTE ${s.n}`}</span>{' '}
          <span className="gc-dir">{s.gate}</span></div>
        <span className="gc-pct" style={{ color: s.color }}>{s.pct}%</span>
      </div>
      <span className="gc-badge" style={{ color: s.color, background: `${s.color}22` }}>{s.label}</span>
      <div className="gc-bar"><i style={{ width: `${s.pct}%`, background: s.color, boxShadow: `0 0 8px ${s.color}88` }} /></div>
      <div className="sm-stats">
        <div className="sm-stat"><div className="k">Occupancy</div><div className="v">{inside.toLocaleString('en-US')}</div></div>
        <div className="sm-stat"><div className="k">Capacity</div><div className="v">{s.cap.toLocaleString('en-US')}</div></div>
        <div className="sm-stat"><div className="k">Flow rate</div><div className="v" style={{ color: flow.startsWith('+') ? C.warn : C.safe }}>{flow}</div></div>
        <div className="sm-stat"><div className="k">Field agents</div><div className="v">{s.agents}</div></div>
        <div className="sm-stat" onClick={() => onCameraClick?.(s.n - 1)} style={{ cursor: 'pointer' }}><div className="k">Cameras</div><div className="v">{s.cams} online</div></div>
        <div className="sm-stat"><div className="k">Sector</div><div className="v">{s.id}</div></div>
      </div>
      {/* Bouton détection : ouvre la vidéo de ce poste et lance l'analyse
          forensic automatiquement (route /forensic/cam-N). */}
      <button
        className="sm-detect-btn"
        style={{
          background: `linear-gradient(135deg, ${s.color}, color-mix(in oklab, ${s.color} 70%, #000))`,
          boxShadow: `0 4px 18px ${s.color}55`,
        }}
        onClick={() => onCameraClick?.((s.cameraIndices && s.cameraIndices[0]) ?? (s.n - 1))}
      >
        <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden="true">
          <rect x="2" y="5" width="11" height="10" rx="2" stroke="#fff" strokeWidth="1.6" />
          <path d="M13 8 L18 5.5 V14.5 L13 12 Z" fill="#fff" />
        </svg>
        {s.critical ? 'DÉTECTION — INSPECTER LA VIDÉO' : 'Détection vidéo de ce poste'}
      </button>
    </div>
  );
}

export default function StadiumMap({ zones, riskThreshold = DFLT_RISK, warnThreshold = DFLT_WARN }) {
  const [open, setOpen] = useState(false);
  const sectors = useMemo(() => buildSectors(zones, riskThreshold, warnThreshold), [zones, riskThreshold, warnThreshold]);
  const [selId, setSelId] = useState('P3');
  const sel = sectors.find((s) => s.id === selId) || sectors[0];
  const { navigate } = useHashRouter();
  const onCameraClick = (i) => navigate(`/forensic/cam-${i}`);

  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <div className="sm-wrap sm-clickable" onClick={handleOpen} title="Click to expand">
        <style>{CSS}</style>
        <div className="sm-title">STADE MOULAY ABDELLAH · RABAT</div>

        <div style={{ width: '100%', height: '100%' }}>
          <StadiumScene sectors={sectors} onCameraClick={onCameraClick} />
        </div>

        <div className="sm-expand-hint">⤢ Click to expand</div>
      </div>

      {open && createPortal(
        <div className="sm-modal" onClick={handleClose}>
          <style>{CSS}</style>
          <div className="sm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="sm-stage">
              <button className="sm-close" aria-label="Close" onClick={handleClose}>×</button>
              <div className="sm-title">STADE MOULAY ABDELLAH · RABAT</div>
              <div className="sm-legend">
                <span><i style={{ background: C.safe }} />Safe</span>
                <span><i style={{ background: C.warn }} />Warning</span>
                <span><i style={{ background: C.crit }} />Critical</span>
                <span><i style={{ background: '#e6edf7' }} />Camera</span>
              </div>
              <StadiumScene sectors={sectors} onGateClick={(s) => setSelId(s.id)} selectedId={selId} onCameraClick={onCameraClick} />
            </div>
            <div className="sm-panel">
              <h2>GATE DETAIL</h2>
              <div className="sub">Live sector telemetry · click a gate</div>
              <GateDetail s={sel} onCameraClick={onCameraClick} />
              <div className="sm-list">
                <div className="lh">
                  <span />
                  <span>Porte</span>
                  <span>Secteur</span>
                  <span className="r">Occ.</span>
                  <span className="r">Statut</span>
                </div>
                {sectors.map((s) => (
                  <div key={s.id} className={`li ${s.id === selId ? 'active' : ''}`} onClick={() => setSelId(s.id)}>
                    <i style={{ background: s.color, boxShadow: `0 0 7px ${s.color}` }} />
                    <span className="nm">Porte {s.n}</span>
                    <span className="dr">{s.gate}</span>
                    <span className="pc" style={{ color: s.color }}>{s.pct}%</span>
                    <span className="st" style={{ color: s.color }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>,
        document.body
      )}
    </>
  );
}
