import requests
from verify_dashboard import get_auth_token
import os

BASE_URL = "http://localhost:8001/api"

def test_documents_flow():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    print("\n--- Testing Commercial Documents Module ---")

    # 1. Get a Customer (Reuse logic)
    print("1. Fetching first customer...")
    res = requests.get(f"{BASE_URL}/crm/customers", headers=headers)
    if not res.json():
        print("Creating a test customer...")
        cust_res = requests.post(f"{BASE_URL}/crm/customers", json={"name": "Doc Test Client", "email": "doc@test.com", "type": "Client"}, headers=headers)
        customer_id = cust_res.json()['id']
    else:
        customer_id = res.json()[0]['id']
    print(f"   Using Customer ID: {customer_id}")

    # 2. Create Quote
    print("\n2. Creating Quote...")
    quote_payload = {
        "client_id": customer_id,
        "date": "2026-03-01",
        "valid_until": "2026-03-15",
        "currency": "XOF",
        "notes": "Test Quote via API",
        "items": [
            {"description": "Web Dev Service", "quantity": 1, "unit_price": 500000, "tax_rate": 0},
            {"description": "Hosting", "quantity": 12, "unit_price": 10000, "tax_rate": 18}
        ]
    }
    
    res = requests.post(f"{BASE_URL}/documents/quotes", json=quote_payload, headers=headers)
    if res.status_code != 200:
        print(f"FAILED: {res.status_code}")
        print(res.text)
        return
    
    quote = res.json()
    quote_id = quote['id']
    print(f"   SUCCESS: Quote Created (ID: {quote_id}, Number: {quote['number']})")
    print(f"   Total Amount: {quote['total_amount']}")

    # 3. Generate PDF
    print(f"\n3. Generating PDF for Quote {quote_id}...")
    pdf_res = requests.get(f"{BASE_URL}/documents/quotes/{quote_id}/pdf", headers=headers)
    
    if pdf_res.status_code == 200 and 'application/pdf' in pdf_res.headers.get('Content-Type', ''):
        filename = f"quote_{quote_id}.pdf"
        with open(filename, 'wb') as f:
            f.write(pdf_res.content)
        print(f"   SUCCESS: PDF downloaded as {filename} ({len(pdf_res.content)} bytes)")
    else:
        print(f"FAILED to download PDF: {pdf_res.status_code}")
        print(pdf_res.text[:200])

if __name__ == "__main__":
    test_documents_flow()
