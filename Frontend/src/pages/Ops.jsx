// Security Ops page — alert hero, radial KPI, stadium iso, live chart,
// zone cards, event log, stats bar.
import React, { useState, useEffect } from 'react';
import { Icon } from '../lib/icons.jsx';
import { Badge } from '../components/Badge.jsx';
import { Button } from '../components/Button.jsx';
import RadialKPI from '../components/RadialKPI.jsx';
import StadiumIso from '../components/StadiumIso.jsx';
import AreaChart from '../components/AreaChart.jsx';
import ZoneCard from '../components/ZoneCard.jsx';
import EventLog from '../components/EventLog.jsx';
import StatsBar from '../components/StatsBar.jsx';
import { GATES, SEED_EVENTS, deriveZoneRisks, statusFromRisk } from '../lib/data.js';
import { fetchLiveState, fetchEvents, broadcastAlert } from '../lib/api.js';

const COUNTDOWN_TOTAL = 420;

function useCountdown(active) {
  const [r, setR] = useState(COUNTDOWN_TOTAL);
  useEffect(() => {
    if (!active) { setR(COUNTDOWN_TOTAL); return; }
    setR(COUNTDOWN_TOTAL);
    const id = setInterval(() => setR((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [active]);
  const m = Math.floor(r / 60), s = r % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function Ops() {
  const [liveState, setLiveState] = useState(null);
  const [events, setEvents] = useState(SEED_EVENTS);

  useEffect(() => {
    fetchLiveState().then(setLiveState).catch(() => {});
    const id = setInterval(() => {
      fetchLiveState().then(setLiveState).catch(() => {});
    }, 2000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      fetchEvents().then(setEvents).catch(() => {});
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const alertOn = liveState?.alert?.active ?? true;
  const risk = liveState?.global_risk ?? 67;
  const countdown = useCountdown(alertOn);
  const zoneRisks = liveState?.zoneRisks ?? deriveZoneRisks(risk);
  const activeAlertIdx = alertOn ? 2 : null;

  const s = liveState?.stats;
  const stats = [
    { label: 'TOTAL SUPPORTERS', fr: 'Spectateurs',     value: s ? s.supporters_inside?.toLocaleString() : '67,842', delta: '▲ 2.1k', deltaColor: 'var(--green)',
      note: `${s ? Math.round((s.supporters_inside / 87000) * 100) : 78}% of 87,000 capacity`, icon: <Icon.Users size={14} /> },
    { label: 'AGENTS DEPLOYED',  fr: 'Agents déployés', value: s ? String(s.agents_deployed) : '184',    delta: '+12 to G3', deltaColor: 'var(--orange)',
      note: '12 crews · 4 mobile units', icon: <Icon.Shield size={14} /> },
    { label: 'INCIDENTS PREVENTED', fr: 'Incidents évités', value: s ? String(s.incidents_prevented) : '23', delta: 'today',
      note: '6 critical · 17 elevated', icon: <Icon.ShieldCheck size={14} /> },
    { label: 'CAMERAS ONLINE',   fr: 'Caméras actives', value: s ? `${s.cameras_active}/${s.cameras_total}` : '412/418', delta: s ? `${Math.round((s.cameras_active / s.cameras_total) * 100)}%` : '98.6%',
      note: `${s ? s.cameras_total - s.cameras_active : 6} offline · auto-failover ok`, icon: <Icon.Camera size={14} /> },
  ];

  const onAlertToggle = async () => {
    if (alertOn) {
      await broadcastAlert({ zone_id: 'gate_5', message: 'All clear — alert dismissed' });
      fetchLiveState().then(setLiveState);
    } else {
      await broadcastAlert({ zone_id: 'gate_3', message: 'Compression détectée — Rediriger vers Porte 5' });
      fetchLiveState().then(setLiveState);
    }
  };

  return (
    <main style={{
      position: 'relative', zIndex: 1,
      maxWidth: 1480, margin: '0 auto',
      padding: '24px 28px 40px', display: 'grid', gap: 18,
    }}>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>SECURITY OPS · OPÉRATIONS DE SÉCURITÉ</div>
          <h1 style={{
            margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15,
            background: 'linear-gradient(180deg, var(--fg-0), color-mix(in oklab, var(--fg-0) 75%, transparent))',
            WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Atlas Stadium · Match J24 — Live</h1>
          <div className="fr" style={{ marginTop: 2 }}>
            Stade Atlas · Journée 24 — Direction des opérations · Quart 18 h 00 — 02 h 00
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{
            padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border-strong)',
            background: 'var(--bg-2)', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <Icon.Clock size={14} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-1)' }}>
              <span style={{ color: 'var(--fg-3)' }}>OPS LEAD</span> &nbsp; M. Rousseau
            </div>
          </div>
          <Button onClick={onAlertToggle}>
            <Icon.Radio size={14} /> {alertOn ? 'Dismiss alert' : 'Trigger alert (demo)'}
          </Button>
        </div>
      </div>

      {/* HERO ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.05fr 1fr', gap: 18 }}>
        {alertOn ? <AlertHero countdownStr={countdown} /> : <AllClearHero />}
        <GlobalRiskCard risk={risk} />
      </div>

      {/* MID ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <StadiumCard sectionRisks={zoneRisks} activeAlertIdx={activeAlertIdx} />
        <RiskTimelineCard risk={risk} />
      </div>

      {/* ZONES + EVENT LOG row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {GATES.map((g, i) => (
            <ZoneCard
              key={g.code}
              idx={i} name={g.name} fr={g.fr}
              capacity={g.cap} occupancy={g.occ}
              risk={zoneRisks[i]} status={statusFromRisk(zoneRisks[i])}
              trend={zoneRisks[i] > 60 ? 'up' : zoneRisks[i] < 40 ? 'down' : 'flat'}
            />
          ))}
        </div>
        <EventLog initial={events} />
      </div>

      {/* STATS BAR */}
      <StatsBar stats={stats} />

      <footer style={{
        marginTop: 8, display: 'flex', justifyContent: 'space-between',
        fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--fg-3)', letterSpacing: '0.06em',
      }}>
        <span>ATLAS CROWD SHIELD · OPERATIONS CONSOLE</span>
        <span>MODEL ACS-7 · INFERENCE 18 ms · CI ±3.2 pts</span>
        <span>SOC-2 TYPE II · ISO 27001</span>
      </footer>
    </main>
  );
}

// ---------------- Sub-components used only by Ops ----------------

function Tag({ label, value }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 2,
      padding: '6px 12px', borderRadius: 8,
      background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
    }}>
      <span className="eyebrow" style={{ fontSize: 9.5 }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-0)', fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function AlertHero({ countdownStr }) {
  return (
    <div className="card card-pad" style={{
      padding: '28px 30px', borderRadius: 24, overflow: 'hidden',
      background:
        'radial-gradient(900px 500px at 90% -50%, rgba(244,63,94,0.35), transparent 60%),' +
        'linear-gradient(140deg, color-mix(in oklab, var(--red-deep) 38%, var(--bg-elev)), var(--bg-elev) 70%)',
      border: '1px solid color-mix(in oklab, var(--red) 35%, var(--border-strong))',
      position: 'relative',
    }}>
      <span style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'repeating-linear-gradient(135deg, rgba(244,63,94,0.06) 0 10px, transparent 10px 24px)',
      }} />
      <span style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
        background: 'linear-gradient(180deg, var(--red-2), var(--red))',
        boxShadow: '0 0 24px var(--red)',
      }} />
      <span className="scan-line" />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, position: 'relative' }}>
        <Badge variant="crit" dot pulse>CRITICAL ALERT</Badge>
        <span className="eyebrow" style={{ color: 'var(--fg-2)' }}>ALERTE CRITIQUE · INC-2241-03</span>
        <div style={{ flex: 1 }} />
        <span className="eyebrow" style={{ color: 'var(--fg-2)' }}>DETECTED 22:41:08</span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', position: 'relative' }}>
        <div style={{ flex: '1 1 320px', minWidth: 0 }}>
          <div style={{
            fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15,
            color: 'var(--fg-0)', textWrap: 'pretty',
          }}>Gate 3 East — Crowd compression detected</div>
          <div className="fr" style={{ marginTop: 4, fontSize: 13.5, color: 'var(--fg-1)' }}>
            Porte 3 Est — Compression de foule détectée
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
            <Tag label="CONFIDENCE" value="94%" />
            <Tag label="VECTOR" value="Inbound surge" />
            <Tag label="CAMERAS" value="CCTV-114, 117, 119" />
          </div>
        </div>
        <div style={{
          padding: '12px 18px', borderRadius: 14,
          border: '1px dashed color-mix(in oklab, var(--red) 50%, transparent)',
          background: 'rgba(244,63,94,0.06)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        }}>
          <div className="eyebrow red">AUTO-DISPATCH IN</div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 36, fontWeight: 700,
            color: 'var(--red-2)', lineHeight: 1, fontVariantNumeric: 'tabular-nums',
            textShadow: '0 0 24px rgba(244,63,94,0.5)',
          }}>{countdownStr}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-2)', letterSpacing: '0.08em' }}>
            Density 4.8 ppl/m² ▲
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: '0 0 168px' }}>
          <Button variant="danger" style={{ width: '100%', padding: '12px 14px', fontSize: 12.5 }}>
            <Icon.Dispatch size={14} /> DISPATCH NOW
          </Button>
          <Button style={{ width: '100%', padding: '10px 14px', fontSize: 12.5 }}>
            <Icon.Check size={14} /> Acknowledge
          </Button>
        </div>
      </div>
    </div>
  );
}

