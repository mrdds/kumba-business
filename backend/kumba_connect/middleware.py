
from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.conf import settings
from django.contrib.auth import get_user_model
from jwt import decode as jwt_decode
from urllib.parse import parse_qs

@database_sync_to_async
def get_user(token):
    try:
        decoded_data = jwt_decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_identity = decoded_data["user_id"]
        User = get_user_model()
        # NINJA_JWT/SIMPLE_JWT is configured to use 'email' as the identity in the claim
        try:
            return User.objects.get(email=user_identity)
        except User.DoesNotExist:
            # Fallback to kumba_uid or PK if email fails
            try:
                return User.objects.get(kumba_id=user_identity)
            except (User.DoesNotExist, ValueError):
                try:
                    return User.objects.get(kumba_uid=user_identity)
                except (User.DoesNotExist, ValueError):
                    return AnonymousUser()
    except Exception as e:
        print(f"JWT Auth Error: {e}")
        return AnonymousUser()

class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode("utf-8")
        query_params = parse_qs(query_string)
        token = query_params.get("token", [None])[0]

        if token:
            scope["user"] = await get_user(token)
        else:
            scope["user"] = AnonymousUser()
        
        return await super().__call__(scope, receive, send)
