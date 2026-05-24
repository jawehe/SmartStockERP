# ============================================================
#  SmartStock ERP — Routes Authentification
#  Fichier : routes/auth_routes.py
#
#  Endpoints :
#    POST  /api/auth/register  → créer un compte
#    POST  /api/auth/login     → connexion → access_token + refresh_token
#    POST  /api/auth/refresh   → renouveler l'access_token
#    POST  /api/auth/logout    → invalider le token (client-side)
#    GET   /api/auth/me        → profil de l'utilisateur connecté
# ============================================================
from flask import Blueprint, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
)
from extensions import db, bcrypt
from models import User
from utils.helpers import success, error, validate_required

auth_bp = Blueprint("auth", __name__)


# ─────────────────────────────────────────────────────────────
#  POST /api/auth/register
# ─────────────────────────────────────────────────────────────
@auth_bp.route("/register", methods=["POST"])
def register():
    """
    Créer un nouveau compte utilisateur.
    Body JSON : { name, email, password, role? }
    Réservé aux administrateurs en production (à protéger par @role_required).
    """
    data = request.get_json(silent=True) or {}

    # Validation des champs obligatoires
    missing = validate_required(data, ["name", "email", "password"])
    if missing:
        return error(
            f"Champs manquants : {', '.join(missing)}",
            errors={"missing_fields": missing}
        )

    # Vérifier l'unicité de l'email
    if User.query.filter_by(email=data["email"].lower().strip()).first():
        return error("Un compte avec cet email existe déjà.", status=409)

    # Valider le rôle
    allowed_roles = ("admin", "manager", "cashier")
    role = data.get("role", "cashier")
    if role not in allowed_roles:
        return error(f"Rôle invalide. Valeurs acceptées : {allowed_roles}")

    # Hasher le mot de passe
    pw_hash = bcrypt.generate_password_hash(data["password"]).decode("utf-8")

    user = User(
        name=data["name"].strip(),
        email=data["email"].lower().strip(),
        password_hash=pw_hash,
        role=role,
    )
    db.session.add(user)
    db.session.commit()

    return success(user.to_dict(), message="Compte créé avec succès.", status=201)


# ─────────────────────────────────────────────────────────────
#  POST /api/auth/login
# ─────────────────────────────────────────────────────────────
@auth_bp.route("/login", methods=["POST"])
def login():
    """
    Connexion utilisateur.
    Body JSON : { email, password }
    Retourne  : { access_token, refresh_token, user }

    Le token JWT contient en additional_claims : { role, name }
    → permet les vérifications d'accès sans requête BDD supplémentaire.
    """
    data = request.get_json(silent=True) or {}

    missing = validate_required(data, ["email", "password"])
    if missing:
        return error(f"Champs manquants : {', '.join(missing)}")

    # Rechercher l'utilisateur
    user = User.query.filter_by(email=data["email"].lower().strip()).first()

    # Vérification du mot de passe
    if not user or not bcrypt.check_password_hash(user.password_hash, data["password"]):
        return error("Email ou mot de passe incorrect.", status=401)

    # Claims supplémentaires embarqués dans le JWT
    additional_claims = {
        "role":  user.role,
        "name":  user.name,
        "email": user.email,
    }

    # Génération des tokens
    access_token  = create_access_token(
        identity=str(user.id),
        additional_claims=additional_claims
    )
    refresh_token = create_refresh_token(
        identity=str(user.id),
        additional_claims=additional_claims
    )

    return success(
        data={
            "access_token":  access_token,
            "refresh_token": refresh_token,
            "token_type":    "Bearer",
            "user":          user.to_dict(),
        },
        message="Connexion réussie."
    )


# ─────────────────────────────────────────────────────────────
#  POST /api/auth/refresh
# ─────────────────────────────────────────────────────────────
@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    """
    Renouveler l'access_token à partir du refresh_token.
    Header : Authorization: Bearer <refresh_token>
    """
    identity = get_jwt_identity()
    claims   = get_jwt()

    new_token = create_access_token(
        identity=identity,
        additional_claims={
            "role":  claims.get("role"),
            "name":  claims.get("name"),
            "email": claims.get("email"),
        }
    )
    return success(
        {"access_token": new_token, "token_type": "Bearer"},
        message="Token renouvelé."
    )


# ─────────────────────────────────────────────────────────────
#  POST /api/auth/logout
# ─────────────────────────────────────────────────────────────
@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    """
    Déconnexion.
    Note : avec JWT stateless, la déconnexion est côté client
    (supprimer le token du localStorage/cookie).
    Pour une révocation côté serveur, utiliser une blocklist Redis.
    """
    return success(message="Déconnexion réussie. Supprimez le token côté client.")


# ─────────────────────────────────────────────────────────────
#  GET /api/auth/me
# ─────────────────────────────────────────────────────────────
@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    """Retourne le profil complet de l'utilisateur connecté."""
    user_id = int(get_jwt_identity())
    user    = User.query.get_or_404(user_id)
    return success(user.to_dict())


# ─────────────────────────────────────────────────────────────
#  PUT /api/auth/me
# ─────────────────────────────────────────────────────────────
@auth_bp.route("/me", methods=["PUT"])
@jwt_required()
def update_profile():
    """Mettre à jour le nom et/ou le mot de passe de son propre compte."""
    user_id = int(get_jwt_identity())
    user    = User.query.get_or_404(user_id)
    data    = request.get_json(silent=True) or {}

    if "name" in data and data["name"].strip():
        user.name = data["name"].strip()

    if "password" in data and data["password"]:
        if len(data["password"]) < 8:
            return error("Le mot de passe doit contenir au moins 8 caractères.")
        user.password_hash = bcrypt.generate_password_hash(
            data["password"]
        ).decode("utf-8")

    db.session.commit()
    return success(user.to_dict(), message="Profil mis à jour.")