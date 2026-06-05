// Admin · Matchs — table of matches + 3-step creation wizard +
// edit, delete, QR, and view-detail modals.
import React, { useState, useEffect } from 'react';
import { Icon } from '../../lib/icons.jsx';
import { Button } from '../../components/Button.jsx';
import { Badge } from '../../components/Badge.jsx';
import Modal from '../../components/Modal.jsx';
import Toast, { useToast } from '../../components/Toast.jsx';
import { TextField, NumberField, SelectField, TextArea, Toggle, Slider, FormGrid } from '../../components/FormField.jsx';
import { FLAGS, FLAG_LIST } from '../../lib/flags.js';
import { STADIUMS, COMPETITIONS, SEED_MATCHES, stadiumById, fmtTeam } from '../../lib/data.js';
import { fetchMatches, createMatch } from '../../lib/api.js';

const MATCH_STATUSES = [
  { value: 'LIVE',     label: 'LIVE' },
  { value: 'UPCOMING', label: 'UPCOMING' },
  { value: 'FINISHED', label: 'FINISHED' },
];

const STATUS_VARIANT = { LIVE: 'crit', UPCOMING: 'info', FINISHED: 'mute' };

export default function Matchs() {
  const [matches, setMatches] = useState(SEED_MATCHES);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardInitial, setWizardInitial] = useState(null);
  const [del, setDel] = useState(null);
  const [qr, setQr] = useState(null);
  const [view, setView] = useState(null);
  const { toast, show, hide } = useToast();

  useEffect(() => {
    fetchMatches().then(setMatches).catch(() => {});
  }, []);

  const onCreate = (m) => {
    if (wizardInitial?.id) {
      setMatches((arr) => arr.map((x) => x.id === m.id ? m : x));
      show('Match modifié avec succès');
    } else {
      createMatch({
        team_a: m.teamA === 'MA' ? 'Maroc' : m.teamA,
        team_b: m.teamB === 'SN' ? 'Sénégal' : m.teamB,
        stadium: stadiumById(m.stadiumId)?.name || m.stadiumId,
        match_date: m.datetime,
        capacity: m.capAuth,
      }).then(() => {
        fetchMatches().then(setMatches);
        show('Match créé avec succès');
      }).catch(() => {
        show('Erreur lors de la création');
      });
    }
    setWizardOpen(false);
    setWizardInitial(null);
  };

  const onDelete = () => {
    setMatches((arr) => arr.filter((x) => x.id !== del.id));
    show(`Match « ${fmtTeam(del.teamA)} vs ${fmtTeam(del.teamB)} » supprimé`);
    setDel(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div className="eyebrow">ADMIN · MATCHS</div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Gestion des matchs</h2>
          <div className="fr" style={{ marginTop: 2 }}>{matches.length} match{matches.length > 1 ? 's' : ''} configuré{matches.length > 1 ? 's' : ''}</div>
        </div>
        <Button variant="primary" onClick={() => { setWizardInitial(null); setWizardOpen(true); }}>
          <Icon.Plus size={14} /> Nouveau Match
        </Button>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--border)' }}>
                {['Match', 'Stade', 'Capacité totale', 'Capacité autorisée', 'Caméras', 'Portes', 'Agents', 'Statut', 'Actions']
                  .map((h) => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '12px 14px',
                      fontFamily: 'var(--font-mono)', fontSize: 10.5,
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                      color: 'var(--fg-2)', fontWeight: 600,
                    }}>{h}</th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {matches.map((m, i) => {
                const stadium = stadiumById(m.stadiumId);
                return (
                  <tr key={m.id} style={{
                    borderBottom: i < matches.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = ''}>
                    <td style={{ padding: '14px' }}>
                      <div style={{ fontWeight: 700 }}>
                        {fmtTeam(m.teamA)} <span style={{ color: 'var(--fg-3)' }}>vs</span> {fmtTeam(m.teamB)}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>
                        {m.competition} · {new Date(m.datetime).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <div>{stadium?.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>{stadium?.city}</div>
                    </td>
                    <td style={{ padding: '14px', fontFamily: 'var(--font-mono)' }}>{stadium?.capacity.toLocaleString()}</td>
                    <td style={{ padding: '14px', fontFamily: 'var(--font-mono)' }}>{m.capAuth.toLocaleString()}</td>
                    <td style={{ padding: '14px', fontFamily: 'var(--font-mono)' }}>{m.camerasActive}/{stadium?.cameras}</td>
                    <td style={{ padding: '14px', fontFamily: 'var(--font-mono)' }}>{m.gatesActive}/{stadium?.gates}</td>
                    <td style={{ padding: '14px', fontFamily: 'var(--font-mono)' }}>{m.agents.toLocaleString()}</td>
                    <td style={{ padding: '14px' }}>
                      <Badge variant={STATUS_VARIANT[m.status]} dot pulse={m.status === 'LIVE'}>{m.status}</Badge>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <IconBtn title="Modifier" onClick={() => { setWizardInitial(m); setWizardOpen(true); }}><Icon.Pencil size={14} /></IconBtn>
                        <IconBtn title="Supprimer" onClick={() => setDel(m)} color="red"><Icon.Trash size={14} /></IconBtn>
                        <IconBtn title="QR code" onClick={() => setQr(m)}><Icon.Qr size={14} /></IconBtn>
                        <IconBtn title="Détails" onClick={() => setView(m)}><Icon.Eye size={14} /></IconBtn>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Wizard */}
      <WizardModal
        open={wizardOpen}
        initial={wizardInitial}
        onClose={() => { setWizardOpen(false); setWizardInitial(null); }}
        onSubmit={onCreate}
      />

      {/* Delete modal */}
      <Modal
        open={!!del} onClose={() => setDel(null)}
        title="Supprimer le match ?" subtitle="Cette action est irréversible."
        width="narrow"
        footer={<>
          <Button onClick={() => setDel(null)}>Annuler</Button>
          <Button variant="danger" onClick={onDelete}>
            <Icon.Trash size={14} /> Supprimer définitivement
          </Button>
        </>}
      >
        {del && (
          <div>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--fg-1)' }}>
              Vous êtes sur le point de supprimer le match&nbsp;:
            </p>
            <div style={{
              marginTop: 12, padding: '14px 16px', borderRadius: 12,
              background: 'var(--bg-2)', border: '1px solid var(--border)',
            }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>
                {fmtTeam(del.teamA)} vs {fmtTeam(del.teamB)}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-2)', marginTop: 4 }}>
                {del.competition} · {stadiumById(del.stadiumId)?.name}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* QR modal */}
      <Modal
        open={!!qr} onClose={() => setQr(null)}
        title="QR code · Accès supporters" subtitle="Distribuez ce QR aux supporters pour accéder à l'app Reports."
        width="narrow"
        footer={<Button variant="primary" onClick={() => setQr(null)}>Fermer</Button>}
      >
        {qr && <QRBlock match={qr} />}
      </Modal>

      {/* View modal */}
      <Modal
        open={!!view} onClose={() => setView(null)}
        title="Détails du match"
        width="wide"
        footer={<Button onClick={() => setView(null)}>Fermer</Button>}
      >
        {view && <ViewBlock match={view} />}
      </Modal>

      <Toast message={toast} onClose={hide} />
    </div>
  );
}

// ---------- Small atoms ----------
function IconBtn({ onClick, children, title, color }) {
  return (
    <button onClick={onClick} title={title}
      style={{
        width: 30, height: 30, borderRadius: 7,
        background: 'transparent',
        border: '1px solid var(--border)',
        color: color === 'red' ? 'var(--red-2)' : 'var(--fg-2)',
        cursor: 'pointer', display: 'grid', placeItems: 'center',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
        e.currentTarget.style.color = color === 'red' ? 'var(--red-2)' : 'var(--fg-0)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = color === 'red' ? 'var(--red-2)' : 'var(--fg-2)';
      }}>
      {children}
    </button>
  );
}

function StepDots({ step }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {[1, 2, 3].map((n) => (
        <React.Fragment key={n}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            color: n <= step ? 'var(--accent-2)' : 'var(--fg-3)',
          }}>
            <span style={{
              width: 24, height: 24, borderRadius: '50%',
              background: n <= step ? 'var(--accent)' : 'var(--bg-3)',
              color: n <= step ? 'white' : 'var(--fg-3)',
              display: 'grid', placeItems: 'center',
              fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
            }}>{n}</span>
            <span style={{ fontSize: 12, fontWeight: 600 }}>
              {n === 1 ? 'Match' : n === 2 ? 'Terrain' : 'Agents'}
            </span>
          </div>
          {n < 3 && <span style={{ width: 28, height: 1, background: 'var(--border-strong)' }} />}
        </React.Fragment>
      ))}
    </div>
  );
}

// ---------- Wizard ----------
function emptyForm() {
  return {
    teamA: '', teamB: '', competition: '',
    datetime: '', stadiumId: '',
    capAuth: '', camerasActive: '', gatesActive: '',
    agents: '', status: 'UPCOMING',
    portsConfig: [], thresholdCrit: 75, thresholdWarn: 60, refresh: '2s',
    distribution: [], leadName: '', leadPhone: '', evac: '', notes: '',
  };
}

function WizardModal({ open, initial, onClose, onSubmit }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(emptyForm());
  const [err, setErr] = useState({});
  const isEdit = !!initial?.id;

  // hydrate form when opening
  React.useEffect(() => {
    if (!open) return;
    if (initial) {
      const st = stadiumById(initial.stadiumId);
      setForm({
        ...emptyForm(),
        ...initial,
        portsConfig: portsForStadium(initial.stadiumId, initial.gatesActive),
        distribution: distributionFor(st?.gates || 6, initial.agents),
        leadName: initial.leadName || 'M. Rousseau',
        leadPhone: initial.leadPhone || '+212 661 00 00 00',
      });
    } else {
      setForm(emptyForm());
    }
    setStep(1);
    setErr({});
  }, [open, initial]);

  if (!open) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onStadium = (id) => {
    const s = stadiumById(id);
    setForm((f) => ({
      ...f,
      stadiumId: id,
      capAuth: f.capAuth || s?.capacity || '',
      camerasActive: s?.cameras || '',
      gatesActive: s?.gates || '',
      portsConfig: portsForStadium(id, s?.gates),
      agents: f.agents || (s?.gates || 6) * 300,
      distribution: distributionFor(s?.gates || 6, (s?.gates || 6) * 300),
    }));
  };

  const validateStep1 = () => {
    const next = {};
    if (!form.teamA) next.teamA = true;
    if (!form.teamB) next.teamB = true;
    if (form.teamA && form.teamA === form.teamB) next.teamB = 'Les équipes doivent être différentes';
    if (!form.competition) next.competition = true;
    if (!form.datetime) next.datetime = true;
    if (!form.stadiumId) next.stadiumId = true;
    setErr(next);
    return !Object.keys(next).length;
  };
  const validateStep2 = () => {
    const next = {};
    if (!form.capAuth) next.capAuth = true;
    if (!form.camerasActive) next.camerasActive = true;
    if (!form.gatesActive) next.gatesActive = true;
    setErr(next);
    return !Object.keys(next).length;
  };
  const validateStep3 = () => {
    const next = {};
    if (!form.agents) next.agents = true;
    if (!form.leadName) next.leadName = true;
    if (!form.leadPhone) next.leadPhone = true;
    setErr(next);
    return !Object.keys(next).length;
  };

  const next = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const submit = () => {
    if (!validateStep3()) return;
    onSubmit({ ...form, id: initial?.id });
  };

  const footer = (
    <>
      <div style={{ flex: 1 }}>{step > 1 && (
        <Button onClick={() => setStep(step - 1)}>
          <Icon.ChevronLeft size={14} /> Précédent
        </Button>
      )}</div>
      <Button onClick={onClose}>Annuler</Button>
      {step < 3 ? (
        <Button variant="primary" onClick={next}>
          Suivant <Icon.ChevronRight size={14} />
        </Button>
      ) : (
        <Button variant="primary" onClick={submit}>
          <Icon.Check size={14} /> {isEdit ? 'Enregistrer' : 'Créer le Match'}
        </Button>
      )}
    </>
  );

  return (
    <Modal
      open={open} onClose={onClose}
      title={isEdit ? 'Modifier le match' : 'Nouveau match'}
      subtitle={<StepDots step={step} />}
      width="wide"
      footer={footer}
    >
      {step === 1 && <Step1 form={form} set={set} err={err} onStadium={onStadium} />}
      {step === 2 && <Step2 form={form} set={set} err={err} />}
      {step === 3 && <Step3 form={form} set={set} err={err} />}
    </Modal>
  );
}

function teamOptions() {
  return FLAG_LIST.map((f) => ({ value: f.code, label: `${f.emoji}  ${f.name}` }));
}

function Step1({ form, set, err, onStadium }) {
  return (
    <FormGrid cols={2}>
      <SelectField label="Équipe A" value={form.teamA} onChange={(v) => set('teamA', v)}
        options={teamOptions()} placeholder="Sélectionner…" error={err.teamA} />
      <SelectField label="Équipe B" value={form.teamB} onChange={(v) => set('teamB', v)}
        options={teamOptions()} placeholder="Sélectionner…" error={err.teamB} />
      <SelectField label="Compétition" value={form.competition} onChange={(v) => set('competition', v)}
        options={COMPETITIONS} placeholder="Sélectionner…" error={err.competition} />
      <TextField label="Date et heure" type="datetime-local"
        value={form.datetime} onChange={(v) => set('datetime', v)} error={err.datetime} />
      <SelectField label="Stade" value={form.stadiumId} onChange={onStadium}
        options={STADIUMS.map((s) => ({ value: s.id, label: `${s.name} — ${s.city}` }))}
        placeholder="Choisir un stade pour auto-remplir…" error={err.stadiumId} span={2} />
      {form.stadiumId && (
        <div style={{
          gridColumn: 'span 2', padding: 14, borderRadius: 12,
          background: 'var(--bg-2)', border: '1px solid var(--border)',
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
        }}>
          {(() => {
            const s = stadiumById(form.stadiumId);
            return (
              <>
                <MiniStat icon={<Icon.Users size={14} />} label="Capacité" value={s.capacity.toLocaleString()} />
                <MiniStat icon={<Icon.Camera size={14} />} label="Caméras" value={s.cameras} />
                <MiniStat icon={<Icon.Door size={14} />} label="Portes" value={s.gates} />
              </>
            );
          })()}
        </div>
      )}
    </FormGrid>
  );
}

function MiniStat({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{
        width: 30, height: 30, borderRadius: 8,
        background: 'var(--bg-3)', display: 'grid', placeItems: 'center',
        color: 'var(--accent-2)',
      }}>{icon}</span>
      <div>
        <div className="eyebrow" style={{ fontSize: 9.5 }}>{label}</div>
        <div className="num" style={{ fontWeight: 700 }}>{value}</div>
      </div>
    </div>
  );
}

function portsForStadium(id, n) {
  const s = stadiumById(id);
  const count = n || s?.gates || 6;
  const sectors = ['Nord', 'Nord-Est', 'Est', 'Sud-Est', 'Sud', 'Ouest', 'Sud-Ouest', 'Nord-Ouest'];
  return Array.from({ length: count }).map((_, i) => ({
    code: `G${i + 1}`,
    name: `Porte ${i + 1}`,
    loc: `Tribune ${sectors[i % sectors.length]}`,
    sector: sectors[i % sectors.length],
    active: true,
  }));
}

function distributionFor(n, total) {
  const each = Math.floor((total || 0) / n);
  return Array.from({ length: n }).map((_, i) => ({
    code: `G${i + 1}`,
    agents: each,
  }));
}

function Step2({ form, set, err }) {
  const s = stadiumById(form.stadiumId);
  const updatePort = (i, key, val) => {
    const copy = form.portsConfig.map((p, j) => j === i ? { ...p, [key]: val } : p);
    set('portsConfig', copy);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <FormGrid cols={3}>
        <NumberField label="Capacité totale" value={s?.capacity || ''} readOnly />
        <NumberField label="Capacité autorisée" value={form.capAuth}
          onChange={(v) => set('capAuth', v)} error={err.capAuth} min={0} />
        <NumberField label="Caméras totales" value={s?.cameras || ''} readOnly />
        <NumberField label="Caméras actives" value={form.camerasActive}
          onChange={(v) => set('camerasActive', v)} error={err.camerasActive} min={0} max={s?.cameras} />
        <NumberField label="Portes totales" value={s?.gates || ''} readOnly />
        <NumberField label="Portes actives" value={form.gatesActive}
          onChange={(v) => set('gatesActive', v)} error={err.gatesActive} min={0} max={s?.gates} />
      </FormGrid>

      <div className="card" style={{ padding: 14 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>CONFIGURATION DES PORTES</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {form.portsConfig.map((p, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '60px 1fr 140px 80px', gap: 10,
              alignItems: 'center',
              padding: '8px 10px', borderRadius: 8,
              background: 'var(--bg-2)', border: '1px solid var(--border)',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{p.code}</span>
              <input value={p.loc} onChange={(e) => updatePort(i, 'loc', e.target.value)}
                placeholder="Localisation"
                style={{
                  background: 'var(--bg-3)', border: '1px solid var(--border-strong)',
                  borderRadius: 7, padding: '7px 10px', color: 'var(--fg-0)', fontSize: 12.5,
                  fontFamily: 'inherit',
                }} />
              <select value={p.sector} onChange={(e) => updatePort(i, 'sector', e.target.value)}
                style={{
                  background: 'var(--bg-3)', border: '1px solid var(--border-strong)',
                  borderRadius: 7, padding: '7px 10px', color: 'var(--fg-0)', fontSize: 12.5,
                }}>
                {['Nord', 'Nord-Est', 'Est', 'Sud-Est', 'Sud', 'Ouest', 'Sud-Ouest', 'Nord-Ouest'].map((x) =>
                  <option key={x} value={x}>{x}</option>)}
              </select>
              <Toggle value={p.active} onChange={(v) => updatePort(i, 'active', v)} label="" />
            </div>
          ))}
        </div>
      </div>

      <FormGrid cols={3}>
        <Slider label="Seuil critique" value={form.thresholdCrit}
          min={50} max={100} unit="%" onChange={(v) => set('thresholdCrit', v)}
          hint="Dispatch automatique au-delà" />
        <Slider label="Seuil warning" value={form.thresholdWarn}
          min={40} max={74} unit="%" onChange={(v) => set('thresholdWarn', v)} />
        <SelectField label="Refresh IA" value={form.refresh}
          onChange={(v) => set('refresh', v)} options={['1s', '2s', '5s']} />
      </FormGrid>
    </div>
  );
}

function Step3({ form, set, err }) {
  const total = form.agents || 0;
  const dist = form.distribution.length
    ? form.distribution
    : distributionFor(form.portsConfig.length || 6, total);
  const sum = dist.reduce((s, d) => s + Number(d.agents || 0), 0);
  const updateDist = (i, val) => {
    const copy = dist.map((d, j) => j === i ? { ...d, agents: Number(val) || 0 } : d);
    set('distribution', copy);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <FormGrid cols={2}>
        <NumberField label="Nombre total d'agents" value={form.agents}
          onChange={(v) => set('agents', v)} min={0} error={err.agents} />
        <TextField label="Responsable sécurité" value={form.leadName}
          onChange={(v) => set('leadName', v)} error={err.leadName} />
        <TextField label="Téléphone responsable" value={form.leadPhone}
          onChange={(v) => set('leadPhone', v)} error={err.leadPhone}
          placeholder="+212 …" />
        <SelectField label="Statut du match" value={form.status}
          onChange={(v) => set('status', v)} options={MATCH_STATUSES} />
      </FormGrid>

      <div className="card" style={{ padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <div className="eyebrow">DISTRIBUTION PAR PORTE</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>
            <span style={{ color: 'var(--fg-3)' }}>Distribué</span>{' '}
            <span style={{
              color: sum === Number(total) ? 'var(--green-2)' : 'var(--orange-2)', fontWeight: 700,
            }}>{sum}</span>{' '}
            <span style={{ color: 'var(--fg-3)' }}>/ {total}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {dist.map((d, i) => {
            const pct = total ? (Number(d.agents || 0) / Number(total)) * 100 : 0;
            return (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '50px 100px 1fr', gap: 12, alignItems: 'center',
                padding: '8px 10px', borderRadius: 8, background: 'var(--bg-2)', border: '1px solid var(--border)',
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{d.code}</span>
                <input type="number" min="0" value={d.agents}
                  onChange={(e) => updateDist(i, e.target.value)}
                  style={{
                    background: 'var(--bg-3)', border: '1px solid var(--border-strong)',
                    borderRadius: 7, padding: '7px 10px', color: 'var(--fg-0)',
                    fontFamily: 'var(--font-mono)', fontSize: 12.5, width: '100%',
                  }} />
                <div style={{ position: 'relative', height: 6, borderRadius: 99, background: 'var(--bg-3)' }}>
                  <div style={{
                    position: 'absolute', inset: 0, width: `${Math.min(100, pct)}%`,
                    background: 'var(--accent-2)', borderRadius: 99,
                    transition: 'width 0.2s',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <FormGrid cols={2}>
        <FakeUpload label="Plan d'évacuation (PDF)" value={form.evac}
          onChange={(v) => set('evac', v)} />
        <TextArea label="Notes" value={form.notes} onChange={(v) => set('notes', v)} rows={3}
          placeholder="Observations, consignes particulières…" />
      </FormGrid>
    </div>
  );
}

function FakeUpload({ label, value, onChange }) {
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 6 }}>{label}</div>
      <button type="button"
        onClick={() => onChange(value ? '' : 'plan-evac-v3.pdf')}
        style={{
          width: '100%', padding: '20px', borderRadius: 10,
          background: 'var(--bg-2)', border: '1px dashed var(--border-strong)',
          color: value ? 'var(--accent-2)' : 'var(--fg-2)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          fontFamily: 'inherit', fontSize: 13,
        }}>
        <Icon.Upload size={16} /> {value || 'Glisser un PDF ou cliquer'}
      </button>
    </div>
  );
}

// ---------- QR block ----------
function QRBlock({ match }) {
  const url = `atlas.ma/match/${match.id}`;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <FakeQR seed={match.id} />
      <div style={{
        padding: '10px 14px', borderRadius: 10, background: 'var(--bg-2)',
        border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', gap: 10,
        width: '100%',
      }}>
        <Icon.Pin size={14} />
        <code style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--fg-0)' }}>{url}</code>
        <Button size="sm" onClick={() => navigator.clipboard?.writeText(url)}>
          <Icon.Copy size={12} /> Copier
        </Button>
      </div>
    </div>
  );
}

function FakeQR({ seed = 'abc' }) {
  // Deterministic 21x21 fake QR using hash of seed
  const n = 21;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const rnd = (i) => {
    let x = (h ^ i ^ (i << 13) ^ (i >>> 7)) >>> 0;
    return (x % 100) / 100;
  };
  const cell = 8;
  return (
    <svg width={n * cell + 24} height={n * cell + 24}
      style={{ background: 'white', borderRadius: 12, padding: 12 }}>
      <g transform="translate(12,12)">
        {Array.from({ length: n }).map((_, y) =>
          Array.from({ length: n }).map((_, x) => {
            // 3 finder patterns at corners
            const inFinder =
              (x < 7 && y < 7) ||
              (x >= n - 7 && y < 7) ||
              (x < 7 && y >= n - 7);
            let on;
            if (inFinder) {
              const fx = x < 7 ? x : x - (n - 7);
              const fy = y < 7 ? y : y - (n - 7);
              const onEdge = fx === 0 || fx === 6 || fy === 0 || fy === 6;
              const inCenter = fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4;
              on = onEdge || inCenter;
            } else {
              on = rnd(y * n + x) > 0.45;
            }
            return on ? (
              <rect key={`${x}-${y}`} x={x * cell} y={y * cell} width={cell - 0.5} height={cell - 0.5} fill="#0d1119" />
            ) : null;
          })
        )}
      </g>
    </svg>
  );
}

// ---------- View block ----------
function ViewBlock({ match }) {
  const s = stadiumById(match.stadiumId);
  const rows = [
    ['Match', `${fmtTeam(match.teamA)} vs ${fmtTeam(match.teamB)}`],
    ['Compétition', match.competition],
    ['Date', new Date(match.datetime).toLocaleString('fr-FR')],
    ['Stade', `${s?.name} — ${s?.city}`],
    ['Capacité totale', s?.capacity.toLocaleString()],
    ['Capacité autorisée', match.capAuth?.toLocaleString()],
    ['Caméras actives', `${match.camerasActive} / ${s?.cameras}`],
    ['Portes actives', `${match.gatesActive} / ${s?.gates}`],
    ['Agents déployés', match.agents?.toLocaleString()],
    ['Statut', match.status],
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
      {rows.map(([k, v], i) => (
        <div key={k} style={{
          display: 'flex', flexDirection: 'column', gap: 4,
          padding: '12px 14px',
          borderBottom: '1px solid var(--border)',
          borderRight: i % 2 === 0 ? '1px solid var(--border)' : 'none',
        }}>
          <span className="eyebrow">{k}</span>
          <span style={{ fontWeight: 600 }}>{v}</span>
        </div>
      ))}
    </div>
  );
}
