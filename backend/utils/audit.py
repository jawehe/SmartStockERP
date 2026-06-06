# backend/utils/audit.py
from flask import request
from flask_jwt_extended import get_jwt_identity
from extensions import db
from models import AuditLog, User
from datetime import datetime

def create_audit_log(
    action: str,
    entity: str,
    entity_id: int = None,
    details: str = None
):
    """Crée une entrée dans l'audit log"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id) if user_id else None
        
        if not user:
            return
        
        # Récupérer l'adresse IP
        ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)
        if ip_address and ',' in ip_address:
            ip_address = ip_address.split(',')[0]
        
        log = AuditLog(
            user_id=user.id,
            user_name=user.name or user.email,
            user_role=user.role,
            action=action,
            entity=entity,
            entity_id=entity_id,
            details=details,
            ip_address=ip_address,
            created_at=datetime.utcnow()
        )
        
        db.session.add(log)
        db.session.commit()
        
    except Exception as e:
        print(f"Error creating audit log: {e}")
        db.session.rollback()


def log_create(entity: str, entity_id: int, name: str = None):
    """Log une création"""
    details = f"{entity} créé(e) avec l'ID #{entity_id}"
    if name:
        details = f"{entity} '{name}' créé(e) avec l'ID #{entity_id}"
    create_audit_log("CREATE", entity, entity_id, details)


def log_update(entity: str, entity_id: int, changes: dict):
    """Log une modification"""
    details = f"{entity} #{entity_id} modifié(e) : {changes}"
    create_audit_log("UPDATE", entity, entity_id, details[:500])


def log_delete(entity: str, entity_id: int, name: str = None):
    """Log une suppression"""
    details = f"{entity} #{entity_id} supprimé(e)"
    if name:
        details = f"{entity} '{name}' (ID #{entity_id}) supprimé(e)"
    create_audit_log("DELETE", entity, entity_id, details)


def log_login(user_id: int, success: bool):
    """Log une tentative de connexion"""
    user = User.query.get(user_id) if user_id else None
    if user:
        action = "LOGIN_SUCCESS" if success else "LOGIN_FAILED"
        details = f"Connexion {'réussie' if success else 'échouée'} pour {user.email}"
        create_audit_log(action, "Auth", None, details)