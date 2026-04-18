import os
import django
import requests

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kumba_backend.settings')
django.setup()

import jwt
from django.conf import settings

# 1. Create a valid Kumba Auth token
payload = {
    'user_id': 'test_company_creation@kumba.io',
    'first_name': 'Company',
    'last_name': 'Test'
}
token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

# 2. Call /api/companies on Kumba Business running locally on 8000
url = 'http://localhost:8000/api/companies/'
headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

data = {
    "name": "Test Company",
    "sector": "Tech",
    "country": "CI",
    "currency": "XOF",
    "tax_rate": 18.0
}

print(f"Calling: {url}")
response = requests.post(url, headers=headers, json=data)

print(f"Status Code: {response.status_code}")
try:
    print(f"Response JSON: {response.json()}")
except Exception as e:
    print(f"Response Text: {response.text}")
