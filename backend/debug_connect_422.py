import requests

LOGIN_URL = "http://192.168.1.72:8000/api/auth/pair"
SEARCH_URL = "http://192.168.1.72:8000/api/connect/users/search"
CREATE_CONV_URL = "http://192.168.1.72:8000/api/connect/conversations"

CREDENTIALS = {
    "username": "mrdds",
    "password": "Aboulaye1996@"
}

def debug_422():
    print("1. Logging in...")
    login_res = requests.post(LOGIN_URL, json=CREDENTIALS)
    if login_res.status_code != 200:
        print(f"Login Failed: {login_res.text}")
        return
        
    token = login_res.json()['access']
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Search Users
    print("\n2. Searching for 'mrdds'...")
    search_res = requests.get(SEARCH_URL, params={"q": "mrdds"}, headers=headers)
    print(f"   Status: {search_res.status_code}")
    print(f"   Body: {search_res.text}")
    
    # 3. Create Conversation (Valid)
    print("\n3. Creating valid conversation with 'sano.daouda96@gmail.com' (Self)...")
    payload = {
        "type": "direct",
        "participant_emails": ["sano.daouda96@gmail.com"]
    }
    create_res = requests.post(CREATE_CONV_URL, json=payload, headers=headers)
    print(f"   Status: {create_res.status_code}")
    print(f"   Body: {create_res.text}")

    # 4. Create Conversation (Invalid Email in list)
    print("\n4. Creating conversation with invalid/missing user email...")
    payload_bad = {
        "type": "direct",
        "participant_emails": ["fake.email.does.not.exist@example.com"]
    }
    # This should 404 in logic (get_object_or_404) or 422?
    create_res_bad = requests.post(CREATE_CONV_URL, json=payload_bad, headers=headers)
    print(f"   Status: {create_res_bad.status_code}")
    print(f"   Body: {create_res_bad.text}")

if __name__ == "__main__":
    debug_422()
