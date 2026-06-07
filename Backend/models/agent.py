from database import db
from datetime import datetime


class Agent(db.Model):
    __tablename__ = "agent"
    id = db.Column(db.Integer, primary_key=True)
    match_id = db.Column(db.Integer, db.ForeignKey("match.id"))
    nom = db.Column(db.String(100), nullable=False, default="")
    prenom = db.Column(db.String(100), nullable=False, default="")
    matricule = db.Column(db.String(50), default="")
    sector = db.Column(db.String(50), default="")
    gateCode = db.Column(db.String(10), default="")
    phone = db.Column(db.String(50), default="")
    status = db.Column(db.String(20), default="STANDBY")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
