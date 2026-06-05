import API_BASE from './config.js';

async function get(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
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
    stats: data.stats || {
      supporters_inside: 0,
      agents_deployed: 0,
      incidents_prevented: 0,
      cameras_active: 0,
      cameras_total: 0,
    },
  };
}

export async function fetchMatches() {
  const data = await get('/api/match/list');
  return data.map((m, i) => ({
    id: `m-${String(i + 1).padStart(3, '0')}`,
    teamA: m.team_a === 'Maroc' ? 'MA' : m.team_a,
    teamB: m.team_b === 'Sénégal' ? 'SN' : m.team_b,
    competition: 'CAN 2025',
    datetime: m.match_date,
    stadiumId: 'moulay',
    capAuth: m.capacity,
    camerasActive: 48,
    gatesActive: 6,
    agents: 1847,
    status: m.status || 'UPCOMING',
  }));
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

export function gateStateFromRiskScore(risk) {
  return gateStateFromRisk(risk);
}
