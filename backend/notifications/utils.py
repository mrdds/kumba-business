import requests
from django.core.mail import send_mail
from django.conf import settings
from .models import Notification, PushToken

def send_push_notification(user, title, body, data=None, sound='default'):
    tokens = PushToken.objects.filter(user=user).values_list('token', flat=True)
    if not tokens:
        return False
    
    # Expo Push API
    headers = {
        'host': 'exp.host',
        'accept': 'application/json',
        'accept-encoding': 'gzip, deflate',
        'content-type': 'application/json'
    }

    message = {
        'to': list(tokens),
        'sound': sound,
        'title': title,
        'body': body,
        'priority': 'high',
        'data': data or {},
        'channelId': data.get('channelId') if data else None,
    }

    try:
        response = requests.post('https://exp.host/--/api/v2/push/send', json=message, headers=headers)
        Notification.objects.create(user=user, title=title, body=body, type='PUSH', status='SENT')
        return True
    except Exception as e:
        print(f"Push Error: {e}")
        Notification.objects.create(user=user, title=title, body=body, type='PUSH', status='FAILED')
        return False

def send_email_notification(user, subject, message):
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
        Notification.objects.create(user=user, title=subject, body=message, type='EMAIL', status='SENT')
        return True
    except Exception as e:
        print(f"Email Error: {e}")
        Notification.objects.create(user=user, title=subject, body=message, type='EMAIL', status='FAILED')
        return False
