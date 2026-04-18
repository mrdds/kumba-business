import requests
import datetime

BASE_URL = "http://localhost:8000/api"

def get_auth_token():
    payload = {
        "username": "test@demo.com",
        "password": "password123"
    }
    try:
        response = requests.post(f"{BASE_URL}/token/pair", json=payload)
        if response.status_code == 200:
            return response.json()['access']
        else:
            print(f"Login failed: {response.status_code} {response.text}")
    except Exception as e:
        print(f"Login exception: {e}")
    return None

def test_dashboard_flow():
    token = get_auth_token()
    if not token:
        print("Failed to get token. Run verify_auth.py first to register.")
        return

    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create a Transaction (Income)
    tx_payload = {
        "amount": 1500.00,
        "type": "IN",
        "category": "Sales",
        "date": str(datetime.date.today()),
        "description": "Consulting Service"
    }
    
    print("Creating Transaction (Income)...")
    res = requests.post(f"{BASE_URL}/accounting/transactions", json=tx_payload, headers=headers)
    print(f"Create TX: {res.status_code}")
    if res.status_code != 201:
        print(res.text)

    # 2. Create another Transaction (Expense)
    tx_payload_exp = {
        "amount": 200.50,
        "type": "OUT",
        "category": "Rent",
        "date": str(datetime.date.today()),
        "description": "Office Rent"
    }
    print("Creating Transaction (Expense)...")
    requests.post(f"{BASE_URL}/accounting/transactions", json=tx_payload_exp, headers=headers)

    # 3. Get Dashboard
    print("Fetching Dashboard...")
    res = requests.get(f"{BASE_URL}/accounting/dashboard", headers=headers)
    print(f"Dashboard: {res.status_code}")
    print(res.json())

    # 4. Get Profile
    print("Fetching Profile...")
    res = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    print(f"Profile: {res.status_code}")
    print(res.json())

if __name__ == "__main__":
    test_dashboard_flow()
