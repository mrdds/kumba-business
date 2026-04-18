from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from datetime import timedelta
import secrets

from companies.models import Company
from .permissions import UserRole

class CustomUser(AbstractUser):
    # Old roles kept for reference/migration if needed, but we switch to UserRole
    company = models.ForeignKey(Company, on_delete=models.CASCADE, null=True, related_name='users')
    role = models.CharField(max_length=50, choices=UserRole.choices, default=UserRole.SUPER_ADMIN)
    job_title = models.CharField(max_length=100, blank=True, null=True)
    permissions = models.JSONField(default=dict, blank=True) # Stores granular permissions e.g., {'can_approve_requests': True, 'allowed_pages': ['dashboard', 'clients']}
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
