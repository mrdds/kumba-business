from functools import wraps
from ninja.errors import HttpError
from .permissions import DEFAULT_ROLE_PERMISSIONS, UserRole

def has_permission(permission):
    """
    Decorator to check if the user has a specific permission.
    Assumes request.user is populated (e.g. via JWTAuth).
    """
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            user = request.user
            if not user or not user.is_authenticated:
                raise HttpError(401, "Unauthorized")

            # Super Admin Bypass
            if user.role == UserRole.SUPER_ADMIN:
                return func(request, *args, **kwargs)

            # Get user's effective permissions
            # 1. Start with role defaults
            user_perms = set(DEFAULT_ROLE_PERMISSIONS.get(user.role, []))
            
            # 2. Add custom overrides if present in user.permissions (assuming structure {'perm_name': True/False})
            if user.permissions and isinstance(user.permissions, dict):
                for perm, value in user.permissions.items():
                    if value is True:
                        user_perms.add(perm)
                    elif value is False:
                        user_perms.discard(perm)
            
            if permission in user_perms:
                return func(request, *args, **kwargs)
            else:
                 raise HttpError(403, f"Permission Denied: Missing {permission}")

        return wrapper
    return decorator

def has_role(roles):
    """
    Decorator to check if user has one of the allowed roles.
    roles: list of UserRole or single UserRole
    """
    if not isinstance(roles, list):
        roles = [roles]
        
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            if request.user.role in roles or request.user.role == UserRole.SUPER_ADMIN:
                return func(request, *args, **kwargs)
            raise HttpError(403, "Permission Denied: Insufficient Role")
        return wrapper
    return decorator
