import os
import django
import requests
from datetime import date

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kumba_backend.settings')
django.setup()

from users.models import CustomUser
from companies.models import Company
from hr.models import Employee, Attendance, SalaryAdvance
from ninja_jwt.tokens import RefreshToken

def verify_hr():
    print("--- Verifying HR Enhancements ---")

    # 1. Setup User & Employee
    email = "hremployee@test.com"
    password = "password123"
    
    # Clean up
    CustomUser.objects.filter(email=email).delete()
    
    user = CustomUser.objects.create_user(username=email, email=email, password=password)
    company, _ = Company.objects.get_or_create(name="HR Test Corp")
    user.company = company
    user.save()

    # Link Employee
    Employee.objects.create(
        company=company, 
        first_name="Test", 
        last_name="Employee", 
        email=email,
        position="Tester",
        base_salary=5000
    )
    
    print(f"Created User & Employee: {email}")

    # 2. Login
    refresh = RefreshToken.for_user(user)
    token = str(refresh.access_token)
    headers = {"Authorization": f"Bearer {token}"}
    base_url = "http://127.0.0.1:8000/api"

    # 3. Check In
    print("\n--- Testing Check In ---")
    resp = requests.post(f"{base_url}/hr/attendance/check-in", json={"latitude": 10.0, "longitude": 20.0}, headers=headers)
    if resp.status_code == 200:
        print("Check In Success:", resp.json())
    else:
        print("Check In Failed:", resp.text)

    # 4. Request Advance
    print("\n--- Testing Request Advance ---")
    resp = requests.post(f"{base_url}/hr/advances", json={"amount": 1000, "reason": "Emergency"}, headers=headers)
    if resp.status_code == 200:
        print("Request Advance Success:", resp.json())
        advance_id = resp.json()['id']
        
        # 5. Approve Advance (As Admin - same user is owner)
        print("\n--- Testing Approve Advance ---")
        resp = requests.patch(f"{base_url}/hr/advances/{advance_id}/approve", headers=headers)
        if resp.status_code == 200:
             print("Approve Advance Success:", resp.json())
        else:
             print("Approve Advance Failed:", resp.text)
    else:
        print("Request Advance Failed:", resp.text)

if __name__ == "__main__":
    verify_hr()
