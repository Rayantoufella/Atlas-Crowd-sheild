import cv2
import numpy as np
import os
from .pipeline.frame_reader import FrameReader
from .pipeline.detector import Detector
from .pipeline.behavior import BehaviorEngine
from .pipeline.alert import AlertEngine
from .pipeline.renderer import Renderer
from .runtime_config import get as cfg

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SNAPSHOT_DIR = os.path.join(BASE_DIR, "uploads", "snapshots")
os.makedirs(SNAPSHOT_DIR, exist_ok=True)

detector = Detector()
renderer = Renderer()

def process_video(video_path, job_id, progress_callback, frame_callback=None):
    behavior = BehaviorEngine()
    alert = AlertEngine()

    reader = FrameReader(video_path, target_fps=cfg("target_fps"))
    total_frames = reader.total_frames
    frame_idx = 0
    detections = []
    LABEL_ORDER = {"CALM": 0, "WATCH": 1, "WARNING": 2, "CRITICAL": 3}
    peak_label = "CALM"
    peak_score = 0.0

    while True:
        ret, frame, idx = reader.read()
        if not ret:
            break

        dets = detector.run(frame, idx)
        person_states = behavior.update(dets, idx, reader.height)
        zone_state = alert.classify(person_states, idx)

        if LABEL_ORDER.get(zone_state.label, 0) > LABEL_ORDER.get(peak_label, 0):
            peak_label = zone_state.label
            peak_score = zone_state.zone_score

        annotated = renderer.draw(frame, person_states, zone_state, detector.last_objects)

        for ps in person_states:
            if ps.risk_tier not in ("high", "critical"):
                continue

            bbox = ps.bbox
            pad = 20
            x1 = max(0, bbox.x1 - pad)
            y1 = max(0, bbox.y1 - pad)
            x2 = min(frame.shape[1], bbox.x2 + pad)
            y2 = min(frame.shape[0], bbox.y2 + pad)

            p_idx = ps.track_id
            snapshot_key = f"{job_id}_f{idx}_t{p_idx}"
            snapshot_fn = f"{snapshot_key}.jpg"

            crop = annotated[y1:y2, x1:x2]
            if crop.size > 0:
                sw = cfg("snapshot_width")
                ch = crop.shape[0] * sw // crop.shape[1]
                crop_small = cv2.resize(crop, (sw, ch))
                cv2.imwrite(os.path.join(SNAPSHOT_DIR, snapshot_fn), crop_small,
                            [int(cv2.IMWRITE_JPEG_QUALITY), cfg("snapshot_jpeg_quality")])

                timestamp_sec = idx / reader.fps if reader.fps > 0 else 0

                detections.append({
                    "id": snapshot_key,
                    "frame": idx,
                    "timestamp": round(timestamp_sec, 2),
                    "label": ps.risk_tier.upper(),
                    "label_en": "Critical" if ps.risk_tier == "critical" else "High Risk",
                    "confidence": round(ps.risk_score * 100),
                    "snapshot": snapshot_fn,
                    "bbox": [bbox.x1, bbox.y1, bbox.x2, bbox.y2],
                    "signals": {
                        "velocity": round(ps.signals.velocity, 2),
                        "acceleration": round(ps.signals.acceleration, 2),
                        "proximity": ps.signals.proximity_count,
                    },
                })

        frame_idx = idx
        progress = int((frame_idx / total_frames) * 100) if total_frames > 0 else 0

        if frame_callback:
            sw = cfg("stream_width")
            sy = annotated.shape[0] * sw // annotated.shape[1]
            stream_small = cv2.resize(annotated, (sw, sy))
            _, jpeg_bytes = cv2.imencode('.jpg', stream_small, [int(cv2.IMWRITE_JPEG_QUALITY), cfg("stream_jpeg_quality")])
            frame_callback(job_id, jpeg_bytes.tobytes())

        progress_callback(job_id, {
            "status": "processing",
            "progress": progress,
            "frame": frame_idx,
            "total_frames": total_frames,
            "detections_count": len(detections),
        })

    reader.release()
    behavior = None
    alert.reset()

    progress_callback(job_id, {
        "status": "done",
        "progress": 100,
        "frame": frame_idx,
        "total_frames": total_frames,
        "detections_count": len(detections),
        "detections": detections,
        "peak_label": peak_label,
        "peak_score": peak_score,
    })
