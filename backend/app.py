# ============================================================
#  SmartStock ERP — Application Flask principale
#  Fichier : app.py
# ============================================================
from flask import Flask, jsonify
from flask_cors import CORS
from extensions import db, jwt, bcrypt, migrate
from config import Config

# ── Import de tous les blueprints ───────────────────────────
from routes.auth_routes      import auth_bp
from routes.products_routes  import product_bp
from routes.client_routes    import client_bp
from routes.category_routes  import category_bp
from routes.sale_routes      import sale_bp
from routes.dashboard_routes import dashboard_bp
from routes.user_routes      import user_bp  # ← Déjà importé
from routes.stock_routes import stock_bp


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # ── Extensions ──────────────────────────────────────────
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    migrate.init_app(app, db)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # ── Enregistrement des blueprints ───────────────────────
    app.register_blueprint(auth_bp,      url_prefix="/api/auth")
    app.register_blueprint(product_bp,   url_prefix="/api/products")
    app.register_blueprint(client_bp,    url_prefix="/api/clients")
    app.register_blueprint(category_bp,  url_prefix="/api/categories")
    app.register_blueprint(sale_bp,      url_prefix="/api/sales")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
    app.register_blueprint(stock_bp,     url_prefix="/api/stock")
    app.register_blueprint(user_bp,      url_prefix="/api/users")  # ← AJOUTE CETTE LIGNE !

    # ── Gestionnaires d'erreurs globaux ─────────────────────
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Ressource introuvable"}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"error": "Méthode non autorisée"}), 405

    @app.errorhandler(500)
    def internal_error(e):
        db.session.rollback()
        return jsonify({"error": "Erreur interne du serveur"}), 500

    # ── JWT : messages d'erreur personnalisés ───────────────
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_data):
        return jsonify({"error": "Token expiré. Veuillez vous reconnecter."}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({"error": "Token invalide."}), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({"error": "Token manquant. Authentification requise."}), 401

    # ── Route de santé ──────────────────────────────────────
    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok", "app": "SmartStock ERP"}), 200
    
    @app.route('/')
    def home():
        return "مرحباً بك في SmartStock ERP!"

    return app


if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        db.create_all()
    app.run(debug=True, host="0.0.0.0", port=5000)