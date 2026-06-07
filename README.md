# Atlas Crowd Shield

AI-powered stadium security & crowd management platform. Real-time risk monitoring across 6 stadium zones, YOLOv8-based video analysis for person tracking and behavior detection, forensic video review, and an alert dispatch system for security personnel.

---

## Tech Stack

| Layer           | Technology |
|-----------------|------------|
| Frontend        | React 18, Vite 8, vanilla CSS, custom hash router, inline SVG icons/charts |
| Backend         | Flask (Python), Flask-SQLAlchemy, Flask-CORS |
| Database        | PostgreSQL |
| Computer Vision | YOLOv8n (Ultralytics), ByteTrack, OpenCV |
| Other           | ReportLab (PDF), qrcode[pil] |

---

## Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Python | 3.10+ | `python --version` |
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| PostgreSQL | 14+ | `psql --version` |
| Git | any | `git --version` |

---

## Installation

### 1 — Clone

```bash
git clone https://github.com/Rayantoufella/Atlas-Crowd-sheild.git
cd "Atlas Crowd Shield"
```

### 2 — Database

```bash
# Windows (psql)
psql -U postgres -c "CREATE DATABASE atlas_db;"

# or via pgAdmin — create a database named "atlas_db"
```

Default connection settings (`Backend/config.py`):

```
DB_USER=postgres
DB_PASS=password
DB_HOST=localhost
DB_NAME=atlas_db
```

Override with environment variables:

```bash
# Windows (cmd)
set DB_PASS=yourpassword
# Linux / Mac
export DB_PASS=yourpassword
```

### 3 — Backend

```bash
cd Backend
python -m venv venv

# Windows
venv\Scripts\activate
# Linux / Mac
# source venv/bin/activate

pip install -r requirements.txt

python app.py
```

The server starts on **`http://localhost:5050`**. Tables (`match`, `zone`, `alert`, `agent`) are auto-created on first run.

### 4 — Frontend

```bash
cd Frontend
npm install
npm run dev
```

The dev server starts on **`http://localhost:5173`** and opens automatically.

### 5 — Login

Open `http://localhost:5173` and sign in with:

- **Email:** `admin@atlas.ma`
- **Password:** `atlas2025`

---

## Verify

| Test | What to expect |
|------|----------------|
| **Ops Dashboard** | 6 zone cards (Gate 1–6) with risk scores, live area chart, event log |
| **Start Demo** | Click *Lancer une simulation* in the top bar → 90‑second scripted risk escalation at Gate 3 |
| **Forensic Analysis** | Go to *Forensic* tab → upload an MP4 video → live MJPEG stream on the left, high‑risk detections on the right → click a snapshot to open the lightbox |
| **Admin → Paramètres** | Adjust detection mode (Fast / Balanced / Strict), weight sliders, thresholds, stream quality — changes affect running analyses immediately |

---

## Project Structure

```
Atlas Crowd Shield/
├── Algorithm/                        # Standalone algorithm experiments (original test_video.py)
├── Backend/
│   ├── app.py                        # Flask entry point
│   ├── config.py                     # Database URI
│   ├── requirements.txt
│   ├── algo/                         # v1 algorithm modules (density, risk)
│   ├── analyzer/                     # v2 analysis pipeline
│   │   ├── config.py                 # Static hyperparameters
│   │   ├── runtime_config.py         # Runtime-adjustable settings (persisted)
│   │   ├── settings.json             # Persisted runtime config
│   │   ├── processor.py              # Video processing orchestrator
│   │   └── pipeline/
│   │       ├── __init__.py           # Dataclasses: BBox, Detection, SignalVector, etc.
│   │       ├── frame_reader.py       # Video reader with FPS control
│   │       ├── detector.py           # YOLOv8 + ByteTrack + dangerous objects
│   │       ├── behavior.py           # Velocity, acceleration, proximity signals
│   │       ├── alert.py              # Zone state: CALM / WATCH / WARNING / CRITICAL
│   │       └── renderer.py           # Annotated frame + HUD overlay
│   ├── models/                       # SQLAlchemy models (match, zone, alert, agent)
│   ├── routes/                       # Flask blueprints (9 route files)
│   ├── simulation/demo_scenario.json
│   └── uploads/snapshots/            # Forensic snapshot images (gitignored)
└── Frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx                   # Auth gate + hash router + NavBar
        ├── main.jsx                  # React bootstrap
        ├── index.css                 # CSS design tokens (variables)
        ├── lib/                      # api.js, config.js, icons.jsx, router.js
        ├── components/               # 13 reusable components (NavBar, Modal, Toast, charts, etc.)
        └── pages/                    # Login, Ops, Forensic, Admin (+5 sub-pages), Reports
```

