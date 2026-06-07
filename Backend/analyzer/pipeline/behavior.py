from collections import deque, defaultdict
from dataclasses import dataclass, field
import math
import numpy as np
from ..config import (
    TRACK_HISTORY_LEN, ACCEL_WINDOW, VELOCITY_NORM_FACTOR, ACCEL_NORM_FACTOR,
    PROXIMITY_RADIUS_PX, PROXIMITY_HIGH,
    APPROACH_LOOKBACK, APPROACH_NORM_FACTOR, APPROACH_V_LOW,
    APPROACH_V_MED, APPROACH_V_HIGH, GROUP_RADIUS_PX, GROUP_MIN_SIZE,
)
from ..runtime_config import get as cfg
from . import Detection, SignalVector, PersonState, ApproachPair

@dataclass
class TrackRecord:
    track_id: int
    centroid_history: deque = field(default_factory=lambda: deque(maxlen=TRACK_HISTORY_LEN))
    velocity_history: deque = field(default_factory=lambda: deque(maxlen=ACCEL_WINDOW))
    last_seen_frame: int = -1

class BehaviorEngine:
    def __init__(self) -> None:
        self._tracks: dict[int, TrackRecord] = {}
        self._prev_centroids: dict[int, tuple[float, float]] = {}

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

        cur_centroids = {d.track_id: (d.bbox.cx, d.bbox.cy) for d in detections}

        approach_pairs = self._compute_approach_pairs(detections)

        groups = self._detect_groups(detections)

        group_map: dict[int, int] = {}
        for gid, members in groups:
            for mid in members:
                group_map[detections[mid].track_id] = gid

        person_states: list[PersonState] = []
        for det in detections:
            tid = det.track_id
            velocity = self._compute_velocity(tid)
            acceleration = self._compute_acceleration(tid)
            proximity = self._compute_proximity(det, detections)

            approach_v = 0.0
            ttc = 999.0
            for ap in approach_pairs:
                if ap.id_a == tid or ap.id_b == tid:
                    if ap.approach_velocity > approach_v:
                        approach_v = ap.approach_velocity
                        ttc = ap.time_to_collision

            group_size_val = 0
            gid = group_map.get(tid, -1)
            if gid >= 0:
                for members in groups:
                    if members[0] == gid:
                        group_size_val = len(members[1])
                        break

            signals = SignalVector(
                velocity=velocity,
                acceleration=acceleration,
                proximity_count=proximity,
                pose_anomaly=0.0,
                object_flag=det.signals_hint_object,
                object_type=det.signals_hint_object_type,
                approach_velocity=approach_v,
                time_to_collision=ttc,
                group_size=group_size_val,
            )

            wv = cfg("weight_velocity")
            wa = cfg("weight_accel")
            wp = cfg("weight_proximity")
            wo = cfg("weight_object")
            wa_proach = cfg("weight_approach")

            approach_norm = min(approach_v / APPROACH_NORM_FACTOR, 1.0)

            risk_score = (
                wv * signals.velocity
                + wa * signals.acceleration
                + wp * min(signals.proximity_count / PROXIMITY_HIGH, 1.0)
                + wo * (1.0 if signals.object_flag else 0.0)
                + wa_proach * approach_norm
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
                track_id=tid, bbox=det.bbox,
                risk_score=risk_score, risk_tier=tier,
                signals=signals, group_id=gid,
            ))

        self._prev_centroids = cur_centroids
        return person_states

    # ------------------------------------------------------------------
    # Approach velocity + TTC
    # ------------------------------------------------------------------
    def _compute_approach_pairs(self, detections: list[Detection]) -> list[ApproachPair]:
        pairs: list[ApproachPair] = []
        for i in range(len(detections)):
            for j in range(i + 1, len(detections)):
                a, b = detections[i], detections[j]
                cx_a, cy_a = a.bbox.cx, a.bbox.cy
                cx_b, cy_b = b.bbox.cx, b.bbox.cy
                cur_dist = math.hypot(cx_a - cx_b, cy_a - cy_b)
                if cur_dist < 5:
                    continue

                approach_v = 0.0
                p_a = self._prev_centroids.get(a.track_id)
                p_b = self._prev_centroids.get(b.track_id)
                if p_a and p_b:
                    prev_dist = math.hypot(p_a[0] - p_b[0], p_a[1] - p_b[1])
                    approach_v = max(0.0, (prev_dist - cur_dist))

                sev = 0
                if approach_v > APPROACH_V_HIGH and cur_dist < 80:
                    sev = 3
                elif approach_v > APPROACH_V_MED and cur_dist < 150:
                    sev = 2
                elif approach_v > APPROACH_V_LOW and cur_dist < 300:
                    sev = 1

                ttc = cur_dist / approach_v if approach_v > 0.1 else 999.0

                if sev > 0:
                    pairs.append(ApproachPair(
                        id_a=a.track_id, id_b=b.track_id,
                        approach_velocity=approach_v,
                        cur_dist=cur_dist, time_to_collision=ttc,
                        severity=sev,
                    ))
        return pairs

    # ------------------------------------------------------------------
    # Group detection (clustering par distance)
    # ------------------------------------------------------------------
    @staticmethod
    def _detect_groups(detections: list[Detection]) -> list[tuple[int, list[int]]]:
        if len(detections) < GROUP_MIN_SIZE:
            return []
        n = len(detections)
        assigned = set()
        groups: list[tuple[int, list[int]]] = []
        next_gid = 0
        for i in range(n):
            if i in assigned:
                continue
            cluster = [i]
            assigned.add(i)
            changed = True
            while changed:
                changed = False
                for j in range(n):
                    if j in assigned:
                        continue
                    cj = (detections[j].bbox.cx, detections[j].bbox.cy)
                    for ci_idx in cluster:
                        ci = detections[ci_idx]
                        dist = math.hypot(ci.bbox.cx - cj[0], ci.bbox.cy - cj[1])
                        if dist <= GROUP_RADIUS_PX:
                            cluster.append(j)
                            assigned.add(j)
                            changed = True
                            break
            if len(cluster) >= GROUP_MIN_SIZE:
                groups.append((next_gid, cluster))
                next_gid += 1
        return groups

    # ------------------------------------------------------------------
    # Per-person signal computation
    # ------------------------------------------------------------------
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
