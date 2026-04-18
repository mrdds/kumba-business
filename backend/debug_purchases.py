import os
import django
import sys

# Setup Django
sys.path.append(os.path.join(os.path.dirname(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kumba_backend.settings')
django.setup()

from purchasing.models import PurchaseOrder
from users.models import CustomUser

def debug():
    print("--- Debugging Purchase Orders ---")
    
    # Check total count
    total = PurchaseOrder.objects.count()
    print(f"Total PurchaseOrders in DB: {total}")
    
    # Check per user/company
    user = CustomUser.objects.filter(email='sano.daouda96@gmail.com').first()
    if user:
        print(f"User: {user.email}")
        print(f"Company: {user.company}")
        user_pos = PurchaseOrder.objects.filter(company=user.company)
        print(f"POs for this company: {user_pos.count()}")
        
        for po in user_pos:
            print(f" - PO #{po.id}: Vendor={po.vendor.name}, Total={po.total_amount}, Status={po.status}")
    else:
        print("User sano.daouda96@gmail.com not found")

if __name__ == '__main__':
    debug()
