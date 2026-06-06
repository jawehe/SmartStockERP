# backend/routes/warehouse_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from models import Warehouse, WarehouseStock, Product
from utils.audit import log_create, log_update, log_delete
from datetime import datetime

warehouse_bp = Blueprint("warehouses", __name__)


# ═════════════════════════════════════════════════════════════
# WAREHOUSE CRUD
# ═════════════════════════════════════════════════════════════
@warehouse_bp.route("", methods=["GET"])
@jwt_required()
def get_warehouses():
    warehouses = Warehouse.query.filter_by(is_active=True).all()
    return jsonify({
        "data": [w.to_dict() for w in warehouses]
    }), 200


@warehouse_bp.route("/<int:warehouse_id>", methods=["GET"])
@jwt_required()
def get_warehouse(warehouse_id):
    warehouse = Warehouse.query.get_or_404(warehouse_id)
    return jsonify({"data": warehouse.to_dict()}), 200


@warehouse_bp.route("", methods=["POST"])
@jwt_required()
def create_warehouse():
    data = request.get_json()
    
    if not data.get("name") or not data.get("code"):
        return jsonify({"message": "Nom et code du dépôt requis"}), 400
    
    if Warehouse.query.filter_by(code=data["code"]).first():
        return jsonify({"message": "Ce code de dépôt existe déjà"}), 400
    
    warehouse = Warehouse(
        name=data["name"],
        code=data["code"].upper(),
        location=data.get("location"),
        manager=data.get("manager"),
        phone=data.get("phone"),
        email=data.get("email"),
        is_active=True
    )
    
    db.session.add(warehouse)
    db.session.commit()
    
    log_create("Warehouse", warehouse.id, warehouse.name)
    
    return jsonify({
        "message": "Dépôt créé avec succès",
        "data": warehouse.to_dict()
    }), 201


@warehouse_bp.route("/<int:warehouse_id>", methods=["PUT"])
@jwt_required()
def update_warehouse(warehouse_id):
    warehouse = Warehouse.query.get_or_404(warehouse_id)
    data = request.get_json()
    
    changes = {}
    
    if "name" in data and data["name"] != warehouse.name:
        changes["name"] = f"{warehouse.name} → {data['name']}"
        warehouse.name = data["name"]
    
    if "location" in data and data["location"] != warehouse.location:
        changes["location"] = f"{warehouse.location} → {data['location']}"
        warehouse.location = data["location"]
    
    if "manager" in data and data["manager"] != warehouse.manager:
        changes["manager"] = f"{warehouse.manager} → {data['manager']}"
        warehouse.manager = data["manager"]
    
    if "phone" in data:
        warehouse.phone = data["phone"]
    if "email" in data:
        warehouse.email = data["email"]
    if "is_active" in data:
        warehouse.is_active = data["is_active"]
    
    db.session.commit()
    
    if changes:
        log_update("Warehouse", warehouse_id, changes)
    
    return jsonify({
        "message": "Dépôt modifié avec succès",
        "data": warehouse.to_dict()
    }), 200


@warehouse_bp.route("/<int:warehouse_id>", methods=["DELETE"])
@jwt_required()
def delete_warehouse(warehouse_id):
    warehouse = Warehouse.query.get_or_404(warehouse_id)
    
    # Vérifier si le dépôt a du stock
    if warehouse.stocks and sum(s.quantity for s in warehouse.stocks) > 0:
        return jsonify({"message": "Impossible de supprimer un dépôt avec du stock"}), 400
    
    db.session.delete(warehouse)
    db.session.commit()
    
    log_delete("Warehouse", warehouse_id, warehouse.name)
    
    return jsonify({"message": "Dépôt supprimé avec succès"}), 200


# ═════════════════════════════════════════════════════════════
# WAREHOUSE STOCK MANAGEMENT
# ═════════════════════════════════════════════════════════════
@warehouse_bp.route("/<int:warehouse_id>/stock", methods=["GET"])
@jwt_required()
def get_warehouse_stock(warehouse_id):
    """Récupère le stock d'un dépôt spécifique"""
    warehouse = Warehouse.query.get_or_404(warehouse_id)
    
    stocks = WarehouseStock.query.filter_by(warehouse_id=warehouse_id).all()
    
    return jsonify({
        "data": [s.to_dict() for s in stocks],
        "warehouse": warehouse.to_dict()
    }), 200


@warehouse_bp.route("/stock", methods=["GET"])
@jwt_required()
def get_all_warehouse_stock():
    """Récupère tout le stock par dépôt"""
    warehouses = Warehouse.query.filter_by(is_active=True).all()
    
    result = []
    for w in warehouses:
        stocks = WarehouseStock.query.filter_by(warehouse_id=w.id).all()
        result.append({
            "warehouse": w.to_dict(),
            "stocks": [s.to_dict() for s in stocks]
        })
    
    return jsonify({"data": result}), 200


