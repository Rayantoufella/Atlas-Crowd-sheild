from database import db
from datetime import datetime


class Agent(db.Model):
    __tablename__ = "agent"
    id = db.Column(db.Integer, primary_key=True)
    match_id = db.Column(db.Integer, db.ForeignKey("match.id"))
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(50), default="security")
    assigned_zone = db.Column(db.String(20))
    active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
