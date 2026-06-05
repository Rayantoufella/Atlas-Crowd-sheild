# Atlas Crowd Shield — Specs Backend
**Responsable : Logic (LG) + Algo/Data (AI)**
**Stack : Flask · PostgreSQL · SQLAlchemy · YOLOv8 · OpenCV**

---

## Setup initial — faire en premier

```bash
# Créer l'environnement Python
python -m venv venv
source venv/bin/activate   # Windows : venv\Scripts\activate

# Installer les dépendances
pip install flask flask-sqlalchemy flask-cors psycopg2-binary ultralytics opencv-python qrcode reportlab

# Créer la base de données PostgreSQL
psql -U postgres -c "CREATE DATABASE atlas_db;"
```

---

## SPEC-B01 · Structure dossiers + app Flask de base

**Quoi :** Créer le repo et lancer le premier serveur Flask.

**Structure à créer :**
```
backend/
├── app.py
├── config.py
├── models/
│   ├── __init__.py
│   ├── match.py
│   ├── zone.py
│   ├── alert.py
│   └── agent.py
├── routes/
│   ├── __init__.py
│   ├── match.py
│   ├── zones.py
│   ├── alerts.py
│   └── supporter.py
├── algo/
│   ├── yolo_detector.py
│   ├── density_estimator.py
│   └── risk_calculator.py
├── simulation/
│   └── demo_scenario.json
└── requirements.txt
```

**`app.py` :**
```python
from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:password@localhost/atlas_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

@app.route('/health')
def health():
    try:
        db.session.execute(db.text('SELECT 1'))
        return jsonify({"status": "ok", "db": "connected"})
    except Exception as e:
        return jsonify({"status": "ok", "db": "error", "detail": str(e)})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
```

**Critère :**
```bash
python app.py
curl http://localhost:5000/health
# {"status": "ok", "db": "connected"}
```

---

## SPEC-B02 · Base de données PostgreSQL — 5 tables

**Quoi :** Créer toutes les tables via SQLAlchemy.

**`models/match.py` :**
```python
from app import db
from datetime import datetime

class Match(db.Model):
    __tablename__ = 'match'
    id          = db.Column(db.Integer, primary_key=True)
    team_a      = db.Column(db.String(100), nullable=False)
    team_b      = db.Column(db.String(100), nullable=False)
    stadium     = db.Column(db.String(100), nullable=False)
    match_date  = db.Column(db.DateTime, nullable=False)
    capacity    = db.Column(db.Integer, default=68500)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)
```

**`models/zone.py` :**
```python
from app import db
from datetime import datetime

class Zone(db.Model):
    __tablename__ = 'zone'
    id          = db.Column(db.Integer, primary_key=True)
    match_id    = db.Column(db.Integer, db.ForeignKey('match.id'))
    gate_id     = db.Column(db.String(20), nullable=False)   # gate_1 à gate_6
    label       = db.Column(db.String(100))
    risk_score  = db.Column(db.Integer, default=0)           # 0 à 100
    status      = db.Column(db.String(20), default='safe')   # safe/watch/warning/critical
    density     = db.Column(db.String(20), default='low')    # low/medium/high
    updated_at  = db.Column(db.DateTime, default=datetime.utcnow)
```

**`models/alert.py` :**
```python
from app import db
from datetime import datetime

class Alert(db.Model):
    __tablename__ = 'alert'
    id            = db.Column(db.Integer, primary_key=True)
    match_id      = db.Column(db.Integer, db.ForeignKey('match.id'))
    zone_id       = db.Column(db.String(20), nullable=False)
    message       = db.Column(db.Text, nullable=False)
    eta_minutes   = db.Column(db.Integer)
    agents_needed = db.Column(db.Integer)
    redirect_to   = db.Column(db.String(20))
    active        = db.Column(db.Boolean, default=True)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)
```

**Créer les tables dans `app.py` :**
```python
from models.match import Match
from models.zone import Zone
from models.alert import Alert

with app.app_context():
    db.create_all()
```

**Critère :**
```bash
psql atlas_db -c "\dt"
# Affiche : match, zone, alert, ...
```

---

## SPEC-B03 · Route POST /api/match/create

**Quoi :** Créer un match en base de données.

