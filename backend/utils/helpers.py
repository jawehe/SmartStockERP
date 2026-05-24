# ============================================================
#  SmartStock ERP — Utilitaires partagés
#  Fichier : utils/helpers.py
# ============================================================
from flask import jsonify, request
from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt


# ─────────────────────────────────────────────────────────────
#  Réponses JSON standardisées
# ─────────────────────────────────────────────────────────────
def success(data=None, message="Succès", status=200, meta=None):
    """Réponse JSON de succès uniformisée."""
    resp = {"success": True, "message": message}
    if data is not None:
        resp["data"] = data
    if meta:
        resp["meta"] = meta
    return jsonify(resp), status


def error(message="Erreur", status=400, errors=None):
    """Réponse JSON d'erreur uniformisée."""
    resp = {"success": False, "message": message}
    if errors:
        resp["errors"] = errors
    return jsonify(resp), status


# ─────────────────────────────────────────────────────────────
#  Décorateur de rôle
# ─────────────────────────────────────────────────────────────
def role_required(*roles):
    """
    Décorateur : vérifie que l'utilisateur connecté possède l'un des rôles.
    Usage :
        @jwt_required()
        @role_required("admin", "manager")
        def ma_route(): ...
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            if claims.get("role") not in roles:
                return error(
                    "Accès refusé : permissions insuffisantes.",
                    status=403
                )
            return fn(*args, **kwargs)
        return wrapper
    return decorator


# ─────────────────────────────────────────────────────────────
#  Pagination helper
# ─────────────────────────────────────────────────────────────
def paginate_query(query, schema_fn=None):
    """
    Pagine une requête SQLAlchemy et retourne data + meta.
    schema_fn : callable appliqué sur chaque item (ex: item.to_dict)
    """
    from config import Config
    page      = request.args.get("page", 1, type=int)
    per_page  = min(
        request.args.get("per_page", Config.DEFAULT_PAGE_SIZE, type=int),
        Config.MAX_PAGE_SIZE
    )
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    items = [schema_fn(item) if schema_fn else item for item in paginated.items]

    return items, {
        "page":        paginated.page,
        "per_page":    paginated.per_page,
        "total":       paginated.total,
        "total_pages": paginated.pages,
        "has_next":    paginated.has_next,
        "has_prev":    paginated.has_prev,
    }


# ─────────────────────────────────────────────────────────────
#  Validation simple
# ─────────────────────────────────────────────────────────────
def validate_required(data: dict, fields: list) -> list:
    """Retourne la liste des champs manquants."""
    return [f for f in fields if not data.get(f)]