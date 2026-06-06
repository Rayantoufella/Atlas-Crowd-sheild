from database import db
from datetime import datetime


class Camera(db.Model):
    __tablename__ = "camera"
    id = db.Column(db.Integer, primary_key=True)
    zone = db.Column(db.String(50), nullable=False)
    loc = db.Column(db.String(200))
    resolution = db.Column(db.String(20), default="4K")
    fps = db.Column(db.Integer, default=60)
    status = db.Column(db.String(20), default="ACTIVE")
    lat = db.Column(db.Float)
    lng = db.Column(db.Float)
    ip = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
