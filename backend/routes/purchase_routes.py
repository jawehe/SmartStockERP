# backend/routes/purchase_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from models import Purchase, PurchaseItem, Product, StockMovement
from datetime import datetime

purchase_bp = Blueprint("purchases", __name__)


@purchase_bp.route("", methods=["GET"])
@jwt_required()
def get_purchases():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    status = request.args.get("status", "")
    supplier_id = request.args.get("supplier_id", type=int)

    query = Purchase.query
    if status:
        query = query.filter(Purchase.status == status)
    if supplier_id:
        query = query.filter(Purchase.supplier_id == supplier_id)

    paginated = query.order_by(Purchase.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "data": [p.to_dict(include_items=False) for p in paginated.items],
        "meta": {
            "total": paginated.total,
            "total_pages": paginated.pages,
            "page": page,
            "per_page": per_page
        }
    }), 200


@ purchase_bp.route("/<int:purchase_id>", methods=["GET"])
@jwt_required()
def get_purchase(purchase_id):
    purchase = Purchase.query.get_or_404(purchase_id)
    return jsonify({"data": purchase.to_dict(include_items=True)}), 200


@purchase_bp.route("", methods=["POST"])
@jwt_required()
def create_purchase():
    data = request.get_json()
    
    if not data.get("supplier_id"):
        return jsonify({"message": "Fournisseur requis"}), 400
    if not data.get("items") or len(data["items"]) == 0:
        return jsonify({"message": "Au moins un article requis"}), 400
    
    try:
        # Créer l'achat
        purchase = Purchase(
            supplier_id=data["supplier_id"],
            status=data.get("status", "received"),
            received_at=datetime.utcnow() if data.get("status") == "received" else None
        )
        db.session.add(purchase)
        db.session.flush()
        
        total = 0
        
        for item in data["items"]:
            product = Product.query.get(item["product_id"])
            if not product:
                db.session.rollback()
                return jsonify({"message": f"Produit {item['product_id']} introuvable"}), 404
            
            quantity = int(item["quantity"])
            unit_cost = float(item["unit_cost"])
            subtotal = quantity * unit_cost
            
            purchase_item = PurchaseItem(
                purchase_id=purchase.id,
                product_id=product.id,
                quantity=quantity,
                unit_cost=unit_cost,
                subtotal=subtotal
            )
            db.session.add(purchase_item)
            
            # Ajouter au stock
            product.stock_quantity += quantity
            
            # Créer mouvement de stock
            movement = StockMovement(
                product_id=product.id,
                movement_type="IN",
                quantity=quantity,
                note=f"Achat #{purchase.id} - {product.name}"
            )
            db.session.add(movement)
            
            total += subtotal
        
        purchase.total_amount = total
        db.session.commit()
        
        return jsonify({
            "message": "Achat créé avec succès",
            "data": purchase.to_dict(include_items=True)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Erreur: {str(e)}"}), 500


@purchase_bp.route("/<int:purchase_id>/status", methods=["PATCH"])
@jwt_required()
def update_purchase_status(purchase_id):
    purchase = Purchase.query.get_or_404(purchase_id)
    data = request.get_json()
    new_status = data.get("status")
    
    if new_status not in ["pending", "received", "cancelled"]:
        return jsonify({"message": "Statut invalide"}), 400
    
    purchase.status = new_status
    if new_status == "received" and not purchase.received_at:
        purchase.received_at = datetime.utcnow()
    
    db.session.commit()
    return jsonify({"message": f"Statut mis à jour: {new_status}"}), 200