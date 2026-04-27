from functools import wraps
from django.http import HttpResponseForbidden
from core.security.engine import can

def has_permission(action: str, resource: str):
    """
    Decorator for Ninja API handlers to check permissions.
    Supports both function-based views and class-based methods.
    """
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(*args, **kwargs):
            import logging
            logger = logging.getLogger('security')
            
            # args[0] is 'request' for function views, or 'self' for class methods
            # args[1] is 'request' for class methods
            # Also check kwargs for 'request'
            request = None
            
            if hasattr(args[0], 'user'):
                request = args[0]
            elif len(args) > 1 and hasattr(args[1], 'user'):
                request = args[1]
            elif 'request' in kwargs:
                request = kwargs['request']
            
            if not request:
                # Last resort: search in args/kwargs for anything with .user
                for a in args:
                    if hasattr(a, 'user'):
                        request = a
                        break
                if not request:
                    for v in kwargs.values():
                        if hasattr(v, 'user'):
                            request = v
                            break

            if not request:
                return HttpResponseForbidden("Authentication context not found")

            user = request.user
            if not user or not user.is_authenticated:
                return HttpResponseForbidden("Authentication required")

            if not can(user, action, resource):
                return HttpResponseForbidden(f"Permission denied: cannot {action} {resource}")

            return view_func(*args, **kwargs)
        return _wrapped_view
    return decorator
