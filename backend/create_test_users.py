import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kumba_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from companies.models import Company

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from companies.models import Company
from users.permissions import UserRole

User = get_user_model()

def create_users():
    print("--- Creating Test Users for Approval Workflows ---")
    
    # 1. Get Company
    company = Company.objects.first()
    if not company:
        print("ERROR: No company found.")
        return
        
    # 2. Define Users and Roles
    # Format: (Email, First Name, Last Name, Group Name, Role)
    test_users = [
        ('gm@test.com', 'General', 'Manager', 'GENERAL_MANAGER', UserRole.ADMIN),
        ('pm@test.com', 'Project', 'Manager', 'PROJECT_MANAGER', UserRole.PROJECT_MANAGER),
        ('om@test.com', 'Operator', 'Manager', 'OPERATOR_MANAGER', UserRole.MANAGER),
        ('finance@test.com', 'Finance', 'Controller', 'FINANCE', UserRole.ADVANCED_USER), 
        ('employee@test.com', 'John', 'Employee', 'EMPLOYEE', UserRole.STANDARD_USER),
    ]
    
    default_password = 'password123'
    
    for email, first, last, group_name, role in test_users:
        # Create or Update User
        user, created = User.objects.update_or_create(
            username=email, # lookup by username
            defaults={
                'email': email,
                'first_name': first,
                'last_name': last,
                'company': company,
                'is_active': True,
                'role': role
            }
        )
        
        if created:
            user.set_password(default_password)
            user.save()
            print(f"   Created User: {email} ({role})")
        else:
            # Force role update just in case update_or_create didn't trigger if only role changed? No it should.
            # But set_password only on create.
            print(f"   Updated User: {email} ({role})")
            
        # Assign Group
        try:
            group = Group.objects.get(name=group_name)
            user.groups.add(group)
            print(f"   - Assigned to Group: {group_name}")
        except Group.DoesNotExist:
            print(f"   ERROR: Group {group_name} does not exist!")

    print("\n--- Users Ready ---")
    print(f"Default Password: {default_password}")

if __name__ == "__main__":
    create_users()
