// Atlas Crowd Shield — Command Center dashboard.
// Faithful React port of the "Atlas Crowd Shield.html" design handoff:
// scaling 1600x900 stage, live clock, risk ring, zone status, tactical
// stadium map, critical-alert countdown, alert feed, AI prediction,
// social-impact tiles, field-agent bars + toast notifications.
// All design markup/logic lives here; styles are scoped under `.acs`.
import React, { useEffect, useRef } from 'react';
import StadiumMap from '../components/StadiumMap';

const CSS = `
.acs {
  --bg: #0A0E1A;
  --bg-2: #0C1222;
  --panel: rgba(255, 255, 255, 0.035);
  --panel-2: rgba(255, 255, 255, 0.05);
  --border: rgba(255, 255, 255, 0.09);
  --border-bright: rgba(255, 255, 255, 0.16);
  --danger: #FF3B47;
  --danger-dim: rgba(255, 59, 71, 0.14);
  --warning: #FF9F1C;
  --warning-dim: rgba(255, 159, 28, 0.13);
  --safe: #1FD17B;
  --safe-dim: rgba(31, 209, 123, 0.13);
  --info: #3B9EFF;
  --info-dim: rgba(59, 158, 255, 0.13);
  --purple: #A66BFF;
  --text: #E9EEF7;
  --text-2: #9AA7BC;
  --text-3: #5E6B81;
  --mono: "SF Mono", "JetBrains Mono", "Roboto Mono", ui-monospace, "Cascadia Mono", Menlo, Consolas, monospace;
  --sans: "Helvetica Neue", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;

  position: relative; z-index: 1;
  background:
    radial-gradient(1200px 700px at 50% -10%, rgba(59, 158, 255, 0.07), transparent 60%),
    radial-gradient(900px 600px at 90% 110%, rgba(255, 59, 71, 0.05), transparent 55%),
    var(--bg);
  color: var(--text);
  font-family: var(--sans);
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}
.acs *, .acs *::before, .acs *::after { box-sizing: border-box; margin: 0; padding: 0; }

/* Fluid layout: the dashboard fills the area below the shared NavBar (~66px)
   and the components reflow responsively — no fixed-scale snapshot.
   min-height (not a fixed height) lets the page scroll instead of clipping
   the bottom of the columns on short viewports. */
.acs #acs-stage { display: block; }
.acs #acs-canvas {
  width: 100%; min-height: calc(100vh - 66px);
  display: grid; grid-template-rows: 34px minmax(420px, 1fr) 44px;
  padding: 16px; gap: 14px;
}
@media (max-width: 1320px) {
  .acs main { grid-template-columns: 300px minmax(0, 1fr) 320px; }
}

/* contextual match strip that replaces the old design header */
.acs .match-strip { display: flex; align-items: center; gap: 18px; padding: 0 18px; }
.acs .match-strip .match-info { display: flex; align-items: center; gap: 14px; }
.acs .match-strip .meta { font-size: 11px; color: var(--text-2); letter-spacing: 0.08em; text-transform: uppercase; font-weight: 600; }

.acs .label { font-size: 10.5px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--text-3); font-weight: 600; }
.acs .mono { font-family: var(--mono); font-variant-numeric: tabular-nums; }
.acs .glass {
  background: var(--panel); border: 1px solid var(--border); border-radius: 10px;
  backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
}

.acs header { display: flex; align-items: center; gap: 22px; padding: 0 22px; }
.acs .brand { display: flex; align-items: center; gap: 14px; }
.acs .brand svg { width: 38px; height: 44px; display: block; }
.acs .brand-text h1 { font-size: 19px; font-weight: 800; letter-spacing: 0.13em; line-height: 1; }
.acs .brand-text p { font-size: 11px; color: var(--text-2); margin-top: 5px; letter-spacing: 0.02em; }
.acs .header-sep { width: 1px; height: 42px; background: var(--border); }
.acs .header-right { margin-left: auto; display: flex; align-items: center; gap: 18px; }
.acs .nav-tabs { display: flex; gap: 4px; padding: 4px; background: var(--bg-2); border-radius: 9px; border: 1px solid var(--border); }
.acs .nav-tabs button {
  padding: 7px 13px; border-radius: 6px; font: 600 12.5px var(--sans); color: var(--text-2);
  background: transparent; border: none; cursor: pointer; letter-spacing: 0.02em; transition: all 0.15s;
}
.acs .nav-tabs button:hover { color: var(--text); }
.acs .nav-tabs button.active { color: #fff; background: var(--panel-2); box-shadow: inset 0 0 0 1px var(--border-bright); }
.acs .live-badge {
  display: flex; align-items: center; gap: 8px; background: var(--danger-dim);
  border: 1px solid rgba(255, 59, 71, 0.35); color: #ff7d86; padding: 7px 13px;
  border-radius: 6px; font-size: 12px; font-weight: 800; letter-spacing: 0.16em;
}
.acs .live-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--danger); box-shadow: 0 0 10px var(--danger); animation: acs-pulse-dot 1.4s infinite; }
@keyframes acs-pulse-dot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.35; transform: scale(0.78); } }
.acs .match { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; }
.acs .match .score { font-size: 15px; font-weight: 700; letter-spacing: 0.02em; }
.acs .match .score b { color: var(--safe); }
.acs .match .meta { font-size: 11px; color: var(--text-3); letter-spacing: 0.04em; }
.acs .clock { font-family: var(--mono); font-size: 25px; font-weight: 600; letter-spacing: 0.04em; color: #fff; min-width: 132px; text-align: right; }
.acs .clock .ms { color: var(--text-3); font-size: 16px; }

.acs main { display: grid; grid-template-columns: 360px 1fr 372px; gap: 14px; min-height: 0; }
.acs .col { display: flex; flex-direction: column; gap: 12px; min-height: 0; }
.acs .card { padding: 15px 16px; }
.acs .card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 13px; }
.acs .card-head .label { color: var(--text-2); }

.acs .risk-card { display: flex; gap: 16px; align-items: center; }
.acs .ring-wrap { position: relative; width: 132px; height: 132px; flex-shrink: 0; }
.acs .ring-wrap svg { transform: rotate(-90deg); }
.acs .ring-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.acs .ring-center .val { font-size: 40px; font-weight: 800; letter-spacing: -0.02em; font-family: var(--mono); }
.acs .ring-center .cap { font-size: 9px; letter-spacing: 0.16em; color: var(--text-3); text-transform: uppercase; margin-top: 2px; }
.acs .risk-meta { flex: 1; }
.acs .risk-meta .label { margin-bottom: 8px; }
.acs .delta { display: inline-flex; align-items: center; gap: 5px; color: var(--warning); font-size: 13px; font-weight: 700; background: var(--warning-dim); padding: 5px 9px; border-radius: 5px; }
.acs .risk-sub { font-size: 11.5px; color: var(--text-2); margin-top: 12px; line-height: 1.5; }

.acs .vitals { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.acs .vital .label { margin-bottom: 7px; }
.acs .vital .big { font-size: 27px; font-weight: 800; font-family: var(--mono); letter-spacing: -0.01em; }
.acs .vital .big.green { color: var(--safe); }
.acs .vital .unit { font-size: 12px; color: var(--text-3); font-weight: 500; }
.acs .checkmark { color: var(--safe); }
.acs .bar { height: 5px; border-radius: 3px; background: rgba(255,255,255,0.08); margin-top: 9px; overflow: hidden; }
.acs .bar > i { display: block; height: 100%; border-radius: 3px; background: var(--info); box-shadow: 0 0 8px rgba(59,158,255,0.6); }

.acs .zone-list { display: flex; flex-direction: column; gap: 2px; flex: 1; }
.acs .zone { display: grid; grid-template-columns: 14px 1fr auto auto; align-items: center; gap: 11px; padding: 9px 8px; border-radius: 7px; transition: background 0.2s; }
.acs .zone:hover { background: var(--panel-2); }
.acs .zdot { width: 9px; height: 9px; border-radius: 50%; }
.acs .zname { font-size: 13px; font-weight: 600; }
.acs .zname small { display: block; font-size: 10px; color: var(--text-3); font-weight: 500; letter-spacing: 0.04em; margin-top: 1px; }
.acs .zpct { font-family: var(--mono); font-size: 11.5px; font-weight: 700; min-width: 64px; text-align: right; white-space: nowrap; }
.acs .zbadge { font-size: 9.5px; font-weight: 800; letter-spacing: 0.1em; padding: 4px 8px; border-radius: 4px; min-width: 72px; text-align: center; }
.acs .s-safe  { color: var(--safe);    background: var(--safe-dim); }
.acs .s-watch { color: var(--warning); background: var(--warning-dim); }
.acs .s-warn  { color: var(--warning); background: var(--warning-dim); }
.acs .s-crit  { color: var(--danger);  background: var(--danger-dim); }
.acs .blink { animation: acs-blink 1.1s steps(1) infinite; }
@keyframes acs-blink { 50% { opacity: 0.32; } }

.acs .c-safe { color: var(--safe); }   .acs .bg-safe { background: var(--safe); }
.acs .c-warn { color: var(--warning); }.acs .bg-warn { background: var(--warning); }
.acs .c-crit { color: var(--danger); } .acs .bg-crit { background: var(--danger); }
.acs .c-info { color: var(--info); }   .acs .bg-info { background: var(--info); }

.acs .center { gap: 14px; }
.acs .stadium-card { flex: 1; position: relative; padding: 14px 16px 12px; display: flex; flex-direction: column; min-height: 0; }
.acs .stadium-card .card-head { margin-bottom: 4px; }
.acs .map-legend { display: flex; gap: 14px; }
.acs .map-legend span { display: inline-flex; align-items: center; gap: 6px; font-size: 10.5px; color: var(--text-2); letter-spacing: 0.04em; }
.acs .map-legend i { width: 8px; height: 8px; border-radius: 50%; }
.acs .stadium-svg-wrap { flex: 1; display: flex; align-items: center; justify-content: center; min-height: 0; }
.acs .stadium-svg-wrap svg { width: 100%; height: 100%; max-height: 100%; }

.acs .cam-on { fill: var(--safe); filter: drop-shadow(0 0 3px rgba(31,209,123,0.8)); }
.acs .cam-off { fill: var(--danger); filter: drop-shadow(0 0 5px rgba(255,59,71,0.95)); }
.acs .gate-crit-glow { animation: acs-critglow 1.8s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
@keyframes acs-critglow { 0%, 100% { opacity: 0.15; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.35); } }
.acs .flow-arrow { stroke-dasharray: 9 8; animation: acs-dash 0.7s linear infinite; }
@keyframes acs-dash { to { stroke-dashoffset: -34; } }

.acs .crit-alert {
  border: 1px solid rgba(255, 59, 71, 0.42);
  background: linear-gradient(180deg, rgba(255,59,71,0.10), rgba(255,59,71,0.04));
  border-radius: 10px; padding: 15px 17px; animation: acs-critborder 2.4s ease-in-out infinite;
}
@keyframes acs-critborder {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255,59,71,0.0), inset 0 0 22px rgba(255,59,71,0.05); border-color: rgba(255,59,71,0.42); }
  50% { box-shadow: 0 0 22px -2px rgba(255,59,71,0.4), inset 0 0 26px rgba(255,59,71,0.10); border-color: rgba(255,59,71,0.7); }
}
.acs .crit-top { display: flex; align-items: center; gap: 12px; }
.acs .crit-top svg { width: 30px; height: 30px; flex-shrink: 0; }
.acs .crit-title { font-size: 15px; font-weight: 800; letter-spacing: 0.06em; color: #ff8088; }
.acs .crit-desc { font-size: 13px; color: var(--text); margin-top: 9px; line-height: 1.45; }
.acs .crit-desc b { color: var(--safe); }
.acs .crit-row { display: flex; align-items: center; gap: 16px; margin-top: 14px; }
.acs .countdown-box { display: flex; flex-direction: column; }
.acs .countdown-box .label { margin-bottom: 4px; }
.acs .countdown { font-family: var(--mono); font-size: 30px; font-weight: 700; letter-spacing: 0.03em; color: var(--danger); line-height: 1; }
.acs .countdown.warn { color: var(--warning); }
.acs .countdown.done { color: var(--safe); font-size: 22px; }
.acs .agents-needed { font-size: 12px; color: var(--text-2); border-left: 1px solid var(--border); padding-left: 16px; }
.acs .agents-needed b { color: var(--text); font-size: 17px; font-family: var(--mono); display: block; }
.acs .crit-btns { display: flex; gap: 10px; margin-left: auto; }
.acs .btn { font-family: var(--sans); font-size: 12.5px; font-weight: 700; letter-spacing: 0.03em; padding: 11px 15px; border-radius: 7px; cursor: pointer; border: 1px solid transparent; transition: all 0.18s; white-space: nowrap; }
.acs .btn-primary { background: var(--danger); color: #fff; box-shadow: 0 4px 16px -4px rgba(255,59,71,0.6); }
.acs .btn-primary:hover { filter: brightness(1.1); }
.acs .btn-primary.done { background: var(--safe); box-shadow: 0 4px 16px -4px rgba(31,209,123,0.6); cursor: default; }
.acs .btn-ghost { background: rgba(255,255,255,0.05); color: var(--text); border-color: var(--border-bright); }
.acs .btn-ghost:hover { background: rgba(255,255,255,0.1); }
.acs .btn-ghost:active { transform: scale(0.97); }

.acs .feed-card { display: flex; flex-direction: column; min-height: 0; flex: 1.3; }
.acs .feed { display: flex; flex-direction: column; gap: 2px; overflow: hidden; flex: 1; }
.acs .feed-row { display: grid; grid-template-columns: auto 4px 1fr; gap: 11px; align-items: start; padding: 9px 6px; border-radius: 6px; animation: acs-slidein 0.45s ease; }
@keyframes acs-slidein { from { opacity: 0; transform: translateY(-7px); } to { opacity: 1; transform: none; } }
.acs .feed-time { font-family: var(--mono); font-size: 11.5px; color: var(--text-3); padding-top: 1px; }
.acs .feed-stripe { width: 3px; border-radius: 3px; align-self: stretch; }
.acs .feed-txt { font-size: 12.5px; line-height: 1.4; color: var(--text); }
.acs .feed-txt b { font-weight: 700; }
.acs .feed-txt .ftag { font-size: 9.5px; letter-spacing: 0.1em; font-weight: 800; text-transform: uppercase; display: block; margin-bottom: 2px; }

.acs .ai-card { border: 1px solid rgba(59,158,255,0.28); background: linear-gradient(180deg, rgba(59,158,255,0.07), rgba(59,158,255,0.02)); }
.acs .ai-head { display: flex; align-items: center; gap: 9px; margin-bottom: 11px; }
.acs .ai-head svg { width: 17px; height: 17px; }
.acs .ai-head .label { color: var(--info); }
.acs .ai-pred { font-size: 14px; line-height: 1.45; font-weight: 600; }
.acs .ai-pred b { color: var(--warning); }
.acs .conf-row { display: flex; align-items: center; gap: 10px; margin-top: 13px; }
.acs .conf-row .label { color: var(--text-3); }
.acs .conf-bar { flex: 1; height: 6px; border-radius: 4px; background: rgba(255,255,255,0.08); overflow: hidden; }
.acs .conf-bar > i { display: block; height: 100%; width: 87%; background: var(--info); border-radius: 4px; box-shadow: 0 0 8px rgba(59,158,255,0.6); }
.acs .conf-val { font-family: var(--mono); font-weight: 700; font-size: 14px; color: var(--info); }

.acs .social { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
.acs .si { padding: 12px 11px; border-radius: 9px; border: 1px solid var(--border); display: flex; flex-direction: column; gap: 9px; }
.acs .si svg { width: 20px; height: 20px; }
.acs .si .si-name { font-size: 11px; font-weight: 700; line-height: 1.25; }
.acs .si .si-stat { font-size: 10px; color: var(--text-3); letter-spacing: 0.03em; }
.acs .si.green { background: var(--safe-dim); border-color: rgba(31,209,123,0.3); }
.acs .si.blue  { background: var(--info-dim); border-color: rgba(59,158,255,0.3); }
.acs .si.purple{ background: rgba(166,107,255,0.13); border-color: rgba(166,107,255,0.32); }

.acs .agent-row { display: flex; align-items: center; gap: 12px; padding: 8px 2px; }
.acs .agent-row .an { font-size: 12.5px; font-weight: 600; width: 52px; }
.acs .agent-bar { flex: 1; height: 7px; border-radius: 4px; background: rgba(255,255,255,0.07); overflow: hidden; }
.acs .agent-bar > i { display: block; height: 100%; border-radius: 4px; }
.acs .agent-row .av { font-family: var(--mono); font-size: 13px; font-weight: 700; width: 40px; text-align: right; }
.acs .agent-row.warn .av { color: var(--warning); }

.acs footer { display: flex; align-items: center; gap: 18px; padding: 0 22px; font-size: 12px; }
.acs footer .tagline { color: var(--text-2); letter-spacing: 0.03em; font-style: italic; }
.acs .pills { margin-left: auto; display: flex; gap: 10px; }
.acs .pill { display: inline-flex; align-items: center; gap: 7px; padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; border: 1px solid var(--border); letter-spacing: 0.03em; }
.acs .pill i { width: 7px; height: 7px; border-radius: 50%; }
.acs .pill.green { color: var(--safe); border-color: rgba(31,209,123,0.3); }
.acs .pill.green i { background: var(--safe); box-shadow: 0 0 7px var(--safe); }
.acs .pill.orange { color: var(--warning); border-color: rgba(255,159,28,0.32); }
.acs .pill.orange i { background: var(--warning); box-shadow: 0 0 7px var(--warning); }

.acs #acs-toast-wrap { position: fixed; bottom: 26px; right: 26px; display: flex; flex-direction: column; gap: 10px; z-index: 50; }
.acs .toast {
  position: relative; right: auto; bottom: auto; /* override global fixed .toast */
  display: flex; align-items: center; gap: 11px; background: rgba(14, 20, 36, 0.96);
  border: 1px solid rgba(31,209,123,0.45); border-left: 3px solid var(--safe);
  padding: 13px 16px; border-radius: 8px; box-shadow: 0 12px 40px -8px rgba(0,0,0,0.6);
  backdrop-filter: blur(10px); animation: acs-toastin 0.35s cubic-bezier(.2,.9,.3,1.2); min-width: 240px;
}
@keyframes acs-toastin { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: none; } }
.acs .toast.out { animation: acs-toastout 0.35s forwards; }
@keyframes acs-toastout { to { opacity: 0; transform: translateX(30px); } }
.acs .toast svg { width: 20px; height: 20px; flex-shrink: 0; }
.acs .toast-txt b { display: block; font-size: 12.5px; font-weight: 700; }
.acs .toast-txt span { font-size: 11px; color: var(--text-2); }
`;

