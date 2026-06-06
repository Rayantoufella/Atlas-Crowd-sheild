from flask import Blueprint, jsonify, request, Response
from database import db
from models.match import Match
from models.alert import Alert
from models.zone import Zone
from models.agent import Agent
from datetime import datetime, timedelta
from fpdf import FPDF
import io

reports_bp = Blueprint("reports", __name__)


PAGE_W = 210
PAGE_H = 297
MARGIN = 12


def latin(s):
    return s.replace("—", "-").replace("é", "e").replace("è", "e").replace("ê", "e").replace("ë", "e") \
            .replace("à", "a").replace("â", "a").replace("ù", "u").replace("û", "u") \
            .replace("ô", "o").replace("î", "i").replace("ï", "i").replace("ç", "c") \
            .replace("É", "E").replace("È", "E").replace("Ê", "E").replace("Ë", "E") \
            .replace("À", "A").replace("Â", "A").replace("Ù", "U").replace("Û", "U") \
            .replace("Ô", "O").replace("Î", "I").replace("Ï", "I").replace("Ç", "C") \
            .replace("'", "'").replace('"', '"')


class ReportPDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(120, 120, 120)
        self.cell(0, 6, latin("ATLAS CROWD SHIELD - Rapport"), align="C")
        self.ln(8)

    def footer(self):
        self.set_y(-14)
        self.set_font("Helvetica", "", 7)
        self.set_text_color(160, 160, 160)
        self.cell(0, 8, f"Page {self.page_no()}/{{nb}}", align="C")

    def section_title(self, title):
        self.set_font("Helvetica", "B", 13)
        self.set_text_color(30, 30, 30)
        self.cell(0, 9, latin(title))
        self.ln(11)

    def cell_label(self, label, value):
        self.set_font("Helvetica", "", 8.5)
        self.set_text_color(130, 130, 130)
        self.cell(30, 6, latin(label))
        self.set_font("Helvetica", "B", 9.5)
        self.set_text_color(30, 30, 30)
        self.cell(0, 6, latin(str(value)))
        self.ln(6.5)

    def table_header(self, cols):
        self.set_font("Helvetica", "B", 7.5)
        self.set_fill_color(230, 230, 230)
        self.set_text_color(60, 60, 60)
        w = (PAGE_W - 2 * MARGIN) / len(cols)
        for c in cols:
            self.cell(w, 7, latin(c), border=1, fill=True, align="C")
        self.ln()

    def table_row(self, cols, widths=None):
        self.set_font("Helvetica", "", 7.5)
        self.set_text_color(40, 40, 40)
        if widths is None:
            widths = [(PAGE_W - 2 * MARGIN) / len(cols)] * len(cols)
        for i, c in enumerate(cols):
            self.cell(widths[i], 6, latin(str(c)), border=1, align="C")
        self.ln()


