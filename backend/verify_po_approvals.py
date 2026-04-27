import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kumba_backend.settings')
django.setup()

from approvals.models import ApprovalDefinition, ApprovalRequest, ApprovalStep
from django.contrib.contenttypes.models import ContentType
from purchasing.models import PurchaseOrder

def verify():
    print("--- PO Approval Debug Script ---")
    po_ct = ContentType.objects.get_for_model(PurchaseOrder)
    
    # 1. Definitions
    defs = ApprovalDefinition.objects.filter(content_type=po_ct)
    print(f"Found {defs.count()} ApprovalDefinitions for PurchaseOrder:")
    for d in defs:
        steps = d.steps.all()
        print(f" - [{d.id}] Subtype: {d.document_subtype}, Amount Min: {d.trigger_amount_min}, Active: {d.is_active}")
        for s in steps:
            print(f"   * Step {s.order}: Role={s.role_required}, User={s.approver_user}")
            
    # 2. Last POs
    print("\nRecent Purchase Orders:")
    pos = PurchaseOrder.objects.all().order_by('-id')[:5]
    for po in pos:
        req = ApprovalRequest.objects.filter(content_type=po_ct, object_id=po.id).first()
        print(f" - PO #{po.id}: Status={po.status}, Total={po.total_amount}, Type={po.document_type}")
        if req:
            print(f"   -> ApprovalRequest ID: {req.id}, Status: {req.status}, Current Step: {req.current_step}")
        else:
            print(f"   -> NO ApprovalRequest found for this PO.")

if __name__ == "__main__":
    verify()
