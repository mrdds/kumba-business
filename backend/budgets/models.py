from django.db import models
from companies.models import Company
from core.security.registry import secure_resource

@secure_resource('budget', 'Finances', actions=['view', 'create', 'edit', 'delete', 'approve', 'close'])
class Budget(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        PENDING = 'PENDING', 'Pending Approval'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
        CLOSED = 'CLOSED', 'Closed'

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='budgets')
    project_name = models.CharField(max_length=255, blank=True, null=True)
    category = models.CharField(max_length=100)
    amount_limit = models.DecimalField(max_digits=15, decimal_places=2)
    current_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    
    period_start = models.DateField()
    period_end = models.DateField()
    
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def total_amount(self):
        return self.amount_limit

    def update_total(self):
        """Recalculate total amount limit from items"""
        if self.items.exists():
            self.amount_limit = sum(item.amount for item in self.items.all())
            self.save(update_fields=['amount_limit'])

    def __str__(self):
        project_str = f" [{self.project_name}]" if self.project_name else ""
        return f"{self.category}{project_str} Budget ({self.period_start} - {self.period_end})"

class BudgetItem(models.Model):
    budget = models.ForeignKey(Budget, on_delete=models.CASCADE, related_name='items')
    description = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    unit_price = models.DecimalField(max_digits=15, decimal_places=2)
    amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)

    def save(self, *args, **kwargs):
        self.amount = self.quantity * self.unit_price
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.description} ({self.amount})"
