import React, { useState, useEffect } from 'react';
import { Icon } from '../../lib/icons.jsx';
import { createIncident, exportIncidentsPDF } from '../../lib/api.js';

const ZONES = ['gate_1','gate_2','gate_3','gate_4','gate_5','gate_6'];

export default function IncidentReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [zoneFilter, setZoneFilter] = useState('');
  const [matchFilter, setMatchFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [matchList, setMatchList] = useState([]);
  const [form, setForm] = useState({
    match_id: '', zone_id: 'gate_1', message: '',
    agents_needed: 2, eta_minutes: 5, redirect_to: '', active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetch('/api/match/list').then(r=>r.json()).then(setMatchList).catch(()=>{}); }, []);

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

  const handleCreate = async () => {
    if (!form.match_id || !form.message) return;
    setSaving(true);
    try {
      await createIncident({ ...form, match_id: Number(form.match_id) });
      setShowModal(false);
      setForm({ match_id: '', zone_id: 'gate_1', message: '', agents_needed: 2, eta_minutes: 5, redirect_to: '', active: true });
      // reload
      setLoading(true);
      const url = `/api/report/incidents?page=${page}`;
      const res = await fetch(url);
      const d = await res.json();
      setData(d);
    } catch (e) { alert('Erreur création: ' + e.message); }
    setSaving(false);
  };

  const field = (k) => form[k];
  const setField = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  if (loading && !data) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-2)' }}>Chargement...</div>;
  }

  const items = data?.items || [];
  const byZone = data?.by_zone || {};

  const statCards = [
    { label: 'Total incidents', value: data?.total ?? 0, color: 'var(--red-2)', icon: <Icon.AlertTri size={16} /> },
    { label: 'Zones touchées', value: Object.keys(byZone).length, color: 'var(--orange-2)', icon: <Icon.Map size={16} /> },
    { label: 'Cette page', value: items.length, color: 'var(--accent-2)', icon: <Icon.Eye size={16} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Actions row */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={() => exportIncidentsPDF({ match_id: matchFilter || undefined, zone_id: zoneFilter || undefined })}
          style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-strong)',
            background: 'var(--bg-2)', color: 'var(--fg-0)', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
          <Icon.Upload size={14} /> Exporter PDF
        </button>
        <button onClick={() => setShowModal(true)}
          style={{
            padding: '8px 16px', borderRadius: 8, border: 'none',
            background: 'linear-gradient(135deg, var(--red-2), var(--red-deep))',
            color: 'white', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
          <Icon.Plus size={14} /> Créer un incident
        </button>
      </div>

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

      {/* Create incident modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'grid', placeItems: 'center',
        }} onClick={() => setShowModal(false)}>
          <div className="card" style={{
            width: 460, maxHeight: '90vh', overflowY: 'auto',
            padding: 24, display: 'flex', flexDirection: 'column', gap: 14,
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="eyebrow">NOUVEL INCIDENT</div>
              <button onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--fg-2)', cursor: 'pointer', fontSize: 18 }}>
                <Icon.X size={18} />
              </button>
            </div>

            <label className="eyebrow" style={{ fontSize: 10.5 }}>Match</label>
            <select value={form.match_id} onChange={setField('match_id')}
              style={inpStyle}>
              <option value="">Sélectionner un match</option>
              {matchList.map((m) => (
                <option key={m.id} value={m.id}>{m.team_a} vs {m.team_b}</option>
              ))}
            </select>

            <label className="eyebrow" style={{ fontSize: 10.5 }}>Zone</label>
            <select value={form.zone_id} onChange={setField('zone_id')} style={inpStyle}>
              {ZONES.map((z) => (
                <option key={z} value={z}>{z.toUpperCase().replace('GATE_', 'G')}</option>
              ))}
            </select>

            <label className="eyebrow" style={{ fontSize: 10.5 }}>Message</label>
            <textarea value={form.message} onChange={setField('message')}
              style={{ ...inpStyle, minHeight: 70, resize: 'vertical' }} rows={3} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label className="eyebrow" style={{ fontSize: 10.5 }}>Agents nécessaires</label>
                <input type="number" value={form.agents_needed} onChange={setField('agents_needed')} style={inpStyle} />
              </div>
              <div>
                <label className="eyebrow" style={{ fontSize: 10.5 }}>ETA (minutes)</label>
                <input type="number" value={form.eta_minutes} onChange={setField('eta_minutes')} style={inpStyle} />
              </div>
            </div>

            <label className="eyebrow" style={{ fontSize: 10.5 }}>Rediriger vers</label>
            <select value={form.redirect_to} onChange={setField('redirect_to')} style={inpStyle}>
              <option value="">Aucune redirection</option>
              {ZONES.map((z) => (
                <option key={z} value={z}>{z.toUpperCase().replace('GATE_', 'G')}</option>
              ))}
            </select>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <input type="checkbox" id="inc-active" checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              <label htmlFor="inc-active" style={{ fontSize: 12.5, color: 'var(--fg-1)' }}>Actif</label>
            </div>

            <button onClick={handleCreate} disabled={saving || !form.match_id || !form.message}
              style={{
                marginTop: 6, padding: '10px', borderRadius: 8, border: 'none',
                background: !form.match_id || !form.message ? 'var(--bg-3)' : 'linear-gradient(135deg, var(--red-2), var(--red-deep))',
                color: !form.match_id || !form.message ? 'var(--fg-3)' : 'white',
                fontWeight: 700, fontSize: 13, cursor: !form.match_id || !form.message ? 'default' : 'pointer',
                fontFamily: 'inherit',
              }}>
              {saving ? 'Création...' : 'Créer l\'incident'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const inpStyle = {
  background: 'var(--bg-2)', color: 'var(--fg-0)',
  border: '1px solid var(--border-strong)', borderRadius: 8,
  padding: '9px 12px', fontSize: 13, fontFamily: 'inherit', width: '100%', boxSizing: 'border-box',
};
