# backend/services/assistant_service.py
import re
from datetime import datetime, timedelta
from sqlalchemy import func
from models import Product, Sale, SaleItem, Client, Purchase
from extensions import db

class AssistantService:
    
    @staticmethod
    def process_question(question: str) -> str:
        """Traite la question de l'utilisateur et retourne une réponse"""
        question_lower = question.lower().strip()
        
        # 1. Top selling products
        if any(word in question_lower for word in ['top selling', 'best selling', 'most sold', 'meilleures ventes']):
            return AssistantService._get_top_products()
        
        # 2. Low stock products
        elif any(word in question_lower for word in ['low stock', 'stock faible', 'rupture', 'inventory alert']):
            return AssistantService._get_low_stock_alert()
        
        # 3. Sales summary
        elif any(word in question_lower for word in ['sales summary', 'chiffre d\'affaires', 'total sales', 'revenue']):
            return AssistantService._get_sales_summary()
        
        # 4. Top clients
        elif any(word in question_lower for word in ['top client', 'best client', 'meilleur client']):
            return AssistantService._get_top_clients()
        
        # 5. Monthly performance
        elif any(word in question_lower for word in ['monthly', 'performance', 'mois', 'this month']):
            return AssistantService._get_monthly_performance()
        
        # 6. Stock value
        elif any(word in question_lower for word in ['stock value', 'inventory value', 'valeur du stock']):
            return AssistantService._get_stock_value()
        
        # 7. Profit
        elif any(word in question_lower for word in ['profit', 'benefice', 'marge']):
            return AssistantService._get_profit()
        
        # 8. Help
        elif any(word in question_lower for word in ['help', 'aide', 'what can you do', 'commandes']):
            return AssistantService._get_help()
        
        # 9. Default response
        else:
            return AssistantService._get_default_response(question)
    
    @staticmethod
    def _get_top_products(limit=5):
        """Retourne les produits les plus vendus"""
        results = db.session.query(
            Product.name,
            func.sum(SaleItem.quantity).label('total_sold'),
            func.sum(SaleItem.subtotal).label('total_revenue')
        ).join(
            SaleItem, Product.id == SaleItem.product_id
        ).join(
            Sale, SaleItem.sale_id == Sale.id
        ).filter(
            Sale.status == 'completed'
        ).group_by(
            Product.id, Product.name
        ).order_by(
            func.sum(SaleItem.quantity).desc()
        ).limit(limit).all()
        
        if not results:
            return "No sales data available yet."
        
        response = f"🏆 Here are your top {len(results)} best selling products:\n\n"
        for i, r in enumerate(results, 1):
            response += f"{i}. **{r.name}** - {int(r.total_sold)} units sold (${float(r.total_revenue):,.2f})\n"
        
        return response
    
    @staticmethod
    def _get_low_stock_alert():
        """Retourne les alertes de stock faible"""
        products = Product.query.filter(
            Product.stock_quantity <= Product.low_stock_threshold
        ).all()
        
        if not products:
            return "✅ All products have sufficient stock. No low stock alerts!"
        
        response = f"⚠️ **Low Stock Alert** - {len(products)} product(s) need attention:\n\n"
        for p in products:
            response += f"• **{p.name}** - Only {p.stock_quantity} units left (threshold: {p.low_stock_threshold})\n"
        
        response += f"\n💡 Recommendation: Reorder {', '.join([p.name for p in products[:3]])}"
        return response
    
    @staticmethod
    def _get_sales_summary():
        """Retourne un résumé des ventes"""
        today = datetime.utcnow().date()
        first_day_month = today.replace(day=1)
        
        # Ventes du mois
        monthly_sales = db.session.query(
            func.sum(Sale.total_amount)
        ).filter(
            Sale.sale_date >= first_day_month,
            Sale.status == 'completed'
        ).scalar() or 0
        
        # Nombre de ventes
        order_count = db.session.query(
            func.count(Sale.id)
        ).filter(
            Sale.sale_date >= first_day_month,
            Sale.status == 'completed'
        ).scalar() or 0
        
        # Moyenne par commande
        avg_order = monthly_sales / order_count if order_count > 0 else 0
        
        # Ventes d'hier vs aujourd'hui
        yesterday = today - timedelta(days=1)
        today_sales = db.session.query(
            func.sum(Sale.total_amount)
        ).filter(
            func.date(Sale.sale_date) == today,
            Sale.status == 'completed'
        ).scalar() or 0
        
        yesterday_sales = db.session.query(
            func.sum(Sale.total_amount)
        ).filter(
            func.date(Sale.sale_date) == yesterday,
            Sale.status == 'completed'
        ).scalar() or 0
        
        trend = "📈 up" if today_sales > yesterday_sales else "📉 down"
        
        return f"""📊 **Sales Summary - This Month**

💰 Total Revenue: **${monthly_sales:,.2f}**
📦 Orders: **{order_count}**
💵 Average Order: **${avg_order:,.2f}**
📅 Today vs Yesterday: **${today_sales:,.2f}** vs **${yesterday_sales:,.2f}** ({trend})

✨ Keep up the great work!"""
    
    @staticmethod
    def _get_top_clients(limit=5):
        """Retourne les meilleurs clients"""
        results = db.session.query(
            Client.name,
            func.sum(Sale.total_amount).label('total_spent'),
            func.count(Sale.id).label('order_count')
        ).join(
            Sale, Client.id == Sale.client_id
        ).filter(
            Sale.status == 'completed'
        ).group_by(
            Client.id, Client.name
        ).order_by(
            func.sum(Sale.total_amount).desc()
        ).limit(limit).all()
        
        if not results:
            return "No client data available yet."
        
        response = f"🏆 Your top {len(results)} clients:\n\n"
        for i, r in enumerate(results, 1):
            response += f"{i}. **{r.name}** - {r.order_count} orders (${float(r.total_spent):,.2f})\n"
        
        return response
    
    @staticmethod
    def _get_monthly_performance():
        """Retourne les performances mensuelles"""
        current_month = datetime.utcnow().month
        current_year = datetime.utcnow().year
        
        sales_by_month = db.session.query(
            func.extract('month', Sale.sale_date).label('month'),
            func.sum(Sale.total_amount).label('revenue')
        ).filter(
            func.extract('year', Sale.sale_date) == current_year,
            Sale.status == 'completed'
        ).group_by(
            func.extract('month', Sale.sale_date)
        ).all()
        
        if not sales_by_month:
            return f"No sales data for {current_year} yet."
        
        month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        response = f"📅 **Monthly Performance {current_year}**\n\n"
        for month, revenue in sales_by_month:
            response += f"• {month_names[int(month)-1]}: **${float(revenue):,.2f}**\n"
        
        return response
    
    @staticmethod
    def _get_stock_value():
        """Retourne la valeur totale du stock"""
        total_value = db.session.query(
            func.sum(Product.price * Product.stock_quantity)
        ).scalar() or 0
        
        total_products = Product.query.count()
        low_stock_count = Product.query.filter(
            Product.stock_quantity <= Product.low_stock_threshold
        ).count()
        
        return f"""📦 **Inventory Summary**

💰 Total Stock Value: **${float(total_value):,.2f}**
📦 Total Products: **{total_products}**
⚠️ Low Stock Items: **{low_stock_count}**

💡 Your inventory is valued at ${float(total_value):,.2f}"""
    
    @staticmethod
    def _get_profit():
        """Retourne le profit estimé"""
        total_sales = db.session.query(
            func.sum(Sale.total_amount)
        ).filter(
            Sale.status == 'completed'
        ).scalar() or 0
        
        total_purchases = db.session.query(
            func.sum(Purchase.total_amount)
        ).filter(
            Purchase.status == 'received'
        ).scalar() or 0
        
        profit = total_sales - total_purchases
        margin = (profit / total_sales * 100) if total_sales > 0 else 0
        
        return f"""💵 **Profit Analysis**

💰 Total Sales: **${float(total_sales):,.2f}**
📦 Total Purchases: **${float(total_purchases):,.2f}**
📈 Estimated Profit: **${float(profit):,.2f}**
📊 Profit Margin: **{margin:.1f}%**

{'🎉 Excellent performance!' if margin > 20 else '📉 Consider reducing costs.' if margin < 10 else '👍 Good performance!'}"""
    
    @staticmethod
    def _get_help():
        """Retourne l'aide avec les commandes disponibles"""
        return """🤖 **SmartStock AI Assistant - Help**

You can ask me questions like:

📊 **Sales & Revenue**
• "What are my top selling products?"
• "Show me sales summary"
• "What is my monthly performance?"

📦 **Inventory**
• "Low stock products?"
• "What is my stock value?"

👥 **Clients**
• "Who are my top clients?"

💰 **Finance**
• "What is my profit?"
• "Show me my margin"

💡 Just type your question in natural language!

*Example: "What are my best selling products this month?"*"""
    
    @staticmethod
    def _get_default_response(question: str):
        """Retourne une réponse par défaut"""
        return f"""❓ I'm not sure I understand your question: "{question}"

💡 Try asking me:
• "What are my top selling products?"
• "Low stock products?"
• "Sales summary"
• "Help" for all commands

I'm learning every day! 🚀"""


# Version avec OpenAI (à implémenter plus tard)
class OpenAIAssistant:
    """Version avancée avec OpenAI GPT"""
    
    @staticmethod
    async def ask_gpt(question: str, api_key: str):
        """Interroge l'API OpenAI"""
        import openai
        openai.api_key = api_key
        
        response = await openai.ChatCompletion.acreate(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful ERP assistant for SmartStock. Answer questions about sales, inventory, and business metrics."},
                {"role": "user", "content": question}
            ],
            temperature=0.7
        )
        
        return response.choices[0].message.content