import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kumba_backend.settings')
django.setup()

from kumba_id.models import KumbaUser
from users.models import Role, RolePermission

user = KumbaUser.objects.filter(email='mr.dds@kumba.io').first() or KumbaUser.objects.first()

if user:
    print(f"User: {user.email}")
    print(f"Role (legacy): {user.role}")
    print(f"Custom Role: {user.custom_role.name if user.custom_role else 'None'}")
    print(f"Is Superuser: {user.is_superuser}")
    
    if user.custom_role:
        perms = RolePermission.objects.filter(role=user.custom_role)
        print(f"Permissions for {user.custom_role.name}:")
        for p in perms:
            print(f"  - {p.action} on {p.resource} (scope: {p.scope})")
    else:
        print("No custom role assigned!")
else:
    print("No user found")
