import requests

# 1. Login
LOGIN_URL = "http://192.168.1.72:8000/api/auth/pair"
CONV_URL = "http://192.168.1.72:8000/api/connect/conversations"
FEED_URL = "http://192.168.1.72:8000/api/social/feed"

CREDENTIALS = {
    "username": "mrdds",
    "password": "Aboulaye1996@"
}

try:
    print("Logging in...")
    login_res = requests.post(LOGIN_URL, json=CREDENTIALS)
    if login_res.status_code != 200:
        print(f"Login failed: {login_res.status_code}")
        exit()
        
    token = login_res.json()['access']
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Check Conversations
    print("\nFetching Conversations...")
    conv_res = requests.get(CONV_URL, headers=headers)
    print(f"Status: {conv_res.status_code}")
    if conv_res.status_code == 200:
        print(f"Data: {conv_res.json()}")
    else:
        print(f"Error: {conv_res.text}")

    # 3. Check Feed
    print("\nFetching Feed...")
    feed_res = requests.get(FEED_URL, headers=headers)
    print(f"Status: {feed_res.status_code}")
    if feed_res.status_code == 200:
        print(f"Data: {feed_res.json()}")
    else:
        print(f"Error: {feed_res.text}")

except Exception as e:
    print(f"Exception: {e}")
