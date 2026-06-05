from flask import Blueprint, request, jsonify
from database import db
from models.alert import Alert

alerts_bp = Blueprint("alerts", __name__)


@alerts_bp.route("/api/alert/broadcast", methods=["POST"])
def broadcast_alert():
    data = request.get_json()

    alert = Alert(
        match_id=data.get("match_id", 1),
        zone_id=data["zone_id"],
        message=data["message"],
        eta_minutes=data.get("eta_minutes", 7),
        agents_needed=data.get("agents_needed", 12),
        redirect_to=data.get("redirect_to", "gate_5"),
        active=True,
    )
    db.session.add(alert)
    db.session.commit()

    return jsonify({
        "status": "broadcast_sent",
        "alert_id": alert.id,
        "recipients": 68420,
    })