function AllClearHero() {
  return (
    <div className="card card-pad" style={{
      padding: '28px 30px', borderRadius: 24,
      background: 'linear-gradient(140deg, color-mix(in oklab, var(--green) 18%, var(--bg-elev)), var(--bg-elev) 70%)',
      borderColor: 'color-mix(in oklab, var(--green) 25%, var(--border-strong))',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: 'color-mix(in oklab, var(--green) 20%, transparent)',
          display: 'grid', placeItems: 'center', color: 'var(--green-2)',
        }}><Icon.ShieldCheck size={20} /></div>
        <div>
          <Badge variant="ok" dot>ALL CLEAR</Badge>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>No active critical alerts</div>
          <div className="fr">Aucune alerte critique active · Surveillance nominale</div>
        </div>
      </div>
    </div>
  );
}

function GlobalRiskCard({ risk }) {
  return (
    <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="eyebrow">GLOBAL RISK SCORE</div>
          <div className="fr" style={{ marginTop: 2 }}>Score de risque global</div>
        </div>
        <Badge variant="crit" dot>▲ +12 pts / 5 min</Badge>
      </div>
      <div style={{ display: 'grid', placeItems: 'center', marginTop: 4 }}>
        <RadialKPI value={risk} size={220} threshold={75} />
      </div>
      <div>
        <div style={{
          position: 'relative', height: 10, borderRadius: 99,
          background: 'var(--bg-3)', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(90deg, var(--green) 0%, var(--orange) 55%, var(--red) 100%)',
            opacity: 0.18,
          }} />
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${risk}%`,
            background: 'linear-gradient(90deg, var(--green-2) 0%, var(--orange-2) 55%, var(--red-2) 100%)',
            borderRadius: 99, boxShadow: '0 0 12px var(--red-2)',
            transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
          }} />
          <div style={{
            position: 'absolute', left: '75%', top: -2, bottom: -2, width: 2,
            background: 'var(--fg-0)', opacity: 0.6,
          }} />
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', marginTop: 6,
          fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)',
        }}>
          <span>0</span><span>50</span><span style={{ color: 'var(--red-2)' }}>75 ▲</span><span>100</span>
        </div>
      </div>
    </div>
  );
}

function StadiumCard({ sectionRisks, activeAlertIdx }) {
  return (
    <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="eyebrow">STADIUM HEAT MAP · 6 SECTORS</div>
          <div className="fr" style={{ marginTop: 2 }}>Carte thermique du stade · 6 secteurs</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Badge variant="ok">{sectionRisks.filter((r) => r < 55).length} OK</Badge>
          <Badge variant="warn">{sectionRisks.filter((r) => r >= 55 && r < 75).length} WARN</Badge>
          <Badge variant="crit">{sectionRisks.filter((r) => r >= 75).length} CRIT</Badge>
        </div>
      </div>
      <StadiumIso sections={sectionRisks} activeAlertIdx={activeAlertIdx} width={560} height={300} />
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--fg-3)',
      }}>
        <span>VIEW · isometric</span>
        <span>67,842 supporters · 3.2k density pts/s</span>
        <span>UPDATED 0.4s ago</span>
      </div>
    </div>
  );
}

function RiskTimelineCard({ risk }) {
  return (
    <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="eyebrow accent">RISK TRAJECTORY · LAST 90 SECONDS</div>
          <div className="fr" style={{ marginTop: 2 }}>Trajectoire du risque · 90 dernières secondes</div>
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <LegendDot color="var(--accent-2)" label="risk score" />
          <LegendDot color="var(--red-2)" label="threshold 75" dashed />
        </div>
      </div>
      <AreaChart width={700} height={220} threshold={75} current={risk} />
    </div>
  );
}

function LegendDot({ color, label, dashed }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--fg-2)',
      letterSpacing: '0.06em', textTransform: 'uppercase',
    }}>
      {dashed
        ? <span style={{ width: 18, borderTop: `2px dashed ${color}` }} />
        : <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />}
      {label}
    </div>
  );
}
