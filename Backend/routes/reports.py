from flask import Blueprint, jsonify, request
from database import db
from models.match import Match
from models.alert import Alert
from models.zone import Zone
from models.agent import Agent
from datetime import datetime

reports_bp = Blueprint("reports", __name__)


@reports_bp.route("/api/report/incidents")
def list_incidents():
    match_id = request.args.get("match_id", type=int)
    zone_id = request.args.get("zone_id")
    page = request.args.get("page", 1, type=int)
    per_page = 20

    query = Alert.query

    if match_id:
        query = query.filter_by(match_id=match_id)
    if zone_id:
        query = query.filter_by(zone_id=zone_id)

    total = query.count()
    alerts = query.order_by(Alert.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    items = []
    for a in alerts:
        match = Match.query.get(a.match_id)
        items.append({
            "id": a.id,
            "match_id": a.match_id,
            "match_label": f"{match.team_a} vs {match.team_b}" if match else "—",
            "zone_id": a.zone_id,
            "message": a.message,
            "eta_minutes": a.eta_minutes,
            "agents_needed": a.agents_needed,
            "redirect_to": a.redirect_to,
            "active": a.active,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        })

    by_zone = {}
    for a in items:
        z = a["zone_id"]
        by_zone[z] = by_zone.get(z, 0) + 1

    return jsonify({
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page,
        "by_zone": by_zone,
    })


@reports_bp.route("/api/report/incident/<int:incident_id>")
def incident_detail(incident_id):
    alert = Alert.query.get_or_404(incident_id)
    match = Match.query.get(alert.match_id)
    return jsonify({
        "id": alert.id,
        "match_id": alert.match_id,
        "match_label": f"{match.team_a} vs {match.team_b}" if match else "—",
        "zone_id": alert.zone_id,
        "message": alert.message,
        "eta_minutes": alert.eta_minutes,
        "agents_needed": alert.agents_needed,
        "redirect_to": alert.redirect_to,
        "active": alert.active,
        "created_at": alert.created_at.isoformat() if alert.created_at else None,
    })


@reports_bp.route("/api/report/match-summary/<int:match_id>")
def match_summary(match_id):
    match = Match.query.get_or_404(match_id)
    alerts = Alert.query.filter_by(match_id=match_id).order_by(Alert.created_at.desc()).all()
    zones = Zone.query.filter_by(match_id=match_id).all()
    agents = Agent.query.filter_by(match_id=match_id).all()

    active_alerts = [a for a in alerts if a.active]
    resolved_alerts = [a for a in alerts if not a.active]
    avg_eta = sum(a.eta_minutes or 0 for a in alerts) / len(alerts) if alerts else 0

    zone_data = []
    for z in zones:
        zone_alerts = sum(1 for a in alerts if a.zone_id == z.gate_id)
        zone_data.append({
            "gate_id": z.gate_id,
            "label": z.label,
            "risk_score": z.risk_score,
            "status": z.status,
            "density": z.density,
            "incidents": zone_alerts,
        })

    return jsonify({
        "match": {
            "id": match.id,
            "team_a": match.team_a,
            "team_b": match.team_b,
            "stadium": match.stadium,
            "match_date": match.match_date.isoformat(),
            "capacity": match.capacity,
            "status": "UPCOMING" if match.match_date > datetime.utcnow() else "FINISHED" if match.match_date < datetime.utcnow() else "LIVE",
        },
        "incidents": {
            "total": len(alerts),
            "active": len(active_alerts),
            "resolved": len(resolved_alerts),
            "avg_response_minutes": round(avg_eta, 1),
        },
        "zones": zone_data,
        "agents": {
            "total": len(agents),
            "active": sum(1 for a in agents if a.active),
        },
    })
