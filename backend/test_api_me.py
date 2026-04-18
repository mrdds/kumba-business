import os
import django
import requests

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kumba_backend.settings')
django.setup()

import jwt
from django.conf import settings

# 1. Create a valid Kumba Auth token
payload = {
    'user_id': 'curl_test@kumba.io',
    'first_name': 'Curl',
    'last_name': 'Test'
}
token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

# 2. Call /api/id/me on Kumba Business running locally on 8000
url = 'http://localhost:8000/api/id/me'
headers = {
    'Authorization': f'Bearer {token}'
}

print(f"Calling: {url}")
response = requests.get(url, headers=headers)

print(f"Status Code: {response.status_code}")
try:
    print(f"Response JSON: {response.json()}")
except Exception as e:
    print(f"Response Text: {response.text}")
