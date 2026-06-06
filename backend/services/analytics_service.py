# backend/services/analytics_service.py
from sqlalchemy import func, extract
from models import Sale, SaleItem, Product, Client, StockMovement
from extensions import db
from datetime import datetime, timedelta

class AnalyticsService:
    
    @staticmethod
    def get_top_products(limit=10):
        """Top produits les plus vendus"""
        results = db.session.query(
            Product.id,
            Product.name,
            Product.sku,
            func.sum(SaleItem.quantity).label('quantity_sold'),
            func.sum(SaleItem.subtotal).label('revenue')
        ).join(
            SaleItem, Product.id == SaleItem.product_id
        ).join(
            Sale, SaleItem.sale_id == Sale.id
        ).filter(
            Sale.status == 'completed'
        ).group_by(
            Product.id, Product.name, Product.sku
        ).order_by(
            func.sum(SaleItem.quantity).desc()
        ).limit(limit).all()
        
        return [{
            "product_id": r.id,
            "product_name": r.name,
            "product_sku": r.sku,
            "quantity_sold": int(r.quantity_sold),
            "revenue": float(r.revenue)
        } for r in results]
    
    @staticmethod
    def get_stock_alerts():
        """Alertes de stock (Critical, Warning, Normal)"""
        products = Product.query.all()
        
        critical = 0  # stock <= seuil
        warning = 0   # stock <= seuil * 1.5
        normal = 0    # stock > seuil * 1.5
        
        for p in products:
            if p.stock_quantity <= p.low_stock_threshold:
                critical += 1
            elif p.stock_quantity <= p.low_stock_threshold * 1.5:
                warning += 1
            else:
                normal += 1
        
        return {
            "critical": critical,
            "warning": warning,
            "normal": normal,
            "total_products": len(products)
        }
    
    @staticmethod
    def get_monthly_revenue(year=None):
        """Revenus mensuels"""
        if not year:
            year = datetime.utcnow().year
        
        results = db.session.query(
            extract('month', Sale.sale_date).label('month'),
            func.sum(Sale.total_amount).label('revenue'),
            func.count(Sale.id).label('orders')
        ).filter(
            extract('year', Sale.sale_date) == year,
            Sale.status == 'completed'
        ).group_by(
            extract('month', Sale.sale_date)
        ).all()
        
        monthly_data = {i: 0 for i in range(1, 13)}
        for r in results:
            monthly_data[int(r.month)] = float(r.revenue)
        
        return {
            "year": year,
            "monthly_revenue": [monthly_data[i] for i in range(1, 13)],
            "total_revenue": sum(monthly_data.values()),
            "total_orders": sum(int(r.orders) for r in results)
        }
    
    @staticmethod
    def get_dashboard_stats():
        """Statistiques globales pour le dashboard analytics"""
        total_products = Product.query.count()
        total_clients = Client.query.count()
        
        # Ventes du mois
        today = datetime.utcnow()
        first_day = today.replace(day=1)
        
        monthly_sales = db.session.query(
            func.sum(Sale.total_amount)
        ).filter(
            Sale.sale_date >= first_day,
            Sale.status == 'completed'
        ).scalar() or 0
        
        # Croissance par rapport au mois précédent
        last_month_first = (first_day - timedelta(days=1)).replace(day=1)
        last_month_sales = db.session.query(
            func.sum(Sale.total_amount)
        ).filter(
            Sale.sale_date >= last_month_first,
            Sale.sale_date < first_day,
            Sale.status == 'completed'
        ).scalar() or 0
        
        growth = ((monthly_sales - last_month_sales) / last_month_sales * 100) if last_month_sales > 0 else 0
        
        return {
            "total_products": total_products,
            "total_clients": total_clients,
            "monthly_revenue": float(monthly_sales),
            "growth_percentage": round(growth, 2)
        }