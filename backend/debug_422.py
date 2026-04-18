
import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "kumba_backend.settings")
django.setup()

from hr.models import Employee
from hr.api import EmployeeOutSchema
from django.contrib.auth import get_user_model

User = get_user_model()
try:
    # Use first user to simulate
    user = User.objects.first()
    if not user:
        print("No user found")
        exit()

    print(f"Testing with user: {user.email}")
    
    try:
        employee = Employee.objects.get(email=user.email)
    except Employee.DoesNotExist:
        print("Employee not found, creating dummy...")
        employee = Employee.objects.create(
            company=user.company,
            first_name="Test",
            last_name="User",
            email=user.email,
            position="Tester"
        )
    
    # Simulate Logic
    print(f"Employee found: {employee}")
    print(f"Photo field: {employee.photo}")
    
    try:
        print("Attempting validation using Ninja's assumed behavior...")
        # Ninja usually does: EmployeeOutSchema.from_orm(employee) if V1
        # or EmployeeOutSchema.model_validate(employee, from_attributes=True) if V2
        
        try:
            print("Try .from_orm() ...")
            res = EmployeeOutSchema.from_orm(employee)
            print(f"Success: {res}")
        except AttributeError:
            print(".from_orm not found, trying .model_validate() ...")
            res = EmployeeOutSchema.model_validate(employee)
            print(f"Success: {res}")
            
    except Exception as e:
        print(f"Schema Validation FAILED: {e}")
        # import traceback
        # traceback.print_exc()

except Exception as e:
    print(f"General Error: {e}")
