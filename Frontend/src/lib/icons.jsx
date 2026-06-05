// Inline SVG icon set. Each component takes standard SVG props.
import React from 'react';

const base = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };

export const Icon = {
  Shield: (p) => (
    <svg {...base} width={p.size || 18} height={p.size || 18} {...p}>
      <path d="M12 2 L4 5 V11 C 4 16, 8 20, 12 22 C 16 20, 20 16, 20 11 V5 Z" />
      <path d="M9 12 l2.2 2.2 L15 10" />
    </svg>
  ),
  ShieldCheck: (p) => (
    <svg {...base} {...p}>
      <path d="M12 2 4 5v6c0 5 4 9 8 11 4-2 8-6 8-11V5l-8-3Z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  Bell: (p) => (
    <svg {...base} {...p}>
      <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
      <path d="M10 18a2 2 0 0 0 4 0" />
    </svg>
  ),
  Settings: (p) => (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8L4.2 7a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1A2 2 0 1 1 19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </svg>
  ),
  Dispatch: (p) => (
    <svg {...base} strokeWidth="2" {...p}>
      <path d="M5 12h13M13 6l6 6-6 6" />
    </svg>
  ),
  Check: (p) => <svg {...base} strokeWidth="2" {...p}><path d="M5 12l4 4 10-10" /></svg>,
  X: (p) => <svg {...base} {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>,
  Plus: (p) => <svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>,
  Pencil: (p) => <svg {...base} {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" /></svg>,
  Trash: (p) => (
    <svg {...base} {...p}>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
  ),
  Qr: (p) => (
    <svg {...base} {...p}>
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3h-3zM21 14v3M17 18v3M14 21h3" />
    </svg>
  ),
  Eye: (p) => <svg {...base} {...p}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>,
  Camera: (p) => <svg {...base} {...p}><rect x="2" y="6" width="18" height="12" rx="2" /><circle cx="11" cy="12" r="3" /><path d="M22 8v8" /></svg>,
  Users: (p) => <svg {...base} {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></svg>,
  Radio: (p) => <svg {...base} {...p}><circle cx="12" cy="12" r="2" /><path d="M16.2 7.8a6 6 0 0 1 0 8.4M7.8 16.2a6 6 0 0 1 0-8.4M19 5a10 10 0 0 1 0 14M5 19A10 10 0 0 1 5 5" /></svg>,
  Clock: (p) => <svg {...base} {...p}><circle cx="12" cy="12" r="10" /><path d="M12 7v5l3 2" /></svg>,
  Door: (p) => <svg {...base} {...p}><path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" /><path d="M14 12h.01" /></svg>,
  Calendar: (p) => <svg {...base} {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>,
  Pin: (p) => <svg {...base} {...p}><path d="M20 10c0 7-8 12-8 12s-8-5-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>,
  Copy: (p) => <svg {...base} {...p}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>,
  ChevronLeft: (p) => <svg {...base} strokeWidth="2" {...p}><path d="M15 18l-6-6 6-6" /></svg>,
  ChevronRight: (p) => <svg {...base} strokeWidth="2" {...p}><path d="M9 18l6-6-6-6" /></svg>,
  Upload: (p) => <svg {...base} {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5M12 3v12" /></svg>,
  Logout: (p) => <svg {...base} {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>,
  Search: (p) => <svg {...base} {...p}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" /></svg>,
  Activity: (p) => <svg {...base} {...p}><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>,
  Mail: (p) => <svg {...base} {...p}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 7l10 7 10-7" /></svg>,
  Lock: (p) => <svg {...base} {...p}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
  Trophy: (p) => <svg {...base} {...p}><path d="M8 21h8M12 17v4M17 4H7v6a5 5 0 0 0 10 0V4Z" /><path d="M17 6h2a2 2 0 0 1 2 2v0a4 4 0 0 1-4 4M7 6H5a2 2 0 0 0-2 2v0a4 4 0 0 0 4 4" /></svg>,
  AlertTri: (p) => <svg {...base} {...p}><path d="M10.3 3.1 1.8 17.3a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.1a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></svg>,
  WC: (p) => <svg {...base} {...p}><circle cx="8" cy="5" r="2" /><path d="M6 21v-7H4l2-6h4l2 6h-2v7H6Z" /><circle cx="17" cy="5" r="2" /><path d="M14 12l1.5 5h1V21h3v-4h1l1.5-5h-3l-1 4-1-4h-3Z" /></svg>,
  Exit: (p) => <svg {...base} {...p}><path d="M15 3h6v6M21 3l-9 9M21 9V3h-6" /><path d="M9 21H5a2 2 0 0 1-2-2v-4" /></svg>,
  Family: (p) => <svg {...base} {...p}><circle cx="9" cy="6" r="2" /><path d="M5 14a4 4 0 0 1 8 0v7H5v-7Z" /><circle cx="17" cy="9" r="1.5" /><path d="M15 14a2 2 0 0 1 4 0v6h-4v-6Z" /></svg>,
  Accessibility: (p) => <svg {...base} {...p}><circle cx="12" cy="4" r="2" /><path d="M19 13v-2c-3 0-7-2-7-2s-3 2-7 2v2c2.5 0 4 .5 4 .5L8 22M16 22l-2-7" /></svg>,
  Phone: (p) => <svg {...base} {...p}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.7.6 2.5a2 2 0 0 1-.5 2.1L7.9 9.4a16 16 0 0 0 6 6l1.1-1.1a2 2 0 0 1 2.1-.5c.8.3 1.6.5 2.5.6a2 2 0 0 1 1.7 2Z" /></svg>,
  Map: (p) => <svg {...base} {...p}><path d="M9 3L2 6v15l7-3 6 3 7-3V3l-7 3-6-3Z" /><path d="M9 3v15M15 6v15" /></svg>,
  Cpu: (p) => <svg {...base} {...p}><rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" /><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" /></svg>,
  Wifi: (p) => <svg {...base} {...p}><path d="M5 12.55a11 11 0 0 1 14 0M2 8.82a16 16 0 0 1 20 0M8.5 16.43a6 6 0 0 1 7 0" /><circle cx="12" cy="20" r="1" /></svg>,
  RefreshCw: (p) => <svg {...base} {...p}><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" /></svg>,
};
