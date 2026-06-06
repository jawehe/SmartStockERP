# backend/routes/export_routes.py
from flask import Blueprint, send_file, jsonify
from flask_jwt_extended import jwt_required
import pandas as pd
from io import BytesIO
from datetime import datetime
from models import Product, Sale, Client, Purchase
from extensions import db

export_bp = Blueprint("export", __name__)


# ═════════════════════════════════════════════════════════════
# EXPORT PRODUCTS TO EXCEL
# ═════════════════════════════════════════════════════════════
@export_bp.route("/products", methods=["GET"])
@jwt_required()
def export_products():
    products = Product.query.all()
    
    data = []
    for p in products:
        data.append({
            "ID": p.id,
            "Name": p.name,
            "SKU": p.sku,
            "Price": float(p.price),
            "Stock Quantity": p.stock_quantity,
            "Low Stock Threshold": p.low_stock_threshold,
            "Status": "Low Stock" if p.stock_quantity <= p.low_stock_threshold else "OK",
            "Created At": p.created_at.strftime("%Y-%m-%d %H:%M") if p.created_at else ""
        })
    
    df = pd.DataFrame(data)
    
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name="Products", index=False)
        
        # Ajuster les largeurs des colonnes
        worksheet = writer.sheets["Products"]
        for column in worksheet.columns:
            max_length = 0
            column_letter = column[0].column_letter
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            adjusted_width = min(max_length + 2, 50)
            worksheet.column_dimensions[column_letter].width = adjusted_width
    
    output.seek(0)
    
    return send_file(
        output,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        as_attachment=True,
        download_name=f"products_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    )


# ═════════════════════════════════════════════════════════════
# EXPORT SALES TO EXCEL
# ═════════════════════════════════════════════════════════════
@export_bp.route("/sales", methods=["GET"])
@jwt_required()
def export_sales():
    sales = Sale.query.order_by(Sale.sale_date.desc()).all()
    
    data = []
    for s in sales:
        data.append({
            "ID": s.id,
            "Invoice #": f"INV-{str(s.id).zfill(6)}",
            "Client": s.client.name if s.client else "Walk-in",
            "Date": s.sale_date.strftime("%Y-%m-%d %H:%M") if s.sale_date else "",
            "Total Amount": float(s.total_amount),
            "Status": s.status,
            "Items Count": len(s.sale_items)
        })
    
    df = pd.DataFrame(data)
    
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name="Sales", index=False)
        
        worksheet = writer.sheets["Sales"]
        for column in worksheet.columns:
            max_length = 0
            column_letter = column[0].column_letter
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            adjusted_width = min(max_length + 2, 50)
            worksheet.column_dimensions[column_letter].width = adjusted_width
    
    output.seek(0)
    
    return send_file(
        output,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        as_attachment=True,
        download_name=f"sales_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    )


# ═════════════════════════════════════════════════════════════
# EXPORT CLIENTS TO EXCEL
# ═════════════════════════════════════════════════════════════
@export_bp.route("/clients", methods=["GET"])
@jwt_required()
def export_clients():
    clients = Client.query.all()
    
    data = []
    for c in clients:
        data.append({
            "ID": c.id,
            "Name": c.name,
            "Email": c.email or "",
            "Phone": c.phone or "",
            "Address": c.address or "",
            "Total Orders": c.sale_count if hasattr(c, 'sale_count') else len(c.sales) if c.sales else 0,
            "Total Spent": float(sum(s.total_amount for s in c.sales)) if c.sales else 0,
            "Created At": c.created_at.strftime("%Y-%m-%d %H:%M") if c.created_at else ""
        })
    
    df = pd.DataFrame(data)
    
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name="Clients", index=False)
        
        worksheet = writer.sheets["Clients"]
        for column in worksheet.columns:
            max_length = 0
            column_letter = column[0].column_letter
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            adjusted_width = min(max_length + 2, 50)
            worksheet.column_dimensions[column_letter].width = adjusted_width
    
    output.seek(0)
    
    return send_file(
        output,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        as_attachment=True,
        download_name=f"clients_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    )


# ═════════════════════════════════════════════════════════════
# EXPORT PURCHASES TO EXCEL
# ═════════════════════════════════════════════════════════════
@export_bp.route("/purchases", methods=["GET"])
@jwt_required()
def export_purchases():
    purchases = Purchase.query.order_by(Purchase.created_at.desc()).all()
    
    data = []
    for p in purchases:
        data.append({
            "ID": p.id,
            "PO #": f"PO-{str(p.id).zfill(6)}",
            "Supplier": p.supplier.name if p.supplier else "N/A",
            "Date": p.created_at.strftime("%Y-%m-%d %H:%M") if p.created_at else "",
            "Total Amount": float(p.total_amount),
            "Status": p.status,
            "Items Count": len(p.items)
        })
    
    df = pd.DataFrame(data)
    
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name="Purchases", index=False)
        
        worksheet = writer.sheets["Purchases"]
        for column in worksheet.columns:
            max_length = 0
            column_letter = column[0].column_letter
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            adjusted_width = min(max_length + 2, 50)
            worksheet.column_dimensions[column_letter].width = adjusted_width
    
    output.seek(0)
    
    return send_file(
        output,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        as_attachment=True,
        download_name=f"purchases_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    )