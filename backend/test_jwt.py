import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kumba_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from ninja_jwt.authentication import JWTAuth
from kumba_id.auth import KumbaJWTAuth
import jwt
from django.conf import settings

User = get_user_model()

# Let's create a fake token payload
payload = {
    'user_id': 'test_cross_auth@test.com',
    'first_name': 'Test',
    'last_name': 'CrossAuth'
}

token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

auth = KumbaJWTAuth()

try:
    user = auth.authenticate(None, token)
    if user:
        print(f"Successfully authenticated/provisioned user: {user.email}")
    else:
        print("Failed to authenticate/provision user (returned None)")
except Exception as e:
    print(f"Exception during auth: {e}")

