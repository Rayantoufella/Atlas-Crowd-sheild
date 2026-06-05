from flask import Blueprint, jsonify

supporter_bp = Blueprint("supporter", __name__)


@supporter_bp.route("/supporter/<int:match_id>")
def supporter_page(match_id):
    return jsonify({
        "match_id": match_id,
        "message": "Page supporter — à implémenter avec le frontend",
    })