**`routes/match.py` :**
```python
from flask import Blueprint, request, jsonify
from app import db
from models.match import Match
from datetime import datetime

match_bp = Blueprint('match', __name__)

@match_bp.route('/api/match/create', methods=['POST'])
def create_match():
    data = request.get_json()

    # Validation
    required = ['team_a', 'team_b', 'stadium', 'match_date']
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"Champ manquant : {field}"}), 400

    match = Match(
        team_a=data['team_a'],
        team_b=data['team_b'],
        stadium=data['stadium'],
        match_date=datetime.fromisoformat(data['match_date']),
        capacity=data.get('capacity', 68500)
    )
    db.session.add(match)
    db.session.commit()

    return jsonify({
        "match_id": match.id,
        "qr_url": f"/api/match/{match.id}/qr",
        "status": "created"
    }), 201
```

**Enregistrer dans `app.py` :**
```python
from routes.match import match_bp
app.register_blueprint(match_bp)
```

**Critère :**
```bash
curl -X POST http://localhost:5000/api/match/create \
  -H "Content-Type: application/json" \
  -d '{"team_a":"Maroc","team_b":"Sénégal","stadium":"Rabat","match_date":"2025-03-15T21:00:00"}'
# {"match_id": 1, "qr_url": "/api/match/1/qr", "status": "created"}
```

---

## SPEC-B04 · Route GET /api/zones/live

**Quoi :** La route principale — retourne le JSON des 6 zones. Le frontend l'appelle toutes les 2 secondes.

**`routes/zones.py` :**
```python
from flask import Blueprint, jsonify
from datetime import datetime

zones_bp = Blueprint('zones', __name__)

# État courant de la démo (mis à jour par le thread simulation)
current_state = None

# JSON de démo par défaut
DEFAULT_STATE = {
    "timestamp": None,
    "match": "Maroc vs Sénégal",
    "minute": 67,
    "global_risk": 28,
    "zones": [
        {"id": "gate_1", "label": "Porte 1 Nord",       "risk": 28, "status": "safe",    "density": "low"},
        {"id": "gate_2", "label": "Porte 2 Nord-Est",   "risk": 22, "status": "safe",    "density": "low"},
        {"id": "gate_3", "label": "Porte 3 Est",        "risk": 20, "status": "safe",    "density": "low"},
        {"id": "gate_4", "label": "Porte 4 Sud",        "risk": 31, "status": "safe",    "density": "low"},
        {"id": "gate_5", "label": "Porte 5 Ouest",      "risk": 18, "status": "safe",    "density": "low"},
        {"id": "gate_6", "label": "Porte 6 Nord-Ouest", "risk": 25, "status": "safe",    "density": "low"},
    ],
    "alert": {"active": False},
    "stats": {
        "supporters_inside": 68420,
        "agents_deployed": 1847,
        "incidents_prevented": 0,
        "cameras_active": 47,
        "cameras_total": 48
    }
}

@zones_bp.route('/api/zones/live')
def zones_live():
    state = current_state if current_state else DEFAULT_STATE
    state["timestamp"] = datetime.utcnow().isoformat() + "Z"
    return jsonify(state)
```

**Critère :**
```bash
curl http://localhost:5000/api/zones/live
# Retourne le JSON complet avec 6 zones
```

---

## SPEC-B05 · Route POST /start-demo (simulation)

**Quoi :** Déclencher le scénario démo — le risk score monte de 28% à 82% en 90 secondes.

**`simulation/demo_scenario.json` :**
```json
[
  {"second": 0,  "global_risk": 28, "gate_3_risk": 20, "alert_active": false},
  {"second": 15, "global_risk": 38, "gate_3_risk": 35, "alert_active": false},
  {"second": 30, "global_risk": 52, "gate_3_risk": 58, "alert_active": false},
  {"second": 45, "global_risk": 67, "gate_3_risk": 82, "alert_active": true},
  {"second": 60, "global_risk": 71, "gate_3_risk": 82, "alert_active": true},
  {"second": 75, "global_risk": 65, "gate_3_risk": 70, "alert_active": true},
  {"second": 90, "global_risk": 45, "gate_3_risk": 45, "alert_active": false}
]
```

