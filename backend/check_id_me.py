import os
import django
import requests
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kumba_backend.settings')
django.setup()

import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from companies.models import Company

User = get_user_model()
email = 'curl_test@kumba.io'
user = User.objects.get(email=email)

# 1. Create a valid Kumba Auth token
payload = {
    'email': email,
    'user_id': email,
    'first_name': 'Curl',
    'last_name': 'Test'
}
token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

headers = {
    'Authorization': f'Bearer {token}'
}

url = 'http://localhost:8000/api/id/me'
print(f"\nCalling: {url}")
response = requests.get(url, headers=headers)
print(f"Status Code: {response.status_code}")
try:
    data = response.json()
    print(f"Response JSON: {json.dumps(data, indent=2)}")
except:
    print(f"Response Text: {response.text}")
