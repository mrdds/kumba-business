import requests

BASE_URL = "http://localhost:8000/api"

def test_register():
    payload = {
        "email": "test@demo.com",
        "password": "password123",
        "first_name": "Test",
        "last_name": "User",
        "company_name": "Demo Company",
        "phone": "0102030405"
    }
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=payload)
        print(f"Register: {response.status_code}")
        print(response.json())
        return response.status_code == 201 or response.status_code == 400 # 400 if already exists
    except Exception as e:
        print(f"Register failed: {e}")
        return False

def test_login():
    payload = {
        "username": "test@demo.com",
        "password": "password123"
    }
    try:
        response = requests.post(f"{BASE_URL}/token/pair", json=payload)
        print(f"Login: {response.status_code}")
        if response.status_code == 200:
            print("Login Successful, Token received.")
            return True
        else:
            print(response.json())
            return False
    except Exception as e:
        print(f"Login failed: {e}")
        return False

if __name__ == "__main__":
    if test_register():
        test_login()
