from django.db import models
from django.core.exceptions import ValidationError
from companies.models import Company
from django.utils.translation import gettext_lazy as _
from decimal import Decimal

class DocumentTemplate(models.Model):
    """
    HTML/CSS Templates for Documents.
    Allows companies to choose distinct visual styles (Classic, Modern, etc.)
    """
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    preview_image = models.ImageField(upload_to='templates/previews/', blank=True, null=True)
    
    # The actual template content (Django Template Syntax acceptable)
    html_content = models.TextField(help_text="Jinja2/Django Template HTML")
    css_content = models.TextField(help_text="CSS styles for the PDF")
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class CompanyBranding(models.Model):
    """
    Company-specific branding settings for documents.
    """
    company = models.OneToOneField(Company, on_delete=models.CASCADE, related_name='document_branding')
    logo = models.ImageField(upload_to='company/logos/', blank=True, null=True)
    primary_color = models.CharField(max_length=7, default='#000000', help_text="Hex Color Code")
    font_family = models.CharField(max_length=100, default='Helvetica', help_text="Font family name")
    
    # Default settings
    default_template = models.ForeignKey(DocumentTemplate, null=True, blank=True, on_delete=models.SET_NULL)
    footer_text = models.TextField(blank=True, help_text="Legal text, bank details, etc. for footer")
    
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Branding for {self.company.name}"

class CommercialDocument(models.Model):
    """
    Abstract Base Class for all Commercial Documents (Quotes, Invoices, POs).
    Enforces consistent fields and behavior.
    """
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='%(class)s_documents')
    
    # Header Info
    number = models.CharField(max_length=50, help_text="Document Number (e.g. INV-2024-001)")
    date = models.DateField()
    currency = models.CharField(max_length=3, default='XOF')
    
    # Financials
    subtotal = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Content
    notes = models.TextField(blank=True)
    terms = models.TextField(blank=True, help_text="Terms and conditions specifics")
    
    # Meta
    created_by = models.ForeignKey('users.CustomUser', null=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        unique_together = ('company', 'number')  # Ensure uniqueness per company

    def calculate_totals(self):
        """Override in subclasses or implement generic logic if items are standardized"""
        pass

class Quote(CommercialDocument):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', _('Draft')
        SENT = 'SENT', _('Sent')
        ACCEPTED = 'ACCEPTED', _('Accepted')
        REJECTED = 'REJECTED', _('Rejected')
        CONVERTED = 'CONVERTED', _('Converted to Invoice')
        EXPIRED = 'EXPIRED', _('Expired')

    client = models.ForeignKey('crm.Customer', on_delete=models.PROTECT, related_name='document_quotes')
    valid_until = models.DateField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    
    # Link to converted invoice
    converted_invoice = models.ForeignKey('documents.Invoice', null=True, blank=True, on_delete=models.SET_NULL, related_name='source_quote')

    class Meta:
        ordering = ['-date', '-number']
        
    def __str__(self):
        return f"Quote {self.number} - {self.client}"

class Invoice(CommercialDocument):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', _('Draft')
        SENT = 'SENT', _('Sent')
        PARTIALLY_PAID = 'PARTIAL', _('Partially Paid')
        PAID = 'PAID', _('Paid')
        OVERDUE = 'OVERDUE', _('Overdue')
        CANCELLED = 'CANCELLED', _('Cancelled')

    client = models.ForeignKey('crm.Customer', on_delete=models.PROTECT, related_name='document_invoices')
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    
    # Accounting Link
    journal_entry = models.ForeignKey('accounting.JournalEntry', null=True, blank=True, on_delete=models.SET_NULL, related_name='document_invoice_entries')

    class Meta:
        ordering = ['-date', '-number']

    def __str__(self):
        return f"Invoice {self.number} - {self.client}"

class PurchaseOrder(CommercialDocument):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', _('Draft')
        PENDING_APPROVAL = 'PENDING', _('Pending Approval')
        APPROVED = 'APPROVED', _('Approved')
        REJECTED = 'REJECTED', _('Rejected')
        SENT = 'SENT', _('Sent to Vendor')
        BILLED = 'BILLED', _('Billed')

    vendor = models.ForeignKey('crm.Supplier', on_delete=models.PROTECT, related_name='document_purchase_orders')
    delivery_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)

    class Meta:
        ordering = ['-date', '-number']

    def __str__(self):
        return f"PO {self.number} - {self.vendor}"
        
class CreditNote(CommercialDocument):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', _('Draft')
        ISSUED = 'ISSUED', _('Issued')
        USED = 'USED', _('Used/Applied')

    client = models.ForeignKey('crm.Customer', on_delete=models.PROTECT, related_name='document_credit_notes')
    original_invoice = models.ForeignKey(Invoice, on_delete=models.PROTECT, related_name='credit_notes')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    
    journal_entry = models.ForeignKey('accounting.JournalEntry', null=True, blank=True, on_delete=models.SET_NULL, related_name='document_credit_note_entries')

    def __str__(self):
        return f"Credit Note {self.number} for {self.original_invoice.number}"

class DocumentItem(models.Model):
    """
    Generic Item item for any commercial document.
    Uses GenericForeignKey to attach to Quote, Invoice, or PO.
    """
    from django.contrib.contenttypes.fields import GenericForeignKey
    from django.contrib.contenttypes.models import ContentType

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    document = GenericForeignKey('content_type', 'object_id')
    
    description = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    unit_price = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text="Tax % (e.g. 18.00)")
    total = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    def save(self, *args, **kwargs):
        self.total = self.quantity * self.unit_price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.description} ({self.total})"
