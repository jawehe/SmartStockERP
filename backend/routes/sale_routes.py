# ============================================================
#  SmartStock ERP — Routes Ventes
#  Fichier : routes/sale_routes.py
#
#  Endpoints :
#    GET    /api/sales           → liste paginée + filtres
#    POST   /api/sales           → créer une vente (transactionnelle)
#    GET    /api/sales/:id       → détail avec items
#    PATCH  /api/sales/:id/status → changer le statut
#    DELETE /api/sales/:id       → annuler une vente (remise en stock)
# ============================================================
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Sale, SaleItem, Product, Client, StockMovement
from utils.helpers import success, error, validate_required, paginate_query, role_required

sale_bp = Blueprint("sales", __name__)


# ─────────────────────────────────────────────────────────────
#  GET /api/sales
# ─────────────────────────────────────────────────────────────
@sale_bp.route("", methods=["GET"])
@jwt_required()
def get_sales():
    """
    Liste paginée des ventes avec filtres.

    Query params :
      ?from=YYYY-MM-DD   → date de début
      ?to=YYYY-MM-DD     → date de fin
      ?client_id=X       → filtrer par client
      ?status=completed  → filtrer par statut
      ?page=1
    """
    query = Sale.query

    if request.args.get("from"):
        query = query.filter(Sale.sale_date >= request.args["from"])
    if request.args.get("to"):
        query = query.filter(Sale.sale_date <= request.args["to"] + " 23:59:59")
    if request.args.get("client_id"):
        query = query.filter(Sale.client_id == int(request.args["client_id"]))
    if request.args.get("status"):
        query = query.filter(Sale.status == request.args["status"])

    query = query.order_by(Sale.sale_date.desc())

    items, meta = paginate_query(
        query,
        schema_fn=lambda s: s.to_dict(include_items=False)
    )
    return success(items, meta=meta)


# ─────────────────────────────────────────────────────────────
#  GET /api/sales/:id
# ─────────────────────────────────────────────────────────────
@sale_bp.route("/<int:sale_id>", methods=["GET"])
@jwt_required()
def get_sale(sale_id):
    """Détail complet d'une vente avec tous ses items."""
    sale = Sale.query.get_or_404(sale_id, description=f"Vente #{sale_id} introuvable.")
    return success(sale.to_dict(include_items=True))


# ─────────────────────────────────────────────────────────────
#  POST /api/sales  (TRANSACTION ATOMIQUE AVEC STOCK MOVEMENT)
# ─────────────────────────────────────────────────────────────
@sale_bp.route("", methods=["POST"])
@jwt_required()
def create_sale():
    """
    Créer une nouvelle vente de façon atomique.

    Body JSON :
    {
      "client_id": 3,
      "note": "...",
      "items": [
        { "product_id": 1, "quantity": 2 },
        { "product_id": 5, "quantity": 1 }
      ]
    }

    Opérations dans la transaction :
      1. Valider le payload
      2. Vérifier l'existence et le stock de chaque produit
      3. Créer la ligne Sale
      4. Créer chaque SaleItem
      5. Déduire le stock de chaque produit
      6. Créer un mouvement StockMovement pour chaque produit (type: OUT)
      7. Calculer et sauvegarder le total
      8. COMMIT ou ROLLBACK si n'importe quelle étape échoue
    """
    data    = request.get_json(silent=True) or {}
    user_id = int(get_jwt_identity())

    # ── 1. Validation du payload ─────────────────────────────
    if not data.get("items") or not isinstance(data["items"], list):
        return error("Le champ 'items' est requis et doit être une liste.")

    if len(data["items"]) == 0:
        return error("La vente doit contenir au moins un article.")

    # Valider chaque item
    for i, item in enumerate(data["items"]):
        if "product_id" not in item:
            return error(f"Item #{i+1} : 'product_id' manquant.")
        if "quantity" not in item:
            return error(f"Item #{i+1} : 'quantity' manquant.")
        try:
            qty = int(item["quantity"])
            if qty <= 0:
                return error(f"Item #{i+1} : la quantité doit être > 0.")
        except (ValueError, TypeError):
            return error(f"Item #{i+1} : quantité invalide.")

    # Vérifier le client (si fourni)
    client_id = data.get("client_id")
    if client_id and not Client.query.get(client_id):
        return error(f"Client #{client_id} introuvable.")

    # ── 2. Vérifier les produits et stocks AVANT la transaction
    items_data = []
    for item in data["items"]:
        product = Product.query.get(item["product_id"])
        if not product:
            return error(f"Produit #{item['product_id']} introuvable.")
        qty = int(item["quantity"])
        if product.stock_quantity < qty:
            return error(
                f"Stock insuffisant pour '{product.name}'. "
                f"Disponible : {product.stock_quantity}, demandé : {qty}",
                status=422
            )
        items_data.append({"product": product, "quantity": qty})

    # ── 3-8. Transaction atomique ────────────────────────────
    try:
        # Créer la vente (entête)
        sale = Sale(
            client_id=client_id,
            user_id=user_id,
            status="completed",
            note=data.get("note", "").strip() or None,
        )
        db.session.add(sale)
        db.session.flush()  # obtenir sale.id avant le commit

        total = 0.0

        for entry in items_data:
            product  = entry["product"]
            qty      = entry["quantity"]
            price    = float(product.price)
            subtotal = round(price * qty, 2)

            # Créer la ligne de vente
            sale_item = SaleItem(
                sale_id=sale.id,
                product_id=product.id,
                quantity=qty,
                unit_price=price,
                subtotal=subtotal,
            )
            db.session.add(sale_item)

            # Déduire le stock
            product.adjust_stock(-qty)

            # ✨ AJOUT : Enregistrer le mouvement de stock (OUT)
            movement = StockMovement(
                product_id=product.id,
                movement_type="OUT",
                quantity=qty,
                note=f"Sale #{sale.id} - {product.name}"
            )
            db.session.add(movement)

            total += subtotal

        # Sauvegarder le total
        sale.total_amount = round(total, 2)

        # ✓ COMMIT — tout réussit ou rien
        db.session.commit()

    except ValueError as e:
        db.session.rollback()
        return error(str(e), status=422)
    except Exception as e:
        db.session.rollback()
        return error(f"Erreur lors de la création de la vente : {str(e)}", status=500)

    # Recharger la vente avec ses relations
    sale = Sale.query.get(sale.id)
    return success(
        sale.to_dict(include_items=True),
        message="Vente créée avec succès.",
        status=201
    )