const CAMERAS = [
  { id: 'CAM-01', loc: 'Entrée G1 — auvent',     res: '4K',    fps: 60, status: 'ACTIVE',  cls: 's-safe',  color: 'var(--safe)' },
  { id: 'CAM-02', loc: 'Tribune NE — niveau 2',   res: '4K',    fps: 60, status: 'ACTIVE',  cls: 's-safe',  color: 'var(--safe)' },
  { id: 'CAM-03', loc: 'Couloir VIP Est',         res: '4K',    fps: 60, status: 'ACTIVE',  cls: 's-safe',  color: 'var(--safe)' },
  { id: 'CAM-04', loc: 'Porte 3 — extérieur',     res: '4K',    fps: 60, status: 'ACTIVE',  cls: 's-safe',  color: 'var(--safe)' },
  { id: 'CAM-05', loc: 'Tribune SE — accès',      res: '1080p', fps: 30, status: 'OFFLINE', cls: 's-crit',  color: 'var(--danger)', blink: true },
  { id: 'CAM-06', loc: 'Aire familles',           res: '4K',    fps: 60, status: 'ACTIVE',  cls: 's-safe',  color: 'var(--safe)' },
  { id: 'CAM-07', loc: 'Sortie urgence Sud',      res: '1080p', fps: 30, status: 'OFFLINE', cls: 's-crit',  color: 'var(--danger)', blink: true },
  { id: 'CAM-08', loc: 'Tribune Ouest — haute',   res: '4K',    fps: 60, status: 'ACTIVE',  cls: 's-safe',  color: 'var(--safe)' },
];

