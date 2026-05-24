from app import create_app
from extensions import db
from models import User, Category, Product, Client, Sale, SaleItem

from datetime import datetime

app = create_app()


with app.app_context():

    # 🧹 reset database (clean start)
    SaleItem.query.delete()
    Sale.query.delete()
    Product.query.delete()
    Client.query.delete()
    Category.query.delete()
    User.query.delete()

    # 👤 USERS
    admin = User(
        name="Admin",
        email="admin@smartstock.com",
        role="admin"
    )
    admin.set_password("admin123")

    cashier = User(
        name="Cashier",
        email="cashier@smartstock.com",
        role="cashier"
    )
    cashier.set_password("cashier123")

    db.session.add_all([admin, cashier])

    # 🏷️ CATEGORIES
    electronics = Category(
        name="Electronics",
        description="Devices and gadgets"
    )

    food = Category(
        name="Food",
        description="Food products"
    )

    db.session.add_all([electronics, food])

    # 📦 PRODUCTS
    p1 = Product(
        name="Laptop",
        sku="ELEC-001",
        description="Gaming laptop",
        price=2500,
        stock_quantity=10,
        category=electronics
    )

    p2 = Product(
        name="Smartphone",
        sku="ELEC-002",
        description="Android phone",
        price=1200,
        stock_quantity=20,
        category=electronics
    )

    p3 = Product(
        name="Rice",
        sku="FOOD-001",
        description="1kg rice pack",
        price=5,
        stock_quantity=100,
        category=food
    )

    db.session.add_all([p1, p2, p3])

    # 👥 CLIENTS
    c1 = Client(
        name="Ali",
        email="ali@test.com",
        phone="12345678",
        address="Tunis"
    )

    c2 = Client(
        name="Sara",
        email="sara@test.com",
        phone="98765432",
        address="Sfax"
    )

    db.session.add_all([c1, c2])

    # 🧾 SALE 1
    sale1 = Sale(
        client=c1,
        user=admin,
        status="completed",
        note="First test sale",
        sale_date=datetime.utcnow()
    )

    db.session.add(sale1)
    db.session.flush()  # باش ناخذ sale ID

    # 🧩 SALE ITEMS
    item1 = SaleItem(
        sale=sale1,
        product=p1,
        quantity=1,
        unit_price=p1.price
    )
    item1.compute_subtotal()

    item2 = SaleItem(
        sale=sale1,
        product=p2,
        quantity=2,
        unit_price=p2.price
    )
    item2.compute_subtotal()

    db.session.add_all([item1, item2])

    # 🔄 update total sale
    sale1.calculate_total()

    # 💾 commit all
    db.session.commit()

    print("✅ Seed data inserted successfully!")