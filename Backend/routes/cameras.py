from flask import Blueprint, jsonify, request
from database import db
from models.camera import Camera

cameras_bp = Blueprint("cameras", __name__)


def _cam_to_dict(c):
    return {
        "id": f"CAM-{c.id:02d}",
        "zone": c.zone,
        "loc": c.loc or "",
        "resolution": c.resolution,
        "fps": c.fps,
        "status": c.status,
        "lat": c.lat,
        "lng": c.lng,
        "ip": c.ip or "",
    }


@cameras_bp.route("/api/camera/list")
def list_cameras():
    cams = Camera.query.order_by(Camera.id).all()
    return jsonify([_cam_to_dict(c) for c in cams])


@cameras_bp.route("/api/camera/create", methods=["POST"])
def create_camera():
    data = request.get_json(force=True)
    c = Camera(
        zone=data.get("zone", "Nord"),
        loc=data.get("loc", ""),
        resolution=data.get("resolution", "4K"),
        fps=data.get("fps", 60),
        status=data.get("status", "ACTIVE"),
        lat=data.get("lat"),
        lng=data.get("lng"),
        ip=data.get("ip", ""),
    )
    db.session.add(c)
    db.session.commit()
    return jsonify(_cam_to_dict(c)), 201


@cameras_bp.route("/api/camera/<int:camera_id>", methods=["PUT"])
def update_camera(camera_id):
    c = Camera.query.get_or_404(camera_id)
    data = request.get_json(force=True)
    if "zone" in data: c.zone = data["zone"]
    if "loc" in data: c.loc = data["loc"]
    if "resolution" in data: c.resolution = data["resolution"]
    if "fps" in data: c.fps = data["fps"]
    if "status" in data: c.status = data["status"]
    if "lat" in data: c.lat = data["lat"]
    if "lng" in data: c.lng = data["lng"]
    if "ip" in data: c.ip = data["ip"]
    db.session.commit()
    return jsonify(_cam_to_dict(c))


@cameras_bp.route("/api/camera/<int:camera_id>", methods=["DELETE"])
def delete_camera(camera_id):
    c = Camera.query.get_or_404(camera_id)
    db.session.delete(c)
    db.session.commit()
    return jsonify({"status": "deleted"})
