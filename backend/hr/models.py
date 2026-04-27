from django.db import models
import secrets
from companies.models import Company

class WorkSite(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='work_sites')
    name = models.CharField(max_length=100)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    radius = models.IntegerField(default=200, null=True, blank=True) # Radius in meters
    
    # Project Metadata
    manager_name = models.CharField(max_length=100, blank=True, null=True)
    project_type = models.CharField(max_length=50, blank=True, null=True) # BTP, TELECOM, etc.
    start_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=20, default='ACTIVE') # ACTIVE, PLANNING, ON_HOLD, COMPLETED
    progress = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.name} ({self.company.name})"

from core.security.registry import secure_resource

@secure_resource('employee', 'Ressources Humaines', actions=['view', 'create', 'edit', 'delete', 'approve', 'export'])
class Employee(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='employees')
    kumba_id = models.CharField(max_length=20, blank=True, null=True, unique=True) # KMB...
    work_site = models.ForeignKey(WorkSite, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    gender = models.CharField(max_length=10, choices=[('M', 'Masculin'), ('F', 'Féminin')], blank=True, null=True)
    employee_id = models.CharField(max_length=50, blank=True, null=True) # Custom company ID
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
    
    # New Onboarding Fields
    birth_date = models.DateField(blank=True, null=True)
    birth_place = models.CharField(max_length=150, blank=True, null=True)
    nationality = models.CharField(max_length=100, blank=True, null=True)
    marital_status = models.CharField(max_length=50, blank=True, null=True)
    children_count = models.IntegerField(default=0)
    cnps_number = models.CharField(max_length=50, blank=True, null=True)
    category = models.CharField(max_length=50, blank=True, null=True)
    education_level = models.CharField(max_length=100, blank=True, null=True)
    study_field = models.CharField(max_length=100, blank=True, null=True)
    contract_type = models.CharField(max_length=50, blank=True, null=True)
    contract_duration = models.IntegerField(blank=True, null=True)
    
    emergency_contacts = models.JSONField(default=list, blank=True)
    experiences = models.JSONField(default=list, blank=True)
    
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
        ('PENDING', 'Pending Approval'),
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
def sync_employee_to_user(sender, instance, created, **kwargs):
    """
    Sync Employee profile fields back to KumbaUser if one exists with the same email.
    Auto-creates User if missing to allow login.
    """
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    user = User.objects.filter(email=instance.email).first()
    
    if not user and instance.email:
        # Create User if missing
        password = secrets.token_urlsafe(12) # Temp password
        try:
            user = User.objects.create_user(
                username=instance.email,
                email=instance.email,
                password=password,
                first_name=instance.first_name,
                last_name=instance.last_name,
                phone=instance.phone or '',
                company=instance.company,
                job_title=instance.position,
                kumba_id=instance.kumba_id,
                employee_id=instance.employee_id,
                must_change_password=True
            )
            
            # Apply role and groups if provided as temporary attributes
            if hasattr(instance, '_role'):
                user.role = instance._role
                
            if hasattr(instance, '_groups'):
                from django.contrib.auth.models import Group
                groups_names = instance._groups
                if isinstance(groups_names, str):
                    import json
                    try:
                        groups_names = json.loads(groups_names)
                    except:
                        groups_names = []
                
                if isinstance(groups_names, list):
                    for group_name in groups_names:
                        group, _ = Group.objects.get_or_create(name=group_name)
                        user.groups.add(group)
            
            user.save()
        except Exception as e:
            print(f"Error auto-creating user for employee {instance.email}: {str(e)}")
        # Note: The KumbaUser post_save signal will trigger the welcome notification
    elif user:
        # Update existing
        User.objects.filter(id=user.id).update(
            first_name=instance.first_name,
            last_name=instance.last_name,
            phone=instance.phone or '',
            bio=instance.bio or '',
            job_title=instance.position,
            avatar=instance.photo,
            kumba_id=instance.kumba_id,
            employee_id=instance.employee_id
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

class EmployeeDocument(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='documents')
    name = models.CharField(max_length=100)
    file = models.FileField(upload_to='employee_documents/')
    document_type = models.CharField(max_length=50, blank=True, null=True) # CV, BIRTH_CERT, ID_CARD, etc.
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.employee}"

class Attendance(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendances')
    date = models.DateField(auto_now_add=True)
    clock_in = models.DateTimeField(null=True, blank=True)
    clock_out = models.DateTimeField(null=True, blank=True)
    
    # Location tracking
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    work_site = models.ForeignKey(WorkSite, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Metadata
    status = models.CharField(max_length=20, default='PRESENT') # PRESENT, LATE, ABSENT, EXCUSED
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['-date', '-clock_in']
        unique_together = ['employee', 'date']

    def __str__(self):
        return f"{self.employee} - {self.date}"

class FieldResource(models.Model):
    RESOURCE_TYPES = [
        ('INTERNAL', 'Employé interne'),
        ('SUBCONTRACTOR', 'Sous-traitant'),
        ('FREELANCE', 'Freelance / Contractuel'),
        ('PARTNER', 'Équipe partenaire'),
    ]

    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE)
    employee = models.OneToOneField(Employee, on_delete=models.CASCADE, null=True, blank=True, related_name='field_resource')
    
    resource_uid = models.CharField(max_length=20, blank=True, null=True, unique=True) # FR-XXXXXX
    
    # Classification
    resource_type = models.CharField(max_length=20, choices=RESOURCE_TYPES)
    
    CATEGORY_CHOICES = [
        # Télécom / Infrastructure
        ('TECH_TL', 'Technicien TL'),
        ('TECH_RIGGER', 'Technicien Rigger'),
        ('TECH_FTTH', 'Technicien FTTH'),
        ('TECH_RADIO', 'Technicien Radio'),
        ('TECH_ENERGY', 'Technicien Énergie'),
        ('TECH_MAINT', 'Technicien Maintenance'),
        ('TECH_TRANS', 'Technicien Transmission'),
        ('TECH_FIBER', 'Technicien Fibre'),
        ('TECH_CW', 'Technicien Civil Works'),
        ('TECH_SAT', 'Technicien SAT'),
        ('TECH_NOC', 'Technicien NOC Terrain'),
        
        # Logistique / Support
        ('DRIVER', 'Chauffeur'),
        ('MAGASINIER', 'Magasinier'),
        ('LOG_TERRAIN', 'Logisticien terrain'),
        ('AGENT_DEPOT', 'Agent dépôt'),
        ('COORD_TERRAIN', 'Coordinateur terrain'),
        
        # Supervision
        ('TEAM_LEAD', 'Team Lead'),
        ('SUPERVISOR', 'Superviseur terrain'),
        ('CHIEF_WORKS', 'Chef chantier'),
        ('COORD_OPS', 'Coordinateur opérations'),
        ('QC_TERRAIN', 'Contrôleur qualité terrain'),
        
        # Exécution
        ('INSTALLER', 'Installateur'),
        ('MONTEUR', 'Monteur'),
        ('LABORER', 'Manœuvre'),
        ('MAINT_AGENT', 'Agent maintenance'),
        ('SECURITY', 'Agent sécurité'),
        
        # Partenaires
        ('TECH_SUB', 'Technicien sous-traitant'),
        ('PARTNER_TEAM', 'Équipe partenaire'),
        ('PREST_MAINT', 'Prestataire maintenance'),
        ('CONTRACT_TERRAIN', 'Contractuel terrain'),
    ]
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES) 
    specialty = models.CharField(max_length=100, blank=True, null=True)
    skill_level = models.CharField(max_length=50, blank=True, null=True) # Junior, Senior, Expert
    
    # Location
    zone = models.CharField(max_length=100, blank=True, null=True)
    mobility = models.CharField(max_length=50, default='LOCAL') # LOCAL, REGIONAL, NATIONAL
    is_available = models.BooleanField(default=True)

    # Subcontractor / Freelance specific
    contractor_company = models.CharField(max_length=150, blank=True, null=True)
    contract_reference = models.CharField(max_length=100, blank=True, null=True)
    contact_person = models.CharField(max_length=100, blank=True, null=True)
    contact_phone = models.CharField(max_length=20, blank=True, null=True)
    contract_start_date = models.DateField(null=True, blank=True)
    contract_end_date = models.DateField(null=True, blank=True)
    daily_rate = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_mode = models.CharField(max_length=50, blank=True, null=True)

    # Capabilities / Permissions
    can_drive = models.BooleanField(default=False)
    can_handle_inventory = models.BooleanField(default=False)
    can_receive_inventory = models.BooleanField(default=False)
    can_approve_inventory = models.BooleanField(default=False)
    can_sign_delivery = models.BooleanField(default=False)
    can_lead_team = models.BooleanField(default=False)
    can_close_mission = models.BooleanField(default=False)

    status = models.CharField(max_length=20, default='ACTIVE') # ACTIVE, INACTIVE, SUSPENDED

    def save(self, *args, **kwargs):
        if not self.resource_uid:
            while True:
                new_id = f"FR-{secrets.token_hex(3).upper()}"
                if not FieldResource.objects.filter(resource_uid=new_id).exists():
                    self.resource_uid = new_id
                    break
        super().save(*args, **kwargs)

    def __str__(self):
        if self.employee:
            return f"[{self.resource_uid}] {self.employee.first_name} {self.employee.last_name}"
        return f"[{self.resource_uid}] {self.contractor_company or 'Freelance'}"

class OperationalAttendance(models.Model):
    STATUS_CHOICES = [
        # Internal & External
        ('ASSIGNED', 'Assigné'),
        ('ON_SITE', 'Présent chantier'),
        ('INTERVENTION', 'En intervention'),
        ('OUT', 'Sorti'),
        ('FINISHED', 'Terminé'),
        # Internal only statuses handled in HR Attendance but mirrored here for ops
        ('OFFICE', 'Bureau'),
        ('DEPOT', 'Dépôt'),
        ('MISSION', 'En mission'),
        ('TRAVEL', 'En déplacement'),
        ('REST', 'En repos'),
        ('LEAVE', 'En congé'),
        ('ABSENT', 'Absent'),
    ]
    
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE)
    resource = models.ForeignKey(FieldResource, on_delete=models.CASCADE, related_name='operational_attendances')
    date = models.DateField(auto_now_add=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    
    # Location tracking
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    work_site = models.ForeignKey(WorkSite, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Context
    mission_id = models.CharField(max_length=50, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-timestamp']
        get_latest_by = 'timestamp'

    def __str__(self):
        return f"{self.resource} - {self.status} @ {self.timestamp}"
