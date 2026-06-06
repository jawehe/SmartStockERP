# ============================================================
#  SmartStock ERP — Modèles SQLAlchemy
#  Fichier : models.py
# ============================================================
from datetime import datetime, timezone
from extensions import db


def now_utc():
    return datetime.now(timezone.utc)


# ─────────────────────────────────────────────────────────────
#  USER
# ─────────────────────────────────────────────────────────────
class User(db.Model):
    __tablename__ = "users"

    id            = db.Column(db.Integer, primary_key=True)
    name          = db.Column(db.String(100), nullable=False)
    email         = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role          = db.Column(db.Enum("admin", "manager", "seller"),
                              nullable=False, default="seller")
    created_at    = db.Column(db.DateTime, default=now_utc, nullable=False)

    sales = db.relationship("Sale", back_populates="user", lazy="dynamic")

    def to_dict(self):
        return {
            "id":         self.id,
            "name":       self.name,
            "email":      self.email,
            "role":       self.role,
            "created_at": self.created_at.isoformat(),
        }

    def __repr__(self):
        return f"<User {self.email}>"


# ─────────────────────────────────────────────────────────────
#  CATEGORY
# ─────────────────────────────────────────────────────────────
class Category(db.Model):
    __tablename__ = "categories"

    id          = db.Column(db.Integer, primary_key=True)
    name        = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.String(255), nullable=True)

    products = db.relationship("Product", back_populates="category", lazy="dynamic")

    def to_dict(self, with_count=True):
        data = {
            "id":          self.id,
            "name":        self.name,
            "description": self.description,
        }
        if with_count:
            data["product_count"] = self.products.count()
        return data

    def __repr__(self):
        return f"<Category {self.name}>"


# ─────────────────────────────────────────────────────────────
#  PRODUCT
# ─────────────────────────────────────────────────────────────
class Product(db.Model):
    __tablename__ = "products"

    id                  = db.Column(db.Integer, primary_key=True)
    category_id         = db.Column(db.Integer, db.ForeignKey("categories.id"),
                                    nullable=True)
    name                = db.Column(db.String(150), nullable=False)
    sku                 = db.Column(db.String(50), unique=True, nullable=False)
    description         = db.Column(db.Text, nullable=True)
    price               = db.Column(db.Numeric(10, 2), nullable=False)
    stock_quantity      = db.Column(db.Integer, nullable=False, default=0)
    low_stock_threshold = db.Column(db.Integer, nullable=False, default=5)
    created_at          = db.Column(db.DateTime, default=now_utc, nullable=False)

    category   = db.relationship("Category", back_populates="products")
    sale_items = db.relationship("SaleItem",  back_populates="product",
                                 lazy="dynamic")
    stock_movements = db.relationship( "StockMovement", back_populates="product", lazy="dynamic" )
    def is_low_stock(self):
        return self.stock_quantity <= self.low_stock_threshold

    def adjust_stock(self, qty: int):
        """qty négatif = déduction, positif = réapprovisionnement."""
        new_qty = self.stock_quantity + qty
        if new_qty < 0:
            raise ValueError(
                f"Stock insuffisant pour '{self.name}'. "
                f"Disponible : {self.stock_quantity}, demandé : {abs(qty)}"
            )
        self.stock_quantity = new_qty

    def to_dict(self):
        return {
            "id":                  self.id,
            "name":                self.name,
            "sku":                 self.sku,
            "description":         self.description,
            "price":               float(self.price),
            "stock_quantity":      self.stock_quantity,
            "low_stock_threshold": self.low_stock_threshold,
            "is_low_stock":        self.is_low_stock(),
            "category_id":         self.category_id,
            "category_name":       self.category.name if self.category else None,
            "created_at":          self.created_at.isoformat(),
        }

    def __repr__(self):
        return f"<Product {self.sku}>"


# ─────────────────────────────────────────────────────────────
#  CLIENT
# ─────────────────────────────────────────────────────────────
class Client(db.Model):
    __tablename__ = "clients"

    id         = db.Column(db.Integer, primary_key=True)
    name       = db.Column(db.String(150), nullable=False)
    email      = db.Column(db.String(150), unique=True, nullable=True)
    phone      = db.Column(db.String(20),  nullable=True)
    address    = db.Column(db.Text,        nullable=True)
    created_at = db.Column(db.DateTime, default=now_utc, nullable=False)

    sales = db.relationship("Sale", back_populates="client", lazy="dynamic")

    def total_spent(self):
        completed = self.sales.filter_by(status="completed").all()
        return round(sum(float(s.total_amount) for s in completed), 2)

    def to_dict(self, include_history=False):
        data = {
            "id":          self.id,
            "name":        self.name,
            "email":       self.email,
            "phone":       self.phone,
            "address":     self.address,
            "total_spent": self.total_spent(),
            "sale_count":  self.sales.count(),
            "created_at":  self.created_at.isoformat(),
        }
        if include_history:
            data["sales"] = [
                s.to_dict(include_items=False)
                for s in self.sales.order_by(Sale.sale_date.desc()).all()
            ]
        return data

    def __repr__(self):
        return f"<Client {self.name}>"


