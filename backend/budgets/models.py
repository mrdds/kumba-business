from django.db import models
from companies.models import Company

class Budget(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='budgets')
    category = models.CharField(max_length=100)
    amount_limit = models.DecimalField(max_digits=12, decimal_places=2)
    period_start = models.DateField()
    period_end = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.category} Budget ({self.period_start} - {self.period_end})"
