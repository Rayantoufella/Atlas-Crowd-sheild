import json
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SETTINGS_PATH = os.path.join(BASE_DIR, "analyzer", "settings.json")

DEFAULTS = {
    "conf_threshold": 0.20,
    "weight_velocity": 0.25,
    "weight_accel": 0.20,
    "weight_proximity": 0.35,
    "weight_object": 0.20,
    "thresh_low": 0.35,
    "thresh_medium": 0.50,
    "thresh_high": 0.65,
    "zone_calm": 0.20,
    "zone_watch": 0.30,
    "zone_warning": 0.42,
    "critical_persistence_frames": 15,
    "target_fps": 30,
    "detection_mode": "balanced",
    "stream_jpeg_quality": 85,
    "snapshot_jpeg_quality": 85,
    "stream_width": 854,
    "snapshot_width": 320,
}

_config = dict(DEFAULTS)

def _load():
    global _config
    try:
        if os.path.exists(SETTINGS_PATH):
            with open(SETTINGS_PATH, "r") as f:
                saved = json.load(f)
                _config.update(saved)
    except (json.JSONDecodeError, OSError):
        pass

def _save():
    with open(SETTINGS_PATH, "w") as f:
        json.dump(_config, f, indent=2)

def get(key: str):
    return _config.get(key, DEFAULTS.get(key))

def get_all() -> dict:
    return dict(_config)

def update(values: dict):
    _config.update(values)
    _save()

def reset():
    _config.clear()
    _config.update(DEFAULTS)
    _save()

_load()