# ─────────────────────────────────────────────────────────────
#  SALE
# ─────────────────────────────────────────────────────────────
class Sale(db.Model):
    __tablename__ = "sales"

    id           = db.Column(db.Integer, primary_key=True)
    client_id    = db.Column(db.Integer, db.ForeignKey("clients.id"), nullable=True)
    user_id      = db.Column(db.Integer, db.ForeignKey("users.id"),   nullable=False)
    total_amount = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    status       = db.Column(
                      db.Enum("pending", "completed", "cancelled"),
                      nullable=False, default="completed"
                  )
    note         = db.Column(db.Text, nullable=True)
    sale_date    = db.Column(db.DateTime, default=now_utc, nullable=False)

    client     = db.relationship("Client",   back_populates="sales")
    user       = db.relationship("User",     back_populates="sales")
    sale_items = db.relationship(
                     "SaleItem",
                     back_populates="sale",
                     cascade="all, delete-orphan",
                     lazy="joined"
                 )

    def calculate_total(self):
        total = sum(float(item.subtotal) for item in self.sale_items)
        self.total_amount = total
        return total

    def to_dict(self, include_items=True):
        data = {
            "id":           self.id,
            "total_amount": float(self.total_amount),
            "status":       self.status,
            "note":         self.note,
            "sale_date":    self.sale_date.isoformat(),
            "client":       {"id": self.client_id,
                             "name": self.client.name} if self.client else None,
            "seller":      {"id": self.user_id,
                             "name": self.user.name}   if self.user   else None,
        }
        if include_items:
            data["items"] = [item.to_dict() for item in self.sale_items]
        return data

    def __repr__(self):
        return f"<Sale #{self.id} {self.status}>"


# ─────────────────────────────────────────────────────────────
#  SALE ITEM
# ─────────────────────────────────────────────────────────────
class SaleItem(db.Model):
    __tablename__ = "sale_items"

    id         = db.Column(db.Integer, primary_key=True)
    sale_id    = db.Column(db.Integer, db.ForeignKey("sales.id"),    nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    quantity   = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False)
    subtotal   = db.Column(db.Numeric(12, 2), nullable=False)

    sale    = db.relationship("Sale",    back_populates="sale_items")
    product = db.relationship("Product", back_populates="sale_items")

    def to_dict(self):
        return {
            "id":           self.id,
            "product_id":   self.product_id,
            "product_name": self.product.name if self.product else None,
            "product_sku":  self.product.sku  if self.product else None,
            "quantity":     self.quantity,
            "unit_price":   float(self.unit_price),
            "subtotal":     float(self.subtotal),
        }

    def __repr__(self):
        return f"<SaleItem sale={self.sale_id} product={self.product_id}>"
    
class StockMovement(db.Model):
    __tablename__ = "stock_movements"

    id = db.Column(db.Integer, primary_key=True)

    product_id = db.Column(
        db.Integer,
        db.ForeignKey("products.id"),
        nullable=False
    )

    movement_type = db.Column(
        db.String(20),
        nullable=False
    )  # IN / OUT / ADJUSTMENT

    quantity = db.Column(
        db.Integer,
        nullable=False
    )

    note = db.Column(
        db.String(255)
    )

    created_at = db.Column(
        db.DateTime,
        default=now_utc
    )

    product = db.relationship(
    "Product",
    back_populates="stock_movements"
)

    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "product_name": self.product.name if self.product else None,
            "movement_type": self.movement_type,
            "quantity": self.quantity,
            "note": self.note,
            "created_at": self.created_at.isoformat()
        }
# backend/models.py - Ajoute ces classes après la classe StockMovement

class Supplier(db.Model):
    __tablename__ = "suppliers"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150))
    phone = db.Column(db.String(50))
    address = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    purchases = db.relationship("Purchase", backref="supplier", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "address": self.address,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "purchase_count": len(self.purchases) if self.purchases else 0
        }


class Purchase(db.Model):
    __tablename__ = "purchases"

    id = db.Column(db.Integer, primary_key=True)
    supplier_id = db.Column(db.Integer, db.ForeignKey("suppliers.id"), nullable=False)
    total_amount = db.Column(db.Numeric(12, 2), default=0)
    status = db.Column(db.String(20), default="received")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    received_at = db.Column(db.DateTime, nullable=True)

    items = db.relationship("PurchaseItem", backref="purchase", lazy=True, cascade="all, delete-orphan")

    def to_dict(self, include_items=True):
        data = {
            "id": self.id,
            "supplier_id": self.supplier_id,
            "supplier_name": self.supplier.name if self.supplier else None,
            "total_amount": float(self.total_amount),
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "received_at": self.received_at.isoformat() if self.received_at else None,
            "items_count": len(self.items) if self.items else 0
        }
        if include_items and self.items:
            data["items"] = [item.to_dict() for item in self.items]
        return data


