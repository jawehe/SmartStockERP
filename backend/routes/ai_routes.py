# backend/routes/ai_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from services.forecast_service import ForecastService
from services.ml_service import MLService
from services.assistant_service import AssistantService
from datetime import datetime 
ai_bp = Blueprint("ai", __name__)


@ai_bp.route("/recommendations", methods=["GET"])
@jwt_required()
def get_recommendations():
    product_id = request.args.get("product_id", type=int)
    data = ForecastService.calculate_reorder(product_id)
    return jsonify({"data": data}), 200


@ai_bp.route("/sales-forecast", methods=["GET"])
@jwt_required()
def get_sales_forecast():
    days = request.args.get("days", 30, type=int)
    days = min(days, 90)  # Maximum 90 jours
    
    data = MLService.predict_next_days(days)
    return jsonify({"data": data}), 200


@ai_bp.route("/product-forecast", methods=["GET"])
@jwt_required()
def get_product_forecast():
    product_id = request.args.get("product_id", type=int)
    data = MLService.get_product_forecast(product_id)
    return jsonify({"data": data}), 200


@ai_bp.route("/train", methods=["POST"])
@jwt_required()
def train_model():
    """Force l'entraînement du modèle"""
    result = MLService.train_model()
    if result:
        return jsonify({
            "message": "Modèle entraîné avec succès",
            "accuracy": {
                "mae": result["mae"],
                "r2": result["r2"]
            }
        }), 200
    else:
        return jsonify({"message": "Données insuffisantes pour l'entraînement"}), 400
    

@ai_bp.route("/ask", methods=["POST"])
@jwt_required()
def ask_assistant():
    """Assistant IA - Questions/réponses"""
    data = request.get_json()
    question = data.get("question", "")
    
    if not question:
        return jsonify({"error": "Question is required"}), 400
    
    answer = AssistantService.process_question(question)
    
    return jsonify({
        "question": question,
        "answer": answer,
        "timestamp": datetime.utcnow().isoformat()
    }), 200
