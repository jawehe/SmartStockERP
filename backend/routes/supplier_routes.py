# backend/routes/supplier_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from models import Supplier

supplier_bp = Blueprint("suppliers", __name__)


@supplier_bp.route("", methods=["GET"])
@jwt_required()
def get_suppliers():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    search = request.args.get("search", "")

    query = Supplier.query
    if search:
        query = query.filter(Supplier.name.ilike(f"%{search}%"))

    paginated = query.order_by(Supplier.name).paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "data": [s.to_dict() for s in paginated.items],
        "meta": {
            "total": paginated.total,
            "total_pages": paginated.pages,
            "page": page,
            "per_page": per_page
        }
    }), 200


@supplier_bp.route("/<int:supplier_id>", methods=["GET"])
@jwt_required()
def get_supplier(supplier_id):
    supplier = Supplier.query.get_or_404(supplier_id)
    return jsonify({"data": supplier.to_dict()}), 200


@supplier_bp.route("", methods=["POST"])
@jwt_required()
def create_supplier():
    data = request.get_json()
    
    if not data.get("name"):
        return jsonify({"message": "Le nom du fournisseur est requis"}), 400
    
    supplier = Supplier(
        name=data["name"],
        email=data.get("email"),
        phone=data.get("phone"),
        address=data.get("address")
    )
    
    db.session.add(supplier)
    db.session.commit()
    
    return jsonify({"message": "Fournisseur créé avec succès", "data": supplier.to_dict()}), 201


@supplier_bp.route("/<int:supplier_id>", methods=["PUT"])
@jwt_required()
def update_supplier(supplier_id):
    supplier = Supplier.query.get_or_404(supplier_id)
    data = request.get_json()
    
    supplier.name = data.get("name", supplier.name)
    supplier.email = data.get("email", supplier.email)
    supplier.phone = data.get("phone", supplier.phone)
    supplier.address = data.get("address", supplier.address)
    
    db.session.commit()
    return jsonify({"message": "Fournisseur modifié avec succès", "data": supplier.to_dict()}), 200


@supplier_bp.route("/<int:supplier_id>", methods=["DELETE"])
@jwt_required()
def delete_supplier(supplier_id):
    supplier = Supplier.query.get_or_404(supplier_id)
    
    # Vérifier si le fournisseur a des achats
    if supplier.purchases and len(supplier.purchases) > 0:
        return jsonify({"message": "Impossible de supprimer un fournisseur avec des achats"}), 400
    
    db.session.delete(supplier)
    db.session.commit()
    return jsonify({"message": "Fournisseur supprimé avec succès"}), 200