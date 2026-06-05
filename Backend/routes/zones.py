from flask import Blueprint, jsonify
from datetime import datetime

zones_bp = Blueprint("zones", __name__)

current_state = None

DEFAULT_STATE = {
    "timestamp": None,
    "match": "Maroc vs Sénégal",
    "minute": 67,
    "global_risk": 28,
    "zones": [
        {"id": "gate_1", "label": "Porte 1 Nord", "risk": 28, "status": "safe", "density": "low"},
        {"id": "gate_2", "label": "Porte 2 Nord-Est", "risk": 22, "status": "safe", "density": "low"},
        {"id": "gate_3", "label": "Porte 3 Est", "risk": 20, "status": "safe", "density": "low"},
        {"id": "gate_4", "label": "Porte 4 Sud", "risk": 31, "status": "safe", "density": "low"},
        {"id": "gate_5", "label": "Porte 5 Ouest", "risk": 18, "status": "safe", "density": "low"},
        {"id": "gate_6", "label": "Porte 6 Nord-Ouest", "risk": 25, "status": "safe", "density": "low"},
    ],
    "alert": {"active": False},
    "stats": {
        "supporters_inside": 68420,
        "agents_deployed": 1847,
        "incidents_prevented": 0,
        "cameras_active": 47,
        "cameras_total": 48,
    },
}


@zones_bp.route("/api/zones/live")
def zones_live():
    state = current_state if current_state else DEFAULT_STATE
    state["timestamp"] = datetime.utcnow().isoformat() + "Z"
    return jsonify(state)
