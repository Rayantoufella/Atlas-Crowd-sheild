from flask import Blueprint, request, jsonify
from database import db
from models.match import Match
from datetime import datetime

match_bp = Blueprint("match", __name__)


@match_bp.route("/api/match/create", methods=["POST"])
def create_match():
    data = request.get_json()

    required = ["team_a", "team_b", "stadium", "match_date"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"Champ manquant : {field}"}), 400

    match = Match(
        team_a=data["team_a"],
        team_b=data["team_b"],
        stadium=data["stadium"],
        match_date=datetime.fromisoformat(data["match_date"]),
        capacity=data.get("capacity", 68500),
    )
    db.session.add(match)
    db.session.commit()

    return jsonify({
        "match_id": match.id,
        "qr_url": f"/api/match/{match.id}/qr",
        "status": "created",
    }), 201


@match_bp.route("/api/match/list")
def list_matches():
    matches = Match.query.order_by(Match.match_date.desc()).all()
    return jsonify([{
        "id": m.id,
        "team_a": m.team_a,
        "team_b": m.team_b,
        "stadium": m.stadium,
        "match_date": m.match_date.isoformat(),
        "capacity": m.capacity,
        "status": "UPCOMING" if m.match_date > datetime.utcnow() else "FINISHED",
    } for m in matches])