---

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/health` | Health check with DB connection test |
| POST | `/start-demo` | Start 90‑second demo simulation |
| GET | `/api/match/list` | List all matches |
| POST | `/api/match/create` | Create a match |
| GET | `/api/match/<id>/qr` | Generate QR code PNG |
| GET | `/api/zones/live` | Live zone state (6 gates + alert) |
| POST | `/api/alert/broadcast` | Broadcast an alert |
| GET | `/api/report/<match_id>` | Post‑match report summary |
| GET | `/supporter/<match_id>` | Supporter mobile page |
| GET | `/api/camera/list` | List cameras |
| GET | `/api/agent/list` | List security agents |
| GET | `/api/event/latest` | Latest events |
| POST | `/api/event/log` | Log an event |
| POST | `/api/forensic/upload` | Upload video for analysis |
| GET | `/api/forensic/status/<job_id>` | Analysis job status |
| GET | `/api/forensic/results/<job_id>` | Completed analysis results |
| GET | `/api/forensic/results/live/<job_id>` | Live in‑progress results |
| GET | `/api/forensic/stream/<job_id>` | MJPEG live stream |
| GET | `/api/forensic/snapshot/<filename>` | Serve snapshot image |
| GET | `/api/forensic/jobs` | List all analysis jobs |
| GET | `/api/settings` | Get runtime settings |
| PUT | `/api/settings` | Update runtime settings |

---

## Architecture

### Frontend Routing

All routes use a **custom hash-based router** (`lib/router.js` — no react-router):

| Hash | Page |
|------|------|
| `#/login` | Login |
| `#/ops` | Security Operations Dashboard |
| `#/forensic` | Forensic video analysis |
| `#/admin` | Admin panel (redirects to `/admin/matchs`) |
| `#/admin/matchs` | Match management |
| `#/admin/cameras` | Camera management |
| `#/admin/agents` | Agent management |
| `#/admin/portes` | Gate management |
| `#/admin/parametres` | System settings |
| `#/reports` | Supporter mobile view |

### Analyzer Pipeline

```
FrameReader → Detector (YOLOv8 + ByteTrack) → BehaviorEngine → AlertEngine → Renderer
```

Each forensic video upload spawns a background thread that processes frames through this 5‑stage pipeline. Results are streamed as MJPEG and high‑risk snapshots are saved.

### Detection Modes

Configurable via Admin → Paramètres or PUT `/api/settings`:

| Mode | Confidence | Velocity | Acceleration | Proximity | Object |
|------|-----------|----------|-------------|-----------|--------|
| Fast (sensitive) | 0.15 | 0.35 | 0.20 | 0.25 | 0.20 |
| Balanced | 0.20 | 0.40 | 0.25 | 0.15 | 0.20 |
| Strict (few FPs) | 0.30 | 0.50 | 0.25 | 0.15 | 0.10 |

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `psycopg2` install fails | `pip install psycopg2-binary` or install `libpq-dev` (Linux) |
| Port 5050 in use | `taskkill /f /im python.exe` (Windows) or `pkill -f "python app.py"` |
| Frontend can't reach backend | Check `Frontend/src/lib/config.js` → `API_BASE` must be `http://localhost:5050` |
| YOLO model missing | Auto‑downloaded by ultralytics on first inference, or place `yolov8n.pt` in `Backend/` |
| DB connection refused | Start PostgreSQL: `net start postgresql-xx` (Windows) or `sudo systemctl start postgresql` |

---

## License

MIT
