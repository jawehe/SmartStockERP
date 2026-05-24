# ============================================================
#  SmartStock ERP — Routes Clients
#  Fichier : routes/client_routes.py
#
#  Endpoints :
#    GET    /api/clients              → liste + recherche
#    POST   /api/clients              → créer un client
#    GET    /api/clients/:id          → détail client
#    PUT    /api/clients/:id          → modifier un client
#    DELETE /api/clients/:id          → supprimer un client
#    GET    /api/clients/:id/history  → historique des achats
#    GET    /api/clients/:id/stats    → statistiques client
# ============================================================
from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from sqlalchemy import or_, func
from extensions import db
from models import Client, Sale, SaleItem, Product
from utils.helpers import success, error, validate_required, paginate_query, role_required

client_bp = Blueprint("clients", __name__)


# ─────────────────────────────────────────────────────────────
#  GET /api/clients
# ─────────────────────────────────────────────────────────────
@client_bp.route("", methods=["GET"])
@jwt_required()
def get_clients():
    """
    Liste paginée des clients.

    Query params :
      ?search=mot      → recherche dans name, email, phone
      ?sort=name|total_spent|sale_count
      ?order=asc|desc
    """
    query = Client.query

    # ── Recherche ────────────────────────────────────────────
    search = request.args.get("search", "").strip()
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                Client.name.ilike(pattern),
                Client.email.ilike(pattern),
                Client.phone.ilike(pattern),
            )
        )

    # ── Tri ──────────────────────────────────────────────────
    sort_field  = request.args.get("sort", "name")
    sort_order  = request.args.get("order", "asc")
    sort_column = getattr(Client, sort_field, Client.name)
    if hasattr(Client, sort_field):
        query = query.order_by(
            sort_column.desc() if sort_order == "desc" else sort_column.asc()
        )

    items, meta = paginate_query(query, schema_fn=lambda c: c.to_dict())
    return success(items, meta=meta)


# ─────────────────────────────────────────────────────────────
#  GET /api/clients/:id
# ─────────────────────────────────────────────────────────────
@client_bp.route("/<int:client_id>", methods=["GET"])
@jwt_required()
def get_client(client_id):
    """Détail complet d'un client."""
    client = Client.query.get_or_404(
        client_id,
        description=f"Client #{client_id} introuvable."
    )
    return success(client.to_dict())


# ─────────────────────────────────────────────────────────────
#  POST /api/clients
# ─────────────────────────────────────────────────────────────
@client_bp.route("", methods=["POST"])
@jwt_required()
def create_client():
    """
    Créer un nouveau client.
    Body JSON : { name, email?, phone?, address? }
    """
    data    = request.get_json(silent=True) or {}
    missing = validate_required(data, ["name"])
    if missing:
        return error("Le champ 'name' est obligatoire.")

    # Unicité de l'email (si fourni)
    email = data.get("email", "").strip().lower() or None
    if email and Client.query.filter_by(email=email).first():
        return error(f"Un client avec l'email '{email}' existe déjà.", status=409)

    client = Client(
        name=data["name"].strip(),
        email=email,
        phone=data.get("phone", "").strip() or None,
        address=data.get("address", "").strip() or None,
    )
    db.session.add(client)
    db.session.commit()

    return success(client.to_dict(), message="Client créé avec succès.", status=201)


# ─────────────────────────────────────────────────────────────
#  PUT /api/clients/:id
# ─────────────────────────────────────────────────────────────
@client_bp.route("/<int:client_id>", methods=["PUT"])
@jwt_required()
def update_client(client_id):
    """Modifier un client existant."""
    client = Client.query.get_or_404(client_id)
    data   = request.get_json(silent=True) or {}

    if "name" in data and data["name"].strip():
        client.name = data["name"].strip()

    if "email" in data:
        new_email = data["email"].strip().lower() or None
        if new_email:
            existing = Client.query.filter_by(email=new_email).first()
            if existing and existing.id != client_id:
                return error(f"L'email '{new_email}' est déjà utilisé.", status=409)
        client.email = new_email

    if "phone" in data:
        client.phone = data["phone"].strip() or None

    if "address" in data:
        client.address = data["address"].strip() or None

    db.session.commit()
    return success(client.to_dict(), message="Client mis à jour.")


