from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
from database import db
from models.match import Match
from models.zone import Zone
from models.camera import Camera
from models.agent import Agent

zones_bp = Blueprint("zones", __name__)

current_state = None

DEFAULT_ZONES = [
    {"id": "gate_1", "label": "Porte 1 Nord", "risk": 28, "status": "safe", "density": "low"},
    {"id": "gate_2", "label": "Porte 2 Nord-Est", "risk": 22, "status": "safe", "density": "low"},
    {"id": "gate_3", "label": "Porte 3 Est", "risk": 20, "status": "safe", "density": "low"},
    {"id": "gate_4", "label": "Porte 4 Sud", "risk": 31, "status": "safe", "density": "low"},
    {"id": "gate_5", "label": "Porte 5 Ouest", "risk": 18, "status": "safe", "density": "low"},
    {"id": "gate_6", "label": "Porte 6 Nord-Ouest", "risk": 25, "status": "safe", "density": "low"},
]


def _match_status(m):
    if m.match_date <= datetime.utcnow() <= m.match_date + timedelta(hours=3):
        return "LIVE"
    return "UPCOMING" if m.match_date > datetime.utcnow() else "FINISHED"


@zones_bp.route("/api/zones/live")
def zones_live():
    now = datetime.utcnow()
    live_match = Match.query.filter(
        Match.match_date <= now,
        Match.match_date + timedelta(hours=3) >= now,
    ).order_by(Match.match_date.asc()).first()

    upcoming = Match.query.filter(Match.match_date > now).order_by(Match.match_date.asc()).first()

    match_obj = live_match or upcoming
    state = current_state if current_state else {}

    if not state.get("zones"):
        state["zones"] = DEFAULT_ZONES

    state["timestamp"] = now.isoformat() + "Z"

    if match_obj:
        state["match"] = f"{match_obj.team_a} vs {match_obj.team_b}"
        state["match_status"] = _match_status(match_obj)
    else:
        state["match"] = "—"
        state["match_status"] = "NONE"

    if not state.get("minute"):
        state["minute"] = 0 if not live_match else int((now - live_match.match_date).total_seconds() // 60)

    state.setdefault("global_risk", 28)
    state.setdefault("alert", {"active": False})

    cameras_total = Camera.query.count()
    cameras_active = Camera.query.filter_by(status="ACTIVE").count()
    agents_deployed = Agent.query.filter_by(status="DEPLOYED").count()

    state.setdefault("stats", {
        "supporters_inside": 68420,
        "agents_deployed": agents_deployed,
        "incidents_prevented": 0,
        "cameras_active": cameras_active,
        "cameras_total": cameras_total,
    })

    return jsonify(state)


@zones_bp.route("/api/zones/<string:gate_id>", methods=["PUT"])
def update_zone(gate_id):
    data = request.get_json(force=True)
    z = Zone.query.filter_by(gate_id=gate_id).first()
    if not z:
        z = Zone(gate_id=gate_id)
        db.session.add(z)
    if "label" in data: z.label = data["label"]
    if "risk_score" in data: z.risk_score = data["risk_score"]
    if "status" in data: z.status = data["status"]
    if "density" in data: z.density = data["density"]
    db.session.commit()
    return jsonify({
        "gate_id": z.gate_id,
        "label": z.label,
        "risk_score": z.risk_score,
        "status": z.status,
        "density": z.density,
    })
