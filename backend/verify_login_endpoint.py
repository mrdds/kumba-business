import requests
import json

URL = "http://localhost:8000/api/auth/pair"
PAYLOAD = {
    "username": "test_user_debug",
    "password": "Password123!" # Using the user created in previous step
}

try:
    print(f"Testing POST to {URL}")
    response = requests.post(URL, json=PAYLOAD)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print("SUCCESS: Endpoint /pair exists and works.")
    elif response.status_code == 404:
        print("FAILURE: Endpoint not found (404). Trying /token/pair...")
    else:
        print(f"FAILURE: Unexpected status {response.status_code}")

except Exception as e:
    print(f"EXCEPTION: {e}")
