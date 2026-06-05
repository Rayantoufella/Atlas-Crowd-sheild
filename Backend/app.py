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

with app.app_context():
    db.create_all()

from routes.match import match_bp
from routes.zones import zones_bp
from routes.alerts import alerts_bp
from routes.supporter import supporter_bp

app.register_blueprint(match_bp)
app.register_blueprint(zones_bp)
app.register_blueprint(alerts_bp)
app.register_blueprint(supporter_bp)


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
        from routes.zones import current_state, DEFAULT_STATE
        import routes.zones as zones_module

        with open("simulation/demo_scenario.json") as f:
            scenario = json.load(f)

        for i, frame in enumerate(scenario):
            state = json.loads(json.dumps(DEFAULT_STATE))
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
