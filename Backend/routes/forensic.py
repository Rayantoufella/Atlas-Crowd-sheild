import os
import uuid
import threading
import json
import shutil
from collections import deque
from flask import Blueprint, jsonify, request, send_from_directory, Response, stream_with_context

forensic_bp = Blueprint("forensic", __name__)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
SNAPSHOT_DIR = os.path.join(UPLOAD_DIR, "snapshots")
JOBS_FILE = os.path.join(BASE_DIR, "uploads", "jobs.json")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(SNAPSHOT_DIR, exist_ok=True)

def load_jobs():
    if not os.path.exists(JOBS_FILE):
        return {}
    try:
        with open(JOBS_FILE, "r") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return {}

data_lock = threading.Lock()
jobs_dict = load_jobs()
stream_buffers = {}
stream_events = {}

STATUS_TRANSITION = frozenset(["queued", "processing", "done", "error"])

def persist_all():
    with open(JOBS_FILE, "w") as f:
        json.dump(jobs_dict, f)

def update_job(job_id, data):
    with data_lock:
        was_status = jobs_dict[job_id].get("status")
        new_status = data.get("status")
        jobs_dict[job_id].update(data)
        if new_status and new_status in STATUS_TRANSITION and new_status != was_status:
            persist_all()

def push_stream_frame(job_id, jpeg_bytes):
    with data_lock:
        buf = stream_buffers.get(job_id)
        if buf is not None and len(buf) < buf.maxlen:
            buf.append(jpeg_bytes)
            ev = stream_events.get(job_id)
            if ev:
                ev.set()

ALLOWED_EXT = {".mp4", ".avi", ".mov", ".mkv", ".webm"}
MAX_SIZE_MB = 500
MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

# Vidéos locales embarquées dans le projet (dossier Backend/video).
VIDEO_DIR = os.path.join(BASE_DIR, "video")
VIDEO_DANGER = os.path.join(VIDEO_DIR, "danger.mp4")
VIDEO_WARNING = os.path.join(VIDEO_DIR, "warning.mp4")
VIDEO_NORMAL = os.path.join(VIDEO_DIR, "normal.mp4")

# Caméras du poste critique (Porte 3 Est) → vidéo de danger.
# Caméras des zones warning (G4, G6) → vidéo warning.
# Toutes les autres → vidéo normale.
DANGER_CAMERAS = {7, 8, 9}
WARNING_CAMERAS = {11, 12, 13, 19, 20, 21}
CAMERA_VIDEOS = {
    i: (VIDEO_DANGER if i in DANGER_CAMERAS else
        VIDEO_WARNING if i in WARNING_CAMERAS else
        VIDEO_NORMAL)
    for i in range(24)
}


@forensic_bp.route("/api/forensic/auto-analyze", methods=["POST"])
def auto_analyze():
    data = request.get_json()
    camera_id = data.get("camera_id")

    video_path = CAMERA_VIDEOS.get(camera_id)
    if not video_path or not os.path.exists(video_path):
        return jsonify({"error": "Video not found for this camera"}), 404

    ext = os.path.splitext(video_path)[1].lower()
    if ext not in ALLOWED_EXT:
        return jsonify({"error": f"Unsupported format {ext}"}), 400

    job_id = str(uuid.uuid4())[:8]
    safe_name = f"{job_id}{ext}"
    save_path = os.path.join(UPLOAD_DIR, safe_name)
    shutil.copy2(video_path, save_path)

    with data_lock:
        stream_buffers[job_id] = deque(maxlen=5)
        stream_events[job_id] = threading.Event()

    job_data = {
        "id": job_id,
        "filename": os.path.basename(video_path),
        "saved_as": safe_name,
        "status": "queued",
        "progress": 0,
        "frame": 0,
        "total_frames": 0,
        "detections_count": 0,
        "detections": [],
    }

    with data_lock:
        jobs_dict[job_id] = job_data
        persist_all()

    def run():
        try:
            from analyzer.processor import process_video
            process_video(save_path, job_id, update_job, frame_callback=push_stream_frame)
        except Exception as e:
            with data_lock:
                if job_id in jobs_dict:
                    update_job(job_id, {"status": "error", "error": str(e)})
        finally:
            with data_lock:
                stream_events.pop(job_id, None)
                stream_buffers.pop(job_id, None)

    thread = threading.Thread(target=run, daemon=True)
    thread.start()

    return jsonify({"job_id": job_id, "status": "queued"}), 202


