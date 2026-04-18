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

def test_invoicing_flow():
    token = get_auth_token()
    if not token:
        print("Failed to get token.")
        return

    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Invoice
    payload = {
        "client_name": "Acme Corp",
        "client_email": "billing@acme.com",
        "date": str(datetime.date.today()),
        "due_date": str(datetime.date.today()),
        "items": [
            {
                "description": "Web Development",
                "quantity": 2,
                "unit_price": 500.00
            },
            {
                "description": "Hosting",
                "quantity": 1,
                "unit_price": 50.00
            }
        ]
    }
    print("Creating Invoice...")
    res = requests.post(f"{BASE_URL}/invoices", json=payload, headers=headers)
    print(f"Create Invoice: {res.status_code}")
    print(res.json())

    # 2. List Invoices
    print("Listing Invoices...")
    res = requests.get(f"{BASE_URL}/invoices", headers=headers)
    print(f"List Invoices: {res.status_code}")
    print(res.json())

    # 3. Get Invoice Details
    if res.json():
        invoice_id = res.json()[0]['id']
        print(f"Getting Invoice {invoice_id}...")
        res = requests.get(f"{BASE_URL}/invoices/{invoice_id}", headers=headers)
        print(f"Get Invoice: {res.status_code}")
        print(res.json())

if __name__ == "__main__":
    test_invoicing_flow()
