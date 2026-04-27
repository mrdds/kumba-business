from ninja import Router, Schema
from django.shortcuts import get_object_or_404
from core.security.registry import ResourceRegistry
from users.models import Role, RolePermission
from typing import List, Optional, Dict

router = Router(tags=["Security"])

class PermissionSchema(Schema):
    resource: str
    action: str
    scope: str
    conditions: Optional[Dict] = {}

class RoleCreateSchema(Schema):
    name: str
    description: Optional[str] = ""

@router.get("/discovery")
def get_discovery(request):
    return ResourceRegistry.get_resources()

@router.get("/roles")
def list_roles(request):
    roles = Role.objects.filter(company=request.user.company)
    return [
        {
            "id": r.id,
            "name": r.name,
            "description": r.description,
            "is_system": r.is_system,
            "permissions_count": r.permissions_links.count()
        } for r in roles
    ]

@router.post("/roles")
def create_role(request, payload: RoleCreateSchema):
    role = Role.objects.create(
        company=request.user.company,
        name=payload.name,
        description=payload.description
    )
    return {"id": role.id, "name": role.name}

@router.get("/roles/{role_id}/permissions")
def get_role_permissions(request, role_id: int):
    role = get_object_or_404(Role, id=role_id, company=request.user.company)
    perms = role.permissions_links.all()
    return [
        {
            "id": p.id,
            "resource": p.resource,
            "action": p.action,
            "scope": p.scope,
            "conditions": p.conditions
        } for p in perms
    ]

@router.post("/roles/{role_id}/permissions")
def sync_role_permissions(request, role_id: int, permissions: List[PermissionSchema]):
    role = get_object_or_404(Role, id=role_id, company=request.user.company)
    
    # Simple sync: delete old and create new
    # In production, you might want to do a more granular update
    role.permissions_links.all().delete()
    
    created_perms = []
    for p in permissions:
        perm = RolePermission.objects.create(
            role=role,
            resource=p.resource,
            action=p.action,
            scope=p.scope,
            conditions=p.conditions
        )
        created_perms.append(perm.id)
        
    return {"success": True, "count": len(created_perms)}

@router.delete("/roles/{role_id}")
def delete_role(request, role_id: int):
    role = get_object_or_404(Role, id=role_id, company=request.user.company)
    if role.is_system:
        return 400, {"detail": "Cannot delete system roles"}
    role.delete()
    return {"success": True}
