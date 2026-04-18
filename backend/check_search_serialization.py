import requests

LOGIN_URL = "http://192.168.1.72:8000/api/auth/pair"
SEARCH_URL = "http://192.168.1.72:8000/api/connect/users/search"

CREDENTIALS = {
    "username": "mrdds",
    "password": "Aboulaye1996@"
}

def check_search():
    print("Logging in...")
    login_res = requests.post(LOGIN_URL, json=CREDENTIALS)
    token = login_res.json()['access']
    headers = {"Authorization": f"Bearer {token}"}
    
    # Search for 'admin' (User 1)
    print("\nSearching for 'admin'...")
    res = requests.get(SEARCH_URL, params={"q": "admin"}, headers=headers)
    print(f"Status: {res.status_code}")
    print(f"Body: {res.text}")

if __name__ == "__main__":
    check_search()
