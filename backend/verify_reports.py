import requests
from verify_dashboard import get_auth_token

BASE_URL = "http://localhost:8001/api"

def test_reports():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    # 1. Test P&L Report
    print("Testing P&L Report...")
    res = requests.get(f"{BASE_URL}/reports/pnl", headers=headers)
    if res.status_code == 200:
        report = res.json()
        print(f"P&L Report generated. Rows: {len(report)}")
        if len(report) > 0:
            print(f"First Month: {report[0]}")
    else:
        print(f"Failed to get P&L: {res.status_code}")
        print(res.text)

    # 2. Test Export (Check content type)
    print("Testing CSV Export...")
    res = requests.get(f"{BASE_URL}/reports/export?type=pnl", headers=headers)
    if res.status_code == 200:
        print(f"Export Success. Content-Type: {res.headers['Content-Type']}")
        if "text/csv" in res.headers['Content-Type']:
            print("Verified Content-Type is CSV.")
        else:
            print(f"Unexpected Content-Type: {res.headers['Content-Type']}")
    else:
         print(f"Failed to export: {res.status_code}")
         print(res.text)

if __name__ == "__main__":
    test_reports()
