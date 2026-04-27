import os
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.units import mm

def generate_stock_document(output_path, data):
    c = canvas.Canvas(output_path, pagesize=A4)
    width, height = A4

    # Type-specific Logic
    doc_type = data.get('type', 'MOUVEMENT') # IN, OUT, ADJUST
    title = data.get('title', f"BON DE {doc_type}")
    
    # Design Philosophy Constants
    MARGIN = 20 * mm
    SLATE = colors.HexColor("#0F172A")
    INDIGO = colors.HexColor("#4F46E5")
    EMERALD = colors.HexColor("#10B981")
    ROSE = colors.HexColor("#F43F5E")
    SLATE_LIGHT = colors.HexColor("#F8FAFC")
    BORDER = colors.HexColor("#E2E8F0")
    
    # Accent Color based on type
    ACCENT = INDIGO
    if doc_type == 'IN': ACCENT = EMERALD
    elif doc_type == 'OUT': ACCENT = ROSE

    # Background
    c.setFillColor(colors.white)
    c.rect(0, 0, width, height, fill=1)

    # Header Section
    c.setFillColor(SLATE)
    c.setFont("Helvetica-Bold", 32)
    c.drawString(MARGIN, height - MARGIN - 10*mm, title.upper())
    
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(ACCENT)
    c.drawString(MARGIN, height - MARGIN - 16*mm, "WEBKING HOLDINGS | LOGISTIQUE & FLUX")

    # Horizontal Line
    c.setStrokeColor(SLATE)
    c.setLineWidth(1.5)
    c.line(MARGIN, height - MARGIN - 20*mm, width - MARGIN, height - MARGIN - 20*mm)

    # Reference & Date
    c.setFillColor(colors.slategray)
    c.setFont("Helvetica", 7)
    c.drawString(MARGIN, height - MARGIN - 25*mm, "RÉFÉRENCE")
    c.drawString(width - MARGIN - 40*mm, height - MARGIN - 25*mm, "DATE D'ÉMISSION")
    
    c.setFillColor(SLATE)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(MARGIN, height - MARGIN - 30*mm, data['reference_id'])
    c.drawRightString(width - MARGIN, height - MARGIN - 30*mm, data['date'])

    # Grid - Main Info
    col1 = MARGIN
    col2 = width / 2
    row_start = height - MARGIN - 45*mm
    
    def draw_info_block(x, y, label, value, color=SLATE):
        c.setFillColor(colors.slategray)
        c.setFont("Helvetica-Bold", 7)
        c.drawString(x, y, label.upper())
        c.setFillColor(color)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(x, y - 5*mm, str(value))

    draw_info_block(col1, row_start, "Responsable Logistique", data['performed_by'])
    
    # Resource label depends on type
    res_label = "Destinataire" if doc_type == 'OUT' else "Provenance" if doc_type == 'IN' else "Responsable Associé"
    draw_info_block(col2, row_start, res_label, data.get('resource_name', 'N/A'))
    
    draw_info_block(col1, row_start - 20*mm, "Équipe Terrain", data['team_name'], EMERALD if doc_type != 'OUT' else ROSE)
    draw_info_block(col2, row_start - 20*mm, "Team Leader (TL)", data['team_leader'], INDIGO)

    # Project Block
    c.setFillColor(SLATE_LIGHT)
    c.setStrokeColor(BORDER)
    c.roundRect(MARGIN, row_start - 55*mm, width - 2*MARGIN, 20*mm, 4, fill=1, stroke=1)
    
    c.setFillColor(colors.slategray)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(MARGIN + 5*mm, row_start - 40*mm, "PROJET / CHANTIER / MOTIF")
    c.setFillColor(SLATE)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(MARGIN + 5*mm, row_start - 48*mm, data['project_name'])

    # Table Header
    table_top = row_start - 70*mm
    c.setFillColor(SLATE)
    c.rect(MARGIN, table_top, width - 2*MARGIN, 8*mm, fill=1)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(MARGIN + 5*mm, table_top + 2.5*mm, "DÉSIGNATION DU MATÉRIEL")
    c.drawRightString(width - MARGIN - 5*mm, table_top + 2.5*mm, "QUANTITÉ")

    # Table Content
    curr_y = table_top - 12*mm
    c.setFillColor(SLATE)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(MARGIN + 5*mm, curr_y, data['product_name'])
    c.setFont("Helvetica", 8)
    c.setFillColor(colors.slategray)
    c.drawString(MARGIN + 5*mm, curr_y - 5*mm, f"Catégorie: {data['category']}")
    
    c.setFillColor(ACCENT)
    c.setFont("Helvetica-Bold", 24)
    prefix = "+" if doc_type == 'IN' else "-" if doc_type == 'OUT' else ""
    c.drawRightString(width - MARGIN - 5*mm, curr_y - 3*mm, f"{prefix}{data['quantity']} {data['unit']}")

    # Conditions & Notes
    note_y = curr_y - 25*mm
    c.setStrokeColor(BORDER)
    c.line(MARGIN, note_y + 5*mm, width - MARGIN, note_y + 5*mm)
    
    c.setFillColor(colors.slategray)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(MARGIN, note_y, "ÉCOSYSTÈME & CONDITIONS")
    c.setFillColor(SLATE)
    c.setFont("Helvetica", 9)
    c.drawString(MARGIN, note_y - 6*mm, f"État du matériel: {data['condition']}")
    c.drawString(MARGIN, note_y - 11*mm, f"Notes: {data['notes'] or 'Aucune observation particulière.'}")

    # Signatures
    sig_y = 50*mm
    c.setStrokeColor(BORDER)
    c.line(MARGIN, sig_y + 15*mm, width - MARGIN, sig_y + 15*mm)
    
    def draw_sig(x, label):
        c.setFillColor(colors.slategray)
        c.setFont("Helvetica-Bold", 6)
        c.drawString(x, sig_y, label.upper())
        c.setStrokeColor(colors.lightgrey)
        c.setDash(1, 2)
        c.line(x, sig_y - 20*mm, x + 50*mm, sig_y - 20*mm)
        c.setDash()

    draw_sig(MARGIN, "Visa Logistique")
    draw_sig(width/2 - 25*mm, "Visa Team Leader")
    draw_sig(width - MARGIN - 50*mm, "Visa Tiers")

    # Footer
    c.setFillColor(colors.lightgrey)
    c.setFont("Helvetica", 6)
    c.drawCentredString(width/2, 10*mm, "Ce document est un artefact généré par le système OurSpace ERP - Kumba Business. Propriété exclusive de WEBKING HOLDINGS.")

    c.save()

if __name__ == "__main__":
    sample_movement = {
        'type': 'ADJUST',
        'title': 'BON DE MOUVEMENT',
        'reference_id': 'BM-2024-04-26-042',
        'date': '26 Avril 2024, 17:40',
        'performed_by': 'Sanogo Hamed',
        'resource_name': 'Inventaire Central',
        'team_name': 'LOGISTIQUE SIÈGE',
        'team_leader': 'Yao Konan',
        'project_name': 'AJUSTEMENT ANNUEL DE STOCK - INVENTAIRE PHYSIQUE',
        'product_name': 'CONNECTEUR RJ45 CAT6',
        'category': 'Réseau / Passif',
        'quantity': '15',
        'unit': 'Unités',
        'condition': 'CONFORME / STOCK VÉRIFIÉ',
        'notes': 'Correction après inventaire tournant du deuxième trimestre.'
    }
    
    os.makedirs('artifacts', exist_ok=True)
    generate_stock_document('/Users/mr.dds/.gemini/antigravity/brain/3c0c4e51-bd96-49b8-9da1-82eb12f02f4e/bon_de_mouvement_premium.pdf', sample_movement)
    print("Premium Bon de Mouvement generated.")