@reports_bp.route("/api/report/incidents", methods=["GET", "POST"])
def list_incidents():
    if request.method == "POST":
        data = request.get_json(force=True)
        alert = Alert(
            match_id=data.get("match_id"),
            zone_id=data.get("zone_id", ""),
            message=data.get("message", ""),
            eta_minutes=data.get("eta_minutes"),
            agents_needed=data.get("agents_needed"),
            redirect_to=data.get("redirect_to"),
            active=data.get("active", True),
        )
        db.session.add(alert)
        db.session.commit()
        return jsonify({"id": alert.id}), 201
    match_id = request.args.get("match_id", type=int)
    zone_id = request.args.get("zone_id")
    page = request.args.get("page", 1, type=int)
    per_page = 20

    query = Alert.query

    if match_id:
        query = query.filter_by(match_id=match_id)
    if zone_id:
        query = query.filter_by(zone_id=zone_id)

    total = query.count()
    alerts = query.order_by(Alert.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    items = []
    for a in alerts:
        match = Match.query.get(a.match_id)
        items.append({
            "id": a.id,
            "match_id": a.match_id,
            "match_label": f"{match.team_a} vs {match.team_b}" if match else "—",
            "zone_id": a.zone_id,
            "message": a.message,
            "eta_minutes": a.eta_minutes,
            "agents_needed": a.agents_needed,
            "redirect_to": a.redirect_to,
            "active": a.active,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        })

    by_zone = {}
    for a in items:
        z = a["zone_id"]
        by_zone[z] = by_zone.get(z, 0) + 1

    return jsonify({
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page,
        "by_zone": by_zone,
    })


@reports_bp.route("/api/report/incident/<int:incident_id>")
def incident_detail(incident_id):
    alert = Alert.query.get_or_404(incident_id)
    match = Match.query.get(alert.match_id)
    return jsonify({
        "id": alert.id,
        "match_id": alert.match_id,
        "match_label": f"{match.team_a} vs {match.team_b}" if match else "—",
        "zone_id": alert.zone_id,
        "message": alert.message,
        "eta_minutes": alert.eta_minutes,
        "agents_needed": alert.agents_needed,
        "redirect_to": alert.redirect_to,
        "active": alert.active,
        "created_at": alert.created_at.isoformat() if alert.created_at else None,
    })


@reports_bp.route("/api/report/match-summary/<int:match_id>")
def match_summary(match_id):
    match = Match.query.get_or_404(match_id)
    alerts = Alert.query.filter_by(match_id=match_id).order_by(Alert.created_at.desc()).all()
    zones = Zone.query.filter_by(match_id=match_id).all()
    agents = Agent.query.filter_by(match_id=match_id).all()

    active_alerts = [a for a in alerts if a.active]
    resolved_alerts = [a for a in alerts if not a.active]
    avg_eta = sum(a.eta_minutes or 0 for a in alerts) / len(alerts) if alerts else 0

    zone_data = []
    for z in zones:
        zone_alerts = sum(1 for a in alerts if a.zone_id == z.gate_id)
        zone_data.append({
            "gate_id": z.gate_id,
            "label": z.label,
            "risk_score": z.risk_score,
            "status": z.status,
            "density": z.density,
            "incidents": zone_alerts,
        })

    return jsonify({
        "match": {
            "id": match.id,
            "team_a": match.team_a,
            "team_b": match.team_b,
            "stadium": match.stadium,
            "match_date": match.match_date.isoformat(),
            "capacity": match.capacity,
            "status": "LIVE" if match.match_date <= datetime.utcnow() <= match.match_date + timedelta(hours=3) else ("UPCOMING" if match.match_date > datetime.utcnow() else "FINISHED"),
        },
        "incidents": {
            "total": len(alerts),
            "active": len(active_alerts),
            "resolved": len(resolved_alerts),
            "avg_response_minutes": round(avg_eta, 1),
        },
        "zones": zone_data,
        "agents": {
            "total": len(agents),
            "active": sum(1 for a in agents if a.active),
        },
    })


@reports_bp.route("/api/report/incidents/export")
def export_incidents_pdf():
    match_id = request.args.get("match_id", type=int)
    zone_id = request.args.get("zone_id")
    query = Alert.query
    if match_id:
        query = query.filter_by(match_id=match_id)
    if zone_id:
        query = query.filter_by(zone_id=zone_id)
    alerts = query.order_by(Alert.created_at.desc()).limit(500).all()

    pdf = ReportPDF()
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.add_page()
    pdf.section_title("Rapport des incidents")

    if match_id:
        m = Match.query.get(match_id)
        if m:
            pdf.cell_label("Match", f"{m.team_a} vs {m.team_b}")
    pdf.cell_label("Total incidents", str(len(alerts)))
    pdf.cell_label("Généré le", datetime.utcnow().strftime("%d/%m/%Y %H:%M"))
    pdf.ln(4)

    cols = ["ID", "Zone", "Message", "Agents", "ETA", "Statut", "Date"]
    widths = [12, 20, 64, 16, 14, 16, 52]
    pdf.table_header(cols)
    for a in alerts:
        pdf.table_row([
            str(a.id),
            a.zone_id.upper().replace("GATE_", "G"),
            a.message[:50],
            str(a.agents_needed or "—"),
            f"{a.eta_minutes or '—'} min",
            "ACTIF" if a.active else "RÉSOLU",
            a.created_at.strftime("%d/%m %H:%M") if a.created_at else "—",
        ], widths)

    buf = io.BytesIO()
    pdf.output(buf)
    buf.seek(0)
    return Response(buf.getvalue(), mimetype="application/pdf",
                    headers={"Content-Disposition": "attachment; filename=incidents.pdf"})


@reports_bp.route("/api/report/match-summary/<int:match_id>/export")
def export_match_pdf(match_id):
    match = Match.query.get_or_404(match_id)
    alerts = Alert.query.filter_by(match_id=match_id).order_by(Alert.created_at.desc()).all()
    zones = Zone.query.filter_by(match_id=match_id).all()
    agents = Agent.query.filter_by(match_id=match_id).all()
    active_alerts = [a for a in alerts if a.active]
    avg_eta = sum(a.eta_minutes or 0 for a in alerts) / len(alerts) if alerts else 0

    pdf = ReportPDF()
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.add_page()
    pdf.section_title("Rapport de match")
    pdf.cell_label("Match", f"{match.team_a} vs {match.team_b}")
    pdf.cell_label("Stade", match.stadium)
    pdf.cell_label("Date", match.match_date.strftime("%d/%m/%Y") if match.match_date else "—")
    pdf.cell_label("Capacité", str(match.capacity or "—"))
    pdf.ln(3)
    pdf.cell_label("Total incidents", str(len(alerts)))
    pdf.cell_label("Actifs", str(len(active_alerts)))
    pdf.cell_label("Résolus", str(len(alerts) - len(active_alerts)))
    pdf.cell_label("Tps moyen (min)", str(round(avg_eta, 1)))
    pdf.cell_label("Agents déployés", f"{sum(1 for a in agents if a.active)} / {len(agents)}")

    if zones:
        pdf.ln(4)
        pdf.section_title("Zones")
        cols = ["Zone", "Risque", "Statut", "Densité", "Incidents"]
        widths = [30, 30, 30, 30, 30]
        pdf.table_header(cols)
        for z in zones:
            za = sum(1 for a in alerts if a.zone_id == z.gate_id)
            pdf.table_row([
                z.gate_id.upper().replace("GATE_", "G"),
                str(z.risk_score or "—"),
                str(z.status or "—"),
                str(z.density or "—"),
                str(za),
            ], widths)

    if alerts:
        pdf.add_page()
        pdf.section_title("Détail des incidents")
        cols = ["ID", "Zone", "Message", "ETA", "Statut"]
        widths = [12, 18, 88, 16, 16]
        pdf.table_header(cols)
        for a in alerts:
            pdf.table_row([
                str(a.id),
                a.zone_id.upper().replace("GATE_", "G"),
                a.message[:70],
                f"{a.eta_minutes or '—'} min",
                "ACTIF" if a.active else "RÉSOLU",
            ], widths)

    buf = io.BytesIO()
    pdf.output(buf)
    buf.seek(0)
    return Response(buf.getvalue(), mimetype="application/pdf",
                    headers={"Content-Disposition": f"attachment; filename=match_{match_id}.pdf"})
