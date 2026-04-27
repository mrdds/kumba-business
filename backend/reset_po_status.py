import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kumba_backend.settings')
django.setup()

from purchasing.models import PurchaseOrder

def reset():
    print("--- Resetting PO status ---")
    po = PurchaseOrder.objects.filter(id=1).first()
    if po:
        print(f"Found PO #1. Current status: {po.status}")
        po.status = 'DRAFT'
        po.save()
        print("PO #1 status reset to DRAFT.")
    else:
        print("PO #1 not found.")

if __name__ == "__main__":
    reset()
