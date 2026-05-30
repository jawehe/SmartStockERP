# backend/routes/user_routes.py
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import User
from datetime import datetime

user_bp = Blueprint('user', __name__)

# Décorateur pour vérifier si l'utilisateur est admin
def admin_required(f):
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user or user.role != 'admin':
            return jsonify({'error': 'Accès admin requis'}), 403
        return f(*args, **kwargs)
    return decorated_function

# GET /api/users - Récupérer tous les utilisateurs (admin only)
@user_bp.route('', methods=['GET'])
@jwt_required()
@admin_required
def get_users():
    users = User.query.all()
    return jsonify({
        'data': [{
            'id': u.id,
            'name': u.name,
            'email': u.email,
            'role': u.role,
            'created_at': u.created_at.isoformat() if u.created_at else datetime.now().isoformat()
        } for u in users]
    }), 200

# GET /api/users/<id> - Récupérer un utilisateur spécifique
@user_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    current_user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    
    # Seul l'admin ou l'utilisateur lui-même peut voir ses infos
    if int(current_user_id) != user_id:
        current = User.query.get(current_user_id)
        if not current or current.role != 'admin':
            return jsonify({'error': 'Non autorisé'}), 403
    
    return jsonify({
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'role': user.role,
        'created_at': user.created_at.isoformat() if user.created_at else None
    }), 200

# POST /api/users - Créer un utilisateur (admin only)
@user_bp.route('', methods=['POST'])
@jwt_required()
@admin_required
def create_user():
    data = request.get_json()
    
    # Validation
    if not data.get('name') or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Nom, email et mot de passe requis'}), 400
    
    # Vérifier si l'email existe déjà
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Cet email est déjà utilisé'}), 400
    
    from werkzeug.security import generate_password_hash
    new_user = User(
        name=data['name'],
        email=data['email'],
        role=data.get('role', 'seller'),
        password_hash=generate_password_hash(data['password']),
        created_at=datetime.now()
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({
        'message': 'Utilisateur créé avec succès',
        'data': {
            'id': new_user.id,
            'name': new_user.name,
            'email': new_user.email,
            'role': new_user.role,
            'created_at': new_user.created_at.isoformat()
        }
    }), 201

# PUT /api/users/<id> - Modifier un utilisateur (admin only)
@user_bp.route('/<int:user_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    
    if 'name' in data:
        user.name = data['name']
    if 'role' in data and data['role'] in ['admin', 'manager', 'seller']:
        user.role = data['role']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Utilisateur modifié avec succès',
        'data': {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role
        }
    }), 200

# DELETE /api/users/<id> - Supprimer un utilisateur (admin only)
@user_bp.route('/<int:user_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_user(user_id):
    current_user_id = int(get_jwt_identity())
    
    # Ne pas supprimer son propre compte
    if current_user_id == user_id:
        return jsonify({'error': 'Vous ne pouvez pas supprimer votre propre compte'}), 400
    
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({'message': 'Utilisateur supprimé avec succès'}), 200