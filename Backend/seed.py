"""Seed initial de la base.

À lancer MANUELLEMENT, une seule fois, depuis le dossier Backend :

    python seed.py

Idempotent : n'insère des lignes que si la table est vide. Ne supprime
jamais rien. Relancer le script ne crée pas de doublons.
"""
from datetime import datetime

from app import app, db
from models.match import Match
from models.agent import Agent
from models.camera import Camera


def seed():
    with app.app_context():
        # S'assure que les tables existent (sans rien supprimer).
        db.create_all()

        if Match.query.count() == 0:
            db.session.add(Match(
                team_a="Maroc", team_b="Sénégal",
                stadium="Stade Moulay Abdellah",
                match_date=datetime(2025, 6, 15, 20, 0),
                capacity=68700,
            ))
            print("→ Match seedé.")

        if Agent.query.count() == 0:
            db.session.add_all([
                Agent(nom="El Amrani", prenom="Yassine", matricule="MR-1041", sector="Est", gateCode="G3", phone="+212 661 11 22 33", status="DEPLOYED"),
                Agent(nom="Bennani", prenom="Salma", matricule="MR-1042", sector="Nord", gateCode="G1", phone="+212 661 22 33 44", status="DEPLOYED"),
                Agent(nom="Toumi", prenom="Karim", matricule="MR-1043", sector="Sud", gateCode="G5", phone="+212 661 33 44 55", status="STANDBY"),
                Agent(nom="Cherkaoui", prenom="Rachid", matricule="MR-1044", sector="Ouest", gateCode="G6", phone="+212 661 44 55 66", status="DEPLOYED"),
                Agent(nom="Mansouri", prenom="Imane", matricule="MR-1045", sector="Nord-Est", gateCode="G2", phone="+212 661 55 66 77", status="STANDBY"),
                Agent(nom="Ouali", prenom="Mehdi", matricule="MR-1046", sector="Sud-Est", gateCode="G4", phone="+212 661 66 77 88", status="OFF"),
            ])
            print("→ Agents seedés.")

        if Camera.query.count() == 0:
            db.session.add_all([
                Camera(zone="Nord", loc="Entree G1 — auvent", resolution="4K", fps=60, status="ACTIVE", lat=33.9716, lng=-6.8498, ip="10.0.1.21"),
                Camera(zone="Nord-Est", loc="Tribune NE — niveau 2", resolution="4K", fps=60, status="ACTIVE", lat=33.9717, lng=-6.8492, ip="10.0.1.22"),
                Camera(zone="Est", loc="Couloir VIP Est", resolution="4K", fps=60, status="ACTIVE", lat=33.9718, lng=-6.8488, ip="10.0.1.23"),
                Camera(zone="Est", loc="Porte 3 — exterieur", resolution="4K", fps=60, status="ACTIVE", lat=33.9719, lng=-6.8487, ip="10.0.1.24"),
                Camera(zone="Sud-Est", loc="Tribune SE — acces", resolution="1080p", fps=30, status="OFFLINE", lat=33.9714, lng=-6.8489, ip="10.0.1.25"),
                Camera(zone="Sud", loc="Aire familles", resolution="4K", fps=60, status="ACTIVE", lat=33.9712, lng=-6.8495, ip="10.0.1.26"),
                Camera(zone="Sud", loc="Sortie urgence Sud", resolution="1080p", fps=30, status="OFFLINE", lat=33.9713, lng=-6.8500, ip="10.0.1.27"),
                Camera(zone="Ouest", loc="Tribune Ouest — haute", resolution="4K", fps=60, status="ACTIVE", lat=33.9715, lng=-6.8503, ip="10.0.1.28"),
            ])
            print("→ Cameras seedées.")

        db.session.commit()
        print("Seed terminé.")


if __name__ == "__main__":
    seed()
