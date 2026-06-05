from flask import Blueprint, jsonify, request

cameras_bp = Blueprint("cameras", __name__)

SEED_CAMERAS = [
    {"id": "CAM-01", "zone": "Nord", "loc": "Entrée G1 — auvent", "resolution": "4K", "fps": 60, "status": "ACTIVE", "lat": 33.9716, "lng": -6.8498, "ip": "10.0.1.21"},
    {"id": "CAM-02", "zone": "Nord-Est", "loc": "Tribune NE — niveau 2", "resolution": "4K", "fps": 60, "status": "ACTIVE", "lat": 33.9717, "lng": -6.8492, "ip": "10.0.1.22"},
    {"id": "CAM-03", "zone": "Est", "loc": "Couloir VIP Est", "resolution": "4K", "fps": 60, "status": "ACTIVE", "lat": 33.9718, "lng": -6.8488, "ip": "10.0.1.23"},
    {"id": "CAM-04", "zone": "Est", "loc": "Porte 3 — extérieur", "resolution": "4K", "fps": 60, "status": "ACTIVE", "lat": 33.9719, "lng": -6.8487, "ip": "10.0.1.24"},
    {"id": "CAM-05", "zone": "Sud-Est", "loc": "Tribune SE — accès", "resolution": "1080p", "fps": 30, "status": "OFFLINE", "lat": 33.9714, "lng": -6.8489, "ip": "10.0.1.25"},
    {"id": "CAM-06", "zone": "Sud", "loc": "Aire familles", "resolution": "4K", "fps": 60, "status": "ACTIVE", "lat": 33.9712, "lng": -6.8495, "ip": "10.0.1.26"},
    {"id": "CAM-07", "zone": "Sud", "loc": "Sortie urgence Sud", "resolution": "1080p", "fps": 30, "status": "OFFLINE", "lat": 33.9713, "lng": -6.8500, "ip": "10.0.1.27"},
    {"id": "CAM-08", "zone": "Ouest", "loc": "Tribune Ouest — haute", "resolution": "4K", "fps": 60, "status": "ACTIVE", "lat": 33.9715, "lng": -6.8503, "ip": "10.0.1.28"},
]


@cameras_bp.route("/api/camera/list")
def list_cameras():
    return jsonify(SEED_CAMERAS)
