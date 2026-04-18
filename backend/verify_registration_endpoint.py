import requests
import json

URL = "http://localhost:8000/api/id/register"
PAYLOAD = {
    "username": "test_user_debug",
    "email": "test_debug@example.com",
    "password": "Password123!",
    "first_name": "Test",
    "last_name": "Debug",
    "phone": "1234567890"
}

try:
    print(f"Testing POST to {URL}")
    response = requests.post(URL, json=PAYLOAD)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200 or response.status_code == 201:
        print("SUCCESS: Endpoint exists and works.")
    elif response.status_code == 404:
        print("FAILURE: Endpoint not found (404).")
        # Try with trailing slash
        URL_SLASH = URL + "/"
        print(f"Retrying with trailing slash: {URL_SLASH}")
        response_slash = requests.post(URL_SLASH, json=PAYLOAD)
        print(f"Status Code: {response_slash.status_code}")
    else:
        print(f"FAILURE: Unexpected status {response.status_code}")

except Exception as e:
    print(f"EXCEPTION: {e}")
