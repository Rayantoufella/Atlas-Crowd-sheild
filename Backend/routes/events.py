from flask import Blueprint, jsonify, request
from database import db
from models.alert import Alert
from datetime import datetime, timedelta

events_bp = Blueprint("events", __name__)


@events_bp.route("/api/event/latest")
def latest_events():
    alerts = Alert.query.order_by(Alert.created_at.desc()).limit(20).all()
    if alerts:
        return jsonify([{
            "time": a.created_at.strftime("%H:%M:%S"),
            "level": "CRIT" if a.active else "INFO",
            "zone": a.zone_id.upper().replace("GATE_", "G"),
            "message": a.message,
        } for a in alerts])

    return jsonify([
        {"time": (datetime.utcnow() - timedelta(seconds=10)).strftime("%H:%M:%S"), "level": "CRIT", "zone": "G3", "message": "Crowd compression detected · 4.8 ppl/m²"},
        {"time": (datetime.utcnow() - timedelta(seconds=50)).strftime("%H:%M:%S"), "level": "WARN", "zone": "G2", "message": "Density rising · +18% in 60s"},
        {"time": (datetime.utcnow() - timedelta(seconds=90)).strftime("%H:%M:%S"), "level": "OK", "zone": "G5", "message": "Crew Bravo dispatched"},
    ])


@events_bp.route("/api/event/log", methods=["POST"])
def log_event():
    data = request.get_json()
    alert = Alert(
        match_id=data.get("match_id", 1),
        zone_id=data.get("zone_id", "gate_3"),
        message=data.get("message", ""),
        active=data.get("active", True),
    )
    db.session.add(alert)
    db.session.commit()
    return jsonify({"status": "logged", "alert_id": alert.id})
