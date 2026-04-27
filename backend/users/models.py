from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from datetime import timedelta
import secrets

from companies.models import Company
from .permissions import UserRole

class Role(models.Model):
    """
    Dynamic roles defined per company.
    """
    name = models.CharField(max_length=100)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='custom_roles')
    description = models.TextField(blank=True, null=True)
    is_system = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('name', 'company')

    def __str__(self):
        return f"{self.name} ({self.company.name})"

class RolePermission(models.Model):
    """
    Granular permissions linked to a role with Scope and ABAC conditions.
    """
    SCOPE_CHOICES = [
        ('self', 'Self (Own records)'),
        ('team', 'Team (Work site/Group)'),
        ('department', 'Department'),
        ('organization', 'Organization (Full access)'),
    ]

    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='permissions_links')
    resource = models.CharField(max_length=100) # ex: 'invoice'
    action = models.CharField(max_length=100)   # ex: 'view'
    scope = models.CharField(max_length=50, choices=SCOPE_CHOICES, default='organization')
    conditions = models.JSONField(default=dict, blank=True) # ABAC Rules: {"amount_max": 5000}

    class Meta:
        unique_together = ('role', 'resource', 'action')

    def __str__(self):
        return f"{self.role.name} - {self.action}:{self.resource} ({self.scope})"

class CustomUser(AbstractUser):
    # Old roles kept for reference/migration
    company = models.ForeignKey(Company, on_delete=models.CASCADE, null=True, related_name='users')
    role = models.CharField(max_length=50, choices=UserRole.choices, default=UserRole.SUPER_ADMIN)
    
    job_title = models.CharField(max_length=100, blank=True, null=True)
    permissions = models.JSONField(default=dict, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    employee_id = models.CharField(max_length=20, unique=True, null=True, blank=True)
    kumba_id = models.CharField(max_length=20, unique=True, null=True, blank=True)


class PasswordResetToken(models.Model):
    """
    Token for password reset requests
    """
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='reset_tokens')
    token = models.CharField(max_length=100, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    
    def save(self, *args, **kwargs):
        if not self.token:
            self.token = secrets.token_urlsafe(32)
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(hours=1)
        super().save(*args, **kwargs)
    
    def is_valid(self):
        """Check if token is still valid"""
        return not self.used and timezone.now() < self.expires_at
    
    def __str__(self):
        return f"Reset token for {self.user.email}"
