from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import Product, StockMovement
from extensions import db
from sqlalchemy import func

stock_bp = Blueprint("stock", __name__)


# ═════════════════════════════════════════════════════════════
# AJOUTER DU STOCK (IN)
# ═════════════════════════════════════════════════════════════
@stock_bp.route("/add", methods=["POST"])
@jwt_required()
def add_stock():
    data = request.get_json()

    if not data.get("product_id") or not data.get("quantity"):
        return jsonify({"message": "product_id et quantity requis"}), 400

    product = Product.query.get_or_404(data["product_id"])
    qty = int(data["quantity"])

    if qty <= 0:
        return jsonify({"message": "La quantité doit être supérieure à 0"}), 400

    product.stock_quantity += qty

    movement = StockMovement(
        product_id=product.id,
        movement_type="IN",
        quantity=qty,
        note=data.get("note", f"Stock ajouté manuellement")
    )

    db.session.add(movement)
    db.session.commit()

    return jsonify({
        "message": f"{qty} unités ajoutées au stock",
        "new_stock": product.stock_quantity
    }), 200


# ═════════════════════════════════════════════════════════════
# RETIRER DU STOCK (OUT)
# ═════════════════════════════════════════════════════════════
@stock_bp.route("/remove", methods=["POST"])
@jwt_required()
def remove_stock():
    data = request.get_json()

    if not data.get("product_id") or not data.get("quantity"):
        return jsonify({"message": "product_id et quantity requis"}), 400

    product = Product.query.get_or_404(data["product_id"])
    qty = int(data["quantity"])

    if qty <= 0:
        return jsonify({"message": "La quantité doit être supérieure à 0"}), 400

    if product.stock_quantity < qty:
        return jsonify({
            "message": f"Stock insuffisant. Disponible: {product.stock_quantity}"
        }), 400

    product.stock_quantity -= qty

    movement = StockMovement(
        product_id=product.id,
        movement_type="OUT",
        quantity=qty,
        note=data.get("note", f"Retrait manuel")
    )

    db.session.add(movement)
    db.session.commit()

    return jsonify({
        "message": f"{qty} unités retirées du stock",
        "new_stock": product.stock_quantity
    }), 200


# ═════════════════════════════════════════════════════════════
# AJUSTER LE STOCK (ADJUSTMENT)
# ═════════════════════════════════════════════════════════════
@stock_bp.route("/adjust", methods=["POST"])
@jwt_required()
def adjust_stock():
    data = request.get_json()

    if not data.get("product_id") or data.get("new_quantity") is None:
        return jsonify({"message": "product_id et new_quantity requis"}), 400

    product = Product.query.get_or_404(data["product_id"])
    old_qty = product.stock_quantity
    new_qty = int(data["new_quantity"])
    difference = new_qty - old_qty

    product.stock_quantity = new_qty

    movement = StockMovement(
        product_id=product.id,
        movement_type="ADJUSTMENT",
        quantity=abs(difference),
        note=data.get("note", f"Ajustement: {old_qty} → {new_qty}")
    )
    db.session.add(movement)
    db.session.commit()

    return jsonify({
        "message": f"Stock ajusté de {old_qty} à {new_qty}",
        "difference": difference
    }), 200


# ═════════════════════════════════════════════════════════════
# HISTORIQUE DES MOUVEMENTS (AVEC PAGINATION)
# ═════════════════════════════════════════════════════════════
@stock_bp.route("/movements", methods=["GET"])
@jwt_required()
def get_movements():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    movement_type = request.args.get("type", "")
    product_id = request.args.get("product_id", type=int)

    query = StockMovement.query

    if movement_type:
        query = query.filter(StockMovement.movement_type == movement_type)
    
    if product_id:
        query = query.filter(StockMovement.product_id == product_id)

    paginated = query.order_by(StockMovement.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        "data": [m.to_dict() for m in paginated.items],
        "meta": {
            "total": paginated.total,
            "total_pages": paginated.pages,
            "page": page,
            "per_page": per_page
        }
    }), 200


# ═════════════════════════════════════════════════════════════
# STATISTIQUES DU STOCK (AJOUTÉ !)
# ═════════════════════════════════════════════════════════════
@stock_bp.route("/stats", methods=["GET"])
@jwt_required()
def stock_stats():
    """
    Retourne les statistiques du stock :
    - low_stock_count : nombre de produits en stock faible
    - out_of_stock_count : nombre de produits en rupture
    - total_inventory_value : valeur totale du stock
    - low_stock_products : liste des produits en stock faible
    """
    # Calcul de la valeur totale du stock
    total_value = db.session.query(
        func.sum(Product.price * Product.stock_quantity)
    ).scalar() or 0

    # Produits en stock faible
    low_stock_products = Product.query.filter(
        Product.stock_quantity <= Product.low_stock_threshold
    ).all()

    # Produits en rupture de stock
    out_of_stock_count = Product.query.filter(
        Product.stock_quantity == 0
    ).count()

    return jsonify({
        "low_stock_count": len(low_stock_products),
        "out_of_stock_count": out_of_stock_count,
        "total_inventory_value": float(total_value),
        "low_stock_products": [p.to_dict() for p in low_stock_products]
    }), 200