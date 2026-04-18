from ninja_extra import api_controller, route
from ninja import Schema
from ninja_jwt.authentication import JWTAuth
from kumba_id.auth import KumbaJWTAuth
from typing import List
from datetime import date
from django.db import transaction
from django.shortcuts import get_object_or_404
from .models import Debt
from accounting.models import Transaction as AccTransaction

class DebtCreateSchema(Schema):
    type: str # 'CLIENT' or 'SUPPLIER' or 'INTERNAL'
    counterparty_name: str
    customer_id: int = None
    supplier_id: int = None
    amount: float
    due_date: date
    description: str = None

class DebtPaymentSchema(Schema):
    amount: float
    date: date

class DebtOutSchema(Schema):
    id: int
    type: str
    counterparty_name: str
    amount: float
    paid_amount: float
    due_date: date
    status: str
    description: str = None

@api_controller('/debts', tags=['Debts'], auth=KumbaJWTAuth())
class DebtController:
    @route.get('', response=List[DebtOutSchema])
    def list_debts(self, request, type: str = None):
        qs = Debt.objects.filter(company=request.user.company)
        if type:
            qs = qs.filter(type=type)
        return qs.order_by('due_date')

    @route.post('', response={201: DebtOutSchema})
    def create_debt(self, request, payload: DebtCreateSchema):
        debt = Debt.objects.create(
            company=request.user.company,
            type=payload.type,
            counterparty_name=payload.counterparty_name,
            customer_id=payload.customer_id,
            supplier_id=payload.supplier_id,
            amount=payload.amount,
            due_date=payload.due_date,
            description=payload.description
        )
        return 201, debt

    @route.post('/{debt_id}/pay', response={200: DebtOutSchema})
    @transaction.atomic
    def pay_debt(self, request, debt_id: int, payload: DebtPaymentSchema):
        debt = get_object_or_404(Debt, id=debt_id, company=request.user.company)
        
        # Update Debt
        from decimal import Decimal
        debt.paid_amount += Decimal(str(payload.amount)) # Ensure Decimal arithmetic
        debt.save() # Status updates in save() method

        # Create Accounting Transaction
        # If paying a Supplier Debt -> Expense (Money Out)
        # If receiving payment for Client Debt -> Income (Money In)
        
        tx_type = 'OUT' if debt.type == 'SUPPLIER' else 'IN'
        # INTERNAL: Could be either, let's assume if we OWE internal debt (like to a partner), paying it is OUT.
        if debt.type == 'INTERNAL':
             tx_type = 'OUT'

        AccTransaction.objects.create(
            company=request.user.company,
            amount=payload.amount,
            type=tx_type,
            category='Debt Payment',
            description=f"Payment for {debt.type} - {debt.counterparty_name}",
            date=payload.date
        )

        return 200, debt
