from ninja_extra import api_controller, route
from ninja import Schema
from typing import List, Optional
from decimal import Decimal

from datetime import date
from django.shortcuts import get_object_or_404
from django.db import transaction
from ninja_jwt.authentication import JWTAuth
from kumba_id.auth import KumbaJWTAuth
from .models import Invoice, InvoiceItem, InvoicePayment

class InvoiceItemCreateSchema(Schema):
    description: str
    quantity: int
    unit_price: float

class InvoiceItemOutSchema(Schema):
    id: int
    description: str
    quantity: int
    unit_price: float
    amount: float

class InvoiceCreateSchema(Schema):
    client_name: str
    client_email: Optional[str] = None
    customer_id: Optional[int] = None
    date: date
    due_date: date
    items: List[InvoiceItemCreateSchema]


class PaymentSchema(Schema):
    """Schema for recording a payment"""
    amount: Decimal
    payment_date: date
    payment_method: str  # CASH, BANK, MOBILE, CHECK
    reference: Optional[str] = None
    notes: Optional[str] = None


class PaymentOutSchema(Schema):
    """Schema for payment response"""
    id: int
    amount: Decimal
    payment_date: date
    payment_method: str
    reference: str
    journal_entry_id: Optional[int] = None


class InvoiceOutSchema(Schema):
    id: int
    client_name: str
    client_email: Optional[str] = None
    customer_id: Optional[int] = None
    date: date
    due_date: date
    status: str
    total_amount: float
    total_paid: float
    balance_due: float
    has_accounting_entry: bool
    items: List[InvoiceItemOutSchema]
    approval_id: Optional[int] = None
    approval_status: Optional[str] = None
    rejection_reason: Optional[str] = None
    approval_level: Optional[int] = None
    
    @staticmethod
    def resolve_approval_id(obj):
        from approvals.service import ApprovalService
        info = ApprovalService.get_approval_info(obj)
        return info['id'] if info else None

    @staticmethod
    def resolve_approval_status(obj):
        from approvals.service import ApprovalService
        info = ApprovalService.get_approval_info(obj)
        return info['status'] if info else obj.status

    @staticmethod
    def resolve_rejection_reason(obj):
        from approvals.service import ApprovalService
        info = ApprovalService.get_approval_info(obj)
        return info['rejection_reason'] if info else None

    @staticmethod
    def resolve_approval_level(obj):
        from approvals.service import ApprovalService
        info = ApprovalService.get_approval_info(obj)
        return info['current_step'] if info else 1

    @staticmethod
    def resolve_total_amount(obj):
        return float(obj.get_total())
    
    @staticmethod
    def resolve_total_paid(obj):
        return float(obj.get_total_paid())
    
    @staticmethod
    def resolve_balance_due(obj):
        return float(obj.get_balance_due())
    
    @staticmethod
    def resolve_has_accounting_entry(obj):
        return obj.journal_entry is not None


class ApprovalRequestOutSchema(Schema):
    id: int
    status: str
    current_step_order: Optional[int]
    
    @staticmethod
    def resolve_current_step_order(obj):
        return obj.current_step.order if obj.current_step else None

