// Login page — simple email + password.
// Demo creds shown right on the form: admin@atlas.ma / atlas2025
import React, { useState } from 'react';
import { Icon } from '../lib/icons.jsx';
import { Button } from '../components/Button.jsx';
import { TextField } from '../components/FormField.jsx';

const DEMO_EMAIL = 'admin@atlas.ma';
const DEMO_PASS  = 'atlas2025';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const submit = (e) => {
    e?.preventDefault?.();
    const next = {};
    if (!email) next.email = true;
    if (!pwd) next.pwd = true;
    setErr(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    setTimeout(() => {
      if (email === DEMO_EMAIL && pwd === DEMO_PASS) {
        onLogin({ email, name: 'M. Rousseau', role: 'admin' });
      } else {
        setErr({ form: 'Identifiants invalides — utilisez les credentials de démo.' });
        setSubmitting(false);
      }
    }, 500);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'grid', placeItems: 'center',
      padding: 24, position: 'relative', zIndex: 1,
    }}>
      {/* Brand mark */}
      <div style={{
        position: 'absolute', top: 28, left: 28,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, var(--accent-2), var(--accent-deep))',
          display: 'grid', placeItems: 'center', color: 'white',
          boxShadow: '0 4px 14px var(--accent-glow), 0 0 0 1px var(--border-strong) inset',
        }}><Icon.Shield size={18} /></div>
        <div style={{ lineHeight: 1.15 }}>
          <div style={{ fontWeight: 700, fontSize: 14.5 }}>Atlas Crowd Shield</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--fg-3)' }}>
            STADIUM SAFETY · OPERATIONS CONSOLE
          </div>
        </div>
      </div>

      <form onSubmit={submit} className={err.form ? 'shake' : ''}
        style={{
          width: '100%', maxWidth: 420,
          background: 'linear-gradient(180deg, var(--bg-elev), var(--bg-1))',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--r-2xl)', padding: 32,
          boxShadow: 'var(--shadow-soft)',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
        <div>
          <div className="eyebrow accent">SIGN IN · OPS CONSOLE</div>
          <h1 style={{
            margin: '6px 0 0', fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em',
          }}>Connexion sécurisée</h1>
          <div className="fr" style={{ marginTop: 2 }}>Accès opérations · authentification requise</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            error={err.email}
            placeholder="vous@atlas.ma"
          />
          <TextField
            label="Mot de passe"
            type="password"
            value={pwd}
            onChange={setPwd}
            error={err.pwd}
            placeholder="••••••••"
          />
        </div>

        {err.form && (
          <div style={{
            padding: '10px 14px', borderRadius: 10,
            background: 'color-mix(in oklab, var(--red) 14%, transparent)',
            border: '1px solid color-mix(in oklab, var(--red) 40%, transparent)',
            color: 'var(--red-2)', fontSize: 12.5,
          }}>{err.form}</div>
        )}

        <Button variant="primary" size="lg" type="submit" disabled={submitting}
          style={{ width: '100%' }}>
          {submitting ? 'Connexion…' : <><Icon.Lock size={16} /> Connexion</>}
        </Button>

        {/* Demo credentials */}
        <div style={{
          padding: '12px 14px', borderRadius: 10,
          background: 'var(--bg-2)', border: '1px dashed var(--border-strong)',
          fontSize: 12, color: 'var(--fg-2)',
        }}>
          <div className="eyebrow" style={{ marginBottom: 4 }}>DEMO CREDENTIALS</div>
          <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg-0)' }}>
            <span style={{ color: 'var(--fg-3)' }}>email </span>{DEMO_EMAIL}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg-0)' }}>
            <span style={{ color: 'var(--fg-3)' }}>pass  </span>{DEMO_PASS}
          </div>
        </div>
      </form>

      <div style={{
        position: 'absolute', bottom: 24,
        fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--fg-3)', letterSpacing: '0.08em',
      }}>
        SOC-2 TYPE II · ISO 27001 · v4.2.1
      </div>
    </div>
  );
}
