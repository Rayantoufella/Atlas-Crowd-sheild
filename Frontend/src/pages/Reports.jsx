// Reports page — mobile supporter view, max 480px centered.
// Match header, alert banner with countdown, gate status cycling,
// mini stadium, alerts feed, practical info, footer.
import React, { useState, useEffect } from 'react';
import { Icon } from '../lib/icons.jsx';
import { Badge } from '../components/Badge.jsx';
import StadiumMini from '../components/StadiumMini.jsx';
import { GATES, fmtTeam, deriveZoneRisks } from '../lib/data.js';

const USER_GATE_IDX = 4; // supporter has ticket for Gate 5 South

const ALERTS_INITIAL = [
  { time: '22:41', zone: 'G3', level: 'CRIT', msg: 'Compression détectée — évitez Porte 3' },
  { time: '22:35', zone: 'G2', level: 'WARN', msg: 'Densité en hausse — préférez Porte 5' },
  { time: '22:21', zone: 'G3', level: 'WARN', msg: 'Flux supérieur à la normale' },
  { time: '22:08', zone: '—',  level: 'INFO', msg: 'Mi-temps dans 12 minutes' },
];

const GATE_CYCLE = [
  { state: 'SAFE',     label: 'SÉCURISÉ',  color: 'var(--green-2)',  bg: 'color-mix(in oklab, var(--green) 22%, var(--bg-elev))',  border: 'color-mix(in oklab, var(--green) 50%, var(--border-strong))' },
  { state: 'WARNING',  label: 'ATTENTION', color: 'var(--orange-2)', bg: 'color-mix(in oklab, var(--orange) 22%, var(--bg-elev))', border: 'color-mix(in oklab, var(--orange) 50%, var(--border-strong))' },
  { state: 'CRITICAL', label: 'CRITIQUE',  color: 'var(--red-2)',    bg: 'color-mix(in oklab, var(--red) 22%, var(--bg-elev))',    border: 'color-mix(in oklab, var(--red) 50%, var(--border-strong))' },
];

function useCycle(period = 8000) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % GATE_CYCLE.length), period);
    return () => clearInterval(id);
  }, [period]);
  return GATE_CYCLE[i];
}

function useMatchClock() {
  const [minute, setMinute] = useState(67);
  useEffect(() => {
    const id = setInterval(() => setMinute((m) => (m < 90 ? m + 1 : m)), 60000);
    return () => clearInterval(id);
  }, []);
  return minute;
}

