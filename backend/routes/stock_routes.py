from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import Product, StockMovement
from extensions import db

stock_bp = Blueprint("stock", __name__)
@stock_bp.route("/add", methods=["POST"])
@jwt_required()
def add_stock():

    data = request.get_json()

    product = Product.query.get_or_404(
        data["product_id"]
    )

    qty = int(data["quantity"])

    product.stock_quantity += qty

    movement = StockMovement(
        product_id=product.id,
        movement_type="IN",
        quantity=qty,
        note=data.get("note")
    )

    db.session.add(movement)
    db.session.commit()

    return jsonify({
        "message": "Stock ajouté"
    }), 200

@stock_bp.route("/movements", methods=["GET"])
@jwt_required()
def movements():

    data = StockMovement.query\
        .order_by(
            StockMovement.created_at.desc()
        )\
        .all()

    return jsonify({
        "data": [
            m.to_dict()
            for m in data
        ]
    })