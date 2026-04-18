import requests
from verify_dashboard import get_auth_token

BASE_URL = "http://localhost:8001/api"

def test_invoice_customer_link():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    # 1. Create a Customer
    print("Creating Customer...")
    cust_payload = {
        "name": "Linked Customer Ltd",
        "email": "link@example.com",
        "phone": "+22501010101",
        "address": "Abidjan",
        "type": "Client"
    }
    res = requests.post(f"{BASE_URL}/crm/customers", json=cust_payload, headers=headers)
    if res.status_code != 200:
        print(f"Failed to create customer: {res.status_code}")
        return
    customer_id = res.json()['id']
    print(f"Customer Created: ID {customer_id}")

    # 2. Create Invoice linked to Customer
    print("Creating Linked Invoice...")
    invoice_payload = {
        "client_name": "Linked Customer Ltd",
        "client_email": "link@example.com",
        "customer_id": customer_id,
        "date": "2026-01-21",
        "due_date": "2026-01-28",
        "items": [
            {"description": "Consulting", "quantity": 10, "unit_price": 100.0}
        ]
    }
    res = requests.post(f"{BASE_URL}/invoices", json=invoice_payload, headers=headers)
    if res.status_code == 201:
        print(f"Create Invoice: {res.status_code}")
        data = res.json()
        print(data)
        
        if data.get('customer_id') == customer_id:
            print("SUCCESS: Invoice linked to Customer correctly.")
        else:
            print(f"FAILURE: Customer ID mismatch. Expected {customer_id}, got {data.get('customer_id')}")
    else:
        print(f"Failed to create invoice: {res.status_code}")
        print(res.text)

if __name__ == "__main__":
    test_invoice_customer_link()
