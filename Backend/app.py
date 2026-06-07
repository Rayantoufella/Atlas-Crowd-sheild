from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import threading
import time
import json
import io
import qrcode
from config import SQLALCHEMY_DATABASE_URI, SQLALCHEMY_TRACK_MODIFICATIONS
from database import db

app = Flask(__name__)
CORS(app)
app.config["SQLALCHEMY_DATABASE_URI"] = SQLALCHEMY_DATABASE_URI
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = SQLALCHEMY_TRACK_MODIFICATIONS
db.init_app(app)

from models.match import Match
from models.zone import Zone
from models.alert import Alert
from models.agent import Agent
from models.camera import Camera

def _seed_if_empty():
    if Agent.query.count() == 0:
        agents_data = [
            Agent(nom="El Amrani", prenom="Yassine", matricule="MR-1041", sector="Est", gateCode="G3", phone="+212 661 11 22 33", status="DEPLOYED"),
            Agent(nom="Bennani", prenom="Salma", matricule="MR-1042", sector="Nord", gateCode="G1", phone="+212 661 22 33 44", status="DEPLOYED"),
            Agent(nom="Toumi", prenom="Karim", matricule="MR-1043", sector="Sud", gateCode="G5", phone="+212 661 33 44 55", status="STANDBY"),
            Agent(nom="Cherkaoui", prenom="Rachid", matricule="MR-1044", sector="Ouest", gateCode="G6", phone="+212 661 44 55 66", status="DEPLOYED"),
            Agent(nom="Mansouri", prenom="Imane", matricule="MR-1045", sector="Nord-Est", gateCode="G2", phone="+212 661 55 66 77", status="STANDBY"),
            Agent(nom="Ouali", prenom="Mehdi", matricule="MR-1046", sector="Sud-Est", gateCode="G4", phone="+212 661 66 77 88", status="OFF"),
        ]
        db.session.add_all(agents_data)
    if Camera.query.count() == 0:
        cams_data = [
            Camera(zone="Nord", loc="Entree G1 — auvent", resolution="4K", fps=60, status="ACTIVE", lat=33.9716, lng=-6.8498, ip="10.0.1.21"),
            Camera(zone="Nord-Est", loc="Tribune NE — niveau 2", resolution="4K", fps=60, status="ACTIVE", lat=33.9717, lng=-6.8492, ip="10.0.1.22"),
            Camera(zone="Est", loc="Couloir VIP Est", resolution="4K", fps=60, status="ACTIVE", lat=33.9718, lng=-6.8488, ip="10.0.1.23"),
            Camera(zone="Est", loc="Porte 3 — exterieur", resolution="4K", fps=60, status="ACTIVE", lat=33.9719, lng=-6.8487, ip="10.0.1.24"),
            Camera(zone="Sud-Est", loc="Tribune SE — acces", resolution="1080p", fps=30, status="OFFLINE", lat=33.9714, lng=-6.8489, ip="10.0.1.25"),
            Camera(zone="Sud", loc="Aire familles", resolution="4K", fps=60, status="ACTIVE", lat=33.9712, lng=-6.8495, ip="10.0.1.26"),
            Camera(zone="Sud", loc="Sortie urgence Sud", resolution="1080p", fps=30, status="OFFLINE", lat=33.9713, lng=-6.8500, ip="10.0.1.27"),
            Camera(zone="Ouest", loc="Tribune Ouest — haute", resolution="4K", fps=60, status="ACTIVE", lat=33.9715, lng=-6.8503, ip="10.0.1.28"),
        ]
        db.session.add_all(cams_data)
    db.session.commit()


try:
    with app.app_context():
        conn = db.engine.connect()
        conn.execute(db.text("DROP TABLE IF EXISTS agent CASCADE"))
        conn.execute(db.text("DROP TABLE IF EXISTS camera CASCADE"))
        conn.commit()
        conn.close()
        db.create_all()
        _seed_if_empty()
