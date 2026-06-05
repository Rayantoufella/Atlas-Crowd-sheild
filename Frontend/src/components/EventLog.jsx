// EventLog — live-ish feed of incidents (rolls new events in periodically).
import React, { useState, useEffect } from 'react';
import { Icon } from '../lib/icons.jsx';

const SAMPLE_NEW_EVENTS = [
  ['WARN', 'G4', 'Queue depth +12% in 30s'],
  ['OK',   'G1', 'Crew rotation complete'],
  ['WARN', 'G2', 'Bottleneck risk rising'],
  ['OK',   '—',  'CCTV-117 reconnected'],
  ['CRIT', 'G3', 'Density spike at 5.1 ppl/m²'],
  ['OK',   'G6', 'Flow nominal · 420 ppm'],
  ['WARN', 'G3', 'Surge vector confirmed'],
];

function now() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export default function EventLog({ initial = [] }) {
  const [events, setEvents] = useState(initial);

  useEffect(() => {
    const tick = () => {
      const sample = SAMPLE_NEW_EVENTS[Math.floor(Math.random() * SAMPLE_NEW_EVENTS.length)];
      setEvents((prev) => [
        { time: now(), level: sample[0], zone: sample[1], message: sample[2] },
        ...prev,
      ].slice(0, 20));
    };
    const id = setInterval(tick, 8000);
    return () => clearInterval(id);
  }, []);

  const colorFor = (lvl) =>
    lvl === 'CRIT' ? 'var(--red-2)' : lvl === 'WARN' ? 'var(--orange-2)' : 'var(--green-2)';

  return (
    <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <div className="eyebrow">EVENT LOG · {events.length} entries</div>
          <div className="fr" style={{ marginTop: 2 }}>Journal d'incidents — temps réel</div>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-2)', letterSpacing: '0.08em',
        }}>
          <Icon.Activity size={12} /> LIVE STREAM
        </span>
      </div>

      <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {events.map((e, i) => (
          <div key={`${e.time}-${i}`} style={{
            display: 'grid', gridTemplateColumns: '64px 56px 36px 1fr', gap: 10,
            alignItems: 'center', padding: '8px 0',
            borderBottom: i < events.length - 1 ? '1px dashed var(--border)' : 'none',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>{e.time}</span>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
              color: colorFor(e.level), letterSpacing: '0.1em',
              padding: '2px 6px', borderRadius: 4,
              background: `color-mix(in oklab, ${colorFor(e.level)} 12%, transparent)`,
              textAlign: 'center',
            }}>{e.level}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-1)', textAlign: 'center' }}>
              {e.zone}
            </span>
            <span style={{ fontSize: 12.5, color: 'var(--fg-1)' }}>{e.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
