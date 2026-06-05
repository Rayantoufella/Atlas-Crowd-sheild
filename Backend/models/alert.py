from database import db
from datetime import datetime


class Alert(db.Model):
    __tablename__ = "alert"
    id = db.Column(db.Integer, primary_key=True)
    match_id = db.Column(db.Integer, db.ForeignKey("match.id"))
    zone_id = db.Column(db.String(20), nullable=False)
    message = db.Column(db.Text, nullable=False)
    eta_minutes = db.Column(db.Integer)
    agents_needed = db.Column(db.Integer)
    redirect_to = db.Column(db.String(20))
    active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
