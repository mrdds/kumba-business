
import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "kumba_backend.settings")
django.setup()

from django.contrib.auth import get_user_model

try:
    User = get_user_model()
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser('admin', 'admin@kumba.ai', 'admin')
        print("Superuser 'admin' created successfully.")
    else:
        print("Superuser 'admin' already exists.")
except Exception as e:
    print(f"Error creating superuser: {e}")
