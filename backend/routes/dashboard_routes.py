# ============================================================
#  SmartStock ERP — Routes Dashboard (CORRIGÉ — sans doublon)
#  Fichier : routes/dashboard_routes.py
# ============================================================
from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from sqlalchemy import func, desc, cast, Date
from datetime import datetime, timedelta, timezone
from extensions import db
from models import Sale, SaleItem, Product, Client, Category
from utils.helpers import success

dashboard_bp = Blueprint("dashboard", __name__)


def _parse_period(period: str) -> datetime:
    days = {"7d": 7, "30d": 30, "90d": 90, "1y": 365}.get(period, 30)
    return datetime.now(timezone.utc) - timedelta(days=days)


@dashboard_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_stats():
    period    = request.args.get("period", "30d")
    date_from = _parse_period(period)
    prev_days = {"7d": 7, "30d": 30, "90d": 90, "1y": 365}.get(period, 30)
    date_prev = date_from - timedelta(days=prev_days)

    sales_agg = db.session.query(
        func.count(Sale.id).label("count"),
        func.coalesce(func.sum(Sale.total_amount), 0).label("revenue"),
        func.coalesce(func.avg(Sale.total_amount), 0).label("avg"),
    ).filter(Sale.status == "completed", Sale.sale_date >= date_from).first()

    prev_rev = db.session.query(
        func.coalesce(func.sum(Sale.total_amount), 0)
    ).filter(
        Sale.status == "completed",
        Sale.sale_date >= date_prev,
        Sale.sale_date < date_from
    ).scalar()

    curr   = float(sales_agg.revenue)
    prev   = float(prev_rev)
    growth = round(((curr - prev) / prev) * 100, 1) if prev > 0 else None

    top = db.session.query(
        Product.id, Product.name, Product.sku,
        func.sum(SaleItem.quantity).label("qty"),
        func.sum(SaleItem.subtotal).label("rev"),
    ).join(SaleItem, Product.id == SaleItem.product_id)\
     .join(Sale, Sale.id == SaleItem.sale_id)\
     .filter(Sale.status == "completed", Sale.sale_date >= date_from)\
     .group_by(Product.id).order_by(desc("qty")).limit(5).all()

    alerts = Product.query.filter(
        Product.stock_quantity <= Product.low_stock_threshold
    ).order_by(Product.stock_quantity.asc()).limit(10).all()

    return success({
        "period": period,
        "sales": {
            "count":      int(sales_agg.count),
            "revenue":    round(curr, 2),
            "avg_basket": round(float(sales_agg.avg), 2),
            "growth_pct": growth,
        },
        "inventory": {
            "total_products":  Product.query.count(),
            "low_stock_count": Product.query.filter(
                Product.stock_quantity <= Product.low_stock_threshold
            ).count(),
        },
        "clients_count": Client.query.count(),
        "top_products": [
            {"id": p.id, "name": p.name, "sku": p.sku,
             "qty_sold": int(p.qty), "revenue": round(float(p.rev), 2)}
            for p in top
        ],
        "low_stock_alerts": [
            {"id": p.id, "name": p.name, "sku": p.sku,
             "stock": p.stock_quantity, "threshold": p.low_stock_threshold}
            for p in alerts
        ],
    })


@dashboard_bp.route("/revenue", methods=["GET"])
@jwt_required()
def get_revenue():
    period    = request.args.get("period", "30d")
    date_from = _parse_period(period)

    results = db.session.query(
        cast(Sale.sale_date, Date).label("day"),
        func.count(Sale.id).label("count"),
        func.sum(Sale.total_amount).label("revenue"),
    ).filter(Sale.status == "completed", Sale.sale_date >= date_from)\
     .group_by(cast(Sale.sale_date, Date))\
     .order_by(cast(Sale.sale_date, Date).asc()).all()

    return success([
        {"date": str(r.day), "revenue": round(float(r.revenue), 2),
         "sales_count": int(r.count)}
        for r in results
    ], meta={"period": period, "points": len(results)})


@dashboard_bp.route("/top-products", methods=["GET"])
@jwt_required()
def get_top_products():
    period    = request.args.get("period", "30d")
    date_from = _parse_period(period)
    limit     = min(request.args.get("limit", 5, type=int), 20)
    sort_by   = request.args.get("by", "qty")

    query = db.session.query(
        Product.id, Product.name, Product.sku,
        Category.name.label("category"),
        func.sum(SaleItem.quantity).label("total_qty"),
        func.sum(SaleItem.subtotal).label("total_revenue"),
    ).join(SaleItem, Product.id == SaleItem.product_id)\
     .join(Sale, Sale.id == SaleItem.sale_id)\
     .outerjoin(Category, Product.category_id == Category.id)\
     .filter(Sale.status == "completed", Sale.sale_date >= date_from)\
     .group_by(Product.id, Category.name)

    query = query.order_by(desc("total_revenue") if sort_by == "revenue" else desc("total_qty"))

    results = query.limit(limit).all()
    return success([
        {"rank": i+1, "id": p.id, "name": p.name, "sku": p.sku,
         "category": p.category, "total_qty": int(p.total_qty),
         "total_revenue": round(float(p.total_revenue), 2)}
        for i, p in enumerate(results)
    ], meta={"period": period, "sort_by": sort_by})