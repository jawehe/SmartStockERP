# backend/routes/reports_routes.py
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from sqlalchemy import func, extract
from models import Sale, SaleItem, Product, Client, Purchase, PurchaseItem, StockMovement
from extensions import db
from datetime import datetime, timedelta

reports_bp = Blueprint("reports", __name__)


# ═════════════════════════════════════════════════════════════
# GET /api/reports/sales - Ventes par mois
# ═════════════════════════════════════════════════════════════
@reports_bp.route("/sales", methods=["GET"])
@jwt_required()
def sales_report():
    year = request.args.get("year", type=int)
    if not year:
        year = datetime.utcnow().year

    # Ventes par mois
    monthly_sales = db.session.query(
        extract('month', Sale.sale_date).label('month'),
        func.sum(Sale.total_amount).label('total'),
        func.count(Sale.id).label('count')
    ).filter(
        extract('year', Sale.sale_date) == year
    ).group_by(
        extract('month', Sale.sale_date)
    ).all()

    # Ventes par statut
    sales_by_status = db.session.query(
        Sale.status,
        func.count(Sale.id).label('count'),
        func.sum(Sale.total_amount).label('total')
    ).group_by(Sale.status).all()

    return jsonify({
        "monthly_sales": [{
            "month": int(m),
            "total": float(t) if t else 0,
            "count": int(c)
        } for m, t, c in monthly_sales],
        "sales_by_status": [{
            "status": s,
            "count": int(c),
            "total": float(t) if t else 0
        } for s, c, t in sales_by_status]
    }), 200


# ═════════════════════════════════════════════════════════════
# GET /api/reports/products - Top produits
# ═════════════════════════════════════════════════════════════
@reports_bp.route("/products", methods=["GET"])
@jwt_required()
def products_report():
    limit = request.args.get("limit", 10, type=int)

    # Top produits les plus vendus
    top_products = db.session.query(
        Product.id,
        Product.name,
        Product.sku,
        func.sum(SaleItem.quantity).label('total_quantity'),
        func.sum(SaleItem.subtotal).label('total_revenue')
    ).join(
        SaleItem, Product.id == SaleItem.product_id
    ).group_by(
        Product.id, Product.name, Product.sku
    ).order_by(
        func.sum(SaleItem.quantity).desc()
    ).limit(limit).all()

    # Produits en stock faible
    low_stock_products = Product.query.filter(
        Product.stock_quantity <= Product.low_stock_threshold
    ).all()

    return jsonify({
        "top_products": [{
            "id": p.id,
            "name": p.name,
            "sku": p.sku,
            "total_quantity": int(p.total_quantity),
            "total_revenue": float(p.total_revenue)
        } for p in top_products],
        "low_stock_products": [p.to_dict() for p in low_stock_products]
    }), 200


# ═════════════════════════════════════════════════════════════
# GET /api/reports/profit - Profit (Sales - Purchases)
# ═════════════════════════════════════════════════════════════
@reports_bp.route("/profit", methods=["GET"])
@jwt_required()
def profit_report():
    # Total des ventes
    total_sales = db.session.query(
        func.sum(Sale.total_amount)
    ).filter(
        Sale.status == 'completed'
    ).scalar() or 0

    # Total des achats
    total_purchases = db.session.query(
        func.sum(Purchase.total_amount)
    ).filter(
        Purchase.status == 'received'
    ).scalar() or 0

    # Profit
    profit = total_sales - total_purchases
    margin = (profit / total_sales * 100) if total_sales > 0 else 0

    return jsonify({
        "total_sales": float(total_sales),
        "total_purchases": float(total_purchases),
        "profit": float(profit),
        "margin": round(margin, 2)
    }), 200


# ═════════════════════════════════════════════════════════════
# GET /api/reports/stock - Statistiques stock
# ═════════════════════════════════════════════════════════════
@reports_bp.route("/stock", methods=["GET"])
@jwt_required()
def stock_report():
    # Valeur totale du stock
    total_value = db.session.query(
        func.sum(Product.price * Product.stock_quantity)
    ).scalar() or 0

    # Nombre de produits par catégorie
    products_by_category = db.session.query(
        Product.category_id,
        func.count(Product.id).label('count')
    ).group_by(Product.category_id).all()

    # Mouvements de stock (30 derniers jours)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_movements = StockMovement.query.filter(
        StockMovement.created_at >= thirty_days_ago
    ).all()

    # Entrées vs Sorties
    stock_in = sum(m.quantity for m in recent_movements if m.movement_type == 'IN')
    stock_out = sum(m.quantity for m in recent_movements if m.movement_type == 'OUT')

    return jsonify({
        "total_value": float(total_value),
        "total_products": Product.query.count(),
        "low_stock_count": Product.query.filter(
            Product.stock_quantity <= Product.low_stock_threshold
        ).count(),
        "out_of_stock_count": Product.query.filter(Product.stock_quantity == 0).count(),
        "stock_in_last_30_days": int(stock_in),
        "stock_out_last_30_days": int(stock_out),
        "products_by_category": [{
            "category_id": c[0],
            "count": c[1]
        } for c in products_by_category if c[0]]
    }), 200


# ═════════════════════════════════════════════════════════════
# GET /api/reports/top-clients - Top clients
# ═════════════════════════════════════════════════════════════
@reports_bp.route("/top-clients", methods=["GET"])
@jwt_required()
def top_clients_report():
    limit = request.args.get("limit", 10, type=int)

    top_clients = db.session.query(
        Client.id,
        Client.name,
        Client.email,
        func.sum(Sale.total_amount).label('total_spent'),
        func.count(Sale.id).label('order_count')
    ).join(
        Sale, Client.id == Sale.client_id
    ).group_by(
        Client.id, Client.name, Client.email
    ).order_by(
        func.sum(Sale.total_amount).desc()
    ).limit(limit).all()

    return jsonify({
        "top_clients": [{
            "id": c.id,
            "name": c.name,
            "email": c.email,
            "total_spent": float(c.total_spent),
            "order_count": int(c.order_count)
        } for c in top_clients]
    }), 200