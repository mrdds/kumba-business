
import os
import django
import requests
import json

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "kumba_backend.settings")
django.setup()

from django.contrib.auth import get_user_model
from ninja_jwt.tokens import AccessToken
from companies.models import Company

User = get_user_model()
email = "test_company_dev@kumba.io"

# Create a test user if not exists
user, created = User.objects.get_or_create(
    username=email, 
    email=email,
    defaults={"first_name": "Test", "last_name": "User"}
)
if created:
    user.set_password("testpassword123")
    user.save()

token = str(AccessToken.for_user(user))

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

BASE_URL = "http://localhost:8000/api"

print("--- Testing Company Creation ---")
payload = {
    "name": "Dev Test Company " + str(uuid.uuid4())[:8] if 'uuid' in globals() else "Dev Test Company 123",
    "sector": "Technology",
    "country": "CI",
    "currency": "XOF",
    "tax_rate": 18.0
}
import uuid
payload["name"] = "Dev Test Company " + str(uuid.uuid4())[:8]

try:
    response = requests.post(f"{BASE_URL}/companies/", headers=headers, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print("SUCCESS: Company created and associated with user.")
        # Verify in DB
        user.refresh_from_db()
        print(f"User Company ID: {user.company_id}")
        if user.company_id:
            print(f"User Role: {user.role}")
            print("OK.")
    else:
        print("FAILED to create company.")
except Exception as e:
    print(f"REQUEST FAILED: {e}")
