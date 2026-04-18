from django.db import models
import secrets
from companies.models import Company

class WorkSite(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='work_sites')
    name = models.CharField(max_length=100)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    radius = models.IntegerField(default=200) # Radius in meters

    def __str__(self):
        return f"{self.name} ({self.company.name})"

class Employee(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='employees')
    kumba_id = models.CharField(max_length=20, blank=True, null=True, unique=True) # KMB...
    work_site = models.ForeignKey(WorkSite, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    phone_numbers = models.JSONField(default=list, blank=True)
    position = models.CharField(max_length=100)
    department = models.CharField(max_length=100, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    photo = models.ImageField(upload_to='employee_photos/', blank=True, null=True)
    hire_date = models.DateField(blank=True, null=True)
    base_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    leave_balance = models.IntegerField(default=30) # Default 30 days of leave
    
    # Device Binding
    device_id = models.CharField(max_length=255, blank=True, null=True)
    device_locked = models.BooleanField(default=False)
    
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('SUSPENDED', 'Suspended'),
        ('BANNED', 'Banned'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    
    def save(self, *args, **kwargs):
        if not self.kumba_id:
            # Generate KMB + 6 random digits
            while True:
                new_id = f"KMB{''.join(secrets.choice('0123456789') for _ in range(6))}"
                if not Employee.objects.filter(kumba_id=new_id).exists():
                    self.kumba_id = new_id
                    break
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class PayrollRun(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='payrolls')
    period_start = models.DateField()
    period_end = models.DateField()
    total_amount = models.DecimalField(max_digits=15, decimal_places=2)
    # Updated status choices
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('APPROVED', 'Approved'),
        ('PAID', 'Paid'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    
    # Accounting Links
    journal_entry = models.ForeignKey('accounting.JournalEntry', on_delete=models.SET_NULL, null=True, blank=True, related_name='payroll_accruals')
    payment_entry = models.ForeignKey('accounting.JournalEntry', on_delete=models.SET_NULL, null=True, blank=True, related_name='payroll_payments')
    payment_date = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def approve(self):
        """
        Approve the payroll run and generate accounting entries.
        """
        if self.status != 'DRAFT':
            return # Already approved or locked
            
        from accounting.models import JournalEntry, JournalEntryLine, Account
        from decimal import Decimal
        
        # Get totals
        payslips = self.payslips.all()
        total_gross = sum(p.basic_salary + p.bonus for p in payslips)
        total_tax = sum(p.tax_amount for p in payslips)
        total_social_employee = sum(p.social_security_employee for p in payslips)
        total_social_employer = sum(p.social_security_employer for p in payslips)
        total_net = sum(p.net_salary for p in payslips)
        
        # Ensure accounts exist (using OHADA-like numbering)
        def get_or_create_account(code, name, type):
            acc, _ = Account.objects.get_or_create(
                company=self.company, 
                code=code, 
                defaults={'name': name, 'type': type, 'is_active': True}
            )
            return acc

        acc_remuneration = get_or_create_account('661000', 'Rémunération du personnel', 'EXPENSE')
        acc_charges_sociales = get_or_create_account('664000', 'Charges sociales', 'EXPENSE')
        
        acc_dettes_personnel = get_or_create_account('422000', 'Personnel, rémunérations dues', 'LIABILITY')
        acc_dettes_sociales = get_or_create_account('431000', 'Sécurité Sociale', 'LIABILITY')
        acc_dettes_impots = get_or_create_account('447000', 'État, impôts retenus', 'LIABILITY')

        # Create Journal Entry
        entry = JournalEntry.objects.create(
            company=self.company,
            date=self.period_end,
            description=f"Payroll Accrual {self.period_start} - {self.period_end}",
            entry_type='JOURNAL',
            status='POSTED',
            created_by=None # System action
        )
        
        # 1. DEBIT: Gross Salary (Expense)
        if total_gross > 0:
            JournalEntryLine.objects.create(journal_entry=entry, account=acc_remuneration, debit=Decimal(total_gross), description="Salaire brut")
            
        # 2. DEBIT: Employer Social Security (Expense)
        if total_social_employer > 0:
            JournalEntryLine.objects.create(journal_entry=entry, account=acc_charges_sociales, debit=Decimal(total_social_employer), description="Charges patronales")
            
        # 3. CREDIT: Net Payable to Employees (Liability)
        if total_net > 0:
            JournalEntryLine.objects.create(journal_entry=entry, account=acc_dettes_personnel, credit=Decimal(total_net), description="Net à payer")
            
        # 4. CREDIT: Taxes Withheld (Liability)
        if total_tax > 0:
            JournalEntryLine.objects.create(journal_entry=entry, account=acc_dettes_impots, credit=Decimal(total_tax), description="Retenue impôt")
            
        # 5. CREDIT: Social Security (Liability = Employee + Employer parts)
        total_social = total_social_employee + total_social_employer
        if total_social > 0:
            JournalEntryLine.objects.create(journal_entry=entry, account=acc_dettes_sociales, credit=Decimal(total_social), description="Charges sociales à payer")

        self.journal_entry = entry
        self.status = 'APPROVED'
        self.save()

class Payslip(models.Model):
    payroll_run = models.ForeignKey(PayrollRun, on_delete=models.CASCADE, related_name='payslips')
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    
    # Component details
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2)
    bonus = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Deductions
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0) # Impots
    social_security_employee = models.DecimalField(max_digits=12, decimal_places=2, default=0) # Charges salariales
    social_security_employer = models.DecimalField(max_digits=12, decimal_places=2, default=0) # Charges patronales
    
    deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0) # Autres retenues (avances, etc.)
    
    net_salary = models.DecimalField(max_digits=12, decimal_places=2)
    
    def calculate_net(self):
        """Recalculate net salary based on components."""
        gross = self.basic_salary + self.bonus
        total_deductions = self.tax_amount + self.social_security_employee + self.deductions
        self.net_salary = gross - total_deductions
        return self.net_salary

class SalaryAdvance(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='advances')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    request_date = models.DateField(auto_now_add=True)
    reason = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, default='PENDING') # PENDING, APPROVED, REJECTED, PAID
    paid_date = models.DateField(null=True, blank=True)

class LeaveRequest(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leave_requests')
    start_date = models.DateField()
    end_date = models.DateField()
    leave_type = models.CharField(max_length=50, default='ANNUAL') # ANNUAL, SICK, UNPAID, MATERNITY
    reason = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, default='PENDING') # PENDING, APPROVED, REJECTED
    created_at = models.DateTimeField(auto_now_add=True)

from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=Employee)
def sync_employee_to_user(sender, instance, **kwargs):
    """
    Sync Employee profile fields back to KumbaUser if one exists with the same email.
    """
    from django.contrib.auth import get_user_model
    User = get_user_model()
    User.objects.filter(email=instance.email).update(
        first_name=instance.first_name,
        last_name=instance.last_name,
        phone=instance.phone or '',
        bio=instance.bio or '',
        job_title=instance.position,
        avatar=instance.photo,
        kumba_id=instance.kumba_id
    )

class Information(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='informations')
    title = models.CharField(max_length=200)
    content = models.TextField()
    color = models.CharField(max_length=20, default='#1E293B')  # For UI styling like the existing announcements
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name='created_informations')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title
