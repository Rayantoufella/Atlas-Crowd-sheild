// Top navigation bar — logo, 3 tabs, live clock, avatar + logout.
import React, { useEffect, useState } from 'react';
import { Icon } from '../lib/icons.jsx';

function useClock() {
  const [t, setT] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}`;
}

export default function NavBar({ activeTab, onTab, onLogout, user = 'M. Rousseau' }) {
  const clock = useClock();
  const tabs = [
    { key: 'ops',     label: 'Security Ops' },
    { key: 'forensic', label: 'Forensic' },
    { key: 'admin',   label: 'Admin' },
    { key: 'reports', label: 'Reports' },
  ];

  return (
    <header style={{
      display: 'flex', alignItems: 'center', gap: 24,
      padding: '14px 28px',
      background: 'color-mix(in oklab, var(--bg-1) 75%, transparent)',
      backdropFilter: 'blur(18px) saturate(140%)',
      WebkitBackdropFilter: 'blur(18px) saturate(140%)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 30,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, var(--accent-2), var(--accent-deep))',
          display: 'grid', placeItems: 'center', color: 'white',
          boxShadow: '0 4px 14px var(--accent-glow), 0 0 0 1px var(--border-strong) inset',
        }}>
          <Icon.Shield size={18} />
        </div>
        <div style={{ lineHeight: 1.15 }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, letterSpacing: '-0.01em' }}>Atlas Crowd Shield</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--fg-3)', letterSpacing: '0.06em' }}>
            v4.2.1 · CONNECTED
          </div>
        </div>
      </div>

      {/* Tabs */}
      <nav style={{
        display: 'flex', gap: 4, padding: 4,
        background: 'var(--bg-2)', borderRadius: 10, border: '1px solid var(--border)',
      }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onTab(t.key)}
            style={{
              padding: '7px 14px', borderRadius: 7,
              fontSize: 13, fontWeight: 600,
              color: activeTab === t.key ? 'var(--fg-0)' : 'var(--fg-2)',
              background: activeTab === t.key ? 'var(--bg-elev)' : 'transparent',
              boxShadow: activeTab === t.key
                ? '0 1px 0 var(--border-strong) inset, 0 1px 2px rgba(0,0,0,0.2)' : 'none',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div style={{ flex: 1 }} />

      {/* Live clock */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--fg-2)', letterSpacing: '0.08em',
      }}>
        <span className="live-dot" />LIVE · {clock}
      </div>

      {/* Avatar */}
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
        display: 'grid', placeItems: 'center', color: 'white',
        fontSize: 12, fontWeight: 700,
        boxShadow: '0 0 0 2px var(--bg-1)',
      }} title={user}>
        {user.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
      </div>

      {/* Logout */}
      <button onClick={onLogout} title="Se déconnecter"
        style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-strong)',
          color: 'var(--fg-1)', padding: '8px 10px', borderRadius: 10,
          display: 'grid', placeItems: 'center', cursor: 'pointer',
        }}>
        <Icon.Logout />
      </button>
    </header>
  );
}
