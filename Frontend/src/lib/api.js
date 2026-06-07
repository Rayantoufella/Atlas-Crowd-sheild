import API_BASE from './config.js';
import { STADIUMS } from './data.js';

async function get(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

async function del(path) {
  const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`);
  return res.json();
}

async function put(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status}`);
  return res.json();
}

async function post(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json();
}

function riskStatus(r) {
  if (r >= 75) return 'crit';
  if (r >= 55) return 'warn';
  return 'ok';
}

function backendZoneToFrontend(backendZone) {
  const map = {
    gate_1: 'G1', gate_2: 'G2', gate_3: 'G3',
    gate_4: 'G4', gate_5: 'G5', gate_6: 'G6',
  };
  const gateNames = {
    G1: 'Gate 1 North', G2: 'Gate 2 NE', G3: 'Gate 3 East',
    G4: 'Gate 4 SE', G5: 'Gate 5 South', G6: 'Gate 6 West',
  };
  const gateFr = {
    G1: 'Porte 1 Nord', G2: 'Porte 2 N-E', G3: 'Porte 3 Est',
    G4: 'Porte 4 S-E', G5: 'Porte 5 Sud', G6: 'Porte 6 Ouest',
  };
  const code = map[backendZone.id] || backendZone.id.toUpperCase();
  return {
    code,
    name: gateNames[code] || backendZone.label,
    fr: gateFr[code] || backendZone.label,
    risk: backendZone.risk,
    status: riskStatus(backendZone.risk),
    density: backendZone.density || 'low',
  };
}

function gateStateFromRisk(risk) {
  if (risk >= 75) return 'FERMÉ';
  if (risk >= 55) return 'RESTREINT';
  return 'OUVERT';
}

export async function fetchLiveState() {
  const data = await get('/api/zones/live');
  const zones = (data.zones || []).map(backendZoneToFrontend);
  const zoneRisks = zones.map((z) => z.risk);
  return {
    global_risk: data.global_risk || 0,
    match: data.match || '',
    minute: data.minute || 0,
    zones,
    zoneRisks,
    alert: data.alert || { active: false },
    zone_label: data.zone_label || 'CALM',
    approach_pairs_count: data.approach_pairs_count || 0,
    group_count: data.group_count || 0,
    approach_velocity_max: data.approach_velocity_max || 0,
    min_ttc: data.min_ttc || 999,
    stats: data.stats || {
      supporters_inside: 0,
      agents_deployed: 0,
      incidents_prevented: 0,
      cameras_active: 0,
      cameras_total: 0,
    },
  };
}

const STADIUM_IDS = {
  'moulay abdellah': 'moulay',
  'grand stade casablanca': 'casablanca',
  'ibn batouta': 'tanger',
  'grand stade agadir': 'agadir',
};

export async function fetchMatches() {
  const data = await get('/api/match/list');
  return data.map((m) => {
    const sid = STADIUM_IDS[(m.stadium || '').toLowerCase()] || m.stadium;
    const st = STADIUMS.find((s) => s.id === sid);
    return {
      id: m.id,
      backendId: m.id,
      teamA: m.team_a,
      teamB: m.team_b,
      competition: m.competition || 'CAN 2025',
      datetime: m.match_date,
      stadiumId: sid,
      stadium: m.stadium,
      capAuth: m.capacity,
      capacity: m.capacity,
      camerasActive: st?.cameras || 0,
      gatesActive: st?.gates || 0,
      agents: 0,
      status: m.status || 'UPCOMING',
    };
  });
}

export async function createMatch(data) {
  return post('/api/match/create', data);
}

export async function broadcastAlert(data) {
  return post('/api/alert/broadcast', data);
}

export async function startDemo() {
  return post('/start-demo', {});
}

export async function fetchCameras() {
  return get('/api/camera/list');
}

export async function fetchAgents() {
  return get('/api/agent/list');
}

export async function fetchEvents() {
  return get('/api/event/latest');
}

export async function logEvent(data) {
  return post('/api/event/log', data);
}

export async function fetchReport(matchId) {
  return get(`/api/report/${matchId}`);
}

export async function fetchIncidents(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return get(`/api/report/incidents${qs ? '?' + qs : ''}`);
}

export async function fetchIncidentDetail(id) {
  return get(`/api/report/incident/${id}`);
}

export async function fetchMatchSummary(matchId) {
  return get(`/api/report/match-summary/${matchId}`);
}

export async function createIncident(data) {
  return post('/api/report/incidents', data);
}

export function exportIncidentsPDF(params = {}) {
  const qs = new URLSearchParams(params).toString();
  window.open(`${API_BASE}/api/report/incidents/export${qs ? '?' + qs : ''}`, '_blank');
}

export function exportMatchPDF(matchId) {
  window.open(`${API_BASE}/api/report/match-summary/${matchId}/export`, '_blank');
}

export async function fetchSettings() {
  return get('/api/settings');
}

export async function saveSettings(data) {
  const res = await fetch(`${API_BASE}/api/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`PUT /api/settings failed: ${res.status}`);
  return res.json();
}

export function gateStateFromRiskScore(risk) {
  return gateStateFromRisk(risk);
}

/* ---- Admin CRUD helpers ---- */

export async function updateMatch(id, data) {
  return put(`/api/match/${id}`, data);
}

export async function deleteMatch(id) {
  return del(`/api/match/${id}`);
}

export async function createCamera(data) {
  return post('/api/camera/create', data);
}

export async function updateCamera(id, data) {
  return put(`/api/camera/${id}`, data);
}

export async function deleteCamera(id) {
  return del(`/api/camera/${id}`);
}

export async function createAgent(data) {
  return post('/api/agent/create', data);
}

export async function updateAgent(id, data) {
  return put(`/api/agent/${id}`, data);
}

export async function deleteAgent(id) {
  return del(`/api/agent/${id}`);
}

export async function fetchZones() {
  return get('/api/zones');
}

export async function updateZone(gateId, data) {
  return put(`/api/zones/${gateId}`, data);
}
