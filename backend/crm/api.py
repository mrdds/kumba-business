from ninja_extra import api_controller, route, ControllerBase
from ninja_jwt.authentication import JWTAuth
from kumba_id.auth import KumbaJWTAuth
from ninja import Schema
from typing import List, Optional
from .models import Customer, Supplier

class CustomerSchema(Schema):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    tax_id: Optional[str] = None

class CustomerOutSchema(CustomerSchema):
    id: int

class SupplierSchema(Schema):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    tax_id: Optional[str] = None

class SupplierOutSchema(SupplierSchema):
    id: int

from django.shortcuts import get_object_or_404

# ... (Previous imports kept)

@api_controller('/crm', tags=['CRM'], auth=KumbaJWTAuth())
class CRMController(ControllerBase):
    
    # --- Customers ---
    @route.get('/customers', response=List[CustomerOutSchema])
    def list_customers(self, request):
        return Customer.objects.filter(company=request.user.company)

    @route.post('/customers', response=CustomerOutSchema)
    def create_customer(self, request, payload: CustomerSchema):
        return Customer.objects.create(
            company=request.user.company,
            **payload.dict()
        )

    @route.get('/customers/{customer_id}', response=CustomerOutSchema)
    def get_customer(self, request, customer_id: int):
        return get_object_or_404(Customer, id=customer_id, company=request.user.company)

    @route.put('/customers/{customer_id}', response=CustomerOutSchema)
    def update_customer(self, request, customer_id: int, payload: CustomerSchema):
        # Allow OWNER and MANAGER to update
        if request.user.role not in ['OWNER', 'MANAGER']:
            return 403, {"message": "Permission denied"}

        customer = get_object_or_404(Customer, id=customer_id, company=request.user.company)
        for attr, value in payload.dict().items():
            setattr(customer, attr, value)
        customer.save()
        return customer

    @route.delete('/customers/{customer_id}')
    def delete_customer(self, request, customer_id: int):
        # Only OWNER can delete
        if request.user.role != 'OWNER':
            return 403, {"message": "Only Owner can delete clients"}

        customer = get_object_or_404(Customer, id=customer_id, company=request.user.company)
        customer.delete()
        return 204, None

    # --- Suppliers ---
    @route.get('/suppliers', response=List[SupplierOutSchema])
    def list_suppliers(self, request):
        return Supplier.objects.filter(company=request.user.company)

    @route.post('/suppliers', response=SupplierOutSchema)
    def create_supplier(self, request, payload: SupplierSchema):
        return Supplier.objects.create(
            company=request.user.company,
            **payload.dict()
        )
    @route.get('/suppliers/{supplier_id}', response=SupplierOutSchema)
    def get_supplier(self, request, supplier_id: int):
        return get_object_or_404(Supplier, id=supplier_id, company=request.user.company)

    @route.put('/suppliers/{supplier_id}', response=SupplierOutSchema)
    def update_supplier(self, request, supplier_id: int, payload: SupplierSchema):
        supplier = get_object_or_404(Supplier, id=supplier_id, company=request.user.company)
        for attr, value in payload.dict().items():
            setattr(supplier, attr, value)
        supplier.save()
        return supplier

    @route.delete('/suppliers/{supplier_id}')
    def delete_supplier(self, request, supplier_id: int):
        supplier = get_object_or_404(Supplier, id=supplier_id, company=request.user.company)
        supplier.delete()
        return 204, None

    @route.get('/suppliers/{supplier_id}/financials')
    def get_supplier_financials(self, request, supplier_id: int):
        """Get financial summary for a supplier"""
        supplier = get_object_or_404(Supplier, id=supplier_id, company=request.user.company)
        
        # Calculate totals
        orders = supplier.purchase_orders.all() # Includes Bills and POs
        total_billed = sum(order.get_total() for order in orders if order.status != 'CANCELLED')
        total_paid = sum(order.get_total_paid() for order in orders if order.status != 'CANCELLED')
        balance_due = total_billed - total_paid
        
        return {
            "total_billed": total_billed,
            "total_paid": total_paid,
            "balance_due": balance_due,
            "invoice_count": orders.count()
        }
