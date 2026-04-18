import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kumba_backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()
USERNAME = 'mrdds'
PASSWORD = 'Aboulaye1996@'

try:
    user = User.objects.get(username=USERNAME)
    print(f"User found: {user.username}")
    is_valid = user.check_password(PASSWORD)
    print(f"Password '{PASSWORD}' is valid: {is_valid}")
    
    if not is_valid:
        # Debugging: check if it's plain text (should never happen but good to check)
        if user.password == PASSWORD:
            print("WARNING: Password is stored in plain text!")
        else:
            print("Password does not match hash.")

except User.DoesNotExist:
    print(f"User {USERNAME} does not exist.")
except Exception as e:
    print(f"Error: {e}")
