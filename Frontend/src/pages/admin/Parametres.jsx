// Admin · Paramètres — left card (config sliders/toggles) + right card (system status).
import React, { useState } from 'react';
import { Icon } from '../../lib/icons.jsx';
import { Button } from '../../components/Button.jsx';
import { Badge } from '../../components/Badge.jsx';
import Toast, { useToast } from '../../components/Toast.jsx';
import {
  TextField, SelectField, Toggle, Slider, FormGrid,
} from '../../components/FormField.jsx';

const DEFAULTS = {
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
};

export default function Parametres() {
  const [cfg, setCfg] = useState(DEFAULTS);
  const { toast, show, hide } = useToast();
  const set = (k, v) => setCfg((c) => ({ ...c, [k]: v }));

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
                onChange={(v) => set('detectionMode', v)}
                options={[
                  { value: 'fast', label: 'Rapide (sensible)' },
                  { value: 'balanced', label: 'Équilibré' },
                  { value: 'strict', label: 'Strict (peu de faux positifs)' },
                ]} />
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
            <Button onClick={() => setCfg(DEFAULTS)}>Réinitialiser</Button>
            <Button variant="primary" onClick={() => show('Paramètres enregistrés')}>
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
