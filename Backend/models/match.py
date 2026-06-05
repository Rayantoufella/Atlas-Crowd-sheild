from database import db
from datetime import datetime


class Match(db.Model):
    __tablename__ = "match"
    id = db.Column(db.Integer, primary_key=True)
    team_a = db.Column(db.String(100), nullable=False)
    team_b = db.Column(db.String(100), nullable=False)
    stadium = db.Column(db.String(100), nullable=False)
    match_date = db.Column(db.DateTime, nullable=False)
    capacity = db.Column(db.Integer, default=68500)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
