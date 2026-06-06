# backend/services/ml_service.py
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, r2_score
from sqlalchemy import func, extract
from models import Sale, SaleItem, Product
from extensions import db
from datetime import datetime, timedelta
import json

class MLService:
    
    @staticmethod
    def prepare_sales_data(days_back=365):
        """Prépare les données de ventes pour l'entraînement"""
        # Récupérer les ventes des X derniers jours
        start_date = datetime.utcnow() - timedelta(days=days_back)
        
        sales_data = db.session.query(
            func.date(Sale.sale_date).label('date'),
            func.sum(Sale.total_amount).label('daily_revenue'),
            func.count(Sale.id).label('order_count')
        ).filter(
            Sale.sale_date >= start_date,
            Sale.status == 'completed'
        ).group_by(
            func.date(Sale.sale_date)
        ).order_by(
            func.date(Sale.sale_date)
        ).all()
        
        if len(sales_data) < 30:
            return None, None, None
        
        # Convertir en DataFrame
        df = pd.DataFrame([{
            'date': pd.to_datetime(r.date),
            'revenue': float(r.daily_revenue),
            'orders': int(r.order_count)
        } for r in sales_data])
        
        # Créer des features
        df['day_of_week'] = df['date'].dt.dayofweek
        df['month'] = df['date'].dt.month
        df['day'] = df['date'].dt.day
        df['week_of_year'] = df['date'].dt.isocalendar().week
        df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
        
        # Features laggées (ventes des jours précédents)
        for lag in [1, 3, 7, 14, 21, 28]:
            df[f'revenue_lag_{lag}'] = df['revenue'].shift(lag)
        
        # Moyenne mobile
        df['revenue_ma_7'] = df['revenue'].rolling(window=7).mean()
        df['revenue_ma_30'] = df['revenue'].rolling(window=30).mean()
        
        # Supprimer les lignes avec NaN
        df = df.dropna()
        
        return df, sales_data, start_date
    
    @staticmethod
    def train_model():
        """Entraîne le modèle de prévision des ventes"""
        df, _, _ = MLService.prepare_sales_data(365)
        
        if df is None or len(df) < 30:
            return None
        
        # Features pour le modèle
        feature_columns = [
            'day_of_week', 'month', 'day', 'week_of_year', 'is_weekend',
            'revenue_lag_1', 'revenue_lag_3', 'revenue_lag_7',
            'revenue_lag_14', 'revenue_lag_21', 'revenue_lag_28',
            'revenue_ma_7', 'revenue_ma_30'
        ]
        
        X = df[feature_columns].values
        y = df['revenue'].values
        
        # Normalisation
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Entraînement
        model = LinearRegression()
        model.fit(X_scaled, y)
        
        # Évaluation
        y_pred = model.predict(X_scaled)
        mae = mean_absolute_error(y, y_pred)
        r2 = r2_score(y, y_pred)
        
        return {
            "model": model,
            "scaler": scaler,
            "mae": mae,
            "r2": r2,
            "feature_columns": feature_columns,
            "last_date": df['date'].max()
        }
    
    @staticmethod
    def predict_next_days(days=30):
        """Prédit les ventes pour les X prochains jours"""
        trained = MLService.train_model()
        
        if trained is None:
            return MLService.get_fallback_prediction(days)
        
        model = trained["model"]
        scaler = trained["scaler"]
        feature_columns = trained["feature_columns"]
        last_date = trained["last_date"]
        
        predictions = []
        last_revenues = []
        
        # Récupérer les dernières valeurs réelles
        actual_sales = db.session.query(
            func.date(Sale.sale_date).label('date'),
            func.sum(Sale.total_amount).label('revenue')
        ).filter(
            Sale.status == 'completed',
            Sale.sale_date >= (datetime.utcnow() - timedelta(days=60))
        ).group_by(
            func.date(Sale.sale_date)
        ).order_by(
            func.date(Sale.sale_date).desc()
        ).limit(30).all()
        
        revenue_history = [float(r.revenue) for r in actual_sales[::-1]]
        
        for i in range(days):
            pred_date = last_date + timedelta(days=i+1)
            
            # Préparer les features pour la prédiction
            features = {
                'day_of_week': pred_date.weekday(),
                'month': pred_date.month,
                'day': pred_date.day,
                'week_of_year': pred_date.isocalendar().week,
                'is_weekend': 1 if pred_date.weekday() >= 5 else 0,
                'revenue_lag_1': revenue_history[-1] if len(revenue_history) >= 1 else 0,
                'revenue_lag_3': revenue_history[-3] if len(revenue_history) >= 3 else 0,
                'revenue_lag_7': revenue_history[-7] if len(revenue_history) >= 7 else 0,
                'revenue_lag_14': revenue_history[-14] if len(revenue_history) >= 14 else 0,
                'revenue_lag_21': revenue_history[-21] if len(revenue_history) >= 21 else 0,
                'revenue_lag_28': revenue_history[-28] if len(revenue_history) >= 28 else 0,
                'revenue_ma_7': np.mean(revenue_history[-7:]) if len(revenue_history) >= 7 else 0,
                'revenue_ma_30': np.mean(revenue_history[-30:]) if len(revenue_history) >= 30 else 0
            }
            
            # Créer le vecteur de features
            feature_vector = [[features[col] for col in feature_columns]]
            feature_scaled = scaler.transform(feature_vector)
            
            # Prédiction
            pred_revenue = model.predict(feature_scaled)[0]
            pred_revenue = max(0, pred_revenue)  # Pas de négatif
            
            predictions.append({
                "date": pred_date.strftime("%Y-%m-%d"),
                "day": pred_date.strftime("%A"),
                "predicted_revenue": round(pred_revenue, 2)
            })
            
            revenue_history.append(pred_revenue)
        
        # Calculer le total prévu
        total_predicted = sum(p["predicted_revenue"] for p in predictions)
        
        return {
            "predictions": predictions,
            "total_predicted": round(total_predicted, 2),
            "average_daily": round(total_predicted / days, 2),
            "days": days,
            "model_accuracy": {
                "mae": round(trained["mae"], 2),
                "r2": round(trained["r2"], 4)
            }
        }
    
    @staticmethod
    def get_fallback_prediction(days=30):
        """Prédiction de secours basée sur la moyenne historique"""
        # Ventes des 90 derniers jours
        ninety_days_ago = datetime.utcnow() - timedelta(days=90)
        
        total_sales = db.session.query(
            func.sum(Sale.total_amount)
        ).filter(
            Sale.sale_date >= ninety_days_ago,
            Sale.status == 'completed'
        ).scalar() or 0
        
        avg_daily = total_sales / 90 if total_sales > 0 else 1000
        
        predictions = []
        for i in range(days):
            pred_date = datetime.utcnow() + timedelta(days=i+1)
            predictions.append({
                "date": pred_date.strftime("%Y-%m-%d"),
                "day": pred_date.strftime("%A"),
                "predicted_revenue": round(avg_daily, 2)
            })
        
        return {
            "predictions": predictions,
            "total_predicted": round(avg_daily * days, 2),
            "average_daily": round(avg_daily, 2),
            "days": days,
            "model_accuracy": {
                "mae": 0,
                "r2": 0,
                "note": "Using historical average (insufficient data for ML)"
            }
        }
    
    @staticmethod
    def get_product_forecast(product_id=None):
        """Prévision des ventes par produit"""
        query = db.session.query(
            Product.id,
            Product.name,
            Product.sku,
            func.sum(SaleItem.quantity).label('total_sold')
        ).join(
            SaleItem, Product.id == SaleItem.product_id
        ).join(
            Sale, SaleItem.sale_id == Sale.id
        ).filter(
            Sale.status == 'completed'
        )
        
        if product_id:
            query = query.filter(Product.id == product_id)
        
        results = query.group_by(Product.id, Product.name, Product.sku).all()
        
        forecasts = []
        for r in results:
            # Ventes quotidiennes moyennes
            avg_daily = r.total_sold / 365 if r.total_sold else 0
            
            # Stock actuel
            product = Product.query.get(r.id)
            current_stock = product.stock_quantity if product else 0
            
            # Jusqu'à quand le stock tiendra
            days_until_out = current_stock / avg_daily if avg_daily > 0 else 999
            
            forecasts.append({
                "product_id": r.id,
                "product_name": r.name,
                "product_sku": r.sku,
                "total_sold_ytd": int(r.total_sold),
                "avg_daily_sales": round(avg_daily, 2),
                "current_stock": current_stock,
                "stock_cover_days": round(days_until_out, 1),
                "recommended_order": max(0, int(avg_daily * 30 - current_stock))
            })
        
        return sorted(forecasts, key=lambda x: x["stock_cover_days"])