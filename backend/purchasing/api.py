from ninja_extra import api_controller, route
from ninja import Schema, File, UploadedFile
from typing import List, Optional
from decimal import Decimal
from datetime import date
from django.shortcuts import get_object_or_404
from django.db import transaction
from ninja_jwt.authentication import JWTAuth
from kumba_id.auth import KumbaJWTAuth
from .models import PurchaseOrder, PurchaseItem, PurchasePayment
from crm.models import Supplier
from django.conf import settings

# ============ SCHEMAS ============

class PurchaseItemCreateSchema(Schema):
    description: str
    quantity: Decimal
    unit_price: Decimal

class PurchaseItemOutSchema(Schema):
    id: int
    description: str
    quantity: Decimal
    unit_price: Decimal
    amount: Decimal

class PurchaseOrderCreateSchema(Schema):
    vendor_id: int
    vendor_name: str  # For display
    project_name: str
    expected_date: Optional[date] = None
    notes: Optional[str] = None
    document_type: str = 'PO'
    vendor_invoice_number: Optional[str] = None
    items: List[PurchaseItemCreateSchema]

class PurchaseOrderUpdateSchema(Schema):
    vendor_id: int
    project_name: str
    expected_date: Optional[date] = None
    notes: Optional[str] = None
    vendor_invoice_number: Optional[str] = None
    items: List[PurchaseItemCreateSchema]

class PurchaseOrderOutSchema(Schema):
    id: int
    vendor_id: int
    vendor_name: str
    project_name: str
    date: date
    expected_date: Optional[date] = None
    status: str
    notes: Optional[str] = None
    document_type: str
    vendor_invoice_number: Optional[str] = None
    attachment: Optional[str] = None
    total_amount: Decimal
    total_paid: Decimal
    balance_due: Decimal
    has_accounting_entry: bool
    items: List[PurchaseItemOutSchema]
    
    @staticmethod
    def resolve_vendor_name(obj):
        return obj.vendor.name
    
    @staticmethod
    def resolve_vendor_id(obj):
        return obj.vendor.id
    
    @staticmethod
    def resolve_total_paid(obj):
        return obj.get_total_paid()
    
    @staticmethod
    def resolve_balance_due(obj):
        return obj.get_balance_due()
    
    @staticmethod
    def resolve_has_accounting_entry(obj):
        return obj.journal_entry is not None
        
    @staticmethod
    def resolve_attachment(obj):
        if obj.attachment:
            return obj.attachment.url
        return None

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

class ApprovalRequestOutSchema(Schema):
    id: int
    status: str
    current_step_order: Optional[int]
    
    @staticmethod
    def resolve_current_step_order(obj):
        return obj.current_step.order if obj.current_step else None

# ============ API CONTROLLER ============


# ============ API CONTROLLER ============

