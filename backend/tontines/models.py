from django.db import models
from companies.models import Company

class TontineGroup(models.Model):
    class Frequency(models.TextChoices):
        WEEKLY = 'WEEKLY', 'Weekly'
        MONTHLY = 'MONTHLY', 'Monthly'

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='tontine_groups')
    name = models.CharField(max_length=255)
    contribution_amount = models.DecimalField(max_digits=12, decimal_places=2)
    frequency = models.CharField(max_length=20, choices=Frequency.choices, default=Frequency.MONTHLY)
    start_date = models.DateField()
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.frequency})"

class TontineMember(models.Model):
    group = models.ForeignKey(TontineGroup, on_delete=models.CASCADE, related_name='members')
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=255, blank=True, null=True)
    join_date = models.DateField(auto_now_add=True)
    
    def __str__(self):
        return self.name

class Contribution(models.Model):
    class Status(models.TextChoices):
        PAID = 'PAID', 'Paid'
        PENDING = 'PENDING', 'Pending'
        MISSED = 'MISSED', 'Missed'

    member = models.ForeignKey(TontineMember, on_delete=models.CASCADE, related_name='contributions')
    date = models.DateField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PAID)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('member', 'date') # Ensure only one contribution per member per date

    def __str__(self):
        return f"{self.member.name} - {self.amount} on {self.date}"
