# backend/routes/analytics_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from services.analytics_service import AnalyticsService

analytics_bp = Blueprint("analytics", __name__)


@analytics_bp.route("/top-products", methods=["GET"])
@jwt_required()
def get_top_products():
    limit = request.args.get("limit", 10, type=int)
    data = AnalyticsService.get_top_products(limit)
    return jsonify({"data": data}), 200


@analytics_bp.route("/stock-alerts", methods=["GET"])
@jwt_required()
def get_stock_alerts():
    data = AnalyticsService.get_stock_alerts()
    return jsonify({"data": data}), 200


@analytics_bp.route("/monthly-revenue", methods=["GET"])
@jwt_required()
def get_monthly_revenue():
    year = request.args.get("year", type=int)
    data = AnalyticsService.get_monthly_revenue(year)
    return jsonify({"data": data}), 200


@analytics_bp.route("/dashboard-stats", methods=["GET"])
@jwt_required()
def get_dashboard_stats():
    data = AnalyticsService.get_dashboard_stats()
    return jsonify({"data": data}), 200