except Exception as e:
    print(f"WARNING: Database unavailable — {e}")
    print("The app will start but DB-dependent features will not work.")

from routes.match import match_bp
from routes.zones import zones_bp
from routes.alerts import alerts_bp
from routes.supporter import supporter_bp
from routes.cameras import cameras_bp
from routes.agents import agents_bp
from routes.events import events_bp
from routes.forensic import forensic_bp
from routes.settings import settings_bp
from routes.reports import reports_bp

app.register_blueprint(match_bp)
app.register_blueprint(zones_bp)
app.register_blueprint(alerts_bp)
app.register_blueprint(supporter_bp)
app.register_blueprint(cameras_bp)
app.register_blueprint(agents_bp)
app.register_blueprint(events_bp)
app.register_blueprint(forensic_bp)
app.register_blueprint(settings_bp)
app.register_blueprint(reports_bp)


@app.route("/health")
def health():
    try:
        db.session.execute(db.text("SELECT 1"))
        return jsonify({"status": "ok", "db": "connected"})
    except Exception as e:
        return jsonify({"status": "ok", "db": "error", "detail": str(e)})


@app.route("/start-demo", methods=["POST"])
def start_demo():
    def run_scenario():
        from routes.zones import current_state, DEFAULT_ZONES
        import routes.zones as zones_module

        with open("simulation/demo_scenario.json") as f:
            scenario = json.load(f)

        for i, frame in enumerate(scenario):
            state = {"zones": list(DEFAULT_ZONES)}
            state["global_risk"] = frame["global_risk"]

            for zone in state["zones"]:
                if zone["id"] == "gate_3":
                    zone["risk"] = frame["gate_3_risk"]
                    zone["status"] = (
                        "critical" if frame["gate_3_risk"] >= 75 else
                        "warning" if frame["gate_3_risk"] >= 60 else
                        "watch" if frame["gate_3_risk"] >= 40 else
                        "safe"
                    )

            if frame.get("alert_active"):
                state["alert"] = {
                    "active": True,
                    "zone_id": "gate_3",
                    "message": "Compression détectée — Rediriger vers Porte 5",
                    "eta_minutes": 7,
                    "agents_needed": 12,
                    "redirect_to": "gate_5",
                }
            else:
                state["alert"] = {"active": False}

            zones_module.current_state = state

            if i + 1 < len(scenario):
                wait = scenario[i + 1]["second"] - frame["second"]
                time.sleep(wait)

    thread = threading.Thread(target=run_scenario)
    thread.daemon = True
    thread.start()

    return jsonify({"status": "demo_started", "duration_seconds": 90})


@app.route("/api/match/<int:match_id>/qr")
def generate_qr(match_id):
    url = f"http://localhost:5000/supporter/{match_id}"
    qr = qrcode.make(url)
    buf = io.BytesIO()
    qr.save(buf, format="PNG")
    buf.seek(0)
    return send_file(buf, mimetype="image/png")


@app.route("/api/report/<int:match_id>")
def get_report(match_id):
    match = Match.query.get_or_404(match_id)
    alerts = Alert.query.filter_by(match_id=match_id).all()
    return jsonify({
        "match": f"{match.team_a} vs {match.team_b}",
        "date": match.match_date.strftime("%Y-%m-%d"),
        "stadium": match.stadium,
        "incidents_prevented": 3,
        "agents_used": 1847,
        "agents_total": 4000,
        "agents_saved_percent": 54,
        "alerts_triggered": len(alerts),
        "avg_reaction_time_minutes": 2.3,
        "zones_summary": [
            {"zone": "Porte 3 Est", "peak_risk": 82, "status": "critical"},
            {"zone": "Porte 6 Nord-Ouest", "peak_risk": 71, "status": "warning"},
        ],
    })


if __name__ == "__main__":
    app.run(debug=True, port=5050)
