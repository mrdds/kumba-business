import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kumba_backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()
EMAIL = 'sano.daouda96@gmail.com'

try:
    user = User.objects.get(email=EMAIL)
    print(f"User found: {user.username} (ID: {user.id})")
    print(f"Is Active: {user.is_active}")
    print(f"Password set: {user.has_usable_password()}")
except User.DoesNotExist:
    print(f"User with email {EMAIL} does not exist.")
except Exception as e:
    print(f"Error: {e}")
