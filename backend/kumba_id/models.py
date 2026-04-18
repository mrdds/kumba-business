import uuid
import secrets
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.translation import gettext_lazy as _
from users.permissions import UserRole

class KumbaUser(AbstractUser):
    class Types(models.TextChoices):
        USER = "user", "User"
        ORGANIZATION = "org", "Organization"
        SERVICE = "service", "Service"
        AGENT = "agent", "Agent"

    kumba_uid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    type = models.CharField(max_length=50, choices=Types.choices, default=Types.USER)
    
    # Kumba ID specific fields
    kumba_id = models.CharField(max_length=20, blank=True, null=True) # E.g., KMB0846150
    phone = models.CharField(max_length=20, blank=True)
    phone_numbers = models.JSONField(default=list, blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    avatar_url = models.URLField(blank=True, null=True)
    cover_image_url = models.URLField(blank=True, null=True)
    bio = models.TextField(blank=True)
    
    # KYC Level (0=None, 1=Basic, 2=Verified, 3=Enhanced)
    kyc_level = models.IntegerField(default=0)
    
    # Language and Timezone
    language = models.CharField(max_length=10, default='fr')
    timezone = models.CharField(max_length=50, default='Africa/Abidjan')
    
    created_at = models.DateTimeField(auto_now_add=True)

    # Business-related fields (ported from CustomUser for compatibility)
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, null=True, related_name='kumba_users')
    role = models.CharField(max_length=50, choices=UserRole.choices, default=UserRole.SUPER_ADMIN)
    job_title = models.CharField(max_length=100, blank=True, null=True)
    permissions = models.JSONField(default=dict, blank=True)
    # Security and Onboarding
    is_activated = models.BooleanField(default=True)
    must_change_password = models.BooleanField(default=False)
    employee_id = models.CharField(max_length=20, unique=True, null=True, blank=True)

    # Avoid clashes with existing 'users.CustomUser' if we were to coexist, 
    # but the plan is to eventually replace. For now, we point related_names to avoid issues.
    groups = models.ManyToManyField(
        Group,
        verbose_name=_("groups"),
        blank=True,
        help_text=_(
            "The groups this user belongs to. A user will get all permissions "
            "granted to each of their groups."
        ),
        related_name="kumba_user_set",
        related_query_name="kumba_user",
    )
    user_permissions = models.ManyToManyField(
        Permission,
        verbose_name=_("user permissions"),
        blank=True,
        help_text=_("Specific permissions for this user."),
        related_name="kumba_user_set",
        related_query_name="kumba_user",
    )

    def save(self, *args, **kwargs):
        if not self.kumba_id:
            # Generate KMB + 6 random digits
            while True:
                new_id = f"KMB{''.join(secrets.choice('0123456789') for _ in range(6))}"
                if not KumbaUser.objects.filter(kumba_id=new_id).exists():
                    self.kumba_id = new_id
                    # Also sync to employee_id for compatibility
                    if not self.employee_id:
                        self.employee_id = new_id
                    break
        super().save(*args, **kwargs)

@receiver(post_save, sender=KumbaUser)
def sync_user_to_employee(sender, instance, **kwargs):
    """
    Sync KumbaUser profile fields to Employee record.
    Auto-creates Employee if missing but user has a company.
    """
    from hr.models import Employee
    
    # Try to find existing employee
    employee = Employee.objects.filter(email=instance.email).first()
    
    if not employee and instance.company:
        # Auto-provision employee for new business users
        Employee.objects.create(
            company=instance.company,
            email=instance.email,
            first_name=instance.first_name or instance.username,
            last_name=instance.last_name or 'User',
            position=instance.job_title or 'Employee',
            kumba_id=instance.kumba_id or instance.employee_id,
            photo=instance.avatar
        )
    elif employee:
        # Update existing
        employee.first_name = instance.first_name or employee.first_name
        employee.last_name = instance.last_name or employee.last_name
        employee.phone = instance.phone or employee.phone
        employee.kumba_id = instance.kumba_id or employee.kumba_id
        employee.bio = instance.bio or employee.bio
        employee.position = instance.job_title or employee.position
        employee.photo = instance.avatar or employee.photo
        employee.save()

    def __str__(self):
        return f"{self.username} ({self.kumba_uid})"


class Organization(models.Model):
    kumba_uid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    name = models.CharField(max_length=255)
    owner = models.ForeignKey(KumbaUser, on_delete=models.CASCADE, related_name='owned_orgs')
    
    # Organization specific fields
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
