import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kumba_backend.settings')
django.setup()

from approvals.models import ApprovalDefinition

def inspect():
    print("--- Current Approval Configuration ---")
    defs = ApprovalDefinition.objects.all().prefetch_related('steps', 'content_type')
    
    if not defs.exists():
        print("No Approval Definitions found. System is likely using default single-level or auto-approve.")
        return

    for d in defs:
        model_name = d.content_type.model
        print(f"\nDocument Type: {model_name.upper()}")
        print(f"Trigger Amount: {d.trigger_amount_min}")
        
        steps = d.steps.all().order_by('order')
        if not steps.exists():
            print("  No steps defined (Auto-approve?)")
        else:
            print(f"  Levels: {steps.count()}")
            for s in steps:
                print(f"  - Level {s.order}: {s.role_required or 'Any Approver'}")

if __name__ == "__main__":
    inspect()
