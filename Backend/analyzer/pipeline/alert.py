from collections import deque, Counter
import math
import numpy as np
from ..config import ZONE_WEIGHT_MAX, ZONE_WEIGHT_MEAN, ZONE_TOP_K
from ..runtime_config import get as cfg
from . import PersonState, ZoneState

class AlertEngine:
    def __init__(self) -> None:
        self._score_history: deque = deque(maxlen=6)
        self._label_history: deque = deque(maxlen=3)
        self._current_label: str = "CALM"
        self.score_log: list[float] = []
        self._frames_above_warning = 0

    def classify(self, person_states: list[PersonState], frame_index: int) -> ZoneState:
        if not person_states:
            smoothed_score = 0.0
            raw_label = "CALM"
        else:
            scores = [p.risk_score for p in person_states]
            top_k = sorted(scores, reverse=True)[:ZONE_TOP_K]
            top_k_mean = sum(top_k) / len(top_k)
            pop_mean = sum(scores) / len(scores)

            zone_score = ZONE_WEIGHT_MAX * top_k_mean + ZONE_WEIGHT_MEAN * pop_mean
            zone_score = float(np.clip(zone_score, 0.0, 1.0))

            self._score_history.append(zone_score)
            smoothed_score = sum(self._score_history) / len(self._score_history)

            zc = cfg("zone_calm")
            zw = cfg("zone_watch")
            zwarn = cfg("zone_warning")

            if smoothed_score < zc:
                raw_label = "CALM"
            elif smoothed_score < zw:
                raw_label = "WATCH"
            elif smoothed_score < zwarn:
                raw_label = "WARNING"
            else:
                raw_label = "CRITICAL"

        if raw_label in ("WARNING", "CRITICAL"):
            self._frames_above_warning += 1
        else:
            self._frames_above_warning = max(0, self._frames_above_warning - 2)

        cp = cfg("critical_persistence_frames")
        if raw_label == "CRITICAL" and self._frames_above_warning < cp:
            raw_label = "WARNING"

        self._label_history.append(raw_label)
        counts = Counter(self._label_history)
        top_label, top_count = counts.most_common(1)[0]
        if top_count >= 3:
            self._current_label = top_label

        self.score_log.append(smoothed_score)
        high_risk_count = sum(1 for p in person_states if p.risk_score >= 0.45)

        approach_pairs_count = 0
        approach_v_max = 0.0
        min_ttc = 999.0
        approach_pairs_list = []
        unique_groups = set()
        for p in person_states:
            if p.signals.approach_velocity > 0:
                approach_pairs_count += 1
            if p.signals.approach_velocity > approach_v_max:
                approach_v_max = p.signals.approach_velocity
            if p.signals.time_to_collision < min_ttc:
                min_ttc = p.signals.time_to_collision
            if p.group_id >= 0:
                unique_groups.add(p.group_id)

        return ZoneState(
            label=self._current_label,
            zone_score=smoothed_score,
            high_risk_count=high_risk_count,
            frame_index=frame_index,
            approach_pairs_count=approach_pairs_count,
            group_count=len(unique_groups),
            approach_velocity_max=approach_v_max,
            min_ttc=min_ttc,
        )

    def get_score_log(self) -> list[float]:
        return list(self.score_log)

    def reset(self) -> None:
        self._score_history.clear()
        self._label_history.clear()
        self._current_label = "CALM"
        self.score_log.clear()
        self._frames_above_warning = 0