# ─────────────────────────────────────────────────────────────
#  PATCH /api/sales/:id/status
# ─────────────────────────────────────────────────────────────
@sale_bp.route("/<int:sale_id>/status", methods=["PATCH"])
@jwt_required()
@role_required("admin", "manager")
def update_sale_status(sale_id):
    """
    Changer le statut d'une vente.
    Body JSON : { "status": "cancelled" }

    Si passage à "cancelled" : 
      - remise en stock automatique des produits
      - ajout d'un mouvement de stock (IN) pour chaque produit
    """
    sale   = Sale.query.get_or_404(sale_id)
    data   = request.get_json(silent=True) or {}
    status = data.get("status")

    allowed_statuses = ("pending", "completed", "cancelled")
    if status not in allowed_statuses:
        return error(f"Statut invalide. Valeurs acceptées : {allowed_statuses}")

    if sale.status == status:
        return error(f"La vente est déjà au statut '{status}'.")

    if sale.status == "cancelled":
        return error("Une vente annulée ne peut pas être modifiée.")

    try:
        # Annulation → remettre le stock et ajouter mouvement IN
        if status == "cancelled":
            for item in sale.sale_items:
                # Remettre le stock
                item.product.adjust_stock(+item.quantity)
                
                # ✨ AJOUT : Enregistrer le mouvement de stock (IN)
                movement = StockMovement(
                    product_id=item.product_id,
                    movement_type="IN",
                    quantity=item.quantity,
                    note=f"Sale #{sale.id} cancelled - Stock restored"
                )
                db.session.add(movement)

        sale.status = status
        db.session.commit()

    except Exception as e:
        db.session.rollback()
        return error(f"Erreur lors de la mise à jour : {str(e)}", status=500)

    return success(
        sale.to_dict(include_items=False),
        message=f"Statut mis à jour → '{status}'."
    )


# ─────────────────────────────────────────────────────────────
#  DELETE /api/sales/:id
# ─────────────────────────────────────────────────────────────
@sale_bp.route("/<int:sale_id>", methods=["DELETE"])
@jwt_required()
@role_required("admin")
def delete_sale(sale_id):
    """
    Supprimer une vente (réservé admin).
    Si la vente est 'completed', remet le stock à jour avant suppression.
    """
    sale = Sale.query.get_or_404(sale_id)

    try:
        if sale.status == "completed":
            for item in sale.sale_items:
                # Remettre le stock
                item.product.adjust_stock(+item.quantity)
                
                # ✨ AJOUT : Enregistrer le mouvement de stock (IN)
                movement = StockMovement(
                    product_id=item.product_id,
                    movement_type="IN",
                    quantity=item.quantity,
                    note=f"Sale #{sale.id} deleted by admin - Stock restored"
                )
                db.session.add(movement)

        db.session.delete(sale)
        db.session.commit()

    except Exception as e:
        db.session.rollback()
        return error(f"Erreur lors de la suppression : {str(e)}", status=500)

    return success(message=f"Vente #{sale_id} supprimée et stock restauré.")