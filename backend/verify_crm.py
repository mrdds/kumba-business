import requests

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
    except Exception as e:
        print(f"Login exception: {e}")
    return None

def test_crm_flow():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Customer
    payload = {
        "name": "Jane Doe",
        "email": "jane@example.com",
        "phone": "+1234567890",
        "address": "123 Main St",
        "tax_id": "TAX-123"
    }
    print("Creating Customer...")
    res = requests.post(f"{BASE_URL}/crm/customers", json=payload, headers=headers)
    print(f"Create Customer: {res.status_code}")
    print(res.json())

    # 2. List Customers
    print("Listing Customers...")
    res = requests.get(f"{BASE_URL}/crm/customers", headers=headers)
    print(f"List Customers: {res.status_code}")
    print(res.json())

    # 3. Create Supplier
    payload = {
        "name": "Supplier Inc",
        "email": "supply@inc.com"
    }
    print("Creating Supplier...")
    res = requests.post(f"{BASE_URL}/crm/suppliers", json=payload, headers=headers)
    print(f"Create Supplier: {res.status_code}")
    print(res.json())

if __name__ == "__main__":
    test_crm_flow()