@forensic_bp.route("/api/forensic/upload", methods=["POST"])
def upload_video():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXT:
        return jsonify({"error": f"Unsupported format {ext}. Allowed: {', '.join(ALLOWED_EXT)}"}), 400

    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)
    if size > MAX_SIZE_BYTES:
        return jsonify({"error": f"File too large. Max {MAX_SIZE_MB}MB"}), 400

    job_id = str(uuid.uuid4())[:8]
    safe_name = f"{job_id}{ext}"
    save_path = os.path.join(UPLOAD_DIR, safe_name)
    file.save(save_path)

    with data_lock:
        stream_buffers[job_id] = deque(maxlen=5)
        stream_events[job_id] = threading.Event()

    job_data = {
        "id": job_id,
        "filename": file.filename,
        "saved_as": safe_name,
        "status": "queued",
        "progress": 0,
        "frame": 0,
        "total_frames": 0,
        "detections_count": 0,
        "detections": [],
    }

    with data_lock:
        jobs_dict[job_id] = job_data
        persist_all()

    def run():
        try:
            from analyzer.processor import process_video
            process_video(save_path, job_id, update_job, frame_callback=push_stream_frame)
        except Exception as e:
            with data_lock:
                if job_id in jobs_dict:
                    update_job(job_id, {"status": "error", "error": str(e)})
        finally:
            with data_lock:
                stream_events.pop(job_id, None)
                stream_buffers.pop(job_id, None)

    thread = threading.Thread(target=run, daemon=True)
    thread.start()

    return jsonify({"job_id": job_id, "status": "queued"}), 202

@forensic_bp.route("/api/forensic/status/<job_id>")
def get_status(job_id):
    with data_lock:
        job = jobs_dict.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404

    return jsonify({
        "id": job["id"],
        "filename": job["filename"],
        "status": job["status"],
        "progress": job["progress"],
        "frame": job["frame"],
        "total_frames": job["total_frames"],
        "detections_count": job["detections_count"],
        "error": job.get("error"),
    })

@forensic_bp.route("/api/forensic/results/<job_id>")
def get_results(job_id):
    with data_lock:
        job = jobs_dict.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    if job["status"] != "done":
        return jsonify({"status": job["status"], "progress": job["progress"]})

    return jsonify({
        "id": job["id"],
        "filename": job["filename"],
        "detections_count": job["detections_count"],
        "detections": job.get("detections", []),
    })

@forensic_bp.route("/api/forensic/results/live/<job_id>")
def get_live_results(job_id):
    with data_lock:
        job = jobs_dict.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404

    return jsonify({
        "status": job["status"],
        "progress": job["progress"],
        "detections_count": job["detections_count"],
        "detections": job.get("detections", []),
    })

@forensic_bp.route("/api/forensic/stream/<job_id>")
def stream_video(job_id):
    def generate():
        with data_lock:
            ev = stream_events.get(job_id)
            buf = stream_buffers.get(job_id)
        if ev is None or buf is None:
            return

        while True:
            with data_lock:
                job = jobs_dict.get(job_id)
            if job is None:
                break
            if job["status"] in ("done", "error"):
                break

            ev.wait(timeout=1.0)
            ev.clear()

            frames = []
            with data_lock:
                while buf:
                    frames.append(buf.popleft())

            for jpeg in frames:
                yield b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + jpeg + b'\r\n'

    return Response(
        stream_with_context(generate()),
        mimetype='multipart/x-mixed-replace; boundary=frame'
    )

@forensic_bp.route("/api/forensic/snapshot/<filename>")
def serve_snapshot(filename):
    return send_from_directory(SNAPSHOT_DIR, filename)

@forensic_bp.route("/api/forensic/jobs")
def list_jobs():
    with data_lock:
        summary = []
        for jid, job in sorted(jobs_dict.items(), reverse=True):
            summary.append({
                "id": jid,
                "filename": job["filename"],
                "status": job["status"],
                "progress": job["progress"],
                "detections_count": job["detections_count"],
            })
    return jsonify(summary)
