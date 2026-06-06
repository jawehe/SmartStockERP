# backend/utils/notifications.py
from extensions import db
from models import Notification
from datetime import datetime

def create_notification(message: str, type: str = 'info', link: str = None):
    """Crée une notification dans la base de données"""
    notification = Notification(
        message=message,
        type=type,
        link=link,
        created_at=datetime.utcnow()
    )
    db.session.add(notification)
    db.session.commit()
    return notification

def check_low_stock_notifications():
    """Vérifie les stocks faibles et crée des notifications"""
    from models import Product
    
    products = Product.query.all()
    notifications_created = 0
    
    for product in products:
        if product.stock_quantity <= product.low_stock_threshold:
            # Vérifier si une notification existe déjà pour ce produit
            existing = Notification.query.filter(
                Notification.message.like(f'%{product.name}%'),
                Notification.is_read == False
            ).first()
            
            if not existing:
                message = f"⚠️ Stock faible: {product.name} (plus que {product.stock_quantity} unités)"
                create_notification(
                    message=message,
                    type='warning',
                    link=f'/products?product={product.id}'
                )
                notifications_created += 1
    
    return notifications_created
