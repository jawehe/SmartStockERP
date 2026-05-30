# backend/routes/products_routes.py

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import or_
from models import Product, Category
from extensions import db

product_bp = Blueprint("products", __name__)


# ═════════════════════════════════════════════════════════════
# GET ALL PRODUCTS (avec pagination et format attendu)
# ═════════════════════════════════════════════════════════════
@product_bp.route("", methods=["GET"])
@jwt_required()
def get_products():
    # Récupérer les paramètres
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    search = request.args.get("search", "")
    category_id = request.args.get("category_id", "")
    low_stock = request.args.get("low_stock", "")

    query = Product.query

    # Filtrage
    if search:
        query = query.filter(
            or_(
                Product.name.ilike(f"%{search}%"),
                Product.sku.ilike(f"%{search}%")
            )
        )
    
    if category_id and category_id.isdigit():
        query = query.filter(Product.category_id == int(category_id))
    
    if low_stock == "true":
        query = query.filter(
            Product.stock_quantity <= Product.low_stock_threshold
        )

    # Pagination
    paginated = query.order_by(Product.id.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    # Format de réponse attendu par le frontend
    return jsonify({
        "data": [product.to_dict() for product in paginated.items],
        "meta": {
            "total": paginated.total,
            "total_pages": paginated.pages,
            "page": page,
            "per_page": per_page
        }
    }), 200


# ═════════════════════════════════════════════════════════════
# GET ONE PRODUCT
# ═════════════════════════════════════════════════════════════
@product_bp.route("/<int:id>", methods=["GET"])
@jwt_required()
def get_product(id):
    product = Product.query.get_or_404(id)
    return jsonify(product.to_dict()), 200


# ═════════════════════════════════════════════════════════════
# CREATE PRODUCT
# ═════════════════════════════════════════════════════════════
@product_bp.route("", methods=["POST"])
@jwt_required()
def create_product():
    data = request.get_json()

    # validation minimale
    required_fields = ["name", "sku", "price"]

    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({
                "message": f"{field} est requis"
            }), 400

    # vérifier SKU unique
    existing_product = Product.query.filter_by(sku=data["sku"]).first()
    if existing_product:
        return jsonify({
            "message": "SKU déjà utilisé"
        }), 400

    # création produit
    product = Product(
        name=data["name"],
        sku=data["sku"],
        description=data.get("description", ""),
        price=float(data["price"]),
        stock_quantity=int(data.get("stock_quantity", 0)),
        low_stock_threshold=int(data.get("low_stock_threshold", 5)),
        category_id=int(data["category_id"]) if data.get("category_id") else None
    )

    db.session.add(product)
    db.session.commit()

    return jsonify({
        "message": "Produit créé avec succès ✅",
        "product": product.to_dict()
    }), 201


# ═════════════════════════════════════════════════════════════
# UPDATE PRODUCT
# ═════════════════════════════════════════════════════════════
@product_bp.route("/<int:id>", methods=["PUT"])
@jwt_required()
def update_product(id):
    product = Product.query.get_or_404(id)
    data = request.get_json()

    # vérifier SKU unique
    if "sku" in data and data["sku"] != product.sku:
        existing_product = Product.query.filter(
            Product.sku == data["sku"],
            Product.id != id
        ).first()
        if existing_product:
            return jsonify({"message": "SKU déjà utilisé"}), 400
        product.sku = data["sku"]

    # update fields
    if "name" in data:
        product.name = data["name"]
    if "description" in data:
        product.description = data["description"]
    if "price" in data:
        product.price = float(data["price"])
    if "stock_quantity" in data:
        product.stock_quantity = int(data["stock_quantity"])
    if "low_stock_threshold" in data:
        product.low_stock_threshold = int(data["low_stock_threshold"])
    if "category_id" in data and data["category_id"]:
        product.category_id = int(data["category_id"])

    db.session.commit()

    return jsonify({
        "message": "Produit modifié avec succès ✅",
        "product": product.to_dict()
    }), 200


# ═════════════════════════════════════════════════════════════
# DELETE PRODUCT
# ═════════════════════════════════════════════════════════════
@product_bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_product(id):
    product = Product.query.get_or_404(id)
    db.session.delete(product)
    db.session.commit()
    return jsonify({"message": "Produit supprimé avec succès ✅"}), 200