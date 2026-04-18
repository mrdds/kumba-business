import requests
from verify_dashboard import get_auth_token

BASE_URL = "http://localhost:8001/api"

def test_budget_flow():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    # 1. Create a Transaction (Expense) to test spending
    tx_payload_exp = {
        "amount": 250.00,
        "type": "OUT",
        "category": "Marketing",
        "date": "2026-01-20",
        "description": "Ad Campaign"
    }
    print("Creating Expense Transaction...")
    requests.post(f"{BASE_URL}/accounting/transactions", json=tx_payload_exp, headers=headers)

    # 2. Section: Create Budget
    print("Creating Budget...")
    budget_payload = {
        "category": "Marketing",
        "amount_limit": 1000.00,
        "period_start": "2026-01-01",
        "period_end": "2026-01-31"
    }
    res = requests.post(f"{BASE_URL}/budgets", json=budget_payload, headers=headers)
    if res.status_code == 200:
        print(f"Create Budget: {res.status_code}")
        print(res.json())
    else:
        print(f"Failed to create budget: {res.status_code}")
        print(res.text)

    # 3. List Budgets (Should show spent amount)
    print("Listing Budgets...")
    res = requests.get(f"{BASE_URL}/budgets", headers=headers)
    if res.status_code == 200:
        print(f"List Budgets: {res.status_code}")
        data = res.json()
        print(data)
        
        # Verify calculation
        if data and data[0]['spent'] >= 250.00:
             print("SUCCESS: Spent amount correctly calculated.")
        else:
             print("FAILURE: Spent amount not reflected.")
    else:
        print(f"Failed to list budgets: {res.status_code}")
        print(res.text)

if __name__ == "__main__":
    test_budget_flow()
