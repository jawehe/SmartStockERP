# backend/services/invoice_service.py
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from io import BytesIO
from datetime import datetime

class InvoiceGenerator:
    def __init__(self, sale_data):
        self.sale = sale_data
        self.buffer = BytesIO()
        
    def generate(self):
        # Créer le document PDF
        doc = SimpleDocTemplate(
            self.buffer,
            pagesize=A4,
            topMargin=20*mm,
            bottomMargin=20*mm,
            leftMargin=15*mm,
            rightMargin=15*mm
        )
        
        styles = getSampleStyleSheet()
        story = []
        
        # Style personnalisé
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1e4db7'),
            spaceAfter=30
        )
        
        # En-tête
        story.append(Paragraph("SmartStock ERP", title_style))
        story.append(Paragraph("Enterprise Suite", styles['Normal']))
        story.append(Spacer(1, 10*mm))
        
        # Informations de la facture
        invoice_info = [
            ["N° FACTURE:", f"#INV-{str(self.sale['id']).zfill(6)}"],
            ["DATE:", datetime.now().strftime("%d/%m/%Y %H:%M")],
            ["STATUT:", self.sale.get('status', 'COMPLETED').upper()]
        ]
        
        info_table = Table(invoice_info, colWidths=[60*mm, 80*mm])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#6b7a99')),
            ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#1a2e4a')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(info_table)
        story.append(Spacer(1, 10*mm))
        
        # Client
        client = self.sale.get('client', {})
        if client:
            client_data = [
                ["CLIENT", client.get('name', 'N/A')],
                ["EMAIL", client.get('email', 'N/A')],
                ["TÉLÉPHONE", client.get('phone', 'N/A')],
            ]
        else:
            client_data = [
                ["CLIENT", "Walk-in Client"],
                ["EMAIL", "-"],
                ["TÉLÉPHONE", "-"],
            ]
        
        client_table = Table(client_data, colWidths=[60*mm, 80*mm])
        client_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#6b7a99')),
            ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#1a2e4a')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(client_table)
        story.append(Spacer(1, 15*mm))
        
        # Tableau des produits
        story.append(Paragraph("DÉTAIL DE LA COMMANDE", styles['Heading4']))
        story.append(Spacer(1, 5*mm))
        
        # En-têtes du tableau
        products_data = [["PRODUIT", "QUANTITÉ", "PRIX UNIT.", "TOTAL"]]
        
        for item in self.sale.get('items', []):
            products_data.append([
                item.get('product_name', 'N/A'),
                str(item.get('quantity', 0)),
                f"{float(item.get('unit_price', 0)):.2f} €",
                f"{float(item.get('subtotal', 0)):.2f} €"
            ])
        
        # Total
        products_data.append(["", "", "TOTAL", f"{float(self.sale.get('total_amount', 0)):.2f} €"])
        
        products_table = Table(products_data, colWidths=[70*mm, 40*mm, 50*mm, 50*mm])
        products_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -2), 9),
            ('FONTSIZE', (0, -1), (-1, -1), 11),
            ('FONTWEIGHT', (0, 0), (-1, 0), 'BOLD'),
            ('FONTWEIGHT', (0, -1), (-1, -1), 'BOLD'),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f0f4ff')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1a2e4a')),
            ('TEXTCOLOR', (0, -1), (-1, -1), colors.HexColor('#1e4db7')),
            ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (-1, 0), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -2), 0.5, colors.HexColor('#e4e9f0')),
            ('BOX', (0, -1), (-1, -1), 1, colors.HexColor('#1e4db7')),
        ]))
        story.append(products_table)
        story.append(Spacer(1, 15*mm))
        
        # Pied de page
        footer_text = """
        <font color="#6b7a99" size="8">
        SmartStock ERP - 123 Avenue de la République, Tunis<br/>
        Tél: +216 71 123 456 - Email: contact@smartstock.tn<br/>
        Merci de votre confiance !
        </font>
        """
        story.append(Paragraph(footer_text, styles['Normal']))
        
        # Générer le PDF
        doc.build(story)
        self.buffer.seek(0)
        return self.buffer


def generate_invoice(sale_data):
    """Génère une facture PDF pour une vente"""
    generator = InvoiceGenerator(sale_data)
    return generator.generate()