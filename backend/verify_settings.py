import requests
from verify_dashboard import get_auth_token

BASE_URL = "http://localhost:8001/api"

def test_settings_flow():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    # 1. Get Current Company Details via /auth/me (or deduce from update return)
    # Since we don't have a direct GET /companies/me (only PUT), we'll test PUT directly.
    
    print("Updating Company Settings...")
    payload = {
        "name": "Kumba Updated Ltd",
        "sector": "FinTech",
        "country": "CI",
        "currency": "XOF",
        "tax_rate": 18.0
    }
    
    res = requests.put(f"{BASE_URL}/companies/me", json=payload, headers=headers)
    if res.status_code == 200:
        print(f"Update Company: {res.status_code}")
        data = res.json()
        print(data)
        
        if data['currency'] == 'XOF' and data['tax_rate'] == 18.0:
            print("SUCCESS: Company settings updated correctly.")
        else:
            print("FAILURE: Settings mismatch.")
    else:
        print(f"Failed to update company: {res.status_code}")
        print(res.text)

if __name__ == "__main__":
    test_settings_flow()
