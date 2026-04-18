from ninja_extra import api_controller, route
from ninja import Schema
from typing import List, Optional
from datetime import date
from django.db import transaction
from django.shortcuts import get_object_or_404
from .models import Quote, QuoteItem, Invoice, InvoiceItem
from ninja_jwt.authentication import JWTAuth
from kumba_id.auth import KumbaJWTAuth

class QuoteItemSchema(Schema):
    description: str
    quantity: int
    unit_price: float

class QuoteCreateSchema(Schema):
    client_name: str
    client_email: str = None
    customer_id: int = None
    date: date
    valid_until: date
    items: List[QuoteItemSchema]

class QuoteItemOutSchema(Schema):
    id: int
    description: str
    quantity: int
    unit_price: float
    amount: float

class QuoteOutSchema(Schema):
    id: int
    client_name: str
    client_email: str = None
    customer_id: int = None
    date: date
    valid_until: date
    status: str
    total_amount: float
    items: List[QuoteItemOutSchema]

    @staticmethod
    def resolve_total_amount(obj):
        return sum(item.amount for item in obj.items.all())

class ApprovalRequestOutSchema(Schema):
    id: int
    status: str
    current_step_order: Optional[int]
    
    @staticmethod
    def resolve_current_step_order(obj):
        return obj.current_step.order if obj.current_step else None

@api_controller('/quotes', tags=['Quotes'], auth=KumbaJWTAuth())
class QuoteController:
    # ... existing methods ...

    @route.post('/{quote_id}/submit-approval', response={200: ApprovalRequestOutSchema})
    @transaction.atomic
    def submit_for_approval(self, request, quote_id: int):
        """Submit quote for approval"""
        quote = get_object_or_404(Quote, id=quote_id, company=request.user.company)
        
        # Verify status
        if quote.status != Quote.Status.DRAFT:
             return 400, {'error': 'Only draft quotes can be submitted'}
             
        from approvals.service import ApprovalService
        
        req = ApprovalService.submit_for_approval(quote, request.user)
        
        if not req:
            # Auto-approve if no workflow
            quote.status = Quote.Status.SENT
            quote.save()
            return 200, None 
            
        return 200, req

    @route.get('', response=List[QuoteOutSchema])
    def list_quotes(self, request):
        return Quote.objects.filter(company=request.user.company).prefetch_related('items').order_by('-created_at')

    @route.get('/{quote_id}', response=QuoteOutSchema)
    def get_quote(self, request, quote_id: int):
        return get_object_or_404(Quote, id=quote_id, company=request.user.company)

    @route.post('', response={201: QuoteOutSchema})
    @transaction.atomic
    def create_quote(self, request, payload: QuoteCreateSchema):
        quote = Quote.objects.create(
            company=request.user.company,
            client_name=payload.client_name,
            client_email=payload.client_email,
            customer_id=payload.customer_id,
            date=payload.date,
            valid_until=payload.valid_until,
            status=Quote.Status.DRAFT
        )

        for item in payload.items:
            QuoteItem.objects.create(
                quote=quote,
                description=item.description,
                quantity=item.quantity,
                unit_price=item.unit_price
            )
        
        return 201, quote

    @route.post('/{quote_id}/convert', response={201: dict})
    @transaction.atomic
    def convert_to_invoice(self, request, quote_id: int):
        quote = get_object_or_404(Quote, id=quote_id, company=request.user.company)
        
        if quote.status == Quote.Status.CONVERTED:
             return 400, {"message": "Quote already converted"}

        # Create Invoice
        invoice = Invoice.objects.create(
            company=quote.company,
            customer=quote.customer,
            client_name=quote.client_name,
            client_email=quote.client_email,
            date=date.today(),
            due_date=date.today(), # Default due date
            status=Invoice.Status.DRAFT
        )

        # Copy Items
        for item in quote.items.all():
            InvoiceItem.objects.create(
                invoice=invoice,
                description=item.description,
                quantity=item.quantity,
                unit_price=item.unit_price
            )
        
        # Update Quote Status
        quote.status = Quote.Status.CONVERTED
        quote.save()

        return 201, {"id": invoice.id, "message": "Quote converted to Invoice"}
