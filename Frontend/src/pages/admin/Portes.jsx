// Admin · Portes — 6 gate cards with 3-state cycle + edit modal.
import React, { useState, useEffect } from 'react';
import { Icon } from '../../lib/icons.jsx';
import { Button } from '../../components/Button.jsx';
import { Badge } from '../../components/Badge.jsx';
import Modal from '../../components/Modal.jsx';
import Toast, { useToast } from '../../components/Toast.jsx';
import {
  TextField, NumberField, SelectField, TextArea, FormGrid,
} from '../../components/FormField.jsx';
import { GATE_STATES, SECTORS } from '../../lib/data.js';
import { fetchLiveState, fetchCameras, updateZone, gateStateFromRiskScore } from '../../lib/api.js';

const STATE_STYLE = {
  'OUVERT':    { variant: 'ok',   color: 'var(--green-2)',  bg: 'color-mix(in oklab, var(--green) 20%, transparent)',  border: 'color-mix(in oklab, var(--green) 50%, var(--border-strong))' },
  'RESTREINT': { variant: 'warn', color: 'var(--orange-2)', bg: 'color-mix(in oklab, var(--orange) 20%, transparent)', border: 'color-mix(in oklab, var(--orange) 50%, var(--border-strong))' },
  'FERMÉ':     { variant: 'crit', color: 'var(--red-2)',    bg: 'color-mix(in oklab, var(--red) 22%, transparent)',    border: 'color-mix(in oklab, var(--red) 50%, var(--border-strong))' },
};

function defaultGates() {
  const names = ['Porte 1 Nord', 'Porte 2 Nord-Est', 'Porte 3 Est', 'Porte 4 Sud-Est', 'Porte 5 Sud', 'Porte 6 Ouest'];
  const locs = ['Entree Nord', 'Entree Nord-Est', 'Entree Est', 'Entree Sud-Est', 'Entree Sud', 'Entree Ouest'];
  const sectors = ['Nord', 'Nord-Est', 'Est', 'Sud-Est', 'Sud', 'Ouest'];
  return names.map((n, i) => ({
    code: `G${i + 1}`, name: n, loc: locs[i], sector: sectors[i],
    state: 'OUVERT', agents: 300, maxFlow: 4200,
    density: 20, cameras: [], notes: '',
  }));
}

export default function Portes() {
  const [gates, setGates] = useState(defaultGates);
  const [edit, setEdit] = useState(null);
  const [editInit, setEditInit] = useState(null);
  const [camList, setCamList] = useState([]);
  const { toast, show, hide } = useToast();

  const refresh = () => {
    fetchLiveState().then((state) => {
      setGates((prev) => prev.map((g, i) => {
        const z = state.zones[i];
        if (!z) return g;
        const densityVal = typeof z.density === 'number' ? z.density
          : z.density === 'high' ? 85 : z.density === 'medium' ? 60 : 20;
        return {
          ...g,
          state: gateStateFromRiskScore(z.risk ?? 0),
          density: densityVal,
        };
      }));
    }).catch(() => {});
    fetchCameras().then(setCamList).catch(() => {});
  };

  useEffect(() => { refresh(); const id = setInterval(refresh, 3000); return () => clearInterval(id); }, []);

  const cycle = (i) => {
    const g = gates[i];
    const idx = GATE_STATES.indexOf(g.state);
    const nextState = GATE_STATES[(idx + 1) % GATE_STATES.length];
    updateZone(`gate_${i + 1}`, { status: nextState === 'OUVERT' ? 'safe' : nextState === 'RESTREINT' ? 'warning' : 'critical' })
      .then(refresh).catch(() => {});
  };

  const save = (g) => {
    updateZone(`gate_${editInit.code.slice(1)}`, {
      label: g.name, ...g,
    }).then(() => {
      show(`Porte ${g.code} mise a jour`);
      refresh();
    }).catch(() => show('Erreur lors de la mise a jour'));
    setEdit(null); setEditInit(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <div className="eyebrow">ADMIN · PORTES</div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>État des portes</h2>
        <div className="fr" style={{ marginTop: 2 }}>
          Cliquer sur le statut pour cycler OUVERT → RESTREINT → FERMÉ
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {gates.map((g, i) => {
          const st = STATE_STYLE[g.state];
          return (
            <div key={g.code} className="card card-pad" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      width: 32, height: 32, borderRadius: 8, background: 'var(--bg-2)',
                      border: '1px solid var(--border)', display: 'grid', placeItems: 'center',
                      fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--fg-1)',
                    }}>{g.code}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.01em' }}>{g.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>{g.loc}</div>
                    </div>
                  </div>
                </div>
                <Badge variant="info">{g.sector}</Badge>
              </div>

              <button onClick={() => cycle(i)}
                style={{
                  marginTop: 16, width: '100%',
                  padding: '14px 18px', borderRadius: 12,
                  background: st.bg, border: `1px solid ${st.border}`,
                  color: st.color, fontFamily: 'inherit',
                  fontSize: 16, fontWeight: 700, letterSpacing: '0.02em',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.filter = ''}>
                <span style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: st.color, boxShadow: `0 0 12px ${st.color}`,
                }} />
                {g.state}
              </button>

              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <DensityBadge value={g.density} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--fg-2)' }}>
                    <Icon.Users size={14} /> <span className="num">{g.agents}</span> agents
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--fg-2)' }}>
                    <Icon.Camera size={14} /> <span className="num">{g.cameras.length}</span>
                  </div>
                </div>
                <Button size="sm" onClick={() => { setEditInit(g); setEdit({ ...g }); }}>
                  <Icon.Pencil size={12} /> Modifier
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        open={!!edit} onClose={() => { setEdit(null); setEditInit(null); }}
        title={editInit ? `Modifier ${editInit.code} — ${editInit.name}` : ''}
        width="wide"
        footer={<>
          <Button onClick={() => { setEdit(null); setEditInit(null); }}>Annuler</Button>
          <Button variant="primary" onClick={() => save(edit)}>
            <Icon.Check size={14} /> Enregistrer
          </Button>
        </>}
      >
        {edit && <GateForm gate={edit} setGate={setEdit} camList={camList} />}
      </Modal>

      <Toast message={toast} onClose={hide} />
    </div>
  );
}

