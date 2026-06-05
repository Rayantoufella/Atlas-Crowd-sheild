// Mock data for Atlas Crowd Shield front-end.
// In production this would come from your backend API.

import { FLAGS } from './flags.js';

// ---------- Stadiums ----------
export const STADIUMS = [
  { id: 'moulay',    name: 'Moulay Abdellah',         city: 'Rabat',      capacity: 68500, cameras: 48, gates: 6 },
  { id: 'casablanca',name: 'Grand Stade Casablanca',  city: 'Casablanca', capacity: 93000, cameras: 62, gates: 8 },
  { id: 'tanger',    name: 'Ibn Batouta',             city: 'Tanger',     capacity: 65000, cameras: 40, gates: 6 },
  { id: 'agadir',    name: 'Grand Stade Agadir',      city: 'Agadir',     capacity: 45000, cameras: 32, gates: 4 },
];

export const COMPETITIONS = ['CAN 2025', 'Mondial 2030', 'Botola', 'Amical'];

// ---------- Matches ----------
export const SEED_MATCHES = [
  {
    id: 'm-001', teamA: 'MA', teamB: 'SN', competition: 'CAN 2025',
    datetime: '2026-06-10T20:00', stadiumId: 'moulay',
    capAuth: 65000, camerasActive: 48, gatesActive: 6, agents: 1847,
    status: 'LIVE',
  },
  {
    id: 'm-002', teamA: 'MA', teamB: 'CI', competition: 'CAN 2025',
    datetime: '2026-06-14T18:00', stadiumId: 'casablanca',
    capAuth: 80000, camerasActive: 60, gatesActive: 8, agents: 2100,
    status: 'UPCOMING',
  },
  {
    id: 'm-003', teamA: 'MA', teamB: 'EG', competition: 'Amical',
    datetime: '2026-06-04T21:00', stadiumId: 'tanger',
    capAuth: 60000, camerasActive: 38, gatesActive: 4, agents: 1500,
    status: 'FINISHED',
  },
];

// ---------- Gates (6 zones for the active stadium) ----------
export const GATES = [
  { idx: 0, code: 'G1', name: 'Gate 1 North',  fr: 'Porte 1 Nord',   cap: 12400, occ: 9120,  base: 38, sector: 'Nord', loc: 'Tribune Nord — accès principal' },
  { idx: 1, code: 'G2', name: 'Gate 2 NE',     fr: 'Porte 2 N-E',    cap: 10800, occ: 9402,  base: 58, sector: 'Nord-Est', loc: 'Tribune Nord-Est' },
  { idx: 2, code: 'G3', name: 'Gate 3 East',   fr: 'Porte 3 Est',    cap: 11200, occ: 11104, base: 91, sector: 'Est', loc: 'Tribune Est — VIP' },
  { idx: 3, code: 'G4', name: 'Gate 4 SE',     fr: 'Porte 4 S-E',    cap: 10800, occ: 8820,  base: 63, sector: 'Sud-Est', loc: 'Tribune Sud-Est' },
  { idx: 4, code: 'G5', name: 'Gate 5 South',  fr: 'Porte 5 Sud',    cap: 12400, occ: 8640,  base: 36, sector: 'Sud', loc: 'Tribune Sud — familles' },
  { idx: 5, code: 'G6', name: 'Gate 6 West',   fr: 'Porte 6 Ouest',  cap: 10200, occ: 6320,  base: 29, sector: 'Ouest', loc: 'Tribune Ouest' },
];

// ---------- Cameras (8 for demo) ----------
export const SEED_CAMERAS = [
  { id: 'CAM-01', zone: 'Nord',     loc: 'Entrée G1 — auvent', resolution: '4K', fps: 60, status: 'ACTIVE',  lat: 33.9716, lng: -6.8498, ip: '10.0.1.21' },
  { id: 'CAM-02', zone: 'Nord-Est', loc: 'Tribune NE — niveau 2', resolution: '4K', fps: 60, status: 'ACTIVE',  lat: 33.9717, lng: -6.8492, ip: '10.0.1.22' },
  { id: 'CAM-03', zone: 'Est',      loc: 'Couloir VIP Est',     resolution: '4K', fps: 60, status: 'ACTIVE',  lat: 33.9718, lng: -6.8488, ip: '10.0.1.23' },
  { id: 'CAM-04', zone: 'Est',      loc: 'Porte 3 — extérieur', resolution: '4K', fps: 60, status: 'ACTIVE',  lat: 33.9719, lng: -6.8487, ip: '10.0.1.24' },
  { id: 'CAM-05', zone: 'Sud-Est',  loc: 'Tribune SE — accès',  resolution: '1080p', fps: 30, status: 'OFFLINE', lat: 33.9714, lng: -6.8489, ip: '10.0.1.25' },
  { id: 'CAM-06', zone: 'Sud',      loc: 'Aire familles',       resolution: '4K', fps: 60, status: 'ACTIVE',  lat: 33.9712, lng: -6.8495, ip: '10.0.1.26' },
  { id: 'CAM-07', zone: 'Sud',      loc: 'Sortie urgence Sud',  resolution: '1080p', fps: 30, status: 'OFFLINE', lat: 33.9713, lng: -6.8500, ip: '10.0.1.27' },
  { id: 'CAM-08', zone: 'Ouest',    loc: 'Tribune Ouest — haute',resolution: '4K', fps: 60, status: 'ACTIVE',  lat: 33.9715, lng: -6.8503, ip: '10.0.1.28' },
];

