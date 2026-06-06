# backend/routes/audit_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from models import AuditLog
from utils.audit import create_audit_log

audit_bp = Blueprint("audit", __name__)


@audit_bp.route("/logs", methods=["GET"])
@jwt_required()
def get_audit_logs():
    """Récupère les logs d'audit (admin seulement)"""
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 50, type=int)
    entity = request.args.get("entity", "")
    action = request.args.get("action", "")
    user_id = request.args.get("user_id", type=int)
    
    query = AuditLog.query
    
    if entity:
        query = query.filter(AuditLog.entity == entity)
    if action:
        query = query.filter(AuditLog.action == action)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    
    paginated = query.order_by(AuditLog.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        "data": [log.to_dict() for log in paginated.items],
        "meta": {
            "total": paginated.total,
            "total_pages": paginated.pages,
            "page": page,
            "per_page": per_page
        }
    }), 200


@audit_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_audit_stats():
    """Statistiques des logs"""
    total_logs = AuditLog.query.count()
    
    # Actions par type
    actions_count = db.session.query(
        AuditLog.action, db.func.count(AuditLog.id)
    ).group_by(AuditLog.action).all()
    
    # Entités les plus modifiées
    entities_count = db.session.query(
        AuditLog.entity, db.func.count(AuditLog.id)
    ).group_by(AuditLog.entity).order_by(db.func.count(AuditLog.id).desc()).limit(5).all()
    
    return jsonify({
        "total_logs": total_logs,
        "actions": [{"action": a, "count": c} for a, c in actions_count],
        "top_entities": [{"entity": e, "count": c} for e, c in entities_count]
    }), 200


@audit_bp.route("/user/<int:user_id>", methods=["GET"])
@jwt_required()
def get_user_activity(user_id):
    """Récupère l'activité d'un utilisateur spécifique"""
    logs = AuditLog.query.filter_by(user_id=user_id).order_by(
        AuditLog.created_at.desc()
    ).limit(50).all()
    
    return jsonify({
        "data": [log.to_dict() for log in logs]
    }), 200