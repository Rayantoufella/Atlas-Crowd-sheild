from flask import Blueprint, jsonify, request
from analyzer import runtime_config

settings_bp = Blueprint("settings", __name__)

DETECTION_MODES = {
    "fast": {
        "conf_threshold": 0.15,
        "weight_velocity": 0.35,
        "weight_accel": 0.20,
        "weight_proximity": 0.25,
        "weight_object": 0.20,
    },
    "balanced": {
        "conf_threshold": 0.20,
        "weight_velocity": 0.40,
        "weight_accel": 0.25,
        "weight_proximity": 0.15,
        "weight_object": 0.20,
    },
    "strict": {
        "conf_threshold": 0.30,
        "weight_velocity": 0.50,
        "weight_accel": 0.25,
        "weight_proximity": 0.15,
        "weight_object": 0.10,
    },
}

@settings_bp.route("/api/settings", methods=["GET"])
def get_settings():
    cfg = runtime_config.get_all()
    risk_threshold = round(cfg.get("thresh_high", 0.45) * 100)
    warn_threshold = round(cfg.get("thresh_medium", 0.32) * 100)
    refresh_map = {30: "1s", 15: "2s", 6: "5s"}
    target_fps = cfg.get("target_fps", 30)
    refresh = refresh_map.get(target_fps, "2s")
    return jsonify({
        "conf_threshold": cfg.get("conf_threshold"),
        "riskThreshold": risk_threshold,
        "warnThreshold": warn_threshold,
        "refresh": refresh,
        "detectionMode": cfg.get("detection_mode", "balanced"),
        "weight_velocity": cfg.get("weight_velocity"),
        "weight_accel": cfg.get("weight_accel"),
        "weight_proximity": cfg.get("weight_proximity"),
        "weight_object": cfg.get("weight_object"),
        "thresh_low": cfg.get("thresh_low"),
        "thresh_medium": cfg.get("thresh_medium"),
        "thresh_high": cfg.get("thresh_high"),
        "zone_calm": cfg.get("zone_calm"),
        "zone_watch": cfg.get("zone_watch"),
        "zone_warning": cfg.get("zone_warning"),
        "critical_persistence_frames": cfg.get("critical_persistence_frames"),
        "target_fps": target_fps,
        "stream_jpeg_quality": cfg.get("stream_jpeg_quality"),
        "snapshot_jpeg_quality": cfg.get("snapshot_jpeg_quality"),
        "stream_width": cfg.get("stream_width"),
        "snapshot_width": cfg.get("snapshot_width"),
    })

@settings_bp.route("/api/settings", methods=["PUT"])
def update_settings():
    body = request.get_json()
    if not body:
        return jsonify({"error": "No data provided"}), 400

    updates = {}

    mode = body.get("detectionMode")
    if mode and mode in DETECTION_MODES:
        updates["detection_mode"] = mode
        updates.update(DETECTION_MODES[mode])

    risk_threshold = body.get("riskThreshold")
    if risk_threshold is not None:
        updates["thresh_high"] = round(risk_threshold / 100, 2)
    warn_threshold = body.get("warnThreshold")
    if warn_threshold is not None:
        updates["thresh_medium"] = round(warn_threshold / 100, 2)

    refresh = body.get("refresh")
    if refresh:
        fps_map = {"1s": 30, "2s": 15, "5s": 6}
        updates["target_fps"] = fps_map.get(refresh, 30)

    weight_velocity = body.get("weight_velocity")
    if weight_velocity is not None:
        updates["weight_velocity"] = round(weight_velocity, 2)
    weight_accel = body.get("weight_accel")
    if weight_accel is not None:
        updates["weight_accel"] = round(weight_accel, 2)
    weight_proximity = body.get("weight_proximity")
    if weight_proximity is not None:
        updates["weight_proximity"] = round(weight_proximity, 2)
    weight_object = body.get("weight_object")
    if weight_object is not None:
        updates["weight_object"] = round(weight_object, 2)

    for k in ("thresh_low", "zone_calm", "zone_watch", "zone_warning",
              "critical_persistence_frames", "conf_threshold",
              "stream_jpeg_quality", "snapshot_jpeg_quality",
              "stream_width", "snapshot_width"):
        v = body.get(k)
        if v is not None:
            updates[k] = v

    if updates:
        runtime_config.update(updates)

    return jsonify({"status": "ok", "updated": list(updates.keys())})
