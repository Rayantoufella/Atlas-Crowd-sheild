// Modal — overlay + body shell. Closes on overlay click or X button.
import React, { useEffect } from 'react';
import { Icon } from '../lib/icons.jsx';

export default function Modal({ open, onClose, title, subtitle, children, footer, width = 'default' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-body ${width === 'wide' ? 'wide' : width === 'narrow' ? 'narrow' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true"
      >
        <div className="modal-head">
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 2 }}>{subtitle}</div>}
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            style={{
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--fg-1)', width: 32, height: 32, borderRadius: 8,
              display: 'grid', placeItems: 'center', cursor: 'pointer',
            }}
          >
            <Icon.X />
          </button>
        </div>
        <div className="modal-content">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
