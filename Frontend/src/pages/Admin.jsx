// Admin shell — left sidebar driven by SECTIONS config, right content area.
import React, { useState, useEffect } from 'react';
import { Icon } from '../lib/icons.jsx';
import { fetchCameras, fetchAgents, fetchMatches } from '../lib/api.js';

const SECTIONS = [
  { key: 'matchs',     label: 'Matchs',     icon: <Icon.Trophy size={16} />, comp: React.lazy(() => import('./admin/Matchs.jsx')) },
  { key: 'cameras',    label: 'Caméras',    icon: <Icon.Camera size={16} />, comp: React.lazy(() => import('./admin/Cameras.jsx')) },
  { key: 'agents',     label: 'Agents',     icon: <Icon.Users size={16} />, comp: React.lazy(() => import('./admin/Agents.jsx')) },
  { key: 'portes',     label: 'Portes',     icon: <Icon.Door size={16} />, comp: React.lazy(() => import('./admin/Portes.jsx')) },
  { key: 'parametres', label: 'Paramètres', icon: <Icon.Settings size={16} />, comp: React.lazy(() => import('./admin/Parametres.jsx')) },
];

export default function Admin({ section, navigate }) {
  const [badges, setBadges] = useState({ matchs: 0, cameras: 0, agents: 0, portes: 6 });

  const fetchBadges = () => {
    fetchMatches().then((d) => setBadges((b) => ({ ...b, matchs: d.length }))).catch(() => {});
    fetchCameras().then((d) => setBadges((b) => ({ ...b, cameras: d.length }))).catch(() => {});
    fetchAgents().then((d) => setBadges((b) => ({ ...b, agents: d.length }))).catch(() => {});
  };

  useEffect(() => { fetchBadges(); }, []);

  const active = section || 'matchs';
  const go = (k) => navigate(`/admin/${k}`);
  const ActiveComp = SECTIONS.find((s) => s.key === active)?.comp;

  return (
    <main style={{
      position: 'relative', zIndex: 1,
      display: 'grid', gridTemplateColumns: '220px 1fr',
      gap: 18, maxWidth: 1480, margin: '0 auto',
      padding: '24px 28px 40px',
    }}>
      {/* Sidebar */}
      <aside className="card" style={{
        padding: '14px 10px', position: 'sticky', top: 84,
        height: 'fit-content', display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        <div className="eyebrow" style={{ padding: '4px 12px 10px' }}>ADMIN · MENU</div>
        {SECTIONS.map((s) => {
          const isActive = s.key === active;
          return (
            <button
              key={s.key}
              onClick={() => go(s.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10,
                background: isActive ? 'color-mix(in oklab, var(--red) 12%, transparent)' : 'transparent',
                color: isActive ? 'var(--fg-0)' : 'var(--fg-2)',
                border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontWeight: isActive ? 700 : 500, fontSize: 13.5,
                position: 'relative', textAlign: 'left',
                borderLeft: isActive ? '3px solid var(--red-2)' : '3px solid transparent',
                paddingLeft: isActive ? 9 : 12,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ color: isActive ? 'var(--red-2)' : 'var(--fg-2)' }}>{s.icon}</span>
              <span style={{ flex: 1 }}>{s.label}</span>
              {badges[s.key] != null && (
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
                  padding: '2px 7px', borderRadius: 99,
                  background: 'var(--bg-3)', color: 'var(--fg-2)',
                  border: '1px solid var(--border)',
                }}>{badges[s.key]}</span>
              )}
            </button>
          );
        })}

        <div style={{ marginTop: 14, padding: '10px 12px', borderTop: '1px solid var(--border)' }}>
          <div className="eyebrow" style={{ marginBottom: 4 }}>SYSTEM</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--green-2)', boxShadow: '0 0 8px var(--green-2)',
              animation: 'pulseDot 1.8s ease-in-out infinite',
            }} />
            All systems operational
          </div>
        </div>
      </aside>

      {/* Content */}
      <section>
        {ActiveComp && <React.Suspense fallback={<div style={{padding:40,textAlign:'center',color:'var(--fg-2)'}}>Chargement...</div>}>
          <ActiveComp />
        </React.Suspense>}
      </section>
    </main>
  );
}
