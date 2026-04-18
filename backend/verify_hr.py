import requests
from verify_dashboard import get_auth_token

BASE_URL = "http://localhost:8001/api"

def test_hr_flow():
    # 0. Register new user to ensure Company exists
    reg_payload = {
        "email": "hr_test@demo.com",
        "password": "password123",
        "first_name": "HR",
        "last_name": "Manager",
        "company_name": "HR Corp",
        "phone": "9999999999"
    }
    requests.post(f"{BASE_URL}/auth/register", json=reg_payload)

    # Login
    auth_payload = {
        "username": "hr_test@demo.com",
        "password": "password123"
    }
    print("Logging in...")
    auth_res = requests.post(f"{BASE_URL}/token/pair", json=auth_payload)
    if auth_res.status_code != 200:
        print(f"Login failed: {auth_res.text}")
        return
    token = auth_res.json()['access']
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Debug Me
    print("Checking User Profile...")
    me_res = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    print(f"Me: {me_res.status_code}")
    print(me_res.json())

    # 1. Create Employee
    print("Creating Employee...")
    employee_payload = {
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@company.com",
        "phone": "+1234567890",
        "position": "Software Engineer",
        "department": "Engineering",
        "base_salary": 75000.00,
        "hire_date": "2023-01-15"
    }

    res = requests.post(f"{BASE_URL}/hr/employees", json=employee_payload, headers=headers)
    if res.status_code == 200:
        print(f"Create Employee: {res.status_code}")
        print(res.json())
    else:
        print(f"Failed to create employee: {res.status_code}")
        print(res.text)

    # 2. List Employees
    print("Listing Employees...")
    res = requests.get(f"{BASE_URL}/hr/employees", headers=headers)
    if res.status_code == 200:
        print(f"List Employees: {res.status_code}")
        print(res.json())
    else:
        print(f"Failed to list employees: {res.status_code}")
        print(res.text)

    # 3. Create Payroll Run
    print("Creating Payroll Run...")
    payroll_payload = {
        "period_start": "2026-01-01",
        "period_end": "2026-01-31"
    }
    res = requests.post(f"{BASE_URL}/hr/payrolls", json=payroll_payload, headers=headers)
    if res.status_code == 200:
        print(f"Create Payroll: {res.status_code}")
        print(res.json())
    else:
        print(f"Failed to create payroll: {res.status_code}")
        print(res.text)

    # 4. List Payrolls
    print("Listing Payrolls...")
    res = requests.get(f"{BASE_URL}/hr/payrolls", headers=headers)
    if res.status_code == 200:
        print(f"List Payrolls: {res.status_code}")
        print(res.json())
    else:
        print(f"Failed to list payrolls: {res.status_code}")
        print(res.text)

if __name__ == "__main__":
    test_hr_flow()
