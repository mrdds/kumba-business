import requests
import json

BASE_URL = 'http://localhost:8000/api'
EMAIL = 'sano.daouda96@gmail.com'
PASSWORD = 'TestPass123!'

def test_create_po():
    # 1. Login
    print("Logging in...")
    resp = requests.post(f'{BASE_URL}/token/pair', json={'username': EMAIL, 'password': PASSWORD})
    if resp.status_code != 200:
        print(f"Login failed: {resp.text}")
        return
    token = resp.json()['access']
    headers = {'Authorization': f'Bearer {token}'}

    # 2. Get Vendor
    print("Fetching vendors...")
    resp = requests.get(f'{BASE_URL}/crm/suppliers', headers=headers)
    if resp.status_code != 200:
        print(f"Get suppliers failed: {resp.text}")
        return
    vendors = resp.json()
    if not vendors:
        print("No vendors found. Creating one...")
        # create valid vendor logic if needed, but lets assume one exists or fail
        return
    vendor_id = vendors[0]['id']
    print(f"Using Vendor ID: {vendor_id}")

    # 3. Create PO
    payload = {
        "vendor_id": vendor_id,
        "vendor_name": "Ignored By Backend",
        "project_name": "Debug Project",
        "expected_date": None, # Test sending null
        "notes": "Debug Note",
        "items": [
            {
                "description": "Test Item",
                "quantity": 10.0,
                "unit_price": 50.0
            }
        ]
    }
    print(f"Sending Payload: {json.dumps(payload, indent=2)}")
    
    resp = requests.post(f'{BASE_URL}/purchasing/orders', headers=headers, json=payload)
    print(f"Response Status: {resp.status_code}")
    print(f"Response Body: {resp.text}")

if __name__ == '__main__':
    test_create_po()
