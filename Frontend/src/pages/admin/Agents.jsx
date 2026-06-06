// Admin · Agents — table of agents + add/edit modal + delete.
import React, { useState, useEffect } from 'react';
import { Icon } from '../../lib/icons.jsx';
import { Button } from '../../components/Button.jsx';
import { Badge } from '../../components/Badge.jsx';
import Modal from '../../components/Modal.jsx';
import Toast, { useToast } from '../../components/Toast.jsx';
import {
  TextField, SelectField, TextArea, FormGrid,
} from '../../components/FormField.jsx';
import {
  SECTORS, AGENT_STATUSES, GATES,
} from '../../lib/data.js';
import { fetchAgents, createAgent, updateAgent, deleteAgent } from '../../lib/api.js';

const STATUS_VARIANT = {
  DEPLOYED: 'ok',
  STANDBY: 'warn',
  OFF: 'mute',
};

const emptyAgent = () => ({
  id: '', nom: '', prenom: '', matricule: '',
  sector: 'Nord', gateCode: 'G1', phone: '',
  status: 'STANDBY', notes: '',
});

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [edit, setEdit] = useState(null);
  const [editInit, setEditInit] = useState(null);
  const [err, setErr] = useState({});
  const [del, setDel] = useState(null);
  const { toast, show, hide } = useToast();

  const refresh = async () => {
    try {
      const data = await fetchAgents();
      setAgents(data.map((a) => ({ ...a, backendId: parseInt(a.id.replace('A-', '')) })));
    } catch { /* ignore */ }
  };

  useEffect(() => { refresh(); }, []);

  const validate = (a) => {
    const e = {};
    if (!a.nom) e.nom = true;
    if (!a.prenom) e.prenom = true;
    if (!a.matricule) e.matricule = true;
    if (!a.phone) e.phone = true;
    setErr(e);
    return !Object.keys(e).length;
  };

  const save = async () => {
    if (!validate(edit)) return;
    const { id: _, backendId: __, ...body } = edit;
    try {
      if (editInit?.backendId) {
        await updateAgent(editInit.backendId, body);
        show('Agent modifié');
      } else {
        await createAgent(body);
        show('Agent ajouté');
      }
      await refresh();
    } catch { /* ignore */ }
    setEdit(null); setEditInit(null); setErr({});
  };

  const onDelete = async () => {
    try {
      await deleteAgent(del.backendId);
      show(`Agent ${del.matricule} supprimé`);
      await refresh();
    } catch { /* ignore */ }
    setDel(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div className="eyebrow">ADMIN · AGENTS</div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Personnel de sécurité</h2>
          <div className="fr" style={{ marginTop: 2 }}>
            {agents.filter((a) => a.status === 'DEPLOYED').length} déployés ·
            {' '}{agents.filter((a) => a.status === 'STANDBY').length} en attente ·
            {' '}{agents.filter((a) => a.status === 'OFF').length} hors-service
          </div>
        </div>
        <Button variant="primary" onClick={() => { setEditInit(null); setEdit(emptyAgent()); setErr({}); }}>
          <Icon.Plus size={14} /> Ajouter un agent
        </Button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--border)' }}>
                {['ID', 'Nom', 'Matricule', 'Secteur', 'Porte', 'Téléphone', 'Statut', 'Actions'].map((h) => (
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
              {agents.map((a, i) => (
                <tr key={a.id} style={{ borderBottom: i < agents.length - 1 ? '1px solid var(--border)' : 'none' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = ''}>
                  <td style={{ padding: '14px', fontFamily: 'var(--font-mono)' }}>{a.id}</td>
                  <td style={{ padding: '14px' }}>
                    <div style={{ fontWeight: 600 }}>{a.prenom} {a.nom}</div>
                  </td>
                  <td style={{ padding: '14px', fontFamily: 'var(--font-mono)', color: 'var(--fg-2)' }}>{a.matricule}</td>
                  <td style={{ padding: '14px' }}>{a.sector}</td>
                  <td style={{ padding: '14px', fontFamily: 'var(--font-mono)' }}>{a.gateCode}</td>
                  <td style={{ padding: '14px', fontFamily: 'var(--font-mono)', color: 'var(--fg-2)' }}>{a.phone}</td>
                  <td style={{ padding: '14px' }}>
                    <Badge variant={STATUS_VARIANT[a.status]} dot pulse={a.status === 'DEPLOYED'}>{a.status}</Badge>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => { setEditInit(a); setEdit({ ...a }); setErr({}); }} title="Modifier" style={iconBtn}>
                        <Icon.Pencil size={14} />
                      </button>
                      <button onClick={() => setDel(a)} title="Supprimer" style={{ ...iconBtn, color: 'var(--red-2)' }}>
                        <Icon.Trash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={!!edit} onClose={() => { setEdit(null); setErr({}); }}
        title={editInit?.id ? 'Modifier l\'agent' : 'Ajouter un agent'}
        footer={<>
          <Button onClick={() => { setEdit(null); setErr({}); }}>Annuler</Button>
          <Button variant="primary" onClick={save}>
            <Icon.Check size={14} /> {editInit?.id ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </>}
      >
        {edit && (
          <FormGrid cols={2}>
            <TextField label="Nom" value={edit.nom} onChange={(v) => setEdit({ ...edit, nom: v })} error={err.nom} />
            <TextField label="Prénom" value={edit.prenom} onChange={(v) => setEdit({ ...edit, prenom: v })} error={err.prenom} />
            <TextField label="Matricule" value={edit.matricule} onChange={(v) => setEdit({ ...edit, matricule: v })} error={err.matricule} placeholder="MR-1047" />
            <TextField label="Téléphone" value={edit.phone} onChange={(v) => setEdit({ ...edit, phone: v })} error={err.phone} placeholder="+212 …" />
            <SelectField label="Secteur" value={edit.sector} onChange={(v) => setEdit({ ...edit, sector: v })} options={SECTORS} />
            <SelectField label="Porte assignée" value={edit.gateCode} onChange={(v) => setEdit({ ...edit, gateCode: v })}
              options={GATES.map((g) => ({ value: g.code, label: `${g.code} — ${g.name}` }))} />
            <SelectField label="Statut" value={edit.status} onChange={(v) => setEdit({ ...edit, status: v })} options={AGENT_STATUSES} />
            <div />
            <TextArea label="Notes" value={edit.notes || ''} onChange={(v) => setEdit({ ...edit, notes: v })} span={2} rows={3} />
          </FormGrid>
        )}
      </Modal>

      <Modal
        open={!!del} onClose={() => setDel(null)}
        title="Supprimer l'agent ?" width="narrow"
        footer={<>
          <Button onClick={() => setDel(null)}>Annuler</Button>
          <Button variant="danger" onClick={onDelete}><Icon.Trash size={14} /> Supprimer</Button>
        </>}
      >
        {del && <p>Supprimer définitivement <b>{del.prenom} {del.nom}</b> ({del.matricule}) ?</p>}
      </Modal>

      <Toast message={toast} onClose={hide} />
    </div>
  );
}

const iconBtn = {
  width: 30, height: 30, borderRadius: 7, padding: 0,
  background: 'transparent', border: '1px solid var(--border)',
  color: 'var(--fg-2)', cursor: 'pointer',
  display: 'grid', placeItems: 'center',
};
