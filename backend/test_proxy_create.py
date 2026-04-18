import os
import django
import requests

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kumba_backend.settings')
django.setup()

import jwt
from django.conf import settings

# 1. Create a valid Kumba Auth token
payload = {
    'user_id': 'proxy_test@kumba.io',
    'first_name': 'Proxy',
    'last_name': 'Test'
}
token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

# 2. Call /api/companies on the Next.js frontend proxy (3001) WITH trailing slash
url_frontend = 'http://localhost:3001/api/companies/'
headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

data = {
    "name": "Proxy Company",
    "sector": "Technology",
    "country": "CI",
    "currency": "XOF",
    "tax_rate": 18
}

print(f"Calling: {url_frontend}")
response = requests.post(url_frontend, headers=headers, json=data)

print(f"Status Code: {response.status_code}")
try:
    print(f"Response JSON: {response.json()}")
except Exception as e:
    print(f"Response Text: {response.text}")
