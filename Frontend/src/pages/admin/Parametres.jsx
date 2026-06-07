import React, { useState, useEffect, useMemo } from 'react';
import { Icon } from '../../lib/icons.jsx';
import { Button } from '../../components/Button.jsx';
import { Badge } from '../../components/Badge.jsx';
import Toast, { useToast } from '../../components/Toast.jsx';
import {
  TextField, SelectField, Toggle, Slider, FormGrid,
} from '../../components/FormField.jsx';
import { fetchSettings, saveSettings, fetchLiveState } from '../../lib/api.js';

const MODE_PRESETS = {
  fast:   { weight_velocity: 35, weight_accel: 20, weight_proximity: 25, weight_object: 20, conf_threshold: 15 },
  balanced: { weight_velocity: 40, weight_accel: 25, weight_proximity: 15, weight_object: 20, conf_threshold: 20 },
  strict: { weight_velocity: 50, weight_accel: 25, weight_proximity: 15, weight_object: 10, conf_threshold: 30 },
};

const FALLBACK = {
  riskThreshold: 75,
  warnThreshold: 60,
  refresh: '2s',
  language: 'fr',
  autoDispatch: true,
  notifyEmail: true,
  notifySms: false,
  notifyPush: true,
  detectionMode: 'balanced',
  retentionDays: 30,
  mfaEnabled: true,
  apiToken: 'atlas_sk_•••••_8f72',
  weight_velocity: 40,
  weight_accel: 25,
  weight_proximity: 15,
  weight_object: 20,
  stream_jpeg_quality: 85,
  snapshot_jpeg_quality: 85,
  stream_width: 854,
  snapshot_width: 320,
};

const wLabel = { weight_velocity: 'Velocity', weight_accel: 'Acceleration', weight_proximity: 'Proximity', weight_object: 'Object' };
const wHint  = { weight_velocity: 'Speed of movement signal', weight_accel: 'Sudden change signal', weight_proximity: 'Nearby people signal', weight_object: 'Dangerous object signal' };