@api_controller('/purchasing/orders', tags=['Purchasing'], auth=KumbaJWTAuth())
class PurchaseOrderController:
    
    @route.get('', response=List[PurchaseOrderOutSchema])
    def list_purchase_orders(self, request):
        """List all purchase orders"""
        return PurchaseOrder.objects.filter(
            company=request.user.company
        ).select_related('vendor').prefetch_related('items', 'payments').order_by('-created_at')
    
    @route.get('/{po_id}', response=PurchaseOrderOutSchema)
    def get_purchase_order(self, request, po_id: int):
        """Get a specific purchase order"""
        return get_object_or_404(
            PurchaseOrder,
            id=po_id,
            company=request.user.company
        )
    

    @route.put('/{po_id}', response={200: PurchaseOrderOutSchema})
    @transaction.atomic
    def update_purchase_order(self, request, po_id: int, payload: PurchaseOrderUpdateSchema):
        """Update purchase order details and items"""
        po = get_object_or_404(PurchaseOrder, id=po_id, company=request.user.company)
        
        if po.status != PurchaseOrder.Status.DRAFT:
            return 400, {'error': 'Only draft purchase orders can be edited'}
            
        # Update fields
        po.project_name = payload.project_name
        po.expected_date = payload.expected_date
        po.notes = payload.notes or ''
        po.vendor_invoice_number = payload.vendor_invoice_number
        # We don't update vendor typically, but we can if draft
        if payload.vendor_id != po.vendor_id:
             vendor = get_object_or_404(Supplier, id=payload.vendor_id, company=request.user.company)
             po.vendor = vendor
        
        # Replace items (simplest approach)
        po.items.all().delete()
        
        total = Decimal('0')
        for item_data in payload.items:
            PurchaseItem.objects.create(
                purchase_order=po,
                description=item_data.description,
                quantity=item_data.quantity,
                unit_price=item_data.unit_price
            )
            total += item_data.quantity * item_data.unit_price
            
        po.total_amount = total
        po.save()
        
        return 200, po

    @route.post('', response={201: PurchaseOrderOutSchema})
    @transaction.atomic
    def create_purchase_order(self, request, payload: PurchaseOrderCreateSchema):
        """Create a new purchase order"""
        # Get vendor
        vendor = get_object_or_404(Supplier, id=payload.vendor_id, company=request.user.company)
        
        # Create PO
        po = PurchaseOrder.objects.create(
            company=request.user.company,
            vendor=vendor,
            project_name=payload.project_name,
            date=date.today(),
            expected_date=payload.expected_date,
            notes=payload.notes or '',
            document_type=payload.document_type,
            vendor_invoice_number=payload.vendor_invoice_number,
            status=PurchaseOrder.Status.DRAFT
        )
        
        # Add items
        total = Decimal('0')
        for item_data in payload.items:
            PurchaseItem.objects.create(
                purchase_order=po,
                description=item_data.description,
                quantity=item_data.quantity,
                unit_price=item_data.unit_price
            )
            total += item_data.quantity * item_data.unit_price
        
        # Update total
        po.total_amount = total
        po.save()
        
        return 201, po

    @route.delete('/{po_id}', response={204: None})
    def delete_purchase_order(self, request, po_id: int):
        """Delete a purchase order"""
        po = get_object_or_404(PurchaseOrder, id=po_id, company=request.user.company)
        po.delete()
        return 204, None
    
    @route.post('/{po_id}/cancel', response={200: PurchaseOrderOutSchema})
    @transaction.atomic
    def cancel_purchase_order(self, request, po_id: int):
        """Cancel a purchase order"""
        po = get_object_or_404(PurchaseOrder, id=po_id, company=request.user.company)
        po.status = PurchaseOrder.Status.CANCELLED
        po.save()
        return 200, po
    
    @route.post('/{po_id}/receive', response={200: PurchaseOrderOutSchema})
    @transaction.atomic
    def mark_as_received(self, request, po_id: int):
        """
        Mark purchase order as received
        This will automatically create a journal entry (via signal)
        """
        po = get_object_or_404(PurchaseOrder, id=po_id, company=request.user.company)
        
        if po.status == PurchaseOrder.Status.RECEIVED:
            return 400, {'error': 'Purchase order already received'}
        
        po.status = PurchaseOrder.Status.RECEIVED
        po.save()
        
        # Signal should create journal entry automatically
        # But we can create manually if needed
        if not po.journal_entry and po.get_total() > 0:
            try:
                po.create_accounting_entry()
            except Exception as e:
                return 400, {'error': f'Failed to create accounting entry: {str(e)}'}
        
        return 200, po
    
    @route.post('/{po_id}/record-payment', response={201: PaymentOutSchema})
    @transaction.atomic
    def record_payment(self, request, po_id: int, payload: PaymentSchema):
        """
        Record a payment for a purchase order
        
        This will:
        1. Create a PurchasePayment record
        2. Automatically generate a journal entry (via signal)
        3. Update PO status if fully paid
        """
        po = get_object_or_404(PurchaseOrder, id=po_id, company=request.user.company)
        
        # Validate payment amount
        balance_due = po.get_balance_due()
        if payload.amount > balance_due:
            return 400, {'error': f'Payment amount ({payload.amount}) exceeds balance due ({balance_due})'}
        
        # Create payment
        payment = PurchasePayment.objects.create(
            purchase_order=po,
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
    
    @route.post('/{po_id}/submit-approval', response={200: ApprovalRequestOutSchema})
    @transaction.atomic
    def submit_for_approval(self, request, po_id: int):
        """Submit purchase order for approval"""
        po = get_object_or_404(PurchaseOrder, id=po_id, company=request.user.company)
        
        # Verify status
        if po.status != PurchaseOrder.Status.DRAFT:
             return 400, {'error': 'Only draft orders can be submitted'}
             
        from approvals.service import ApprovalService
        
        req = ApprovalService.submit_for_approval(po, request.user)
        
        if not req:
            # Auto-approve if no workflow? Or error?
            # For now, let's treat "no workflow" as "Cannot submit" or "Auto Approve"
            # Let's auto-approve for smoother UX if no rules defined
            po.status = PurchaseOrder.Status.SENT
            po.save()
            return 200, None # Or generic success
            
        return 200, req

    @route.post('/{po_id}/attachment', response={200: PurchaseOrderOutSchema})
    def upload_attachment(self, request, po_id: int, file: UploadedFile = File(...)):
        """Upload attachment (invoice/bill) for a purchase order"""
        po = get_object_or_404(PurchaseOrder, id=po_id, company=request.user.company)
        
        # Save file
        po.attachment.save(file.name, file)
        po.save()
        
        return 200, po

    @route.get('/{po_id}/payments', response=List[PaymentOutSchema])
    def list_payments(self, request, po_id: int):
        """Get all payments for a purchase order"""
        po = get_object_or_404(PurchaseOrder, id=po_id, company=request.user.company)
        return [
            PaymentOutSchema(
                id=p.id,
                amount=p.amount,
                payment_date=p.payment_date,
                payment_method=p.payment_method,
                reference=p.reference,
                journal_entry_id=p.journal_entry.id if p.journal_entry else None
            )
            for p in po.payments.all()
        ]
