import React, { useState, useEffect } from 'react';
import { Icon } from '../../lib/icons.jsx';

export default function IncidentReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [zoneFilter, setZoneFilter] = useState('');
  const [matchFilter, setMatchFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    let url = `/api/report/incidents?page=${page}`;
    if (zoneFilter) url += `&zone_id=${zoneFilter}`;
    if (matchFilter) url += `&match_id=${matchFilter}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [page, zoneFilter, matchFilter]);

  if (loading && !data) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-2)' }}>Chargement...</div>;
  }

  const items = data?.items || [];
  const byZone = data?.by_zone || {};

  const statCards = [
    { label: 'Total incidents', value: data?.total ?? 0, color: 'var(--red-2)', icon: <Icon.AlertTri size={16} /> },
    { label: 'Zones touchées', value: Object.keys(byZone).length, color: 'var(--orange-2)', icon: <Icon.Map size={16} /> },
    { label: 'Cette page', value: items.length, color: 'var(--accent-2)', icon: <Icon.List size={16} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {statCards.map((s, i) => (
          <div key={i} className="card card-pad" style={{
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <span style={{
              width: 40, height: 40, borderRadius: 10,
              background: `color-mix(in oklab, ${s.color} 18%, transparent)`,
              color: s.color, display: 'grid', placeItems: 'center', flex: 'none',
            }}>{s.icon}</span>
            <div>
              <div className="eyebrow">{s.label}</div>
              <div className="num" style={{ fontSize: 28, fontWeight: 700, marginTop: 2 }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="eyebrow">LISTE DES INCIDENTS</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              value={zoneFilter}
              onChange={(e) => { setZoneFilter(e.target.value); setPage(1); }}
              style={{
                background: 'var(--bg-2)', color: 'var(--fg-0)',
                border: '1px solid var(--border-strong)', borderRadius: 8,
                padding: '6px 10px', fontSize: 12, fontFamily: 'inherit',
              }}
            >
              <option value="">Toutes zones</option>
              {[...new Set(items.map((i) => i.zone_id))].sort().map((z) => (
                <option key={z} value={z}>{z.toUpperCase().replace('GATE_', 'G')}</option>
              ))}
            </select>
            <select
              value={matchFilter}
              onChange={(e) => { setMatchFilter(e.target.value); setPage(1); }}
              style={{
                background: 'var(--bg-2)', color: 'var(--fg-0)',
                border: '1px solid var(--border-strong)', borderRadius: 8,
                padding: '6px 10px', fontSize: 12, fontFamily: 'inherit',
              }}
            >
              <option value="">Tous matchs</option>
              {[...new Set(items.map((i) => i.match_label))].filter(Boolean).map((m) => (
                <option key={m} value={items.find((i) => i.match_label === m)?.match_id}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {items.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--fg-3)' }}>
            Aucun incident trouvé
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['ID', 'Match', 'Zone', 'Message', 'Agents', 'ETA', 'Statut', 'Date'].map((h) => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '8px 10px',
                      fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--fg-3)',
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((inc) => (
                  <tr key={inc.id} style={{
                    borderBottom: '1px solid var(--border)',
                    transition: 'background 0.1s',
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '10px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      #{inc.id}
                    </td>
                    <td style={{ padding: '10px' }}>{inc.match_label}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                        background: 'var(--bg-3)', color: 'var(--fg-1)',
                      }}>
                        {inc.zone_id.toUpperCase().replace('GATE_', 'G')}
                      </span>
                    </td>
                    <td style={{ padding: '10px', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {inc.message}
                    </td>
                    <td style={{ padding: '10px', fontFamily: 'var(--font-mono)' }}>
                      {inc.agents_needed ?? '—'}
                    </td>
                    <td style={{ padding: '10px', fontFamily: 'var(--font-mono)' }}>
                      {inc.eta_minutes != null ? `${inc.eta_minutes} min` : '—'}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                        background: inc.active
                          ? 'color-mix(in oklab, var(--red) 18%, transparent)'
                          : 'color-mix(in oklab, var(--green) 18%, transparent)',
                        color: inc.active ? 'var(--red-2)' : 'var(--green-2)',
                      }}>
                        {inc.active ? 'ACTIF' : 'RÉSOLU'}
                      </span>
                    </td>
                    <td style={{ padding: '10px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-2)' }}>
                      {inc.created_at ? new Date(inc.created_at).toLocaleString('fr-FR') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.total_pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, paddingTop: 8 }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              style={{
                padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border-strong)',
                background: page <= 1 ? 'var(--bg-2)' : 'var(--bg-3)',
                color: page <= 1 ? 'var(--fg-3)' : 'var(--fg-0)',
                cursor: page <= 1 ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: 12,
              }}
            >Précédent</button>
            <span style={{
              padding: '6px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-2)',
            }}>
              Page {data.page} / {data.total_pages}
            </span>
            <button
              disabled={page >= data.total_pages}
              onClick={() => setPage((p) => p + 1)}
              style={{
                padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border-strong)',
                background: page >= data.total_pages ? 'var(--bg-2)' : 'var(--bg-3)',
                color: page >= data.total_pages ? 'var(--fg-3)' : 'var(--fg-0)',
                cursor: page >= data.total_pages ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: 12,
              }}
            >Suivant</button>
          </div>
        )}
      </div>
    </div>
  );
}
