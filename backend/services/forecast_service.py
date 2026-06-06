# backend/services/forecast_service.py
from sqlalchemy import func
from models import Product, Sale, SaleItem
from extensions import db
from datetime import datetime, timedelta

class ForecastService:
    
    @staticmethod
    def calculate_reorder(product_id=None):
        """Calcule les recommandations de réapprovisionnement"""
        query = Product.query
        
        if product_id:
            query = query.filter(Product.id == product_id)
        
        products = query.all()
        recommendations = []
        
        for product in products:
            # Ventes des 30 derniers jours
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            
            total_sold = db.session.query(
                func.sum(SaleItem.quantity)
            ).join(
                Sale, SaleItem.sale_id == Sale.id
            ).filter(
                SaleItem.product_id == product.id,
                Sale.sale_date >= thirty_days_ago,
                Sale.status == 'completed'
            ).scalar() or 0
            
            # Moyenne journalière
            avg_daily_sales = total_sold / 30
            
            if avg_daily_sales == 0:
                continue
            
            # Jours de stock restant
            days_remaining = product.stock_quantity / avg_daily_sales
            
            # Seuil de réapprovisionnement (10 jours)
            if days_remaining < 10:
                # Quantité recommandée = ventes moyennes sur 30 jours
                recommended_order = int(avg_daily_sales * 30) - product.stock_quantity
                if recommended_order < 0:
                    recommended_order = int(avg_daily_sales * 15)
                
                recommendations.append({
                    "product_id": product.id,
                    "product_name": product.name,
                    "product_sku": product.sku,
                    "current_stock": product.stock_quantity,
                    "avg_daily_sales": round(avg_daily_sales, 2),
                    "days_remaining": round(days_remaining, 1),
                    "recommended_order": max(1, recommended_order),
                    "priority": "high" if days_remaining < 5 else "medium"
                })
        
        return sorted(recommendations, key=lambda x: x["days_remaining"])
    
    @staticmethod
    def get_low_stock_products():
        """Produits avec stock faible"""
        return Product.query.filter(
            Product.stock_quantity <= Product.low_stock_threshold
        ).all()