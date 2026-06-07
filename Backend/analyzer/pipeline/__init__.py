from dataclasses import dataclass, field
from typing import Optional
import numpy as np

@dataclass
class BBox:
    x1: int; y1: int; x2: int; y2: int

    @property
    def cx(self) -> float: return (self.x1 + self.x2) / 2
    @property
    def cy(self) -> float: return (self.y1 + self.y2) / 2
    @property
    def width(self) -> int: return self.x2 - self.x1
    @property
    def height(self) -> int: return self.y2 - self.y1

@dataclass
class Detection:
    track_id: int
    bbox: BBox
    confidence: float
    class_name: str
    keypoints: Optional[np.ndarray] = None
    signals_hint_object: bool = False
    signals_hint_object_type: str = ""

@dataclass
class ApproachPair:
    id_a: int
    id_b: int
    approach_velocity: float
    cur_dist: float
    time_to_collision: float
    severity: int

@dataclass
class SignalVector:
    velocity: float
    acceleration: float
    proximity_count: int
    pose_anomaly: float
    object_flag: bool
    object_type: str
    approach_velocity: float = 0.0
    time_to_collision: float = 999.0
    group_size: int = 0

@dataclass
class PersonState:
    track_id: int
    bbox: BBox
    risk_score: float
    risk_tier: str
    signals: SignalVector
    group_id: int = -1

@dataclass
class ZoneState:
    label: str
    zone_score: float
    high_risk_count: int
    frame_index: int
    approach_pairs_count: int = 0
    approach_pairs: list = field(default_factory=list)
    group_count: int = 0
    approach_velocity_max: float = 0.0
    min_ttc: float = 999.0
