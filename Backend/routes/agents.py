from flask import Blueprint, jsonify, request

agents_bp = Blueprint("agents", __name__)

SEED_AGENTS = [
    {"id": "A-2401", "nom": "El Amrani", "prenom": "Yassine", "matricule": "MR-1041", "sector": "Est", "gateCode": "G3", "phone": "+212 661 11 22 33", "status": "DEPLOYED"},
    {"id": "A-2402", "nom": "Bennani", "prenom": "Salma", "matricule": "MR-1042", "sector": "Nord", "gateCode": "G1", "phone": "+212 661 22 33 44", "status": "DEPLOYED"},
    {"id": "A-2403", "nom": "Toumi", "prenom": "Karim", "matricule": "MR-1043", "sector": "Sud", "gateCode": "G5", "phone": "+212 661 33 44 55", "status": "STANDBY"},
    {"id": "A-2404", "nom": "Cherkaoui", "prenom": "Rachid", "matricule": "MR-1044", "sector": "Ouest", "gateCode": "G6", "phone": "+212 661 44 55 66", "status": "DEPLOYED"},
    {"id": "A-2405", "nom": "Mansouri", "prenom": "Imane", "matricule": "MR-1045", "sector": "Nord-Est", "gateCode": "G2", "phone": "+212 661 55 66 77", "status": "STANDBY"},
    {"id": "A-2406", "nom": "Ouali", "prenom": "Mehdi", "matricule": "MR-1046", "sector": "Sud-Est", "gateCode": "G4", "phone": "+212 661 66 77 88", "status": "OFF"},
]


@agents_bp.route("/api/agent/list")
def list_agents():
    return jsonify(SEED_AGENTS)
