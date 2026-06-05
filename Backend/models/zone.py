from database import db
from datetime import datetime


class Zone(db.Model):
    __tablename__ = "zone"
    id = db.Column(db.Integer, primary_key=True)
    match_id = db.Column(db.Integer, db.ForeignKey("match.id"))
    gate_id = db.Column(db.String(20), nullable=False)
    label = db.Column(db.String(100))
    risk_score = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20), default="safe")
    density = db.Column(db.String(20), default="low")
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)
