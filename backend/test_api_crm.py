import os
import django
import requests
import json

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kumba_backend.settings')
django.setup()

from users.models import CustomUser

def test_api():
    base_url = 'http://localhost:8000/api'
    token_url = f"{base_url}/token/pair"
    crm_url = f"{base_url}/crm/customers"

    # --- Test 1: Standard User ---
    print("\n--- Testing Standard User ---")
    email = 'test@demo.com'
    password = 'password123'
    
    try:
        user = CustomUser.objects.get(email=email)
        user.set_password(password)
        user.save()

        resp = requests.post(token_url, json={'username': email, 'password': password})
        if resp.status_code == 200:
            access_token = resp.json().get('access')
            headers = {'Authorization': f'Bearer {access_token}'}
            resp = requests.get(crm_url, headers=headers)
            print(f"Standard Response: {resp.status_code}")
        else:
            print(f"Login failed: {resp.text}")
    except Exception as e:
        print(f"Standard Test Failed: {e}")

    # --- Test 2: User without Company ---
    print("\n--- Testing User without Company ---")
    try:
        no_comp_email = 'nocompany@test.com'
        if not CustomUser.objects.filter(email=no_comp_email).exists():
            user = CustomUser.objects.create_user(username=no_comp_email, email=no_comp_email, password=password, role='OWNER')
            user.company = None
            user.save()
        else:
            user = CustomUser.objects.get(email=no_comp_email)
            user.company = None
            user.set_password(password)
            user.save()
        
        resp = requests.post(token_url, json={'username': no_comp_email, 'password': password})
        if resp.status_code == 200:
            access_token = resp.json().get('access')
            headers = {'Authorization': f'Bearer {access_token}'}
            resp = requests.get(crm_url, headers=headers)
            print(f"No Company Response: {resp.status_code}")
            print(f"Body: {resp.text}")
        else:
            print(f"Login failed for no company: {resp.text}")

    except Exception as e:
        print(f"Edge Case Failed: {e}")

if __name__ == '__main__':
    test_api()