**Route dans `app.py` :**
```python
import threading, time, json

@app.route('/start-demo', methods=['POST'])
def start_demo():
    def run_scenario():
        from routes.zones import current_state, DEFAULT_STATE
        import routes.zones as zones_module

        with open('simulation/demo_scenario.json') as f:
            scenario = json.load(f)

        for i, frame in enumerate(scenario):
            # Construire le state à partir du frame
            state = json.loads(json.dumps(DEFAULT_STATE))  # deep copy
            state["global_risk"] = frame["global_risk"]

            for zone in state["zones"]:
                if zone["id"] == "gate_3":
                    zone["risk"] = frame["gate_3_risk"]
                    zone["status"] = "critical" if frame["gate_3_risk"] >= 75 else \
                                     "warning"  if frame["gate_3_risk"] >= 60 else \
                                     "watch"    if frame["gate_3_risk"] >= 40 else "safe"

            if frame["alert_active"]:
                state["alert"] = {
                    "active": True,
                    "zone_id": "gate_3",
                    "message": "Compression détectée — Rediriger vers Porte 5",
                    "eta_minutes": 7,
                    "agents_needed": 12,
                    "redirect_to": "gate_5"
                }
            else:
                state["alert"] = {"active": False}

            zones_module.current_state = state

            # Attendre jusqu'au prochain frame
            if i + 1 < len(scenario):
                wait = scenario[i + 1]["second"] - frame["second"]
                time.sleep(wait)

    thread = threading.Thread(target=run_scenario)
    thread.daemon = True
    thread.start()

    return jsonify({"status": "demo_started", "duration_seconds": 90})
```

**Critère :**
```bash
curl -X POST http://localhost:5000/start-demo
# {"status": "demo_started", "duration_seconds": 90}
# Ensuite GET /api/zones/live retourne des valeurs qui changent
```

---

## SPEC-B06 · Couche algorithme — YOLOv8 + Risk Score

**Responsable : Algo/Data (AI)**

**Quoi :** Faire analyser de vraies vidéos par YOLOv8 et calculer le score de risque.

### Étape 1 — Télécharger vidéos test

Aller sur **pexels.com**, chercher "crowd stadium", télécharger 3 vidéos MP4 libres de droits.
Les nommer : `crowd_dense.mp4`, `crowd_medium.mp4`, `crowd_light.mp4`
Les mettre dans `backend/assets/videos/`

### Étape 2 — Détecteur YOLOv8

**`algo/yolo_detector.py` :**
```python
from ultralytics import YOLO

model = YOLO('yolov8n.pt')  # téléchargé automatiquement au premier run

def detect_persons(frame):
    """
    frame  : image OpenCV (numpy array BGR)
    return : int — nombre de personnes détectées
    """
    results = model(frame, classes=[0], verbose=False)  # 0 = personne
    return len(results[0].boxes)
```

**Test rapide :**
```python
import cv2
from algo.yolo_detector import detect_persons

cap = cv2.VideoCapture('assets/videos/crowd_dense.mp4')
ret, frame = cap.read()
print("Personnes détectées :", detect_persons(frame))
# Doit afficher un nombre > 0
```

### Étape 3 — Calcul Risk Score par zone

**`algo/risk_calculator.py` :**
```python
import cv2
from algo.yolo_detector import detect_persons

# Les 6 zones = régions de la frame (en fractions 0.0 à 1.0)
ZONES = [
    {"id": "gate_1", "label": "Porte 1 Nord",       "region": (0.0,  0.0,  0.33, 0.5)},
    {"id": "gate_2", "label": "Porte 2 Nord-Est",   "region": (0.33, 0.0,  0.66, 0.5)},
    {"id": "gate_3", "label": "Porte 3 Est",        "region": (0.66, 0.0,  1.0,  0.5)},
    {"id": "gate_4", "label": "Porte 4 Sud",        "region": (0.0,  0.5,  0.33, 1.0)},
    {"id": "gate_5", "label": "Porte 5 Ouest",      "region": (0.33, 0.5,  0.66, 1.0)},
    {"id": "gate_6", "label": "Porte 6 Nord-Ouest", "region": (0.66, 0.5,  1.0,  1.0)},
]

MAX_PERSONS_PER_ZONE = 20  # calibrer selon tes vidéos

def get_status(risk):
    if risk >= 75: return "critical"
    if risk >= 60: return "warning"
    if risk >= 40: return "watch"
    return "safe"

def get_density(risk):
    if risk >= 60: return "high"
    if risk >= 35: return "medium"
    return "low"

def calculate_risk(frame):
    """
    frame  : image OpenCV
    return : dict avec global_risk et zones[]
    """
    h, w = frame.shape[:2]
    zone_results = []

    for zone in ZONES:
        x1 = int(zone["region"][0] * w)
        y1 = int(zone["region"][1] * h)
        x2 = int(zone["region"][2] * w)
        y2 = int(zone["region"][3] * h)

        cropped = frame[y1:y2, x1:x2]
        count = detect_persons(cropped)
        risk = min(100, int((count / MAX_PERSONS_PER_ZONE) * 100))

        zone_results.append({
            "id":      zone["id"],
            "label":   zone["label"],
            "risk":    risk,
            "status":  get_status(risk),
            "density": get_density(risk),
        })

    global_risk = int(sum(z["risk"] for z in zone_results) / len(zone_results))
    return {"global_risk": global_risk, "zones": zone_results}
```

