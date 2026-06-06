import React from 'react';
import IncidentReport from './reports/IncidentReport.jsx';
import MatchReport from './reports/MatchReport.jsx';

export default function ReportsDashboard({ section, navigate }) {
  const active = section || 'incidents';
  const go = (k) => navigate(`/reports/${k}`);

  return (
    <main style={{
      position: 'relative', zIndex: 1,
      maxWidth: 1400, margin: '0 auto',
      padding: '24px 28px 40px',
    }}>
      <div style={{ marginBottom: 20 }}>
        <div className="eyebrow">RAPPORTS</div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Analyse des incidents et matchs</h2>
        <div className="fr" style={{ marginTop: 2 }}>Consultez les incidents par zone et les rapports par match</div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {[
          { key: 'incidents', label: 'Incidents', icon: '⚠' },
          { key: 'match', label: 'Match', icon: '🏟' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => go(t.key)}
            style={{
              padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
              background: active === t.key
                ? 'color-mix(in oklab, var(--red) 12%, transparent)'
                : 'var(--bg-2)',
              color: active === t.key ? 'var(--fg-0)' : 'var(--fg-2)',
              borderLeft: active === t.key ? '3px solid var(--red-2)' : '3px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {active === 'incidents' && <IncidentReport />}
      {active === 'match' && <MatchReport />}
    </main>
  );
}
