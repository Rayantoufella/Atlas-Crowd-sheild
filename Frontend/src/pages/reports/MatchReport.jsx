import React, { useState, useEffect } from 'react';
import { Icon } from '../../lib/icons.jsx';
import { fetchMatches, fetchMatchSummary, exportMatchPDF } from '../../lib/api.js';

export default function MatchReport() {
  const [matches, setMatches] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches().then((list) => {
      setMatches(list);
      if (list.length > 0 && !selectedId) {
        setSelectedId(String(list[0].id));
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    fetchMatchSummary(selectedId)
      .then((d) => { setReport(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [selectedId]);

  if (loading && !report) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-2)' }}>Chargement...</div>;
  }

  const m = report?.match;
  const incidents = report?.incidents;
  const zones = report?.zones || [];
  const agents = report?.agents;

  const statusColor = (s) =>
    s === 'CRITICAL' ? 'var(--red-2)' :
    s === 'WARNING' ? 'var(--orange-2)' :
    s === 'WATCH' ? 'var(--yellow-2)' :
    'var(--green-2)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="card card-pad" style={{
        display: 'flex', alignItems: 'center', gap: 16,
        flexWrap: 'wrap',
      }}>
        <div className="eyebrow" style={{ flex: 'none' }}>SÉLECTIONNER UN MATCH</div>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          style={{
            flex: 1, minWidth: 250,
            background: 'var(--bg-2)', color: 'var(--fg-0)',
            border: '1px solid var(--border-strong)', borderRadius: 10,
            padding: '10px 12px', fontSize: 13.5, fontFamily: 'inherit',
          }}
        >
          {matches.map((match) => (
            <option key={match.id} value={match.id}>
              {match.team_a} vs {match.team_b} — {new Date(match.match_date).toLocaleDateString('fr-FR')}
            </option>
          ))}
        </select>
        <button onClick={() => selectedId && exportMatchPDF(selectedId)}
          disabled={!selectedId}
          style={{
            padding: '9px 16px', borderRadius: 8, border: '1px solid var(--border-strong)',
            background: selectedId ? 'var(--bg-2)' : 'var(--bg-1)',
            color: selectedId ? 'var(--fg-0)' : 'var(--fg-3)',
            cursor: selectedId ? 'pointer' : 'default', fontFamily: 'inherit',
            fontSize: 12.5, fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', gap: 6, flex: 'none',
          }}>
          <Icon.Upload size={14} /> Exporter PDF
        </button>
      </div>

      {report && (
        <>
          {m && (
            <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="eyebrow">MATCH</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{m.team_a} vs {m.team_b}</div>
              <div className="fr" style={{ fontSize: 13 }}>
                {m.stadium} — {new Date(m.match_date).toLocaleDateString('fr-FR')}
                {' · '}
                <span style={{
                  color: m.status === 'LIVE' ? 'var(--green-2)' : 'var(--fg-2)',
                  fontWeight: 600,
                }}>{m.status}</span>
              </div>
            </div>
          )}

          {incidents && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {[
                { label: 'Incidents', value: incidents.total, color: 'var(--red-2)' },
                { label: 'Actifs', value: incidents.active, color: 'var(--orange-2)' },
                { label: 'Résolus', value: incidents.resolved, color: 'var(--green-2)' },
                { label: 'Tps moyen (min)', value: incidents.avg_response_minutes, color: 'var(--accent-2)' },
              ].map((s, i) => (
                <div key={i} className="card card-pad">
                  <div className="eyebrow">{s.label}</div>
                  <div className="num" style={{
                    fontSize: 28, fontWeight: 700, marginTop: 4, color: s.color,
                  }}>{s.value}</div>
                </div>
              ))}
            </div>
          )}

          {agents && (
            <div className="card card-pad" style={{ display: 'flex', gap: 24 }}>
              <div>
                <div className="eyebrow">AGENTS</div>
                <div className="num" style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>
                  {agents.active} / {agents.total}
                </div>
                <div className="fr">déployés</div>
              </div>
            </div>
          )}

          {zones.length > 0 && (
            <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="eyebrow">ZONES</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                {zones.map((z) => (
                  <div key={z.gate_id} style={{
                    padding: '12px 14px', borderRadius: 10,
                    background: 'var(--bg-2)', border: '1px solid var(--border)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>
                        {z.gate_id.toUpperCase().replace('GATE_', 'G')}
                      </span>
                      <span style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: statusColor(z.status),
                        boxShadow: `0 0 8px ${statusColor(z.status)}`,
                      }} />
                    </div>
                    <div className="fr" style={{ marginTop: 2 }}>{z.label || z.gate_id}</div>
                    <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: 'var(--fg-2)' }}>Risque <strong>{z.risk_score}</strong></span>
                      <span style={{ color: 'var(--fg-2)' }}>Incidents <strong>{z.incidents}</strong></span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 2 }}>
                      Densité: {z.density} · Statut: {z.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
