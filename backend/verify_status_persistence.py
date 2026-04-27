import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kumba_backend.settings')
django.setup()

from purchasing.models import PurchaseOrder
from approvals.service import ApprovalService
from django.contrib.auth import get_user_model

User = get_user_model()

def verify():
    print("--- Verifying PENDING status persistence ---")
    u = User.objects.first()
    po = PurchaseOrder.objects.filter(id=1).first()
    
    if not po:
        print("PO #1 not found.")
        return

    print(f"PO #1 initial status: {po.status}")
    po.status = 'DRAFT'
    po.save()
    print("PO #1 reset to DRAFT.")
    
    # Simulate submit
    print("Simulating submission for approval...")
    req = ApprovalService.submit_for_approval(po, u)
    
    # Reload PO
    po.refresh_from_db()
    print(f"PO #1 status after submission: {po.status}")
    
    if req:
        print(f"ApprovalRequest created: ID={req.id}, Status={req.status}")
    else:
        print("No ApprovalRequest created (auto-approved?)")

if __name__ == "__main__":
    verify()