export const CAMERA_RESOLUTIONS = ['720p', '1080p', '4K', '8K'];
export const CAMERA_FPS = [24, 30, 60, 120];

// ---------- Agents (6 demo) ----------
export const SEED_AGENTS = [
  { id: 'A-2401', nom: 'El Amrani',  prenom: 'Yassine',  matricule: 'MR-1041', sector: 'Est',      gateCode: 'G3', phone: '+212 661 11 22 33', status: 'DEPLOYED' },
  { id: 'A-2402', nom: 'Bennani',    prenom: 'Salma',    matricule: 'MR-1042', sector: 'Nord',     gateCode: 'G1', phone: '+212 661 22 33 44', status: 'DEPLOYED' },
  { id: 'A-2403', nom: 'Toumi',      prenom: 'Karim',    matricule: 'MR-1043', sector: 'Sud',      gateCode: 'G5', phone: '+212 661 33 44 55', status: 'STANDBY' },
  { id: 'A-2404', nom: 'Cherkaoui',  prenom: 'Rachid',   matricule: 'MR-1044', sector: 'Ouest',    gateCode: 'G6', phone: '+212 661 44 55 66', status: 'DEPLOYED' },
  { id: 'A-2405', nom: 'Mansouri',   prenom: 'Imane',    matricule: 'MR-1045', sector: 'Nord-Est', gateCode: 'G2', phone: '+212 661 55 66 77', status: 'STANDBY' },
  { id: 'A-2406', nom: 'Ouali',      prenom: 'Mehdi',    matricule: 'MR-1046', sector: 'Sud-Est',  gateCode: 'G4', phone: '+212 661 66 77 88', status: 'OFF' },
];

export const AGENT_STATUSES = ['DEPLOYED', 'STANDBY', 'OFF'];
export const SECTORS = ['Nord', 'Nord-Est', 'Est', 'Sud-Est', 'Sud', 'Ouest'];

// ---------- Gate operational state ----------
// State cycles OUVERT (open) → RESTREINT (restricted) → FERMÉ (closed)
export const GATE_STATES = ['OUVERT', 'RESTREINT', 'FERMÉ'];

export const SEED_GATES = GATES.map((g, i) => ({
  ...g,
  state: i === 2 ? 'RESTREINT' : i === 5 ? 'OUVERT' : 'OUVERT',
  agents: [38, 32, 56, 34, 28, 22][i],
  maxFlow: [1200, 1100, 1100, 1100, 1200, 1000][i],
  cameras: [
    ['CAM-01'],
    ['CAM-02'],
    ['CAM-03', 'CAM-04'],
    [],
    ['CAM-06', 'CAM-07'],
    ['CAM-08'],
  ][i],
}));

// ---------- Initial event log ----------
export const SEED_EVENTS = [
  { time: '22:41:08', level: 'CRIT', zone: 'G3', message: 'Crowd compression detected · 4.8 ppl/m²' },
  { time: '22:38:42', level: 'WARN', zone: 'G2', message: 'Density rising · +18% in 60s' },
  { time: '22:35:17', level: 'OK',   zone: 'G5', message: 'Crew Bravo dispatched' },
  { time: '22:32:01', level: 'WARN', zone: 'G4', message: 'Queue depth +18%' },
  { time: '22:28:55', level: 'OK',   zone: '—',  message: 'CCTV-114 reconnected' },
  { time: '22:25:12', level: 'OK',   zone: '—',  message: 'Half-time prep completed' },
  { time: '22:21:33', level: 'WARN', zone: 'G3', message: 'Flow rate exceeds nominal' },
  { time: '22:18:09', level: 'OK',   zone: 'G1', message: 'Shift change · crew Alpha' },
];

// ---------- helpers ----------
export function fmtTeam(code) {
  const f = FLAGS[code];
  return f ? `${f.name} ${f.emoji}` : code;
}

export function stadiumById(id) {
  return STADIUMS.find((s) => s.id === id);
}

export function statusFromRisk(r) {
  return r >= 75 ? 'crit' : r >= 55 ? 'warn' : 'ok';
}

export function deriveZoneRisks(globalRisk) {
  const baseMean = GATES.reduce((s, g) => s + g.base, 0) / GATES.length;
  const shift = globalRisk - baseMean;
  return GATES.map((g) => Math.max(0, Math.min(100, Math.round(g.base + shift))));
}
