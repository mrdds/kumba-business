from django.db import models
from django.db import transaction as db_transaction
from companies.models import Company
from decimal import Decimal
import datetime

class Invoice(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        SENT = 'SENT', 'Sent'
        PAID = 'PAID', 'Paid'
        PARTIALLY_PAID = 'PARTIAL', 'Partially Paid'
        OVERDUE = 'OVERDUE', 'Overdue'

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='invoices')
    customer = models.ForeignKey('crm.Customer', null=True, on_delete=models.SET_NULL, related_name='invoices')
    client_name = models.CharField(max_length=255)
    client_email = models.EmailField(blank=True, null=True)
    date = models.DateField()
    due_date = models.DateField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT)
    
    # Accounting integration
    journal_entry = models.ForeignKey(
        'accounting.JournalEntry',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='invoice_entries',
        help_text="Journal entry created when invoice is sent"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Invoice #{self.id} - {self.client_name}"
    
    def get_total(self):
        """Calculate total amount of invoice"""
        return sum(item.amount for item in self.items.all())
    
    def get_total_paid(self):
        """Calculate total amount paid"""
        return sum(payment.amount for payment in self.payments.all())
    
    def get_balance_due(self):
        """Calculate remaining balance"""
        return self.get_total() - self.get_total_paid()
    
    @db_transaction.atomic
    def create_accounting_entry(self):
        """
        Create journal entry for this invoice
        
        Journal Entry:
          DR: 411 (Accounts Receivable)  [Total]
          CR: 706 (Service Revenue)       [Total]
        
        Note: Tax handling to be added later
        """
        from accounting.models import JournalEntry, JournalEntryLine, Account
        
        # Don't create if already exists
        if self.journal_entry:
            return self.journal_entry
        
        # Get required accounts
        try:
            ar_account = Account.objects.get(company=self.company, code='411', is_active=True)
            revenue_account = Account.objects.get(company=self.company, code='706', is_active=True)
        except Account.DoesNotExist as e:
            raise ValueError(f"Required accounting accounts not found: {e}")
        
        total = self.get_total()
        
        if total <= 0:
            raise ValueError("Cannot create journal entry for zero-amount invoice")
        
        # Create journal entry
        entry = JournalEntry.objects.create(
            company=self.company,
            date=self.date,
            reference=f"INV-{self.id}",
            description=f"Invoice #{self.id} for {self.client_name}",
            entry_type=JournalEntry.EntryType.INVOICE,
            source_model='invoicing.Invoice',
            source_id=self.id
        )
        
        # DR: Accounts Receivable
        JournalEntryLine.objects.create(
            journal_entry=entry,
            account=ar_account,
            debit=total,
            credit=Decimal('0'),
            description=f"AR for Invoice #{self.id}"
        )
        
        # CR: Revenue
        JournalEntryLine.objects.create(
            journal_entry=entry,
            account=revenue_account,
            debit=Decimal('0'),
            credit=total,
            description=f"Service revenue"
        )
        
        # Post the entry
        entry.post()
        
        # Link to invoice
        self.journal_entry = entry
        self.save(update_fields=['journal_entry'])
        
        return entry


class InvoiceItem(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    description = models.CharField(max_length=255)
    quantity = models.IntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    amount = models.DecimalField(max_digits=12, decimal_places=2)

    def save(self, *args, **kwargs):
        self.amount = self.quantity * self.unit_price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.description} ({self.amount})"


class InvoicePayment(models.Model):
    """
    Payment received for an invoice
    """
    class PaymentMethod(models.TextChoices):
        CASH = 'CASH', 'Cash (Caisse)'
        BANK = 'BANK', 'Bank Transfer'
        MOBILE_MONEY = 'MOBILE', 'Mobile Money'
        CHECK = 'CHECK', 'Check'
    
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_date = models.DateField()
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.CASH)
    reference = models.CharField(max_length=100, blank=True, help_text="Payment reference number")
    notes = models.TextField(blank=True)
    
    # Accounting integration
    journal_entry = models.ForeignKey(
        'accounting.JournalEntry',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='payment_entries'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Payment {self.amount} for Invoice #{self.invoice.id}"
    
    @db_transaction.atomic
    def create_accounting_entry(self):
        """
        Create journal entry for this payment
        
        Journal Entry:
          DR: 53/52/54 (Cash/Bank/Mobile)  [Amount]
          CR: 411 (Accounts Receivable)     [Amount]
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
            self.PaymentMethod.CHECK: '52',  # Banque (check deposits to bank)
        }
        
        cash_account_code = account_codes.get(self.payment_method, '53')
        
        try:
            cash_account = Account.objects.get(
                company=self.invoice.company,
                code=cash_account_code,
                is_active=True
            )
            ar_account = Account.objects.get(
                company=self.invoice.company,
                code='411',
                is_active=True
            )
        except Account.DoesNotExist as e:
            raise ValueError(f"Required accounting accounts not found: {e}")
        
        # Create journal entry
        entry = JournalEntry.objects.create(
            company=self.invoice.company,
            date=self.payment_date,
            reference=self.reference or f"PAY-INV-{self.invoice.id}-{self.id}",
            description=f"Payment received for Invoice #{self.invoice.id}",
            entry_type=JournalEntry.EntryType.PAYMENT,
            source_model='invoicing.InvoicePayment',
            source_id=self.id
        )
        
        # DR: Cash/Bank
        JournalEntryLine.objects.create(
            journal_entry=entry,
            account=cash_account,
            debit=self.amount,
            credit=Decimal('0'),
            description=f"Payment via {self.get_payment_method_display()}"
        )
        
        # CR: Accounts Receivable
        JournalEntryLine.objects.create(
            journal_entry=entry,
            account=ar_account,
            debit=Decimal('0'),
            credit=self.amount,
            description=f"Payment for Invoice #{self.invoice.id}"
        )
        
        # Post the entry
        entry.post()
        
        # Link to payment
        self.journal_entry = entry
        self.save(update_fields=['journal_entry'])
        
        # Update invoice status
        self._update_invoice_status()
        
        return entry
    
    def _update_invoice_status(self):
        """Update invoice status based on payment"""
        total_due = self.invoice.get_total()
        total_paid = self.invoice.get_total_paid()
        
        if total_paid >= total_due:
            self.invoice.status = Invoice.Status.PAID
        elif total_paid > 0:
            self.invoice.status = Invoice.Status.PARTIALLY_PAID
        else:
            # Don't change status if no payment
            pass
        
        self.invoice.save(update_fields=['status'])


class Quote(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        SENT = 'SENT', 'Sent'
        ACCEPTED = 'ACCEPTED', 'Accepted'
        REJECTED = 'REJECTED', 'Rejected'
        CONVERTED = 'CONVERTED', 'Converted'

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='quotes')
    customer = models.ForeignKey('crm.Customer', null=True, on_delete=models.SET_NULL, related_name='quotes')
    client_name = models.CharField(max_length=255)
    client_email = models.EmailField(blank=True, null=True)
    date = models.DateField()
    valid_until = models.DateField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Quote #{self.id} - {self.client_name}"


class QuoteItem(models.Model):
    quote = models.ForeignKey(Quote, on_delete=models.CASCADE, related_name='items')
    description = models.CharField(max_length=255)
    quantity = models.IntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    amount = models.DecimalField(max_digits=12, decimal_places=2)

    def save(self, *args, **kwargs):
        self.amount = self.quantity * self.unit_price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.description} ({self.amount})"


class RecurringInvoice(models.Model):
    class Frequency(models.TextChoices):
        WEEKLY = 'WEEKLY', 'Weekly'
        MONTHLY = 'MONTHLY', 'Monthly'
        YEARLY = 'YEARLY', 'Yearly'

    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        PAUSED = 'PAUSED', 'Paused'
        CANCELLED = 'CANCELLED', 'Cancelled'

    base_invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='recurring_schedules')
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    frequency = models.CharField(max_length=20, choices=Frequency.choices, default=Frequency.MONTHLY)
    start_date = models.DateField()
    next_run_date = models.DateField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Recurring #{self.id} - {self.frequency} - Next: {self.next_run_date}"