export default function Dashboard() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const $ = (sel) => root.querySelector(sel);
    const intervals = [];
    const setIv = (fn, ms) => { const id = setInterval(fn, ms); intervals.push(id); return id; };

    /* ---- clock (only if the design header is active; the shared NavBar
            already shows a clock so this is optional) ---- */
    const clockEl = $('#acs-clock');
    if (clockEl) {
      const tickClock = () => {
        const d = new Date();
        const p = (n) => String(n).padStart(2, '0');
        clockEl.innerHTML = p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds()) +
          ' <span class="ms">GMT+1</span>';
      };
      tickClock();
      setIv(tickClock, 1000);
    }

    /* ---- camera feed list ---- */
    $('#acs-zoneList').innerHTML = CAMERAS.map((c) => `
      <div class="zone">
        <span class="zdot ${c.blink ? 'blink' : ''}" style="background:${c.color}; box-shadow:0 0 8px ${c.color};"></span>
        <span class="zname">${c.id}<small>${c.loc}</small></span>
        <span class="zpct" style="color:var(--text-3)">${c.res} · ${c.fps}fps</span>
        <span class="zbadge ${c.cls} ${c.blink ? 'blink' : ''}">${c.status}</span>
      </div>`).join('');

    /* ---- stadium map is now the self-contained <StadiumMap /> component ---- */

    /* ---- alert feed ---- */
    const COLORS = { danger: 'var(--danger)', warning: 'var(--warning)', safe: 'var(--safe)', info: 'var(--info)' };
    const TAGCOLOR = { danger: 'c-crit', warning: 'c-warn', safe: 'c-safe', info: 'c-info' };
    const feedEl = $('#acs-feed');
    feedEl.innerHTML = ''; // idempotent — avoid double-seeding under StrictMode re-mount
    const nowStamp = () => {
      const d = new Date();
      const p = (n) => String(n).padStart(2, '0');
      return p(d.getHours()) + ':' + p(d.getMinutes());
    };
    const addAlert = ({ time, tag, txt, cls }) => {
      const row = document.createElement('div');
      row.className = 'feed-row';
      row.innerHTML = `
        <span class="feed-time">${time || nowStamp()}</span>
        <span class="feed-stripe" style="background:${COLORS[cls]}; box-shadow:0 0 8px ${COLORS[cls]}33;"></span>
        <span class="feed-txt"><span class="ftag ${TAGCOLOR[cls]}">${tag}</span>${txt}</span>`;
      feedEl.prepend(row);
      while (feedEl.children.length > 3) feedEl.removeChild(feedEl.lastChild);
    };
    [
      { time: '21:15', tag: 'NORMAL',   txt: 'Crowd flow normalized at <b>Porte 1 Nord</b>', cls: 'safe' },
      { time: '21:28', tag: 'RISING',   txt: 'Density rising at <b>Porte 6 Nord-Ouest</b> — monitoring', cls: 'warning' },
      { time: '21:34', tag: 'CRITICAL', txt: 'Abnormal compression at <b>Porte 3 Est</b> — intervention advised', cls: 'danger' },
    ].forEach(addAlert);
    const STREAM = [
      { tag: 'SENSOR', txt: 'Thermal density scan refreshed across east concourse', cls: 'info' },
      { tag: 'RISING', txt: '<b>Porte 4 Sud</b> ingress rate up 9% — AI watching', cls: 'warning' },
      { tag: 'NORMAL', txt: 'Flow velocity stabilized at <b>Porte 2 Nord-Est</b>', cls: 'safe' },
      { tag: 'PATROL', txt: 'Anti-harassment unit repositioned to south stand', cls: 'info' },
      { tag: 'CAMERA', txt: 'CCTV-34 offline — backup feed engaged', cls: 'warning' },
      { tag: 'NORMAL', txt: 'PMR route 7 confirmed clear and accessible', cls: 'safe' },
      { tag: 'SENSOR', txt: 'Acoustic sentiment stable — no aggression markers', cls: 'info' },
    ];
    let si = 0;
    setIv(() => { addAlert(STREAM[si % STREAM.length]); si++; }, 8000);

    /* ---- global risk ---- */
    (function () {
      const valEl = $('#acs-riskVal');
      const ringEl = $('#acs-riskRing');
      const deltaEl = $('#acs-riskDelta');
      const CIRC = 351.86;
      let risk = 67;
      const render = () => {
        valEl.innerHTML = Math.round(risk) + '<span style="font-size:18px;">%</span>';
        ringEl.setAttribute('stroke-dashoffset', CIRC * (1 - risk / 100));
        const c = risk >= 70 ? 'var(--danger)' : risk >= 50 ? 'var(--warning)' : 'var(--safe)';
        ringEl.setAttribute('stroke', c);
        valEl.style.color = c;
      };
      render();
      setIv(() => {
        risk += (Math.random() * 4 - 2);
        risk = Math.max(58, Math.min(78, risk));
        render();
        const up = Math.random() > 0.42;
        const amt = (Math.random() * 4 + 1).toFixed(0);
        deltaEl.innerHTML = (up ? '▲ +' : '▼ −') + amt + '% · last 10 min';
        deltaEl.style.color = up ? 'var(--warning)' : 'var(--safe)';
        deltaEl.style.background = up ? 'var(--warning-dim)' : 'var(--safe-dim)';
      }, 3000);

      const supEl = $('#acs-supporters');
      let sup = 68420;
      setIv(() => {
        sup += Math.floor(Math.random() * 12);
        supEl.textContent = sup.toLocaleString('en-US');
      }, 3500);
    })();

    /* ---- countdown ---- */
    (function () {
      const el = $('#acs-countdown');
      let secs = 7 * 60;
      const fmt = (s) => { const m = Math.floor(s / 60); return String(m).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
      const iv = setIv(() => {
        secs--;
        if (secs <= 0) {
          el.textContent = 'PREVENTED ✓';
          el.className = 'countdown done';
          clearInterval(iv);
          addAlert({ tag: 'RESOLVED', txt: '<b>Porte 3 Est</b> compression cleared — redirect successful', cls: 'safe' });
          return;
        }
        el.textContent = fmt(secs);
        el.className = 'countdown' + (secs < 240 ? ' warn' : '');
      }, 1000);
    })();

    /* ---- toast ---- */
    const toast = (title, sub) => {
      const wrap = $('#acs-toast-wrap');
      const t = document.createElement('div');
      t.className = 'toast';
      t.innerHTML = `
        <svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="#1FD17B" stroke-width="1.6"/><path d="M6 10 l2.6 2.6 L14 7" stroke="#1FD17B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <div class="toast-txt"><b>${title}</b><span>${sub}</span></div>`;
      wrap.appendChild(t);
      setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 350); }, 3800);
    };

    /* ---- buttons ---- */
    const deploy = $('#acs-deployBtn');
    const redirect = $('#acs-redirectBtn');
    const onDeploy = () => {
      if (deploy.classList.contains('done')) return;
      deploy.classList.add('done');
      deploy.textContent = '✓ Deployed';
      $('#acs-agentsNeeded').textContent = '0';
      addAlert({ tag: 'DEPLOYED', txt: '<b>12 agents</b> dispatched to Porte 3 Est', cls: 'safe' });
    };
    const onRedirect = () => {
      toast('Crowd Flow Redirected', 'SMS sent to 12 field agents · Porte 3 → Porte 5');
      addAlert({ tag: 'REDIRECT', txt: 'Supporters rerouted <b>Porte 3 → Porte 5</b>', cls: 'info' });
    };
    deploy.addEventListener('click', onDeploy);
    redirect.addEventListener('click', onRedirect);

    return () => {
      intervals.forEach(clearInterval);
      deploy.removeEventListener('click', onDeploy);
      redirect.removeEventListener('click', onRedirect);
    };
  }, []);

  return (
    <div className="acs" ref={rootRef}>
      <style>{CSS}</style>
      <div id="acs-stage">
        <div id="acs-canvas">

          {/* ============================================================
              ANCIEN HEADER DU DESIGN — commenté.
              On utilise désormais la NavBar partagée (comme les autres
              pages) qui porte le logo, les onglets de navigation, l'horloge
              et l'avatar. Conservé ici pour référence.
          ============================================================
          <header className="glass">
            <div className="brand">
              <svg viewBox="0 0 44 52" fill="none" aria-hidden="true">
                <path d="M22 2 L40 9 V25 C40 38 32 46 22 50 C12 46 4 38 4 25 V9 Z" fill="rgba(59,158,255,0.10)" stroke="#3B9EFF" strokeWidth="2" strokeLinejoin="round" />
                <path d="M22 13 L31 17 V26 C31 33 27 38 22 40 C17 38 13 33 13 26 V17 Z" fill="none" stroke="#1FD17B" strokeWidth="1.7" strokeLinejoin="round" />
                <path d="M18 26 l3 3 6-7" stroke="#1FD17B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
              <div className="brand-text">
                <h1>ATLAS CROWD SHIELD</h1>
                <p>Predictive Security Platform — Stade Moulay Abdellah, Rabat</p>
              </div>
            </div>
            <div className="header-right">
              <div className="live-badge"><span className="live-dot"></span> LIVE</div>
              <div className="header-sep"></div>
              <div className="match">
                <div className="score">Morocco <b>1</b> – 0 Senegal · <span className="c-warn">67'</span></div>
                <div className="meta">AFCON 2025 · Quarter-Final · Capacity 68,700</div>
              </div>
              <div className="header-sep"></div>
              <div className="clock" id="acs-clock">--:--:--</div>
            </div>
          </header>
          ============================================================ */}

          {/* Bandeau contextuel (sans match ni badge LIVE) */}
          <div className="glass match-strip">
            <div className="match-info">
              <div className="meta">AFCON 2025 · Stade Moulay Abdellah, Rabat · Capacité 68 700</div>
            </div>
          </div>

          {/* MAIN */}
          <main>
            {/* LEFT */}
            <section className="col">
              <div className="glass card risk-card">
                <div className="ring-wrap">
                  <svg width="132" height="132" viewBox="0 0 132 132">
                    <circle cx="66" cy="66" r="56" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="11" />
                    <circle id="acs-riskRing" cx="66" cy="66" r="56" fill="none" stroke="var(--warning)" strokeWidth="11" strokeLinecap="round" strokeDasharray="351.86" strokeDashoffset="116" />
                  </svg>
                  <div className="ring-center">
                    <div className="val" id="acs-riskVal">67<span style={{ fontSize: 18 }}>%</span></div>
                    <div className="cap">Global Risk</div>
                  </div>
                </div>
                <div className="risk-meta">
                  <div className="label">Threat Index</div>
                  <div className="delta" id="acs-riskDelta">▲ +4% · last 10 min</div>
                  <div className="risk-sub">Composite of crowd density, flow velocity &amp; sentiment signals across 6 sectors.</div>
                </div>
              </div>

              <div className="glass card">
                <div className="vitals">
                  <div className="vital">
                    <div className="label">Supporters Inside</div>
                    <div className="big" id="acs-supporters">68,420</div>
                  </div>
                  <div className="vital">
                    <div className="label">Incidents Prevented</div>
                    <div className="big green">3 <span className="checkmark">✓</span></div>
                  </div>
                  <div className="vital" style={{ gridColumn: '1 / -1' }}>
                    <div className="label">Agents Deployed</div>
                    <div className="big">1,847 <span className="unit">/ 4,000</span></div>
                    <div className="bar"><i style={{ width: '46%' }}></i></div>
                  </div>
                </div>
              </div>

              <div className="glass card" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <div className="card-head">
                  <span className="label">Camera Feeds · 8 Caméras</span>
                  <span className="label" style={{ color: 'var(--text-3)' }}>Live</span>
                </div>
                <div className="zone-list" id="acs-zoneList"></div>
              </div>
            </section>

            {/* CENTER */}
            <section className="col center">
              <div className="glass stadium-card">
                <div className="card-head">
                  <span className="label">Live Tactical Map · Top-Down</span>
                  <div className="map-legend">
                    <span><i style={{ background: 'var(--safe)' }}></i>Safe</span>
                    <span><i style={{ background: 'var(--warning)' }}></i>Warning</span>
                    <span><i style={{ background: 'var(--danger)' }}></i>Critical</span>
                    <span><i style={{ background: 'var(--safe)' }}></i>Camera</span>
                  </div>
                </div>
                <div className="stadium-svg-wrap">
                  <StadiumMap />
                </div>
              </div>

              <div className="crit-alert">
                <div className="crit-top">
                  <svg viewBox="0 0 30 30" fill="none">
                    <path d="M15 3 L28 26 H2 Z" fill="rgba(255,59,71,0.16)" stroke="#FF3B47" strokeWidth="2" strokeLinejoin="round" />
                    <line x1="15" y1="11" x2="15" y2="18" stroke="#FF3B47" strokeWidth="2.4" strokeLinecap="round" />
                    <circle cx="15" cy="22" r="1.5" fill="#FF3B47" />
                  </svg>
                  <div>
                    <div className="crit-title">CRITICAL ALERT — PORTE 3 EST</div>
                  </div>
                </div>
                <div className="crit-desc">Abnormal crowd compression detected at turnstile cluster. Recommended action: <b>redirect supporters to Porte 5 Ouest</b> via north concourse.</div>
                <div className="crit-row">
                  <div className="countdown-box">
                    <span className="label">Time to Incident</span>
                    <div className="countdown" id="acs-countdown">07:00</div>
                  </div>
                  <div className="agents-needed">Agents Needed<b id="acs-agentsNeeded">12</b></div>
                  <div className="crit-btns">
                    <button className="btn btn-primary" id="acs-deployBtn">Deploy Reinforcements</button>
                    <button className="btn btn-ghost" id="acs-redirectBtn">Redirect Crowd Flow</button>
                  </div>
                </div>
              </div>
            </section>

            {/* RIGHT */}
            <section className="col">
              <div className="glass card feed-card">
                <div className="card-head">
                  <span className="label">Alert Feed</span>
                  <span className="label" style={{ color: 'var(--text-3)' }}>Auto-stream</span>
                </div>
                <div className="feed" id="acs-feed"></div>
              </div>

              <div className="glass card ai-card">
                <div className="ai-head">
                  <svg viewBox="0 0 18 18" fill="none">
                    <path d="M9 1 L9 4 M9 14 L9 17 M1 9 L4 9 M14 9 L17 9" stroke="#3B9EFF" strokeWidth="1.6" strokeLinecap="round" />
                    <rect x="4.5" y="4.5" width="9" height="9" rx="2.2" fill="rgba(59,158,255,0.18)" stroke="#3B9EFF" strokeWidth="1.6" />
                    <circle cx="9" cy="9" r="1.6" fill="#3B9EFF" />
                  </svg>
                  <span className="label">AI Prediction Engine</span>
                </div>
                <div className="ai-pred"><b>Porte 4 Sud</b> projected to reach <b>75%</b> risk within <b>10 minutes</b> at current ingress rate.</div>
                <div className="conf-row">
                  <span className="label">Confidence</span>
                  <div className="conf-bar"><i></i></div>
                  <span className="conf-val">87%</span>
                </div>
              </div>

              <div className="glass card">
                <div className="card-head"><span className="label">Social Impact · Active</span></div>
                <div className="social">
                  <div className="si green">
                    <svg viewBox="0 0 20 20" fill="none"><circle cx="7" cy="6" r="2.6" stroke="#1FD17B" strokeWidth="1.5" /><circle cx="14" cy="7" r="2.1" stroke="#1FD17B" strokeWidth="1.5" /><path d="M3 17c0-3 2-4.5 4-4.5s4 1.5 4 4.5M11.5 17c0-2.4 1.6-3.8 3.2-3.8s3.3 1.4 3.3 3.8" stroke="#1FD17B" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    <div><div className="si-name">Family Zones</div><div className="si-stat">8 zones · clear</div></div>
                  </div>
                  <div className="si blue">
                    <svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="3.4" stroke="#3B9EFF" strokeWidth="1.5" /><circle cx="10" cy="10" r="7.5" stroke="#3B9EFF" strokeWidth="1.5" strokeDasharray="3 3" /></svg>
                    <div><div className="si-name">PMR Routes</div><div className="si-stat">14 routes open</div></div>
                  </div>
                  <div className="si purple">
                    <svg viewBox="0 0 20 20" fill="none"><path d="M10 2 L17 5 V11 C17 15 14 17.5 10 18.5 C6 17.5 3 15 3 11 V5 Z" stroke="#A66BFF" strokeWidth="1.5" strokeLinejoin="round" /></svg>
                    <div><div className="si-name">Anti-Harassment</div><div className="si-stat">Patrol active</div></div>
                  </div>
                </div>
              </div>

              <div className="glass card">
                <div className="card-head"><span className="label">Field Agents · By Sector</span></div>
                <div className="agent-row">
                  <span className="an">Nord</span>
                  <div className="agent-bar"><i className="bg-safe" style={{ width: '86%', boxShadow: '0 0 8px rgba(31,209,123,0.6)' }}></i></div>
                  <span className="av">342</span>
                </div>
                <div className="agent-row warn">
                  <span className="an">Est</span>
                  <div className="agent-bar"><i className="bg-warn" style={{ width: '22%', boxShadow: '0 0 8px rgba(255,159,28,0.6)' }}></i></div>
                  <span className="av">89</span>
                </div>
                <div className="agent-row">
                  <span className="an">Sud</span>
                  <div className="agent-bar"><i className="bg-safe" style={{ width: '70%', boxShadow: '0 0 8px rgba(31,209,123,0.6)' }}></i></div>
                  <span className="av">280</span>
                </div>
                <div className="agent-row">
                  <span className="an">Ouest</span>
                  <div className="agent-bar"><i className="bg-info" style={{ width: '64%', boxShadow: '0 0 8px rgba(59,158,255,0.6)' }}></i></div>
                  <span className="av">256</span>
                </div>
              </div>
            </section>
          </main>

          {/* FOOTER */}
          <footer className="glass">
            <span className="tagline">"Securing the future of Moroccan football."</span>
            <div className="pills">
              <span className="pill green"><i></i>AI Active</span>
              <span className="pill green"><i></i>WebSocket Connected</span>
              <span className="pill orange"><i></i>Cameras 47/48</span>
            </div>
          </footer>
        </div>
      </div>

      <div id="acs-toast-wrap"></div>
    </div>
  );
}
