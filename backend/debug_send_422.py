import requests

LOGIN_URL = "http://192.168.1.72:8000/api/auth/pair"
CONV_ID = "ca63b6ed-7d4f-4871-b5bd-47d8a400cf18"
SEND_URL = f"http://192.168.1.72:8000/api/connect/conversations/{CONV_ID}/messages"

CREDENTIALS = {
    "username": "mrdds",
    "password": "Aboulaye1996@"
}

def debug_send_422():
    print("Logging in...")
    login_res = requests.post(LOGIN_URL, json=CREDENTIALS)
    token = login_res.json()['access']
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"\nSending Message to {CONV_ID}...")
    payload = {
        "content": "Testing 422 fix",
        "content_type": "text"
    }
    res = requests.post(SEND_URL, json=payload, headers=headers)
    
    print(f"Status: {res.status_code}")
    print(f"Body: {res.text}")

if __name__ == "__main__":
    debug_send_422()
