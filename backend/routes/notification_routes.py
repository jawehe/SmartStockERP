# backend/routes/notification_routes.py
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from extensions import db
from models import Notification
from utils.notifications import check_low_stock_notifications

notification_bp = Blueprint("notifications", __name__)


# GET /api/notifications - Récupérer les notifications
@notification_bp.route("", methods=["GET"])
@jwt_required()
def get_notifications():
    limit = request.args.get("limit", 20, type=int)
    
    notifications = Notification.query.order_by(
        Notification.created_at.desc()
    ).limit(limit).all()
    
    unread_count = Notification.query.filter_by(is_read=False).count()
    
    return jsonify({
        "data": [n.to_dict() for n in notifications],
        "unread_count": unread_count
    }), 200


# PATCH /api/notifications/:id/read - Marquer comme lu
@notification_bp.route("/<int:notif_id>/read", methods=["PATCH"])
@jwt_required()
def mark_as_read(notif_id):
    notification = Notification.query.get_or_404(notif_id)
    notification.is_read = True
    db.session.commit()
    return jsonify({"message": "Notification marquée comme lue"}), 200


# PATCH /api/notifications/read-all - Marquer toutes comme lues
@notification_bp.route("/read-all", methods=["PATCH"])
@jwt_required()
def mark_all_as_read():
    Notification.query.update({"is_read": True})
    db.session.commit()
    return jsonify({"message": "Toutes les notifications sont lues"}), 200


# POST /api/notifications/check-stock - Vérifier stocks faibles
@notification_bp.route("/check-stock", methods=["POST"])
@jwt_required()
def check_stock():
    from utils.notifications import check_low_stock_notifications
    count = check_low_stock_notifications()
    return jsonify({
        "message": f"{count} notification(s) créée(s)",
        "created": count
    }), 200