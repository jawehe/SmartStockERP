# backend/routes/products_routes.py

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from models import Product, Category
from extensions import db

product_bp = Blueprint("products", __name__)


# ═════════════════════════════════════════════════════════════
# GET ALL PRODUCTS
# ─────────────────────────────────────────────────────────────
# GET /api/products
#
# Query params:
# ?category=1
# ?search=pc
# ═════════════════════════════════════════════════════════════
@product_bp.route("/api/products", methods=["GET"])
@jwt_required()
def get_products():

    category_id = request.args.get("category")
    search = request.args.get("search")

    query = Product.query

    # filtrage catégorie
    if category_id:
        query = query.filter(
            Product.category_id == category_id
        )

    # recherche nom ou SKU
    if search:
        query = query.filter(
            Product.name.ilike(f"%{search}%") |
            Product.sku.ilike(f"%{search}%")
        )

    products = query.order_by(Product.id.desc()).all()

    return jsonify([
        product.to_dict()
        for product in products
    ]), 200


# ═════════════════════════════════════════════════════════════
# GET ONE PRODUCT
# ─────────────────────────────────────────────────────────────
# GET /api/products/<id>
# ═════════════════════════════════════════════════════════════
@product_bp.route("/api/products/<int:id>", methods=["GET"])
@jwt_required()
def get_product(id):

    product = Product.query.get_or_404(id)

    return jsonify(product.to_dict()), 200


# ═════════════════════════════════════════════════════════════
# CREATE PRODUCT
# ─────────────────────────────────────────────────────────────
# POST /api/products
# ═════════════════════════════════════════════════════════════
@product_bp.route("/api/products", methods=["POST"])
@jwt_required()
def create_product():

    data = request.get_json()

    # validation minimale
    required_fields = ["name", "sku", "price"]

    for field in required_fields:
        if field not in data:
            return jsonify({
                "error": f"{field} est requis"
            }), 400

    # vérifier SKU unique
    existing_product = Product.query.filter_by(
        sku=data["sku"]
    ).first()

    if existing_product:
        return jsonify({
            "error": "SKU déjà utilisé"
        }), 400

    # vérifier catégorie existe
    category_id = data.get("category_id")

    if category_id:
        category = Category.query.get(category_id)

        if not category:
            return jsonify({
                "error": "Catégorie introuvable"
            }), 404

    # création produit
    product = Product(
        name=data["name"],
        sku=data["sku"],
        description=data.get("description"),
        price=data["price"],
        stock_quantity=data.get("stock_quantity", 0),
        low_stock_threshold=data.get(
            "low_stock_threshold",
            5
        ),
        category_id=category_id
    )

    db.session.add(product)
    db.session.commit()

    return jsonify({
        "message": "Produit créé avec succès ✅",
        "product": product.to_dict()
    }), 201


# ═════════════════════════════════════════════════════════════
# UPDATE PRODUCT
# ─────────────────────────────────────────────────────────────
# PUT /api/products/<id>
# ═════════════════════════════════════════════════════════════
@product_bp.route("/api/products/<int:id>", methods=["PUT"])
@jwt_required()
def update_product(id):

    product = Product.query.get_or_404(id)

    data = request.get_json()

    # vérifier SKU unique
    if "sku" in data:

        existing_product = Product.query.filter(
            Product.sku == data["sku"],
            Product.id != id
        ).first()

        if existing_product:
            return jsonify({
                "error": "SKU déjà utilisé"
            }), 400

    # update fields
    product.name = data.get(
        "name",
        product.name
    )

    product.sku = data.get(
        "sku",
        product.sku
    )

    product.description = data.get(
        "description",
        product.description
    )

    product.price = data.get(
        "price",
        product.price
    )

    product.stock_quantity = data.get(
        "stock_quantity",
        product.stock_quantity
    )

    product.low_stock_threshold = data.get(
        "low_stock_threshold",
        product.low_stock_threshold
    )

    product.category_id = data.get(
        "category_id",
        product.category_id
    )

    db.session.commit()

    return jsonify({
        "message": "Produit modifié avec succès ✅",
        "product": product.to_dict()
    }), 200


# ═════════════════════════════════════════════════════════════
# DELETE PRODUCT
# ─────────────────────────────────────────────────────────────
# DELETE /api/products/<id>
# ═════════════════════════════════════════════════════════════
@product_bp.route("/api/products/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_product(id):

    product = Product.query.get_or_404(id)

    db.session.delete(product)
    db.session.commit()

    return jsonify({
        "message": "Produit supprimé avec succès ✅"
    }), 200