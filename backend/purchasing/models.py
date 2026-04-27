from django.db import models
from django.db import transaction as db_transaction
from companies.models import Company
from crm.models import Supplier
from decimal import Decimal
import datetime

from core.security.registry import secure_resource

@secure_resource('purchase_order', 'Achats', actions=['view', 'create', 'edit', 'delete', 'approve', 'receive', 'pay'])
class PurchaseOrder(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        PENDING_APPROVAL = 'PENDING', 'Pending Approval'
        SENT = 'SENT', 'Sent'
        RECEIVED = 'RECEIVED', 'Received'
        PAID = 'PAID', 'Paid'
        PARTIALLY_PAID = 'PARTIAL', 'Partially Paid'
        CANCELLED = 'CANCELLED', 'Cancelled'

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='purchase_orders')
    vendor = models.ForeignKey(Supplier, on_delete=models.PROTECT, related_name='purchase_orders')
    project_name = models.CharField(max_length=255)
    date = models.DateField()
    expected_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    notes = models.TextField(blank=True, null=True)
    
    # Bill/Invoice Support
    class DocumentType(models.TextChoices):
        PURCHASE_ORDER = 'PO', 'Purchase Order'
        BILL = 'BILL', 'Vendor Bill'
    
    document_type = models.CharField(max_length=5, choices=DocumentType.choices, default=DocumentType.PURCHASE_ORDER)
    attachment = models.FileField(upload_to='bills/%Y/%m/', null=True, blank=True)
    vendor_invoice_number = models.CharField(max_length=50, null=True, blank=True, help_text="Invoice number provided by vendor")
    
    # Denormalized total for quick access
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Accounting integration
    journal_entry = models.ForeignKey(
        'accounting.JournalEntry',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='purchase_entries',
        help_text="Journal entry created when PO is received"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"PO #{self.id} - {self.vendor.name}"

    def update_total(self):
        """Recalculate total from items"""
        self.total_amount = sum(item.amount for item in self.items.all())
        self.save(update_fields=['total_amount'])
    
    def get_total(self):
        """Get total amount"""
        return self.total_amount or sum(item.amount for item in self.items.all())
    
    def get_total_paid(self):
        """Calculate total amount paid"""
        return sum(payment.amount for payment in self.payments.all())
    
    def get_balance_due(self):
        """Calculate remaining balance"""
        return self.get_total() - self.get_total_paid()
    
    @db_transaction.atomic
    def create_accounting_entry(self):
        """
        Create journal entry for this purchase order when received
        
        Journal Entry:
          DR: 60 (Purchases/Expense)     [Total]
          CR: 401 (Accounts Payable)     [Total]
        """
        from accounting.models import JournalEntry, JournalEntryLine, Account
        
        # Don't create if already exists
        if self.journal_entry:
            return self.journal_entry
        
        # Get required accounts
        try:
            expense_account = Account.objects.get(company=self.company, code='60', is_active=True)
            ap_account = Account.objects.get(company=self.company, code='401', is_active=True)
        except Account.DoesNotExist as e:
            raise ValueError(f"Required accounting accounts not found: {e}")
        
        total = self.get_total()
        
        if total <= 0:
            raise ValueError("Cannot create journal entry for zero-amount purchase order")
        
        # Create journal entry
        entry = JournalEntry.objects.create(
            company=self.company,
            date=self.date,
            reference=f"PO-{self.id}",
            description=f"Purchase Order #{self.id} from {self.vendor.name} - {self.project_name}",
            entry_type=JournalEntry.EntryType.PURCHASE,
            source_model='purchasing.PurchaseOrder',
            source_id=self.id
        )
        
        # DR: Expense (Purchases)
        JournalEntryLine.objects.create(
            journal_entry=entry,
            account=expense_account,
            debit=total,
            credit=Decimal('0'),
            description=f"Purchase for {self.project_name}"
        )
        
        # CR: Accounts Payable
        JournalEntryLine.objects.create(
            journal_entry=entry,
            account=ap_account,
            debit=Decimal('0'),
            credit=total,
            description=f"AP for PO #{self.id}"
        )
        
        # Post the entry
        entry.post()
        
        # Link to PO
        self.journal_entry = entry
        self.save(update_fields=['journal_entry'])
        
        return entry


class PurchaseItem(models.Model):
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='items')
    description = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    amount = models.DecimalField(max_digits=12, decimal_places=2)

    def save(self, *args, **kwargs):
        self.amount = self.quantity * self.unit_price
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.description} ({self.amount})"


