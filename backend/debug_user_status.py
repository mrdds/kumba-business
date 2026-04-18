import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kumba_backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()
USERNAME = 'test_user_debug'

try:
    user = User.objects.get(username=USERNAME)
    print(f"User found: {user.username}")
    print(f"Is Active: {user.is_active}")
    print(f"Password Check ('Password123!'): {user.check_password('Password123!')}")
    print(f"Email: {user.email}")
    print(f"Type: {user.type}")
except User.DoesNotExist:
    print(f"User {USERNAME} does not exist.")
except Exception as e:
    print(f"Error: {e}")