@api_controller('/invoices', tags=['Invoicing'], auth=KumbaJWTAuth())
class InvoiceController:
    # ... existing methods ...

    @route.post('/{invoice_id}/submit-approval', response={200: ApprovalRequestOutSchema})
    @transaction.atomic
    def submit_for_approval(self, request, invoice_id: int):
        """Submit invoice for approval"""
        invoice = get_object_or_404(Invoice, id=invoice_id, company=request.user.company)
        
        # Verify status
        # Allow Draft or Sent (if reverting to approval flow)? No, only Draft
        if invoice.status != Invoice.Status.DRAFT:
             return 400, {'error': 'Only draft invoices can be submitted'}
             
        from approvals.service import ApprovalService
        
        req = ApprovalService.submit_for_approval(invoice, request.user)
        
        if not req:
            # Auto-approve
            invoice.status = Invoice.Status.SENT
            invoice.save()
            return 200, None 
            
        return 200, req

    @route.get('', response=List[InvoiceOutSchema])
    def list_invoices(self, request):
        return Invoice.objects.filter(company=request.user.company).prefetch_related('items', 'payments').order_by('-created_at')

    @route.get('/{invoice_id}', response=InvoiceOutSchema)
    def get_invoice(self, request, invoice_id: int):
        return get_object_or_404(Invoice, id=invoice_id, company=request.user.company)

    @route.post('', response={201: InvoiceOutSchema})
    @transaction.atomic
    def create_invoice(self, request, payload: InvoiceCreateSchema):
        invoice = Invoice.objects.create(
            company=request.user.company,
            client_name=payload.client_name,
            client_email=payload.client_email,
            customer_id=payload.customer_id,
            date=payload.date,
            due_date=payload.due_date,
            status=Invoice.Status.DRAFT  # Start as DRAFT to allow approval workflow
        )

        for item in payload.items:
            InvoiceItem.objects.create(
                invoice=invoice,
                description=item.description,
                quantity=item.quantity,
                unit_price=item.unit_price
            )
        
        return 201, invoice

    @route.put('/{invoice_id}', response={200: InvoiceOutSchema})
    @transaction.atomic
    def update_invoice(self, request, invoice_id: int, payload: InvoiceCreateSchema):
        """Update an existing invoice (if still DRAFT)"""
        invoice = get_object_or_404(Invoice, id=invoice_id, company=request.user.company)
        
        if invoice.status != Invoice.Status.DRAFT:
            return 400, {'error': 'Only draft invoices can be edited'}
            
        invoice.client_name = payload.client_name
        invoice.client_email = payload.client_email
        invoice.customer_id = payload.customer_id
        invoice.date = payload.date
        invoice.due_date = payload.due_date
        invoice.save()
        
        # Replace items
        invoice.items.all().delete()
        for item in payload.items:
            InvoiceItem.objects.create(
                invoice=invoice,
                description=item.description,
                quantity=item.quantity,
                unit_price=item.unit_price
            )
            
        return 200, invoice
    
    @route.post('/{invoice_id}/record-payment', response={201: PaymentOutSchema})
    @transaction.atomic
    def record_payment(self, request, invoice_id: int, payload: PaymentSchema):
        """
        Record a payment for an invoice
        
        This will:
        1. Create an InvoicePayment record
        2. Automatically generate a journal entry (via signal)
        3. Update invoice status if fully paid
        """
        invoice = get_object_or_404(Invoice, id=invoice_id, company=request.user.company)
        
        # Validate payment amount
        balance_due = invoice.get_balance_due()
        if payload.amount > balance_due:
            return 400, {'error': f'Payment amount ({payload.amount}) exceeds balance due ({balance_due})'}
        
        # Create payment
        payment = InvoicePayment.objects.create(
            invoice=invoice,
            amount=payload.amount,
            payment_date=payload.payment_date,
            payment_method=payload.payment_method,
            reference=payload.reference or '',
            notes=payload.notes or ''
        )
        
        # Signal will automatically create journal entry
        
        return 201, PaymentOutSchema(
            id=payment.id,
            amount=payment.amount,
            payment_date=payment.payment_date,
            payment_method=payment.payment_method,
            reference=payment.reference,
            journal_entry_id=payment.journal_entry.id if payment.journal_entry else None
        )
    
    @route.get('/{invoice_id}/payments', response=List[PaymentOutSchema])
    def list_payments(self, request, invoice_id: int):
        """Get all payments for an invoice"""
        invoice = get_object_or_404(Invoice, id=invoice_id, company=request.user.company)
        return [
            PaymentOutSchema(
                id=p.id,
                amount=p.amount,
                payment_date=p.payment_date,
                payment_method=p.payment_method,
                reference=p.reference,
                journal_entry_id=p.journal_entry.id if p.journal_entry else None
            )
            for p in invoice.payments.all()
        ]

    @route.post('/{invoice_id}/send-email', response={200: dict})
    def send_email(self, request, invoice_id: int):
        invoice = get_object_or_404(Invoice, id=invoice_id, company=request.user.company)
        
        if not invoice.client_email:
            return 400, {'message': 'Client has no email address'}
        
        # Calculate total
        total_amount = invoice.get_total()
        currency = invoice.company.currency
        
        # In a real app, use an HTML template here
        subject = f"Invoice #{invoice.id} from {request.user.company.name}"
        message = f"""
        Dear {invoice.client_name},
        
        Please find attached invoice #{invoice.id} for {currency} {total_amount}.
        
        Due Date: {invoice.due_date}
        
        Thank you for your business.
        """
        
        from django.core.mail import send_mail
        send_mail(
            subject,
            message,
            None,  # Use DEFAULT_FROM_EMAIL
            [invoice.client_email],
            fail_silently=False,
        )
        
        return 200, {'message': 'Email sent successfully'}

    class RecurringInvoiceSchema(Schema):
        frequency: str  # WEEKLY, MONTHLY, YEARLY
        start_date: date

    @route.post('/{invoice_id}/recurring', response={201: dict})
    def create_recurring(self, request, invoice_id: int, payload: RecurringInvoiceSchema):
        from .models import RecurringInvoice
        
        invoice = get_object_or_404(Invoice, id=invoice_id, company=request.user.company)
        
        recurring = RecurringInvoice.objects.create(
            company=request.user.company,
            base_invoice=invoice,
            frequency=payload.frequency,
            start_date=payload.start_date,
            next_run_date=payload.start_date,
            status=RecurringInvoice.Status.ACTIVE
        )
        
        return 201, {'id': recurring.id, 'message': 'Recurring schedule created'}