### Étape 4 — Brancher l'algo sur la route /api/zones/live

Modifier `routes/zones.py` pour utiliser l'algo sur une vidéo :

```python
import cv2
from algo.risk_calculator import calculate_risk

cap = cv2.VideoCapture('assets/videos/crowd_dense.mp4')

@zones_bp.route('/api/zones/live')
def zones_live():
    ret, frame = cap.read()
    if not ret:
        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)  # rebobiner
        ret, frame = cap.read()

    result = calculate_risk(frame)
    result["timestamp"] = datetime.utcnow().isoformat() + "Z"
    result["match"] = "Maroc vs Sénégal"
    result["minute"] = 67
    return jsonify(result)
```

**Critère :**
```bash
curl http://localhost:5000/api/zones/live
# Les scores changent à chaque appel car la vidéo avance frame par frame
```

---

## SPEC-B07 · Route GET /api/match/{id}/qr

**Quoi :** Générer un QR code PNG pour la page supporter.

```python
import qrcode, io
from flask import send_file

@app.route('/api/match/<int:match_id>/qr')
def generate_qr(match_id):
    url = f"http://localhost:5000/supporter/{match_id}"
    qr = qrcode.make(url)
    buf = io.BytesIO()
    qr.save(buf, format='PNG')
    buf.seek(0)
    return send_file(buf, mimetype='image/png')
```

**Critère :** Ouvrir `http://localhost:5000/api/match/1/qr` → image QR code s'affiche dans le navigateur.

---

## SPEC-B08 · Route POST /api/alert/broadcast

**Quoi :** Enregistrer une alerte en base.

```python
@app.route('/api/alert/broadcast', methods=['POST'])
def broadcast_alert():
    data = request.get_json()
    alert = Alert(
        match_id=data.get('match_id', 1),
        zone_id=data['zone_id'],
        message=data['message'],
        eta_minutes=data.get('eta_minutes', 7),
        agents_needed=data.get('agents_needed', 12),
        redirect_to=data.get('redirect_to', 'gate_5'),
        active=True
    )
    db.session.add(alert)
    db.session.commit()
    return jsonify({"status": "broadcast_sent", "alert_id": alert.id, "recipients": 68420})
```

**Critère :**
```bash
curl -X POST http://localhost:5000/api/alert/broadcast \
  -H "Content-Type: application/json" \
  -d '{"zone_id":"gate_3","message":"Test alerte"}'
# {"status": "broadcast_sent", "alert_id": 1, "recipients": 68420}
```

---

## SPEC-B09 · Route GET /api/report/{match_id}

**Quoi :** Retourner un résumé post-match en JSON.

```python
@app.route('/api/report/<int:match_id>')
def get_report(match_id):
    match = Match.query.get_or_404(match_id)
    alerts = Alert.query.filter_by(match_id=match_id).all()
    return jsonify({
        "match": f"{match.team_a} vs {match.team_b}",
        "date": match.match_date.strftime('%Y-%m-%d'),
        "stadium": match.stadium,
        "incidents_prevented": 3,
        "agents_used": 1847,
        "agents_total": 4000,
        "agents_saved_percent": 54,
        "alerts_triggered": len(alerts),
        "avg_reaction_time_minutes": 2.3,
        "zones_summary": [
            {"zone": "Porte 3 Est", "peak_risk": 82, "status": "critical"},
            {"zone": "Porte 6 Nord-Ouest", "peak_risk": 71, "status": "warning"}
        ]
    })
```

---

## Ordre à suivre

```
B01 (Flask + structure)
  → B02 (tables PostgreSQL)
    → B03 (POST /match/create)
      → B04 (GET /zones/live)   ← B06 (YOLOv8) vient se brancher ici
        → B05 (POST /start-demo)
        → B07 (GET /qr)
        → B08 (POST /alert)
        → B09 (GET /report)

B06 (algo) peut être développé en parallèle de B03-B05
```

---

*Atlas Crowd Shield · Specs Backend · Hackathon SporTech 2025*
