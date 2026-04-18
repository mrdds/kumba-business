
import os
import django
import sys
import json

# Setup Django environment
sys.path.append('/Users/mr.dds/.gemini/antigravity/scratch/kumba-business/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kumba_backend.settings')
django.setup()

from approvals.models import ApprovalRequest
from users.models import CustomUser

def serialize_min(req):
    try:
        data = {
            "id": req.id,
            "content_type_model": req.content_type.model,
            "object_id": req.object_id,
            "status": req.status,
            "current_step_order": req.current_step.order if req.current_step else None,
            "created_by_email": req.created_by.email if req.created_by else None,
            "created_at": str(req.created_at)
        }
        return data
    except Exception as e:
        print(f"FAILED on ID {req.id}: {e}")
        return None

print("Scanning ALL ApprovalRequests...")
qs = ApprovalRequest.objects.all()
for req in qs:
    res = serialize_min(req)
    if res:
        print(f"OK: {res['id']}")

print("-" * 20)
print("Scanning Users that might be triggering this...")
users = CustomUser.objects.all()
for u in users:
    try:
        print(f"User {u.email} Company: {u.company}")
    except Exception as e:
        print(f"User {u.id} failed: {e}")