# ─────────────────────────────────────────────────────────────
#  DELETE /api/clients/:id
# ─────────────────────────────────────────────────────────────
@client_bp.route("/<int:client_id>", methods=["DELETE"])
@jwt_required()
@role_required("admin")
def delete_client(client_id):
    """
    Supprimer un client.
    Refusé si le client a des ventes associées.
    """
    client = Client.query.get_or_404(client_id)

    if client.sales.count() > 0:
        return error(
            "Impossible de supprimer : ce client a des ventes enregistrées. "
            "Anonymisez-le plutôt.",
            status=409
        )

    db.session.delete(client)
    db.session.commit()
    return success(message=f"Client '{client.name}' supprimé.")


# ─────────────────────────────────────────────────────────────
#  GET /api/clients/:id/history
# ─────────────────────────────────────────────────────────────
@client_bp.route("/<int:client_id>/history", methods=["GET"])
@jwt_required()
def get_client_history(client_id):
    """
    Historique complet des achats d'un client.

    Query params :
      ?from=YYYY-MM-DD  → date de début
      ?to=YYYY-MM-DD    → date de fin
      ?status=completed → filtrer par statut
      ?page=1
    """
    client = Client.query.get_or_404(client_id)

    query = Sale.query.filter_by(client_id=client_id)

    # ── Filtres de période ───────────────────────────────────
    date_from = request.args.get("from")
    date_to   = request.args.get("to")
    if date_from:
        query = query.filter(Sale.sale_date >= date_from)
    if date_to:
        query = query.filter(Sale.sale_date <= date_to + " 23:59:59")

    # ── Filtre statut ────────────────────────────────────────
    status = request.args.get("status")
    if status:
        query = query.filter(Sale.status == status)

    query = query.order_by(Sale.sale_date.desc())

    items, meta = paginate_query(query, schema_fn=lambda s: s.to_dict())

    return success(
        {
            "client":  client.to_dict(),
            "history": items,
        },
        meta=meta
    )


# ─────────────────────────────────────────────────────────────
#  GET /api/clients/:id/stats
# ─────────────────────────────────────────────────────────────
@client_bp.route("/<int:client_id>/stats", methods=["GET"])
@jwt_required()
def get_client_stats(client_id):
    """
    Statistiques agrégées d'un client :
    total dépensé, nb ventes, panier moyen, produit préféré.
    """
    client = Client.query.get_or_404(client_id)

    # Total dépensé et nb ventes (ventes complétées uniquement)
    agg = db.session.query(
        func.count(Sale.id).label("sale_count"),
        func.coalesce(func.sum(Sale.total_amount), 0).label("total_spent"),
        func.coalesce(func.avg(Sale.total_amount), 0).label("avg_basket"),
    ).filter(
        Sale.client_id == client_id,
        Sale.status == "completed"
    ).first()

    # Produit le plus acheté
    top_product = db.session.query(
        Product.name,
        func.sum(SaleItem.quantity).label("total_qty")
    ).join(SaleItem, Product.id == SaleItem.product_id)\
     .join(Sale,     Sale.id    == SaleItem.sale_id)\
     .filter(
         Sale.client_id == client_id,
         Sale.status    == "completed"
     ).group_by(Product.id)\
      .order_by(func.sum(SaleItem.quantity).desc())\
      .first()

    return success({
        "client":       client.to_dict(),
        "sale_count":   int(agg.sale_count),
        "total_spent":  float(agg.total_spent),
        "avg_basket":   round(float(agg.avg_basket), 2),
        "top_product":  {
            "name":     top_product.name,
            "quantity": int(top_product.total_qty),
        } if top_product else None,
    })