class PurchaseItem(db.Model):
    __tablename__ = "purchase_items"

    id = db.Column(db.Integer, primary_key=True)
    purchase_id = db.Column(db.Integer, db.ForeignKey("purchases.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit_cost = db.Column(db.Numeric(10, 2), nullable=False)
    subtotal = db.Column(db.Numeric(12, 2), nullable=False)

    product = db.relationship("Product", backref="purchase_items")

    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "product_name": self.product.name if self.product else None,
            "product_sku": self.product.sku if self.product else None,
            "quantity": self.quantity,
            "unit_cost": float(self.unit_cost),
            "subtotal": float(self.subtotal)
        }
# backend/models.py - Ajouter cette classe

class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    message = db.Column(db.String(500), nullable=False)
    type = db.Column(db.String(50), default='info')  # warning, success, info, danger
    is_read = db.Column(db.Boolean, default=False)
    link = db.Column(db.String(200), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "message": self.message,
            "type": self.type,
            "is_read": self.is_read,
            "link": self.link,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "time_ago": self.get_time_ago()
        }

    def get_time_ago(self):
        if not self.created_at:
            return ""
        diff = datetime.utcnow() - self.created_at
        if diff.days > 0:
            return f"Il y a {diff.days} jour(s)"
        elif diff.seconds > 3600:
            return f"Il y a {diff.seconds // 3600} heure(s)"
        elif diff.seconds > 60:
            return f"Il y a {diff.seconds // 60} minute(s)"
        else:
            return "À l'instant"    
        
# backend/models.py - Ajouter cette classe

class AuditLog(db.Model):
    __tablename__ = "audit_logs"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    user_name = db.Column(db.String(100), nullable=False)
    user_role = db.Column(db.String(50), nullable=False)
    action = db.Column(db.String(50), nullable=False)  # CREATE, UPDATE, DELETE, LOGIN, LOGOUT
    entity = db.Column(db.String(50), nullable=False)  # Product, Sale, Client, User, etc.
    entity_id = db.Column(db.Integer, nullable=True)
    details = db.Column(db.Text, nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relation
    user = db.relationship("User", backref="audit_logs")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "user_name": self.user_name,
            "user_role": self.user_role,
            "action": self.action,
            "entity": self.entity,
            "entity_id": self.entity_id,
            "details": self.details,
            "ip_address": self.ip_address,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "time_ago": self.get_time_ago()
        }

    def get_time_ago(self):
        if not self.created_at:
            return ""
        diff = datetime.utcnow() - self.created_at
        if diff.days > 0:
            return f"Il y a {diff.days} jour(s)"
        elif diff.seconds > 3600:
            return f"Il y a {diff.seconds // 3600} heure(s)"
        elif diff.seconds > 60:
            return f"Il y a {diff.seconds // 60} minute(s)"
        else:
            return "À l'instant"    

# backend/models.py - Ajouter ces classes

class Warehouse(db.Model):
    __tablename__ = "warehouses"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(20), unique=True, nullable=False)
    location = db.Column(db.String(200))
    manager = db.Column(db.String(100))
    phone = db.Column(db.String(50))
    email = db.Column(db.String(100))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relations
    stocks = db.relationship("WarehouseStock", backref="warehouse", lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "code": self.code,
            "location": self.location,
            "manager": self.manager,
            "phone": self.phone,
            "email": self.email,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "stock_count": len(self.stocks) if self.stocks else 0
        }


class WarehouseStock(db.Model):
    __tablename__ = "warehouse_stocks"

    id = db.Column(db.Integer, primary_key=True)
    warehouse_id = db.Column(db.Integer, db.ForeignKey("warehouses.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    quantity = db.Column(db.Integer, default=0)
    reserved_quantity = db.Column(db.Integer, default=0)  # Stock réservé pour commandes
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    product = db.relationship("Product", backref="warehouse_stocks")

    __table_args__ = (
        db.UniqueConstraint('warehouse_id', 'product_id', name='unique_warehouse_product'),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "warehouse_id": self.warehouse_id,
            "warehouse_name": self.warehouse.name if self.warehouse else None,
            "product_id": self.product_id,
            "product_name": self.product.name if self.product else None,
            "product_sku": self.product.sku if self.product else None,
            "quantity": self.quantity,
            "reserved_quantity": self.reserved_quantity,
            "available_quantity": self.quantity - self.reserved_quantity,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }            