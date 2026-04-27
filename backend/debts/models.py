from django.db import models
from django.db import transaction as db_transaction
from companies.models import Company
from decimal import Decimal

from core.security.registry import secure_resource

@secure_resource('debt', 'Dettes & Créances', actions=['view', 'create', 'edit', 'delete', 'settle'])
class Debt(models.Model):
    class Type(models.TextChoices):
        CLIENT = 'CLIENT', 'Client Debt (Money we lent)'
        SUPPLIER = 'SUPPLIER', 'Supplier Debt (Money we borrowed)'
        INTERNAL = 'INTERNAL', 'Internal Debt'

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        PARTIAL = 'PARTIAL', 'Partially Paid'
        PAID = 'PAID', 'Paid'

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='debts')
    type = models.CharField(max_length=20, choices=Type.choices, default=Type.CLIENT)
    counterparty_name = models.CharField(max_length=255)
    customer = models.ForeignKey('crm.Customer', null=True, blank=True, on_delete=models.SET_NULL, related_name='debts')
    supplier = models.ForeignKey('crm.Supplier', null=True, blank=True, on_delete=models.SET_NULL, related_name='debts')
    
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    due_date = models.DateField()
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    
    # Accounting integration
    journal_entry = models.ForeignKey(
        'accounting.JournalEntry',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='debt_entries',
        help_text="Journal entry when debt is created"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if self.paid_amount >= self.amount:
            self.status = self.Status.PAID
        elif self.paid_amount > 0:
            self.status = self.Status.PARTIAL
        else:
            self.status = self.Status.PENDING
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.type} - {self.counterparty_name} ({self.amount})"
    
    @db_transaction.atomic
    def create_accounting_entry(self):
        """
        Create journal entry for debt
        
        If CLIENT debt (we lent money):
          DR: Loan Receivable (other account)
          CR: Cash
        
        If SUPPLIER debt (we borrowed money):
          DR: Cash  
          CR: Loan Payable (other account)
        
        Note: For now we'll use simplified accounts
        """
        from accounting.models import JournalEntry, JournalEntryLine, Account
        
        if self.journal_entry:
            return self.journal_entry
        
        # Get accounts based on debt type
        try:
            cash_account = Account.objects.get(company=self.company, code='53', is_active=True)  # Caisse
        except Account.DoesNotExist:
            raise ValueError("Cash account (53) not found")
        
        # Create journal entry
        entry = JournalEntry.objects.create(
            company=self.company,
            date=self.created_at.date(),
            reference=f"DEBT-{self.id}",
            description=f"{self.get_type_display()} - {self.counterparty_name}: {self.description or 'Debt'}",
            entry_type=JournalEntry.EntryType.MANUAL,
            source_model='debts.Debt',
            source_id=self.id
        )
        
        # Note: In a complete system, we'd use specific Loan Receivable/Payable accounts
        # For now, this creates a record but may need refinement
        
        if self.type == Debt.Type.CLIENT:
            # We lent money - reduce cash
            JournalEntryLine.objects.create(
                journal_entry=entry,
                account=cash_account,
                debit=Decimal('0'),
                credit=self.amount,
                description=f"Loan to {self.counterparty_name}"
            )
        else:
            # We borrowed - increase cash
            JournalEntryLine.objects.create(
                journal_entry=entry,
                account=cash_account,
                debit=self.amount,
                credit=Decimal('0'),
                description=f"Loan from {self.counterparty_name}"
            )
        
        # For balance, we'd normally use a Loans Receivable/Payable account
        # Skipping for now - this is a simplified version
        
        self.journal_entry = entry
        self.save(update_fields=['journal_entry'])
        
        return entry