function DensityBadge({ value }) {
  const v = value >= 75 ? 'crit' : value >= 55 ? 'warn' : 'ok';
  return <Badge variant={v}>DENS {value}%</Badge>;
}

function GateForm({ gate, setGate, camList }) {
  const toggleCam = (id) => {
    const has = gate.cameras.includes(id);
    setGate({
      ...gate,
      cameras: has ? gate.cameras.filter((c) => c !== id) : [...gate.cameras, id],
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <FormGrid cols={2}>
        <TextField label="Nom" value={gate.name} onChange={(v) => setGate({ ...gate, name: v })} />
        <SelectField label="Secteur" value={gate.sector} onChange={(v) => setGate({ ...gate, sector: v })} options={SECTORS} />
        <TextField label="Localisation" value={gate.loc} onChange={(v) => setGate({ ...gate, loc: v })} span={2} />
        <NumberField label="Capacité flux max (pers/h)" value={gate.maxFlow}
          onChange={(v) => setGate({ ...gate, maxFlow: v })} min={0} />
        <NumberField label="Agents assignés" value={gate.agents}
          onChange={(v) => setGate({ ...gate, agents: v })} min={0} />
      </FormGrid>

      <div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>CAMÉRAS ASSOCIÉES</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {(camList.length ? camList : []).map((c) => {
            const checked = gate.cameras.includes(c.id);
            return (
              <button key={c.id} type="button" onClick={() => toggleCam(c.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 12px', borderRadius: 8,
                  background: checked ? 'color-mix(in oklab, var(--accent) 18%, transparent)' : 'var(--bg-2)',
                  border: `1px solid ${checked ? 'var(--accent)' : 'var(--border)'}`,
                  color: 'var(--fg-0)', cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 12.5, fontWeight: 600,
                }}>
                <span style={{
                  width: 16, height: 16, borderRadius: 4,
                  border: `1.5px solid ${checked ? 'var(--accent-2)' : 'var(--fg-3)'}`,
                  background: checked ? 'var(--accent-2)' : 'transparent',
                  display: 'grid', placeItems: 'center', color: 'white',
                }}>
                  {checked && <Icon.Check size={11} />}
                </span>
                <span style={{ fontFamily: '"Courier New", monospace' }}>{c.id}</span>
              </button>
            );
          })}
        </div>
      </div>

      <TextArea label="Notes" value={gate.notes || ''} onChange={(v) => setGate({ ...gate, notes: v })} rows={3} />
    </div>
  );
}
