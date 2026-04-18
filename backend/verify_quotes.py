import requests
from verify_dashboard import get_auth_token

BASE_URL = "http://localhost:8001/api"

def test_quote_flow():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    # 1. Create a Customer (reuse logic or create new)
    # Let's assume customer ID 1 exists or create one.
    print("Creating Customer for Quote...")
    cust_payload = {
        "name": "Quote Customer Ltd",
        "email": "quote@example.com",
        "phone": "+22502020202",
        "address": "Bouaké",
        "type": "Client"
    }
    res = requests.post(f"{BASE_URL}/crm/customers", json=cust_payload, headers=headers)
    if res.status_code == 200:
        customer_id = res.json()['id']
    else:
        # Try listing customers to find one
        res = requests.get(f"{BASE_URL}/crm/customers", headers=headers)
        if res.json():
            customer_id = res.json()[0]['id']
            print(f"Using existing customer ID {customer_id}")
        else:
             print("Failed to get a customer")
             return

    # 2. Create Quote
    print("Creating Quote...")
    quote_payload = {
        "client_name": "Quote Customer Ltd",
        "client_email": "quote@example.com",
        "customer_id": customer_id,
        "date": "2026-02-01",
        "valid_until": "2026-02-15",
        "items": [
            {"description": "Web Design", "quantity": 1, "unit_price": 5000.0}
        ]
    }
    res = requests.post(f"{BASE_URL}/quotes", json=quote_payload, headers=headers)
    if res.status_code != 201:
        print(f"Failed to create quote: {res.status_code}")
        print(res.text)
        return
    
    quote_data = res.json()
    quote_id = quote_data['id']
    print(f"Quote Created: ID {quote_id}")

    # 3. List Quotes
    print("Listing Quotes...")
    res = requests.get(f"{BASE_URL}/quotes", headers=headers)
    if quote_id in [q['id'] for q in res.json()]:
        print("Quote found in list.")
    else:
        print("Quote NOT found in list.")

    # 4. Convert Quote to Invoice
    print(f"Converting Quote {quote_id} to Invoice...")
    res = requests.post(f"{BASE_URL}/quotes/{quote_id}/convert", headers=headers)
    if res.status_code == 201:
        invoice_data = res.json()
        print(f"Quote Converted! Invoice ID: {invoice_data.get('id')}")
        
        # Verify Quote Status is updated
        res = requests.get(f"{BASE_URL}/quotes/{quote_id}", headers=headers)
        if res.json()['status'] == 'CONVERTED':
             print("SUCCESS: Quote status updated to CONVERTED.")
        else:
             print(f"FAILURE: Quote status is {res.json()['status']}")
    else:
        print(f"Failed to convert quote: {res.status_code}")
        print(res.text)

if __name__ == "__main__":
    test_quote_flow()
