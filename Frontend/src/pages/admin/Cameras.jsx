// Admin · Caméras — 8 camera cards grid + add/edit + flux modal + delete.
import React, { useState, useEffect } from 'react';
import { Icon } from '../../lib/icons.jsx';
import { Button } from '../../components/Button.jsx';
import { Badge } from '../../components/Badge.jsx';
import Modal from '../../components/Modal.jsx';
import Toast, { useToast } from '../../components/Toast.jsx';
import {
  TextField, NumberField, SelectField, Toggle, FormGrid,
} from '../../components/FormField.jsx';
import { SECTORS, CAMERA_RESOLUTIONS, CAMERA_FPS } from '../../lib/data.js';
import { fetchCameras, createCamera, updateCamera, deleteCamera } from '../../lib/api.js';

const emptyCam = () => ({
  id: '', zone: 'Nord', loc: '',
  lat: 33.97, lng: -6.85, resolution: '4K', fps: 60, ip: '',
  status: 'ACTIVE',
});

export default function Cameras() {
  const [cams, setCams] = useState([]);
  const [edit, setEdit] = useState(null);
  const [editInit, setEditInit] = useState(null);
  const [flux, setFlux] = useState(null);
  const [del, setDel] = useState(null);
  const { toast, show, hide } = useToast();

  const refresh = () => {
    fetchCameras().then((data) => {
      setCams(data.map((c) => ({ ...c, backendId: parseInt(c.id.replace('CAM-', '')) })));
    }).catch(() => {});
  };

  useEffect(() => { refresh(); }, []);

  const toggleStatus = (id) => {
    const c = cams.find((x) => x.id === id);
    if (!c) return;
    updateCamera(c.backendId, { status: c.status === 'ACTIVE' ? 'OFFLINE' : 'ACTIVE' })
      .then(refresh).catch(() => {});
  };

  const save = (cam) => {
    const body = { zone: cam.zone, loc: cam.loc, lat: cam.lat, lng: cam.lng, resolution: cam.resolution, fps: cam.fps, ip: cam.ip, status: cam.status };
    if (editInit?.id) {
      updateCamera(editInit.backendId, body).then(refresh).catch(() => {});
      show(`Caméra ${cam.id} modifiée`);
    } else {
      createCamera(body).then(refresh).catch(() => {});
      show(`Caméra ${cam.id} ajoutée`);
    }
    setEdit(null);
  };

  const onDelete = () => {
    deleteCamera(del.backendId).then(refresh).catch(() => {});
    show(`Caméra ${del.id} supprimée`);
    setDel(null);
  };

  const activeCount = cams.filter((c) => c.status === 'ACTIVE').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div className="eyebrow">ADMIN · CAMÉRAS</div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Parc caméras</h2>
          <div className="fr" style={{ marginTop: 2 }}>
            {activeCount} actives · {cams.length - activeCount} offline · {cams.length} au total
          </div>
        </div>
        <Button variant="primary" onClick={() => { setEditInit(null); setEdit(emptyCam()); }}>
          <Icon.Plus size={14} /> Ajouter une caméra
        </Button>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {cams.map((c) => (
          <CameraCard
            key={c.id} cam={c}
            onToggle={() => toggleStatus(c.id)}
            onFlux={() => setFlux(c)}
            onEdit={() => { setEditInit(c); setEdit({ ...c }); }}
            onDelete={() => setDel(c)}
          />
        ))}
      </div>

      {/* Add/Edit modal */}
      <Modal
        open={!!edit} onClose={() => setEdit(null)}
        title={editInit?.id ? 'Modifier la caméra' : 'Ajouter une caméra'}
        footer={<>
          <Button onClick={() => setEdit(null)}>Annuler</Button>
          <Button variant="primary" onClick={() => save(edit)}>
            <Icon.Check size={14} /> {editInit?.id ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </>}
      >
        {edit && <CameraForm cam={edit} setCam={setEdit} />}
      </Modal>

      {/* Flux modal */}
      <Modal
        open={!!flux} onClose={() => setFlux(null)}
        title={flux ? `Flux · ${flux.id}` : ''} subtitle={flux?.loc}
        width="wide"
        footer={<Button onClick={() => setFlux(null)}>Fermer</Button>}
      >
        {flux && <FluxView cam={flux} />}
      </Modal>

      {/* Delete */}
      <Modal
        open={!!del} onClose={() => setDel(null)}
        title="Supprimer la caméra ?" width="narrow"
        footer={<>
          <Button onClick={() => setDel(null)}>Annuler</Button>
          <Button variant="danger" onClick={onDelete}><Icon.Trash size={14} /> Supprimer</Button>
        </>}
      >
        {del && <p>Supprimer définitivement <b>{del.id}</b> — {del.loc} ?</p>}
      </Modal>

      <Toast message={toast} onClose={hide} />
    </div>
  );
}

