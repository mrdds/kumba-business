from django.db import models
from django.conf import settings
from companies.models import Company
from core.security.registry import secure_resource

@secure_resource('finance_request', 'Finance', actions=['view', 'create', 'edit', 'delete', 'approve', 'cancel'])
class Request(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        PENDING = 'PENDING', 'Pending Approval'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    class RequestType(models.TextChoices):
        MONEY = 'MONEY', 'Money Out (Sortie d\'argent)'
        MATERIAL = 'MATERIAL', 'Material (Matériel)'
        TRAVEL = 'TRAVEL', 'Travel (Déplacement)'
        LEAVE = 'LEAVE', 'Leave (Congé)'
        OTHER = 'OTHER', 'Other (Autre)'

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='finance_requests')
    project_name = models.CharField(max_length=255, blank=True, null=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    request_type = models.CharField(max_length=20, choices=RequestType.choices, default=RequestType.MONEY)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    
    requester = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='my_requests')
    date = models.DateField(auto_now_add=True)
    
    # Files
    attachment = models.FileField(upload_to='requests/%Y/%m/', null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"


@secure_resource('expense', 'Finance', actions=['view', 'create', 'edit', 'delete', 'approve'])
class Expense(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        PENDING = 'PENDING', 'Pending Approval'
        APPROVED = 'APPROVED', 'Approved'
        PAID = 'PAID', 'Paid'
        CANCELLED = 'CANCELLED', 'Cancelled'

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='finance_expenses')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    date = models.DateField()
    category = models.CharField(max_length=100, blank=True) # e.g. Office, Fuel, etc.
    document_type = models.CharField(max_length=50, blank=True, null=True) # e.g. Invoice, Receipt, Ticket
    
    # Payment Info
    bank_account = models.ForeignKey('accounting.BankAccount', on_delete=models.SET_NULL, null=True, blank=True)
    payment_method = models.CharField(max_length=50, blank=True) # e.g. Cash, Mobile Money
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    
    # Links
    related_request = models.ForeignKey(Request, on_delete=models.SET_NULL, null=True, blank=True, related_name='expenses')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_expenses')
    
    attachment = models.FileField(upload_to='expenses/%Y/%m/', null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.amount}"


@secure_resource('income', 'Finance', actions=['view', 'create', 'edit', 'delete', 'approve'])
class Income(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        RECEIVED = 'RECEIVED', 'Received'

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='finance_incomes')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    date = models.DateField()
    category = models.CharField(max_length=100, blank=True) # e.g. Sales, Refund, etc.
    
    # Payment Info
    bank_account = models.ForeignKey('accounting.BankAccount', on_delete=models.SET_NULL, null=True, blank=True)
    payment_method = models.CharField(max_length=50, blank=True) # e.g. Cash, Mobile Money, Bank
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_incomes')
    attachment = models.FileField(upload_to='incomes/%Y/%m/', null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Income: {self.title} ({self.amount})"
