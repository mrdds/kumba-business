from django.contrib.auth import get_user_model
from django.db.models import Q

User = get_user_model()

class EmailAuthenticationBackend:
    """
    Authenticate using either username or email.
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        try:
            # Try to find user by email or username
            user = User.objects.get(Q(username=username) | Q(email=username))
            if user.check_password(password):
                return user
        except User.DoesNotExist:
            return None
        except Exception:
            return None
        return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
