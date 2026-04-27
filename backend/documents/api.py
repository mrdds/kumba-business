from ninja_extra import api_controller, route
from ninja import Schema, File, Form
from ninja.files import UploadedFile
from typing import List, Optional
from django.shortcuts import get_object_or_404
from .models import Quote, Invoice, PurchaseOrder, DocumentItem, DocumentTemplate, CompanyBranding, CreditNote, FileDocument
from .services import PDFService
from datetime import date
from django.http import HttpResponse, FileResponse
from kumba_id.auth import KumbaJWTAuth

# --- Schemas ---

class DocumentItemSchema(Schema):
    description: str
    quantity: float
    unit_price: float
    tax_rate: float = 0.0

class QuoteCreateSchema(Schema):
    client_id: int
    date: date
    valid_until: date
    currency: str = 'XOF'
    items: List[DocumentItemSchema]
    notes: Optional[str] = None

class QuoteOutSchema(Schema):
    id: int
    number: str
    client_name: str
    date: date
    total_amount: float
    status: str
    
    @staticmethod
    def resolve_client_name(obj):
        return obj.client.name

class FileDocumentOutSchema(Schema):
    id: int
    name: str
    title: str
    category: str
    doc_type: str
    size: str
    extension: str
    created_at: date
    file_url: str = None
    
    @staticmethod
    def resolve_file_url(obj):
        return obj.file.url if obj.file else None

class PreviewSchema(Schema):
    template_id: Optional[int] = None
    document_type: str # 'QUOTE', 'INVOICE', 'PO'
    # Mock data for preview
    client_name: str = "Client Name"
    items: List[DocumentItemSchema]

# --- Controller ---

@api_controller('/documents', tags=['Documents'], auth=KumbaJWTAuth())
class DocumentsController:
    
    # --- Files Management ---
    
    @route.get('/files', response=List[FileDocumentOutSchema])
    def list_files(self, request, category: Optional[str] = None):
        qs = FileDocument.objects.filter(company=request.user.company)
        if category:
            qs = qs.filter(category=category)
        return qs

    @route.post('/files/upload', response=FileDocumentOutSchema)
    def upload_file(self, 
                    request, 
                    file: UploadedFile = File(...), 
                    category: str = Form('General'),
                    title: Optional[str] = Form(None),
                    doc_type: Optional[str] = Form(None)):
        doc = FileDocument.objects.create(
            company=request.user.company,
            name=file.name,
            title=title or file.name,
            file=file,
            category=category,
            doc_type=doc_type or '',
            created_by=request.user
        )
        return doc

    @route.delete('/files/{id}', response={204: None})
    def delete_file(self, request, id: int):
        doc = get_object_or_404(FileDocument, id=id, company=request.user.company)
        doc.file.delete()
        doc.delete()
        return 204, None

    @route.get('/files/{id}/download')
    def download_file(self, request, id: int):
        doc = get_object_or_404(FileDocument, id=id, company=request.user.company)
        return FileResponse(doc.file.open(), as_attachment=True, filename=doc.name)

    # --- Quotes ---
    @route.get('/quotes', response=List[QuoteOutSchema])
    def list_quotes(self, request):
        return Quote.objects.filter(company=request.user.company)

    @route.post('/quotes', response=QuoteOutSchema)
    def create_quote(self, request, payload: QuoteCreateSchema):
        # 1. Generate Number (Simple auto-increment logic for MVP)
        last_quote = Quote.objects.filter(company=request.user.company).order_by('id').last()
        seq = (last_quote.id + 1) if last_quote else 1
        number = f"Q-{date.today().year}-{seq:04d}"
        
        # 2. Create Quote
        quote = Quote.objects.create(
            company=request.user.company,
            client_id=payload.client_id,
            number=number,
            date=payload.date,
            valid_until=payload.valid_until,
            currency=payload.currency,
            notes=payload.notes,
            created_by=request.user
        )
        
        # 3. Create Items
        total_sub = 0
        total_tax = 0
        
        for item in payload.items:
            # Create Generic Item
            doc_item = DocumentItem.objects.create(
                document=quote,
                description=item.description,
                quantity=item.quantity,
                unit_price=item.unit_price,
                tax_rate=item.tax_rate
            )
            total_sub += (doc_item.quantity * doc_item.unit_price)
            # Simple tax calc
            total_tax += (doc_item.total * (doc_item.tax_rate / 100))

        # 4. Update Totals
        quote.subtotal = total_sub
        quote.tax_amount = total_tax
        quote.total_amount = total_sub + total_tax
        quote.save()

        return quote

    @route.get('/quotes/{id}/pdf')
    def download_quote_pdf(self, request, id: int):
        quote = get_object_or_404(Quote, id=id, company=request.user.company)
        
        # Get Branding & Template
        branding, _ = CompanyBranding.objects.get_or_create(company=request.user.company)
        template_src = 'documents/pdf/base.html' # Default
        
        # Prepare Context
        items = DocumentItem.objects.filter(object_id=quote.id, content_type__model='quote')
        
        context = {
            'document': quote,
            'doc_type': 'DEVIS / QUOTE',
            'items': items,
            'branding': branding,
        }
        
        return PDFService.render_to_response(template_src, context, filename=f"{quote.number}.pdf")

    # --- Config ---
    @route.post('/branding/logo')
    def upload_logo(self, request, file: UploadedFile = File(...)):
        branding, _ = CompanyBranding.objects.get_or_create(company=request.user.company)
        branding.logo.save(file.name, file)
        return {"success": True, "url": branding.logo.url}
