import requests

LOGIN_URL = "http://192.168.1.72:8000/api/auth/pair"
PROFILE_URL = "http://192.168.1.72:8000/api/social/profile/me"

CREDENTIALS = {
    "username": "mrdds",
    "password": "Aboulaye1996@"
}

def debug_profile():
    print("Logging in...")
    login_res = requests.post(LOGIN_URL, json=CREDENTIALS)
    if login_res.status_code != 200:
        print(f"Login Failed: {login_res.text}")
        return
        
    token = login_res.json()['access']
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"\nFetching Profile...")
    res = requests.get(PROFILE_URL, headers=headers)
    
    print(f"Status: {res.status_code}")
    print(f"Body: {res.text}")

if __name__ == "__main__":
    debug_profile()
