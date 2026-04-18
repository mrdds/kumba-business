
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

class Role(models.TextChoices):
    ADMIN = 'admin', _('Admin')
    USER = 'user', _('User')
    AUDITOR = 'auditor', _('Auditor')

SCOPES = {
    Role.ADMIN: ['read:all', 'write:all', 'delete:all'],
    Role.USER: ['read:own', 'write:own'],
    Role.AUDITOR: ['read:all', 'read:audit_logs'],
}

class AuditLog(models.Model):
    class Actions(models.TextChoices):
        LOGIN = 'login', 'Login'
        LOGOUT = 'logout', 'Logout'
        REGISTER = 'register', 'Register'
        CREATE = 'create', 'Create'
        UPDATE = 'update', 'Update'
        DELETE = 'delete', 'Delete'
        VIEW = 'view', 'View'
        ACCESS_DENIED = 'access_denied', 'Access Denied'

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='audit_logs',
        help_text=_("User who performed the action")
    )
    action = models.CharField(max_length=50, choices=Actions.choices)
    resource = models.CharField(max_length=255, help_text=_("Target resource (e.g., 'invoice:123')"))
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=255, blank=True, null=True)
    details = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['actor', 'action']),
            models.Index(fields=['timestamp']),
        ]

    def __str__(self):
        return f"{self.timestamp} - {self.actor} - {self.action}"

class Presence(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='presence_logs'
    )
    date = models.DateField()
    check_in = models.TimeField(null=True, blank=True)
    check_out = models.TimeField(null=True, blank=True)
    status = models.CharField(max_length=20, default='PRESENT') # PRESENT, ABSENT, LATE, ONLINE
    location_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    location_lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    device_id = models.CharField(max_length=255, null=True, blank=True)
    work_site_name = models.CharField(max_length=255, null=True, blank=True)
    
    # Security Flags
    is_mocked = models.BooleanField(default=False)
    is_vpn = models.BooleanField(default=False)
    
    last_active = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('user', 'date')
