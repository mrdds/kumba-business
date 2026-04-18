import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kumba_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

def check_users():
    print(f"Checking {User.objects.count()} users...")
    for u in User.objects.all():
        print(f"User {u.id}: {u.username}")
        print(f"  - email: {u.email!r} (type: {type(u.email)})")
        print(f"  - first: {u.first_name!r} (type: {type(u.first_name)})")
        print(f"  - last:  {u.last_name!r} (type: {type(u.last_name)})")
        print(f"  - role:  {u.role!r} (type: {type(u.role)})")
        print(f"  - avatar_url: {u.avatar_url!r} (type: {type(u.avatar_url)})")
        
        # Check against schema constraints
        # UserSearchSchema:
        # email: str
        # first_name: str
        # last_name: str
        
        if u.email is None: print("  ❌ EMAIL IS NONE")
        if u.first_name is None: print("  ❌ FIRST_NAME IS NONE")
        if u.last_name is None: print("  ❌ LAST_NAME IS NONE")

if __name__ == "__main__":
    check_users()