function CameraCard({ cam, onToggle, onFlux, onEdit, onDelete }) {
  const isActive = cam.status === 'ACTIVE';
  const color = isActive ? 'var(--green-2)' : 'var(--fg-3)';
  return (
    <div className="card card-pad" style={{
      padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
      opacity: isActive ? 1 : 0.85,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: 'var(--bg-2)', border: `1px solid ${isActive ? 'color-mix(in oklab, var(--green) 40%, var(--border))' : 'var(--border)'}`,
          display: 'grid', placeItems: 'center', color,
        }}>
          <Icon.Camera size={20} />
        </div>
        <Badge variant={isActive ? 'ok' : 'mute'} dot pulse={isActive}>
          {cam.status}
        </Badge>
      </div>
      <div>
        <div style={{ fontFamily: '"Courier New", monospace', fontWeight: 700, fontSize: 16 }}>{cam.id}</div>
        <div style={{ fontSize: 12.5, color: 'var(--fg-1)', marginTop: 2 }}>{cam.loc}</div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Badge variant="info">{cam.zone}</Badge>
        <Badge variant="mute">{cam.resolution}</Badge>
        <Badge variant="mute">{cam.fps} fps</Badge>
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 10, borderTop: '1px solid var(--border)',
      }}>
        <button onClick={onToggle}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: color, fontFamily: 'var(--font-mono)', fontSize: 11,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
          {isActive ? 'Désactiver' : 'Activer'}
        </button>
        <div style={{ display: 'flex', gap: 4 }}>
          <Button size="sm" onClick={onFlux}><Icon.Eye size={12} /> Voir flux</Button>
          <button onClick={onEdit} title="Modifier" style={iconBtn}><Icon.Pencil size={12} /></button>
          <button onClick={onDelete} title="Supprimer" style={{ ...iconBtn, color: 'var(--red-2)' }}><Icon.Trash size={12} /></button>
        </div>
      </div>
    </div>
  );
}

const iconBtn = {
  width: 28, height: 28, borderRadius: 6, padding: 0,
  background: 'transparent', border: '1px solid var(--border)',
  color: 'var(--fg-2)', cursor: 'pointer',
  display: 'grid', placeItems: 'center',
};

function CameraForm({ cam, setCam }) {
  const set = (k, v) => setCam((c) => ({ ...c, [k]: v }));
  return (
    <FormGrid cols={2}>
      <TextField label="ID caméra" value={cam.id} onChange={(v) => set('id', v)} placeholder="CAM-09" />
      <SelectField label="Zone" value={cam.zone} onChange={(v) => set('zone', v)} options={SECTORS} />
      <TextField label="Emplacement précis" value={cam.loc} onChange={(v) => set('loc', v)} span={2}
        placeholder="Tribune Est — niveau 2, couloir VIP" />
      <NumberField label="Latitude" value={cam.lat} onChange={(v) => set('lat', v)} step="0.0001" />
      <NumberField label="Longitude" value={cam.lng} onChange={(v) => set('lng', v)} step="0.0001" />
      <SelectField label="Résolution" value={cam.resolution} onChange={(v) => set('resolution', v)} options={CAMERA_RESOLUTIONS} />
      <SelectField label="FPS" value={cam.fps} onChange={(v) => set('fps', Number(v))} options={CAMERA_FPS.map(String)} />
      <TextField label="Adresse IP" value={cam.ip} onChange={(v) => set('ip', v)} placeholder="10.0.1.29" span={2} />
      <div style={{ gridColumn: 'span 2', padding: '10px 12px', borderRadius: 10,
        background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
        <Toggle label="Caméra active" hint="Désactiver coupe le flux"
          value={cam.status === 'ACTIVE'} onChange={(v) => set('status', v ? 'ACTIVE' : 'OFFLINE')} />
      </div>
    </FormGrid>
  );
}

function FluxView({ cam }) {
  return (
    <div>
      <div style={{
        aspectRatio: '16/9', borderRadius: 12, position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #050505, #1a1a1a)',
        border: '1px solid var(--border-strong)',
      }}>
        {/* fake noise pattern */}
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.4 }}>
          <defs>
            <filter id="n">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" />
              <feColorMatrix values="0 0 0 0 0.3  0 0 0 0 0.3  0 0 0 0 0.3  0 0 0 0.5 0" />
            </filter>
          </defs>
          <rect width="100%" height="100%" filter="url(#n)" />
        </svg>
        {/* corner overlays */}
        <div style={{
          position: 'absolute', top: 12, left: 12, display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 10px', background: 'rgba(0,0,0,0.6)', borderRadius: 6,
          fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--red-2)',
        }}>
          <span className="live-dot" /> REC · {cam.id}
        </div>
        <div style={{
          position: 'absolute', bottom: 12, left: 12,
          padding: '6px 10px', background: 'rgba(0,0,0,0.6)', borderRadius: 6,
          fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-1)',
        }}>
          {cam.resolution} · {cam.fps}fps · {cam.lat},{cam.lng}
        </div>
        <div style={{
          position: 'absolute', top: 12, right: 12,
          padding: '6px 10px', background: 'rgba(0,0,0,0.6)', borderRadius: 6,
          fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-1)',
        }}>
          {new Date().toLocaleTimeString('fr-FR')}
        </div>
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
        padding: 14, marginTop: 14, borderRadius: 12,
        background: 'var(--bg-2)', border: '1px solid var(--border)',
      }}>
        <KV label="ZONE" v={cam.zone} />
        <KV label="EMPLACEMENT" v={cam.loc} />
        <KV label="IP" v={cam.ip || '—'} />
        <KV label="STATUS" v={cam.status} />
      </div>
    </div>
  );
}

function KV({ label, v }) {
  return (
    <div>
      <div className="eyebrow" style={{ fontSize: 9.5 }}>{label}</div>
      <div style={{ fontSize: 13, marginTop: 2 }}>{v}</div>
    </div>
  );
}