function useCountdown(total = 180) {
  const [r, setR] = useState(total);
  useEffect(() => {
    const id = setInterval(() => setR((v) => (v > 0 ? v - 1 : total)), 1000);
    return () => clearInterval(id);
  }, [total]);
  const m = Math.floor(r / 60), s = r % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function Reports() {
  const gateState = useCycle(8000);
  const minute = useMatchClock();
  const countdown = useCountdown(180);
  const zoneRisks = deriveZoneRisks(72);
  const userGate = GATES[USER_GATE_IDX];

  return (
    <main style={{
      position: 'relative', zIndex: 1,
      maxWidth: 480, margin: '0 auto', padding: '20px 16px 40px',
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      {/* Page eyebrow */}
      <div style={{ textAlign: 'center' }}>
        <div className="eyebrow accent">SUPPORTER VIEW · MOBILE</div>
        <div className="fr">Aperçu mobile · expérience supporter</div>
      </div>

      {/* Match header card */}
      <div className="card card-pad" style={{ padding: '18px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--red-2)', letterSpacing: '0.08em',
          }}>
            <span className="live-dot" /> LIVE · {minute}'
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>CAN 2025 · J24</span>
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center', gap: 10, textAlign: 'center',
        }}>
          <div>
            <div style={{ fontSize: 30 }}>🇲🇦</div>
            <div style={{ fontWeight: 700, fontSize: 14, marginTop: 2 }}>Maroc</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div className="num" style={{ fontSize: 30, fontWeight: 700, lineHeight: 1 }}>1 — 1</div>
            <div className="eyebrow" style={{ fontSize: 9 }}>{minute}' EN COURS</div>
          </div>
          <div>
            <div style={{ fontSize: 30 }}>🇸🇳</div>
            <div style={{ fontWeight: 700, fontSize: 14, marginTop: 2 }}>Sénégal</div>
          </div>
        </div>
        <div style={{
          marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between',
          fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-2)',
        }}>
          <span><Icon.Pin size={11} /> Moulay Abdellah, Rabat</span>
          <span><Icon.Calendar size={11} /> 10 juin · 20:00</span>
        </div>
      </div>

      {/* Alert banner */}
      <div style={{
        padding: '14px 16px', borderRadius: 14,
        background: 'linear-gradient(135deg, color-mix(in oklab, var(--red-deep) 50%, var(--bg-elev)), var(--bg-elev) 75%)',
        border: '1px solid color-mix(in oklab, var(--red) 45%, var(--border-strong))',
        position: 'relative', overflow: 'hidden',
      }}>
        <span className="scan-line" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'color-mix(in oklab, var(--red) 22%, transparent)',
            display: 'grid', placeItems: 'center', color: 'var(--red-2)', flex: 'none',
          }}>
            <Icon.AlertTri size={18} />
          </span>
          <div style={{ flex: 1 }}>
            <div className="eyebrow red">ALERTE FOULE</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2, lineHeight: 1.25 }}>
              Évitez Porte 3 → utilisez Porte 5
            </div>
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700,
            color: 'var(--red-2)', textShadow: '0 0 12px rgba(244,63,94,0.6)',
          }}>{countdown}</div>
        </div>
      </div>

      {/* Gate status card (cycles) */}
      <div style={{
        padding: '22px 20px', borderRadius: 16,
        background: gateState.bg, border: `1px solid ${gateState.border}`,
        transition: 'background 0.5s, border-color 0.5s',
      }}>
        <div className="eyebrow">VOTRE PORTE — {userGate.code}</div>
        <div style={{ fontSize: 13, color: 'var(--fg-1)', marginTop: 2 }}>{userGate.loc}</div>
        <div style={{
          marginTop: 14, display: 'flex', alignItems: 'center', gap: 12,
          transition: 'color 0.5s', color: gateState.color,
        }}>
          <span style={{
            width: 14, height: 14, borderRadius: '50%',
            background: gateState.color, boxShadow: `0 0 16px ${gateState.color}`,
            animation: 'pulseDot 1.6s ease-in-out infinite',
          }} />
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>{gateState.label}</div>
            <div className="eyebrow" style={{ fontSize: 10, color: gateState.color, marginTop: 4 }}>
              {gateState.state} · {gateState.state === 'SAFE' ? 'Accès normal' : gateState.state === 'WARNING' ? 'Restez vigilant' : 'Suivez les agents'}
            </div>
          </div>
        </div>
      </div>

      {/* Mini stadium */}
      <div className="card card-pad" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <div className="eyebrow">CARTE DU STADE</div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--fg-3)' }}>
            Votre porte en surbrillance
          </span>
        </div>
        <div style={{ display: 'grid', placeItems: 'center' }}>
          <StadiumMini sections={zoneRisks} highlightIdx={USER_GATE_IDX} size={420} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 6 }}>
          <LegendDot color="var(--green-2)" label="OK" />
          <LegendDot color="var(--orange-2)" label="ATTENTION" />
          <LegendDot color="var(--red-2)" label="CRITIQUE" />
        </div>
      </div>

      {/* Alerts feed */}
      <div className="card card-pad" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <div className="eyebrow">ALERTES EN DIRECT</div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
            fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--red-2)', letterSpacing: '0.08em' }}>
            <span className="live-dot" /> LIVE
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {ALERTS_INITIAL.map((a, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '46px 1fr auto',
              gap: 10, alignItems: 'center', padding: '10px 0',
              borderBottom: i < ALERTS_INITIAL.length - 1 ? '1px dashed var(--border)' : 'none',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>{a.time}</span>
              <div>
                <Badge variant={a.level === 'CRIT' ? 'crit' : a.level === 'WARN' ? 'warn' : 'info'} dot pulse={i === 0 && a.level === 'CRIT'}>
                  {a.zone}
                </Badge>
                <div style={{ fontSize: 12.5, color: 'var(--fg-1)', marginTop: 4 }}>{a.msg}</div>
              </div>
              <Icon.ChevronRight size={16} />
            </div>
          ))}
        </div>
      </div>

      {/* Practical info */}
      <div className="card card-pad" style={{ padding: 16 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>INFOS PRATIQUES</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          <InfoTile icon={<Icon.WC size={16} />} label="Toilettes" hint="6 espaces · le plus proche : G5" />
          <InfoTile icon={<Icon.Exit size={16} />} label="Sorties de secours" hint="Toujours visibles · suivez vert" />
          <InfoTile icon={<Icon.Family size={16} />} label="Espace famille" hint="Tribune Sud — Porte 5" />
          <InfoTile icon={<Icon.Accessibility size={16} />} label="Accès PMR" hint="Ascenseur — G1, G5" />
          <InfoTile icon={<Icon.Phone size={16} />} label="Urgences" hint="Composer le 15" full />
        </div>
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center', padding: '20px 0 0',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: 'linear-gradient(135deg, var(--accent-2), var(--accent-deep))',
          display: 'grid', placeItems: 'center', color: 'white',
          boxShadow: '0 4px 14px var(--accent-glow)',
        }}>
          <Icon.Shield size={18} />
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--fg-3)', letterSpacing: '0.08em' }}>
          ATLAS CROWD SHIELD · POUR LES SUPPORTERS
        </div>
        <div className="fr" style={{ fontSize: 11 }}>Votre sécurité, en temps réel</div>
      </div>
    </main>
  );
}

function InfoTile({ icon, label, hint, full }) {
  return (
    <div style={{
      gridColumn: full ? 'span 2' : 'auto',
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 12px', borderRadius: 10,
      background: 'var(--bg-2)', border: '1px solid var(--border)',
    }}>
      <span style={{
        width: 32, height: 32, borderRadius: 8,
        background: 'var(--bg-3)', color: 'var(--accent-2)',
        display: 'grid', placeItems: 'center', flex: 'none',
      }}>{icon}</span>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 700 }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>{hint}</div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-2)', letterSpacing: '0.06em',
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
      {label}
    </div>
  );
}
