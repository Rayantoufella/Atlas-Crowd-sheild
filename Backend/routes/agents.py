from flask import Blueprint, jsonify, request
from database import db
from models.agent import Agent

agents_bp = Blueprint("agents", __name__)


def _agent_to_dict(a):
    return {
        "id": f"A-{a.id}",
        "nom": a.nom,
        "prenom": a.prenom,
        "matricule": a.matricule,
        "sector": a.sector,
        "gateCode": a.gateCode,
        "phone": a.phone,
        "status": a.status,
    }


@agents_bp.route("/api/agent/list")
def list_agents():
    agents = Agent.query.order_by(Agent.id).all()
    return jsonify([_agent_to_dict(a) for a in agents])


@agents_bp.route("/api/agent/create", methods=["POST"])
def create_agent():
    data = request.get_json(force=True)
    a = Agent(
        nom=data.get("nom", ""),
        prenom=data.get("prenom", ""),
        matricule=data.get("matricule", ""),
        sector=data.get("sector", ""),
        gateCode=data.get("gateCode", ""),
        phone=data.get("phone", ""),
        status=data.get("status", "STANDBY"),
    )
    db.session.add(a)
    db.session.commit()
    return jsonify(_agent_to_dict(a)), 201


@agents_bp.route("/api/agent/<int:agent_id>", methods=["PUT"])
def update_agent(agent_id):
    a = Agent.query.get_or_404(agent_id)
    data = request.get_json(force=True)
    for f in ("nom", "prenom", "matricule", "sector", "gateCode", "phone", "status"):
        if f in data:
            setattr(a, f, data[f])
    db.session.commit()
    return jsonify(_agent_to_dict(a))


@agents_bp.route("/api/agent/<int:agent_id>", methods=["DELETE"])
def delete_agent(agent_id):
    a = Agent.query.get_or_404(agent_id)
    db.session.delete(a)
    db.session.commit()
    return jsonify({"status": "deleted"})
