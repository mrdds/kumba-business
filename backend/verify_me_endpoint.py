import requests

# 1. Login to get token
LOGIN_URL = "http://localhost:8000/api/auth/pair"
ME_URL = "http://localhost:8000/api/auth/me"
CREDENTIALS = {
    "username": "mrdds",
    "password": "Aboulaye1996@"
}

try:
    print(f"Logging in as {CREDENTIALS['username']}...")
    login_res = requests.post(LOGIN_URL, json=CREDENTIALS)
    
    if login_res.status_code != 200:
        print(f"Login Failed: {login_res.status_code} {login_res.text}")
        exit()
        
    tokens = login_res.json()
    access_token = tokens['access']
    print("Login Successful. Got Access Token.")
    
    # 2. Fetch Me
    print(f"Fetching {ME_URL}...")
    headers = {"Authorization": f"Bearer {access_token}"}
    me_res = requests.get(ME_URL, headers=headers)
    
    print(f"Status Code: {me_res.status_code}")
    print(f"Response: {me_res.text}")
    
    if me_res.status_code == 200:
        print("SUCCESS: /auth/me endpoint works.")
    else:
        print("FAILURE: /auth/me endpoint failed.")

except Exception as e:
    print(f"Error: {e}")
