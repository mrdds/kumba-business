import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kumba_backend.settings')
django.setup()

from django.contrib.auth import authenticate

USERNAME = 'sano.daouda96@gmail.com' # Using email as username
PASSWORD = 'Aboulaye1996@'

try:
    user = authenticate(username=USERNAME, password=PASSWORD)
    if user:
        print(f"SUCCESS: Authenticated user {user.username} using email.")
        print(f"Backend used: {user.backend}")
    else:
        print("FAILURE: Authentication failed.")

except Exception as e:
    print(f"Error: {e}")