@warehouse_bp.route("/<int:warehouse_id>/stock/<int:product_id>", methods=["GET"])
@jwt_required()
def get_product_stock_in_warehouse(warehouse_id, product_id):
    """Récupère le stock d'un produit spécifique dans un dépôt"""
    stock = WarehouseStock.query.filter_by(
        warehouse_id=warehouse_id,
        product_id=product_id
    ).first()
    
    if not stock:
        return jsonify({
            "data": {
                "warehouse_id": warehouse_id,
                "product_id": product_id,
                "quantity": 0,
                "reserved_quantity": 0,
                "available_quantity": 0
            }
        }), 200
    
    return jsonify({"data": stock.to_dict()}), 200


@warehouse_bp.route("/stock/transfer", methods=["POST"])
@jwt_required()
def transfer_stock():
    """Transférer du stock entre dépôts"""
    data = request.get_json()
    
    from_warehouse_id = data.get("from_warehouse_id")
    to_warehouse_id = data.get("to_warehouse_id")
    product_id = data.get("product_id")
    quantity = int(data.get("quantity", 0))
    
    if not all([from_warehouse_id, to_warehouse_id, product_id, quantity]):
        return jsonify({"message": "Tous les champs sont requis"}), 400
    
    if quantity <= 0:
        return jsonify({"message": "La quantité doit être positive"}), 400
    
    # Vérifier les dépôts
    from_warehouse = Warehouse.query.get_or_404(from_warehouse_id)
    to_warehouse = Warehouse.query.get_or_404(to_warehouse_id)
    product = Product.query.get_or_404(product_id)
    
    # Vérifier le stock source
    from_stock = WarehouseStock.query.filter_by(
        warehouse_id=from_warehouse_id,
        product_id=product_id
    ).first()
    
    available_qty = (from_stock.quantity - from_stock.reserved_quantity) if from_stock else 0
    if available_qty < quantity:
        return jsonify({
            "message": f"Stock insuffisant dans {from_warehouse.name}. "
                       f"Disponible: {available_qty}"
        }), 400
    
    # Retirer du stock source
    if from_stock:
        from_stock.quantity -= quantity
    
    # Ajouter au stock destination
    to_stock = WarehouseStock.query.filter_by(
        warehouse_id=to_warehouse_id,
        product_id=product_id
    ).first()
    
    if to_stock:
        to_stock.quantity += quantity
        to_stock.updated_at = datetime.utcnow()
    else:
        to_stock = WarehouseStock(
            warehouse_id=to_warehouse_id,
            product_id=product_id,
            quantity=quantity
        )
        db.session.add(to_stock)
    
    db.session.commit()
    
    # Audit log
    log_create("StockTransfer", None, 
               f"{quantity} x {product.name} transféré de {from_warehouse.name} vers {to_warehouse.name}")
    
    return jsonify({
        "message": f"Transfert de {quantity} x {product.name} effectué",
        "from_warehouse": from_warehouse.name,
        "to_warehouse": to_warehouse.name
    }), 200


@warehouse_bp.route("/stock/adjust", methods=["POST"])
@jwt_required()
def adjust_warehouse_stock():
    """Ajuster le stock dans un dépôt spécifique"""
    data = request.get_json()
    
    warehouse_id = data.get("warehouse_id")
    product_id = data.get("product_id")
    quantity = int(data.get("quantity", 0))
    
    if not all([warehouse_id, product_id]):
        return jsonify({"message": "warehouse_id et product_id requis"}), 400
    
    warehouse = Warehouse.query.get_or_404(warehouse_id)
    product = Product.query.get_or_404(product_id)
    
    stock = WarehouseStock.query.filter_by(
        warehouse_id=warehouse_id,
        product_id=product_id
    ).first()
    
    old_quantity = stock.quantity if stock else 0
    
    if stock:
        stock.quantity = quantity
        stock.updated_at = datetime.utcnow()
    else:
        stock = WarehouseStock(
            warehouse_id=warehouse_id,
            product_id=product_id,
            quantity=quantity
        )
        db.session.add(stock)
    
    db.session.commit()
    
    log_update("WarehouseStock", None,
               f"{product.name} dans {warehouse.name}: {old_quantity} → {quantity}")
    
    return jsonify({
        "message": f"Stock de {product.name} ajusté à {quantity} dans {warehouse.name}",
        "data": stock.to_dict()
    }), 200