export default function Parametres() {
  const [cfg, setCfg] = useState(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { toast, show, hide } = useToast();
  const set = (k, v) => setCfg((c) => ({ ...c, [k]: v }));

  useEffect(() => {
    fetchSettings()
      .then((data) => {
        setCfg((c) => ({
          ...c,
          riskThreshold: data.riskThreshold ?? FALLBACK.riskThreshold,
          warnThreshold: data.warnThreshold ?? FALLBACK.warnThreshold,
          refresh: data.refresh ?? FALLBACK.refresh,
          detectionMode: data.detectionMode ?? FALLBACK.detectionMode,
          weight_velocity: Math.round((data.weight_velocity ?? 0.4) * 100),
          weight_accel: Math.round((data.weight_accel ?? 0.25) * 100),
          weight_proximity: Math.round((data.weight_proximity ?? 0.15) * 100),
          weight_object: Math.round((data.weight_object ?? 0.2) * 100),
          stream_jpeg_quality: data.stream_jpeg_quality ?? 85,
          snapshot_jpeg_quality: data.snapshot_jpeg_quality ?? 85,
          stream_width: data.stream_width ?? 854,
          snapshot_width: data.snapshot_width ?? 320,
        }));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const applyMode = (mode) => {
    const p = MODE_PRESETS[mode] || MODE_PRESETS.balanced;
    setCfg((c) => ({
      ...c,
      detectionMode: mode,
      weight_velocity: p.weight_velocity,
      weight_accel: p.weight_accel,
      weight_proximity: p.weight_proximity,
      weight_object: p.weight_object,
    }));
  };

  const handleSave = async () => {
    try {
      const body = {
        riskThreshold: cfg.riskThreshold,
        warnThreshold: cfg.warnThreshold,
        refresh: cfg.refresh,
        detectionMode: cfg.detectionMode,
        weight_velocity: cfg.weight_velocity / 100,
        weight_accel: cfg.weight_accel / 100,
        weight_proximity: cfg.weight_proximity / 100,
        weight_object: cfg.weight_object / 100,
        stream_jpeg_quality: cfg.stream_jpeg_quality,
        snapshot_jpeg_quality: cfg.snapshot_jpeg_quality,
        stream_width: cfg.stream_width,
        snapshot_width: cfg.snapshot_width,
      };
      await saveSettings(body);
      show('Paramètres enregistrés');
    } catch {
      show('Erreur lors de la sauvegarde');
    }
  };

  const handleReset = () => {
    applyMode('balanced');
    setCfg((c) => ({
      ...c,
      riskThreshold: FALLBACK.riskThreshold,
      warnThreshold: FALLBACK.warnThreshold,
      refresh: FALLBACK.refresh,
      stream_jpeg_quality: FALLBACK.stream_jpeg_quality,
      snapshot_jpeg_quality: FALLBACK.snapshot_jpeg_quality,
      stream_width: FALLBACK.stream_width,
      snapshot_width: FALLBACK.snapshot_width,
    }));
  };

  if (loading) {
    return (
      <main style={{ padding: 40, textAlign: 'center', color: 'var(--fg-2)' }}>
        Chargement des paramètres…
      </main>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <div className="eyebrow">ADMIN · PARAMÈTRES</div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Configuration système</h2>
        <div className="fr" style={{ marginTop: 2 }}>Seuils IA, notifications, sécurité et statut des services</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18 }}>
        {/* Left: configuration */}
        <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <Section title="DÉTECTION IA" subtitle="Seuils et fréquence d'inférence">
            <FormGrid cols={2}>
              <Slider label="Seuil critique" value={cfg.riskThreshold} min={50} max={100} unit="%"
                onChange={(v) => set('riskThreshold', v)} hint="Dispatch auto au-delà" />
              <Slider label="Seuil warning" value={cfg.warnThreshold} min={40} max={74} unit="%"
                onChange={(v) => set('warnThreshold', v)} />
              <SelectField label="Fréquence d'inférence" value={cfg.refresh}
                onChange={(v) => set('refresh', v)} options={['1s', '2s', '5s']} />
              <SelectField label="Mode de détection" value={cfg.detectionMode}
                onChange={(v) => applyMode(v)}
                options={[
                  { value: 'fast', label: 'Rapide (sensible)' },
                  { value: 'balanced', label: 'Équilibré' },
                  { value: 'strict', label: 'Strict (peu de faux positifs)' },
                ]} />
            </FormGrid>

            <div style={{ marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                style={{
                  background: 'none', border: 'none', color: 'var(--accent-2)',
                  fontFamily: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  padding: '4px 0', display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <span style={{
                  display: 'inline-block', transition: 'transform 0.2s',
                  transform: showAdvanced ? 'rotate(90deg)' : 'rotate(0deg)',
                }}>▶</span>
                Poids avancés
              </button>

              {showAdvanced && (
                <div style={{
                  marginTop: 10, padding: 14, borderRadius: 10,
                  background: 'var(--bg-2)', border: '1px solid var(--border)',
                  display: 'flex', flexDirection: 'column', gap: 12,
                }}>
                  <div className="eyebrow" style={{ marginBottom: 2 }}>POIDS DES SIGNAUX</div>
                  <div className="fr" style={{ marginBottom: 6 }}>
                    Poids ajustables pour chaque signal de comportement
                  </div>
                  {['weight_velocity', 'weight_accel', 'weight_proximity', 'weight_object'].map((k) => (
                    <Slider key={k} label={wLabel[k]} value={cfg[k]} min={0} max={100} unit="%"
                      onChange={(v) => set(k, v)} hint={wHint[k]} />
                  ))}
                </div>
              )}
            </div>
          </Section>

          <ZonePreview riskThreshold={cfg.riskThreshold} warnThreshold={cfg.warnThreshold} />

          <Divider />

          <Section title="QUALITÉ IMAGE" subtitle="Résolution et compression du flux et des captures">
            <FormGrid cols={2}>
              <Slider label="Qualité stream" value={cfg.stream_jpeg_quality} min={50} max={100} unit="%"
                onChange={(v) => set('stream_jpeg_quality', v)} hint="JPEG compression du flux live" />
              <Slider label="Qualité snapshots" value={cfg.snapshot_jpeg_quality} min={50} max={100} unit="%"
                onChange={(v) => set('snapshot_jpeg_quality', v)} hint="JPEG compression des captures" />
              <SelectField label="Résolution stream" value={String(cfg.stream_width)}
                onChange={(v) => set('stream_width', Number(v))}
                options={[{value:'640',label:'640p'},{value:'854',label:'854p'},{value:'1280',label:'1280p'}]} />
              <SelectField label="Taille snapshots" value={String(cfg.snapshot_width)}
                onChange={(v) => set('snapshot_width', Number(v))}
                options={[{value:'240',label:'240px'},{value:'320',label:'320px'},{value:'480',label:'480px'},{value:'640',label:'640px'}]} />
            </FormGrid>
          </Section>

          <Divider />

          <Section title="NOTIFICATIONS" subtitle="Canaux d'alerte">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <ToggleCard label="Auto-dispatch agents" hint="Envoyer les équipes sans confirmation"
                value={cfg.autoDispatch} onChange={(v) => set('autoDispatch', v)} />
              <ToggleCard label="Notifications email" hint="alertes@atlas.ma"
                value={cfg.notifyEmail} onChange={(v) => set('notifyEmail', v)} />
              <ToggleCard label="Notifications SMS" hint="+212 661 …"
                value={cfg.notifySms} onChange={(v) => set('notifySms', v)} />
              <ToggleCard label="Push mobile" hint="App superviseur"
                value={cfg.notifyPush} onChange={(v) => set('notifyPush', v)} />
            </div>
          </Section>

          <Divider />

          <Section title="SÉCURITÉ" subtitle="Authentification et données">
            <FormGrid cols={2}>
              <SelectField label="Langue interface" value={cfg.language}
                onChange={(v) => set('language', v)}
                options={[{ value: 'fr', label: 'Français' }, { value: 'en', label: 'English' }, { value: 'ar', label: 'العربية' }]} />
              <SelectField label="Rétention vidéo (jours)" value={String(cfg.retentionDays)}
                onChange={(v) => set('retentionDays', Number(v))}
                options={['7', '14', '30', '60', '90']} />
              <ToggleCard label="Authentification 2FA"
                hint="Code TOTP obligatoire pour toute connexion"
                value={cfg.mfaEnabled} onChange={(v) => set('mfaEnabled', v)} />
              <TextField label="Token API" value={cfg.apiToken} onChange={(v) => set('apiToken', v)} readOnly />
            </FormGrid>
          </Section>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
            <Button onClick={handleReset}>Réinitialiser</Button>
            <Button variant="primary" onClick={handleSave}>
              <Icon.Check size={14} /> Enregistrer
            </Button>
          </div>
        </div>

        {/* Right: system status */}
        <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div className="eyebrow">SYSTEM STATUS</div>
            <div className="fr" style={{ marginTop: 2 }}>Tous les services sont opérationnels</div>
          </div>

          <StatusRow icon={<Icon.Cpu size={14} />} label="IA Model ACS-7" status="ok" value="18 ms" />
          <StatusRow icon={<Icon.Camera size={14} />} label="Stream caméras" status="ok" value="412 / 418" />
          <StatusRow icon={<Icon.Radio size={14} />} label="Comms équipes" status="ok" value="100%" />
          <StatusRow icon={<Icon.Wifi size={14} />} label="Réseau backbone" status="ok" value="1.2 Gbps" />
          <StatusRow icon={<Icon.Activity size={14} />} label="Telemetry agents" status="warn" value="184 / 192" />
          <StatusRow icon={<Icon.Mail size={14} />} label="Notifications" status="ok" value="< 1s" />

          <div style={{
            marginTop: 4, padding: '12px 14px', borderRadius: 10,
            background: 'var(--bg-2)', border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="eyebrow">UPTIME</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--green-2)' }}>99.97%</span>
            </div>
            <div className="num" style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>14j 06h 22m</div>
          </div>

          <Button variant="danger" style={{ marginTop: 4 }} onClick={() => show('Redémarrage IA programmé')}>
            <Icon.RefreshCw size={14} /> Redémarrer le moteur IA
          </Button>
        </div>
      </div>

      <Toast message={toast} onClose={hide} />
    </div>
  );
}

const ZONE_NAMES = [
  { id: 'G1', name: 'Porte 1 Nord', fr: 'Nord' },
  { id: 'G2', name: 'Porte 2 N-E', fr: 'Nord-Est' },
  { id: 'G3', name: 'Porte 3 Est', fr: 'Est' },
  { id: 'G4', name: 'Porte 4 S-E', fr: 'Sud-Est' },
  { id: 'G5', name: 'Porte 5 Sud', fr: 'Sud' },
  { id: 'G6', name: 'Porte 6 Ouest', fr: 'Ouest' },
];

function ZonePreview({ riskThreshold, warnThreshold }) {
  const [zones, setZones] = useState(null);
  useEffect(() => {
    fetchLiveState().then((data) => setZones(data.zones)).catch(() => {});
  }, []);

  const items = useMemo(() => {
    if (!zones) return null;
    return zones.map((z, i) => {
      const r = z.risk;
      const label = r >= riskThreshold ? 'CRITICAL' : r >= warnThreshold ? 'WARNING' : r >= 50 ? 'WATCH' : 'SAFE';
      const color = r >= riskThreshold ? '#ef4444' : r >= warnThreshold ? '#f59e0b' : '#22c55e';
      return { ...ZONE_NAMES[i] || ZONE_NAMES[0], pct: r, label, color };
    });
  }, [zones, riskThreshold, warnThreshold]);

  return (
    <div style={{ marginTop: 12 }}>
      <div className="eyebrow" style={{ marginBottom: 6 }}>APERÇU ZONES</div>
      <div className="fr" style={{ marginBottom: 8 }}>
        Coloration selon les seuils actuels — {items?.length || 0} zones
      </div>
      {items ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {items.map((item) => (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '6px 10px', borderRadius: 8,
              background: 'var(--bg-2)', fontSize: 12,
            }}>
              <span style={{ width: 100, fontWeight: 600, fontSize: 11.5 }}>{item.name}</span>
              <div style={{
                flex: 1, height: 6, borderRadius: 4,
                background: 'rgba(255,255,255,0.08)', overflow: 'hidden',
              }}>
                <div style={{
                  width: `${item.pct}%`, height: '100%', borderRadius: 4,
                  background: item.color,
                  boxShadow: `0 0 6px ${item.color}66`,
                  transition: 'all 0.2s',
                }} />
              </div>
              <span style={{
                width: 36, textAlign: 'right', fontFamily: 'var(--font-mono)',
                fontWeight: 700, fontSize: 11.5, color: item.color,
              }}>{item.pct}%</span>
              <span style={{
                padding: '2px 7px', borderRadius: 4, fontSize: 9.5,
                fontWeight: 800, letterSpacing: '0.08em',
                color: item.color, background: `${item.color}22`,
                minWidth: 60, textAlign: 'center',
              }}>{item.label}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="fr" style={{ fontSize: 12, color: 'var(--fg-3)', padding: '12px 0' }}>
          Aucune donnée live
        </div>
      )}
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 2 }}>{title}</div>
      {subtitle && <div className="fr" style={{ marginBottom: 10 }}>{subtitle}</div>}
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--border)' }} />;
}

function ToggleCard({ label, hint, value, onChange }) {
  return (
    <div style={{
      padding: '12px 14px', borderRadius: 10,
      background: 'var(--bg-2)', border: '1px solid var(--border)',
    }}>
      <Toggle label={label} hint={hint} value={value} onChange={onChange} />
    </div>
  );
}

function StatusRow({ icon, label, status, value }) {
  const color = status === 'ok' ? 'var(--green-2)' : status === 'warn' ? 'var(--orange-2)' : 'var(--red-2)';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 12px', borderRadius: 10,
      background: 'var(--bg-2)', border: '1px solid var(--border)',
    }}>
      <span style={{
        width: 30, height: 30, borderRadius: 8,
        background: `color-mix(in oklab, ${color} 18%, transparent)`,
        color, display: 'grid', placeItems: 'center', flex: 'none',
      }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
      </div>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 11.5, color, fontWeight: 600,
      }}>{value}</div>
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: color, boxShadow: `0 0 8px ${color}`,
        animation: 'pulseDot 1.8s ease-in-out infinite',
      }} />
    </div>
  );
}
