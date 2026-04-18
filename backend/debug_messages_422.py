import requests
import uuid

LOGIN_URL = "http://192.168.1.72:8000/api/auth/pair"
# Using the UUID from the user's log
CONV_ID = "ca63b6ed-7d4f-4871-b5bd-47d8a400cf18"
MESSAGES_URL = f"http://192.168.1.72:8000/api/connect/conversations/{CONV_ID}/messages"

CREDENTIALS = {
    "username": "mrdds",
    "password": "Aboulaye1996@"
}

def debug_messages():
    print("1. Logging in...")
    login_res = requests.post(LOGIN_URL, json=CREDENTIALS)
    if login_res.status_code != 200:
        print(f"Login Failed: {login_res.text}")
        return
        
    token = login_res.json()['access']
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"\n2. Fetching Messages for {CONV_ID}...")
    res = requests.get(MESSAGES_URL, headers=headers)
    
    print(f"   Status: {res.status_code}")
    print(f"   Body: {res.text}")

if __name__ == "__main__":
    debug_messages()