class PurchasePayment(models.Model):
    """
    Payment made to supplier for a purchase order
    """
    class PaymentMethod(models.TextChoices):
        CASH = 'CASH', 'Cash (Caisse)'
        BANK = 'BANK', 'Bank Transfer'
        MOBILE_MONEY = 'MOBILE', 'Mobile Money'
        CHECK = 'CHECK', 'Check'
    
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_date = models.DateField()
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.BANK)
    reference = models.CharField(max_length=100, blank=True, help_text="Payment reference number")
    notes = models.TextField(blank=True)
    
    # Accounting integration
    journal_entry = models.ForeignKey(
        'accounting.JournalEntry',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='purchase_payment_entries'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Payment {self.amount} for PO #{self.purchase_order.id}"
    
    @db_transaction.atomic
    def create_accounting_entry(self):
        """
        Create journal entry for this payment
        
        Journal Entry:
          DR: 401 (Accounts Payable)       [Amount]
          CR: 53/52/54 (Cash/Bank/Mobile)  [Amount]
        """
        from accounting.models import JournalEntry, JournalEntryLine, Account
        
        # Don't create if already exists
        if self.journal_entry:
            return self.journal_entry
        
        # Get cash/bank account based on payment method
        account_codes = {
            self.PaymentMethod.CASH: '53',  # Caisse
            self.PaymentMethod.BANK: '52',  # Banque
            self.PaymentMethod.MOBILE_MONEY: '54',  # Mobile Money
            self.PaymentMethod.CHECK: '52',  # Banque
        }
        
        cash_account_code = account_codes.get(self.payment_method, '52')
        
        try:
            cash_account = Account.objects.get(
                company=self.purchase_order.company,
                code=cash_account_code,
                is_active=True
            )
            ap_account = Account.objects.get(
                company=self.purchase_order.company,
                code='401',
                is_active=True
            )
        except Account.DoesNotExist as e:
            raise ValueError(f"Required accounting accounts not found: {e}")
        
        # Create journal entry
        entry = JournalEntry.objects.create(
            company=self.purchase_order.company,
            date=self.payment_date,
            reference=self.reference or f"PAY-PO-{self.purchase_order.id}-{self.id}",
            description=f"Payment for PO #{self.purchase_order.id} to {self.purchase_order.vendor.name}",
            entry_type=JournalEntry.EntryType.PAYMENT,
            source_model='purchasing.PurchasePayment',
            source_id=self.id
        )
        
        # DR: Accounts Payable
        JournalEntryLine.objects.create(
            journal_entry=entry,
            account=ap_account,
            debit=self.amount,
            credit=Decimal('0'),
            description=f"Payment for PO #{self.purchase_order.id}"
        )
        
        # CR: Cash/Bank
        JournalEntryLine.objects.create(
            journal_entry=entry,
            account=cash_account,
            debit=Decimal('0'),
            credit=self.amount,
            description=f"Payment via {self.get_payment_method_display()}"
        )
        
        # Post the entry
        entry.post()
        
        # Link to payment
        self.journal_entry = entry
        self.save(update_fields=['journal_entry'])
        
        # Update PO status
        self._update_po_status()
        
        return entry
    
    def _update_po_status(self):
        """Update PO status based on payment"""
        total_due = self.purchase_order.get_total()
        total_paid = self.purchase_order.get_total_paid()
        
        if total_paid >= total_due:
            self.purchase_order.status = PurchaseOrder.Status.PAID
        elif total_paid > 0:
            self.purchase_order.status = PurchaseOrder.Status.PARTIALLY_PAID
        
        self.purchase_order.save(update_fields=['status'])
