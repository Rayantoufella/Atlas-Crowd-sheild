from flask import Blueprint, request, jsonify
from database import db
from models.match import Match
from datetime import datetime, timedelta

MATCH_DURATION = timedelta(hours=3)

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


@match_bp.route("/api/match/<int:match_id>", methods=["PUT"])
def update_match(match_id):
    m = Match.query.get_or_404(match_id)
    data = request.get_json(force=True)
    if "team_a" in data: m.team_a = data["team_a"]
    if "team_b" in data: m.team_b = data["team_b"]
    if "stadium" in data: m.stadium = data["stadium"]
    if "match_date" in data: m.match_date = datetime.fromisoformat(data["match_date"])
    if "capacity" in data: m.capacity = data["capacity"]
    db.session.commit()
    return jsonify({"id": m.id}), 200


@match_bp.route("/api/match/<int:match_id>", methods=["DELETE"])
def delete_match(match_id):
    m = Match.query.get_or_404(match_id)
    db.session.delete(m)
    db.session.commit()
    return jsonify({"status": "deleted"}), 200


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
        "status": "LIVE" if m.match_date <= datetime.utcnow() <= m.match_date + MATCH_DURATION else ("UPCOMING" if m.match_date > datetime.utcnow() else "FINISHED"),
    } for m in matches])
