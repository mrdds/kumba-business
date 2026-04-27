import logging
from django.db.models import Q
from typing import Optional, Any

logger = logging.getLogger(__name__)

def evaluate_condition(user, condition_key, condition_value, target_obj, context):
    """
    Evaluates a specific ABAC condition.
    Example: amount_max: 5000 checks if target_obj.amount <= 5000
    """
    if not target_obj:
        return True # Cannot evaluate object-specific conditions without object

    # Example: Dynamic Threshold Check
    if condition_key == 'amount_max':
        val = getattr(target_obj, 'amount', getattr(target_obj, 'total_amount', 0))
        return float(val) <= float(condition_value)

    # Example: Department matching
    if condition_key == 'match_department':
        user_dept = getattr(user, 'department', None)
        obj_dept = getattr(target_obj, 'department', None)
        return user_dept == obj_dept

    # Add more complex ABAC logic here as needed
    return True

def check_scope(user, scope, target_obj):
    """
    Checks if the target_obj is within the user's allowed scope.
    """
    if scope == 'organization':
        return True
    
    if not target_obj:
        return True # Generic check (e.g. can view list)

    if scope == 'self':
        owner_id = getattr(target_obj, 'created_by_id', getattr(target_obj, 'user_id', None))
        return owner_id == user.id

    if scope == 'team':
        user_site = getattr(user, 'work_site_id', None)
        obj_site = getattr(target_obj, 'work_site_id', None)
        return user_site == obj_site and user_site is not None

    return False

def can(user, action: str, resource: str, target_obj: Any = None, context: dict = None) -> bool:
    """
    The universal permission check function.
    """
    if user.is_superuser:
        return True

    # Fallback to legacy role system if custom_role is not set
    if not hasattr(user, 'custom_role') or not user.custom_role:
        return user.role in ['SUPER_ADMIN', 'ADMIN', 'OWNER']

    # Get matching permissions for this role/resource/action
    from users.models import RolePermission
    permissions = RolePermission.objects.filter(
        role_id=user.custom_role_id,
        resource=resource,
        action=action
    )

    if not permissions.exists():
        return False

    for perm in permissions:
        # 1. Check Scope
        if not check_scope(user, perm.scope, target_obj):
            continue

        # 2. Check ABAC Conditions
        is_abac_valid = True
        if perm.conditions:
            for key, value in perm.conditions.items():
                if not evaluate_condition(user, key, value, target_obj, context):
                    is_abac_valid = False
                    break
        
        if is_abac_valid:
            return True

    return False
