import requests

# Using the IP from apiConfig.ts
BASE_URL = "http://192.168.1.72:8000/api"
LOGIN_URL = f"{BASE_URL}/auth/pair"
ME_URL = f"{BASE_URL}/auth/me"

CREDENTIALS = {
    "username": "mrdds",
    "password": "Aboulaye1996@"
}

def test_login():
    try:
        print(f"1. Attempting login at {LOGIN_URL}...")
        res = requests.post(LOGIN_URL, json=CREDENTIALS, timeout=5)
        
        if res.status_code == 200:
            print("   Login SUCCESS!")
            tokens = res.json()
            access = tokens.get('access')
            print(f"   Got Access Token: {access[:10]}...")
            return access
        else:
            print(f"   Login FAILED: {res.status_code}")
            print(f"   Response: {res.text}")
            return None
            
    except Exception as e:
        print(f"   Login EXCEPTION: {e}")
        return None

def test_me(access_token):
    if not access_token:
        return
        
    try:
        print(f"2. Fetching user info at {ME_URL}...")
        headers = {"Authorization": f"Bearer {access_token}"}
        res = requests.get(ME_URL, headers=headers, timeout=5)
        
        if res.status_code == 200:
            print("   /auth/me SUCCESS!")
            print(f"   User: {res.json().get('username')}")
        else:
            print(f"   /auth/me FAILED: {res.status_code}")
            print(f"   Response: {res.text}")

    except Exception as e:
        print(f"   /auth/me EXCEPTION: {e}")

if __name__ == "__main__":
    token = test_login()
    test_me(token)
