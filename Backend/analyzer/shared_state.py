import threading

_lock = threading.Lock()
_state = {
    "zone_label": "CALM",
    "global_risk": 28,
    "high_risk_count": 0,
    "approach_pairs_count": 0,
    "group_count": 0,
    "approach_velocity_max": 0.0,
    "min_ttc": 999.0,
}


def get() -> dict:
    with _lock:
        return dict(_state)


def set(key: str, value):
    with _lock:
        _state[key] = value


def update(data: dict):
    with _lock:
        _state.update(data)
