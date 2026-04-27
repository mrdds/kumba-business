from ninja_extra import api_controller, route
from ninja import Schema
from ninja_jwt.authentication import JWTAuth
from kumba_id.auth import KumbaJWTAuth
from typing import List
from datetime import date
from django.db import transaction
from django.shortcuts import get_object_or_404
from .models import Debt
from accounting.models import Account, JournalEntry, JournalEntryLine

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

        # Create Accounting Transaction (Journal Entry)
        # On cherche un compte de trésorerie (commence par 5)
        cash_account = Account.objects.filter(company=request.user.company, code__startswith='5').first()
        
        # Compte de tiers (411 Clients, 401 Fournisseurs)
        debt_code = '411' if debt.type == 'CLIENT' else '401'
        debt_account = Account.objects.filter(company=request.user.company, code=debt_code).first()
        
        if cash_account and debt_account:
            amount_dec = Decimal(str(payload.amount))
            entry = JournalEntry.objects.create(
                company=request.user.company,
                date=payload.date,
                reference=f"PAY-DEBT-{debt.id}",
                description=f"Payment for {debt.type} - {debt.counterparty_name}",
                entry_type=JournalEntry.EntryType.PAYMENT
            )
            
            if debt.type == 'CLIENT':
                # Reçu du client: Débit Caisse/Banque, Crédit Client
                JournalEntryLine.objects.create(journal_entry=entry, account=cash_account, debit=amount_dec)
                JournalEntryLine.objects.create(journal_entry=entry, account=debt_account, credit=amount_dec)
            else:
                # Payé au fournisseur: Débit Fournisseur, Crédit Caisse/Banque
                JournalEntryLine.objects.create(journal_entry=entry, account=debt_account, debit=amount_dec)
                JournalEntryLine.objects.create(journal_entry=entry, account=cash_account, credit=amount_dec)
            
            try:
                entry.post()
            except:
                pass # Fallback safety

        return 200, debt
