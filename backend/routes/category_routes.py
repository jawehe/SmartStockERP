# ============================================================
#  SmartStock ERP — Routes Catégories
#  Fichier : routes/category_routes.py
#
#  Endpoints :
#    GET    /api/categories       → liste avec nb produits par catégorie
#    POST   /api/categories       → créer une catégorie
#    GET    /api/categories/:id   → détail
#    PUT    /api/categories/:id   → modifier
#    DELETE /api/categories/:id   → supprimer (si pas de produits liés)
# ============================================================
from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from extensions import db
from models import Category, Product
from utils.helpers import success, error, validate_required, role_required

category_bp = Blueprint("categories", __name__)


# ─────────────────────────────────────────────────────────────
#  GET /api/categories
# ─────────────────────────────────────────────────────────────
@category_bp.route("", methods=["GET"])
@jwt_required()
def get_categories():
    """
    Liste toutes les catégories avec le nombre de produits associés.
    Pas de pagination : le nombre de catégories est typiquement faible.
    """
    categories = Category.query.order_by(Category.name.asc()).all()
    return success(
        [c.to_dict(with_count=True) for c in categories],
        meta={"total": len(categories)}
    )


# ─────────────────────────────────────────────────────────────
#  GET /api/categories/:id
# ─────────────────────────────────────────────────────────────
@category_bp.route("/<int:category_id>", methods=["GET"])
@jwt_required()
def get_category(category_id):
    """Détail d'une catégorie avec la liste de ses produits."""
    category = Category.query.get_or_404(
        category_id,
        description=f"Catégorie #{category_id} introuvable."
    )
    data = category.to_dict(with_count=True)

    # Inclure les produits si demandé
    if request.args.get("with_products", "").lower() == "true":
        data["products"] = [p.to_dict() for p in category.products.all()]

    return success(data)


# ─────────────────────────────────────────────────────────────
#  POST /api/categories
# ─────────────────────────────────────────────────────────────
@category_bp.route("", methods=["POST"])
@jwt_required()
@role_required("admin", "manager")
def create_category():
    """
    Créer une nouvelle catégorie.
    Body JSON : { name, description? }
    """
    data    = request.get_json(silent=True) or {}
    missing = validate_required(data, ["name"])
    if missing:
        return error("Le champ 'name' est obligatoire.")

    name = data["name"].strip()

    # Unicité du nom
    if Category.query.filter(Category.name.ilike(name)).first():
        return error(f"La catégorie '{name}' existe déjà.", status=409)

    category = Category(
        name=name,
        description=data.get("description", "").strip() or None,
    )
    db.session.add(category)
    db.session.commit()

    return success(
        category.to_dict(with_count=True),
        message="Catégorie créée avec succès.",
        status=201
    )


# ─────────────────────────────────────────────────────────────
#  PUT /api/categories/:id
# ─────────────────────────────────────────────────────────────
@category_bp.route("/<int:category_id>", methods=["PUT"])
@jwt_required()
@role_required("admin", "manager")
def update_category(category_id):
    """Modifier une catégorie existante."""
    category = Category.query.get_or_404(category_id)
    data     = request.get_json(silent=True) or {}

    if "name" in data and data["name"].strip():
        new_name = data["name"].strip()
        existing = Category.query.filter(Category.name.ilike(new_name)).first()
        if existing and existing.id != category_id:
            return error(f"Le nom '{new_name}' est déjà utilisé.", status=409)
        category.name = new_name

    if "description" in data:
        category.description = data["description"].strip() or None

    db.session.commit()
    return success(category.to_dict(with_count=True), message="Catégorie mise à jour.")


# ─────────────────────────────────────────────────────────────
#  DELETE /api/categories/:id
# ─────────────────────────────────────────────────────────────
@category_bp.route("/<int:category_id>", methods=["DELETE"])
@jwt_required()
@role_required("admin")
def delete_category(category_id):
    """
    Supprimer une catégorie.
    Refusé si des produits lui sont associés.
    """
    category = Category.query.get_or_404(category_id)

    product_count = category.products.count()
    if product_count > 0:
        return error(
            f"Impossible de supprimer : {product_count} produit(s) sont liés à cette catégorie.",
            status=409
        )

    db.session.delete(category)
    db.session.commit()
    return success(message=f"Catégorie '{category.name}' supprimée.")