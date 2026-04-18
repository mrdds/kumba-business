import requests
from verify_dashboard import get_auth_token

BASE_URL = "http://localhost:8001/api"

def test_dashboard_kpis():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    print("Fetching Dashboard Summary...")
    res = requests.get(f"{BASE_URL}/accounting/dashboard", headers=headers)
    if res.status_code == 200:
        data = res.json()
        print("Dashboard Data Received:")
        print(f"Revenue: {data.get('revenue')}")
        print(f"Expenses: {data.get('expenses')}")
        print(f"Unpaid Invoices Count: {data.get('unpaid_invoices_count')}")
        print(f"Unpaid Invoices Amount: {data.get('unpaid_invoices_amount')}")
        print(f"Pending Salaries Amount: {data.get('pending_salaries_amount')}")
        
        # We can add assertions if we know the state, but printing confirms the keys exist
        if 'unpaid_invoices_count' in data and 'pending_salaries_amount' in data:
            print("SUCCESS: Dashboard KPIs present in response.")
        else:
            print("FAILURE: Missing KPI keys.")
    else:
        print(f"Failed to fetch dashboard: {res.status_code}")
        print(res.text)

if __name__ == "__main__":
    test_dashboard_kpis()
