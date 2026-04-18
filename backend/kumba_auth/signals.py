
from django.contrib.auth import user_logged_in, user_login_failed
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import AuditLog
from django.conf import settings

User = settings.AUTH_USER_MODEL

@receiver(user_logged_in)
def log_user_login(sender, request, user, **kwargs):
    ip = request.META.get('REMOTE_ADDR')
    ua = request.META.get('HTTP_USER_AGENT')
    AuditLog.objects.create(
        actor=user,
        action=AuditLog.Actions.LOGIN,
        resource='auth',
        ip_address=ip,
        user_agent=ua,
        details={'method': 'JWT' if 'Authorization' in request.headers else 'Session'}
    )

@receiver(post_save, sender=User)
def log_user_register(sender, instance, created, **kwargs):
    if created:
        AuditLog.objects.create(
            actor=instance,
            action=AuditLog.Actions.REGISTER,
            resource=f'user:{instance.kumba_uid}',
            details={'username': instance.username}
        )
