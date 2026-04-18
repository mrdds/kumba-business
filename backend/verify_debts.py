import requests
from verify_dashboard import get_auth_token

BASE_URL = "http://localhost:8001/api"

def test_debt_flow():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    # 1. Create a Debt (Supplier Debt)
    print("Creating Supplier Debt...")
    debt_payload = {
        "type": "SUPPLIER",
        "counterparty_name": "Tech Supplies Inc.",
        "amount": 2500.00,
        "due_date": "2026-03-01",
        "description": "Laptops Purchase"
    }
    
    res = requests.post(f"{BASE_URL}/debts", json=debt_payload, headers=headers)
    if res.status_code != 201:
        print(f"Failed to create debt: {res.status_code}")
        print(res.text)
        return
    
    debt_data = res.json()
    debt_id = debt_data['id']
    print(f"Debt Created: ID {debt_id} - ${debt_data['amount']}")

    # 2. Pay Debt (Partial Payment)
    print(f"Paying $1000 against Debt {debt_id}...")
    pay_payload = {
        "amount": 1000.00,
        "date": "2026-01-25"
    }
    res = requests.post(f"{BASE_URL}/debts/{debt_id}/pay", json=pay_payload, headers=headers)
    
    if res.status_code == 200:
        updated_debt = res.json()
        print(f"Payment Success. Paid Amount: ${updated_debt['paid_amount']}")
        print(f"New Status: {updated_debt['status']}")
        
        if updated_debt['status'] == 'PARTIAL':
            print("SUCCESS: Debt status updated to PARTIAL.")
        else:
            print(f"FAILURE: Unexpected status {updated_debt['status']}")
    else:
        print(f"Failed to pay debt: {res.status_code}")
        print(res.text)

if __name__ == "__main__":
    test_debt_flow()
