# ============================================================
#  SmartStock ERP — Configuration
#  Fichier : config.py
# ============================================================
import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


class Config:
    # ── Général ─────────────────────────────────────────────
    SECRET_KEY = os.getenv("SECRET_KEY", "change-this-in-production")
    DEBUG      = os.getenv("FLASK_DEBUG", "False").lower() == "true"

    # ── Base de données ─────────────────────────────────────
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://root:password@localhost/smartstock_db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False  # Passer à True pour voir les requêtes SQL en dev

    # ── JWT ─────────────────────────────────────────────────
    JWT_SECRET_KEY             = os.getenv("JWT_SECRET_KEY", "jwt-secret-change-me")
    JWT_ACCESS_TOKEN_EXPIRES   = timedelta(hours=int(os.getenv("JWT_TTL_HOURS", "8")))
    JWT_REFRESH_TOKEN_EXPIRES  = timedelta(days=30)
    JWT_TOKEN_LOCATION         = ["headers"]
    JWT_HEADER_NAME            = "Authorization"
    JWT_HEADER_TYPE            = "Bearer"

    # ── Pagination ──────────────────────────────────────────
    DEFAULT_PAGE_SIZE = 15
    MAX_PAGE_SIZE     = 100


class DevelopmentConfig(Config):
    DEBUG               = True
    SQLALCHEMY_ECHO     = True


class ProductionConfig(Config):
    DEBUG               = False
    SQLALCHEMY_ECHO     = False