from collections import deque, defaultdict
from dataclasses import dataclass, field
import math
import numpy as np
from ..config import (
    TRACK_HISTORY_LEN, ACCEL_WINDOW, VELOCITY_NORM_FACTOR, ACCEL_NORM_FACTOR,
    PROXIMITY_RADIUS_PX, PROXIMITY_HIGH,
)
from ..runtime_config import get as cfg
from . import Detection, SignalVector, PersonState

@dataclass
class TrackRecord:
    track_id: int
    centroid_history: deque = field(default_factory=lambda: deque(maxlen=TRACK_HISTORY_LEN))
    velocity_history: deque = field(default_factory=lambda: deque(maxlen=ACCEL_WINDOW))
    last_seen_frame: int = -1

class BehaviorEngine:
    def __init__(self) -> None:
        self._tracks: dict[int, TrackRecord] = {}

    def update(self, detections: list[Detection], frame_index: int, frame_height: int) -> list[PersonState]:
        if not detections:
            return []

        for det in detections:
            tid = det.track_id
            if tid not in self._tracks:
                self._tracks[tid] = TrackRecord(track_id=tid)
            record = self._tracks[tid]
            record.centroid_history.append((det.bbox.cx, det.bbox.cy))
            record.last_seen_frame = frame_index

        stale_ids = [tid for tid, rec in self._tracks.items() if frame_index - rec.last_seen_frame > 30]
        for tid in stale_ids:
            del self._tracks[tid]

        person_states: list[PersonState] = []
        for det in detections:
            velocity = self._compute_velocity(det.track_id)
            acceleration = self._compute_acceleration(det.track_id)
            proximity = self._compute_proximity(det, detections)

            signals = SignalVector(
                velocity=velocity,
                acceleration=acceleration,
                proximity_count=proximity,
                pose_anomaly=0.0,
                object_flag=det.signals_hint_object,
                object_type=det.signals_hint_object_type,
            )

            wv = cfg("weight_velocity")
            wa = cfg("weight_accel")
            wp = cfg("weight_proximity")
            wo = cfg("weight_object")

            risk_score = (
                wv * signals.velocity
                + wa * signals.acceleration
                + wp * min(signals.proximity_count / PROXIMITY_HIGH, 1.0)
                + wo * (1.0 if signals.object_flag else 0.0)
            )
            risk_score = float(np.clip(risk_score, 0.0, 1.0))

            tl = cfg("thresh_low")
            tm = cfg("thresh_medium")
            th = cfg("thresh_high")

            if risk_score < tl:
                tier = "low"
            elif risk_score < tm:
                tier = "medium"
            elif risk_score < th:
                tier = "high"
            else:
                tier = "critical"

            person_states.append(PersonState(
                track_id=det.track_id, bbox=det.bbox,
                risk_score=risk_score, risk_tier=tier,
                signals=signals,
            ))
        return person_states

    def _compute_velocity(self, track_id: int) -> float:
        record = self._tracks.get(track_id)
        if record is None or len(record.centroid_history) < 2:
            return 0.0
        steps = min(3, len(record.centroid_history) - 1)
        dx = record.centroid_history[-1][0] - record.centroid_history[-(steps + 1)][0]
        dy = record.centroid_history[-1][1] - record.centroid_history[-(steps + 1)][1]
        raw_speed = math.sqrt(dx * dx + dy * dy) / steps
        return float(min(raw_speed / VELOCITY_NORM_FACTOR, 1.0))

    def _compute_acceleration(self, track_id: int) -> float:
        record = self._tracks.get(track_id)
        if record is None:
            return 0.0
        current_velocity = self._compute_velocity(track_id)
        record.velocity_history.append(current_velocity)
        if len(record.velocity_history) < 2:
            return 0.0
        accel = abs(record.velocity_history[-1] - record.velocity_history[-2])
        return float(np.clip(accel / (ACCEL_NORM_FACTOR / 100), 0.0, 1.0))

    @staticmethod
    def _compute_proximity(detection: Detection, all_detections: list[Detection]) -> int:
        count = 0
        for other in all_detections:
            if other.track_id == detection.track_id:
                continue
            dist = math.hypot(detection.bbox.cx - other.bbox.cx, detection.bbox.cy - other.bbox.cy)
            if dist <= PROXIMITY_RADIUS_PX:
                count += 1
        return count
