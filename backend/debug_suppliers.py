import os
import django
import sys
from pydantic import ValidationError

# Setup Django
sys.path.append('/Users/mr.dds/.gemini/antigravity/scratch/kumba-business/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kumba_backend.settings')
django.setup()

from crm.models import Supplier
from crm.api import SupplierOutSchema
from users.models import CustomUser

def debug_suppliers():
    print("Debugging Suppliers...")
    try:
        user = CustomUser.objects.get(email='sano.daouda96@gmail.com')
        print(f"User found: {user.email}, Company: {user.company}")
        
        suppliers = Supplier.objects.filter(company=user.company)
        print(f"Found {suppliers.count()} suppliers.")
        
        for supplier in suppliers:
            print(f"Checking Supplier ID: {supplier.id}, Name: {supplier.name}")
            try:
                # Manually validate against schema
                data = {
                    'id': supplier.id,
                    'name': supplier.name,
                    'email': supplier.email,
                    'phone': supplier.phone,
                    'address': supplier.address,
                    'tax_id': supplier.tax_id
                }
                print(f"Data: {data}")
                validated = SupplierOutSchema(**data)
                print("  -> Valid")
            except ValidationError as e:
                print(f"  -> INVALID: {e}")
            except Exception as e:
                print(f"  -> CRASH: {e}")
                import traceback
                traceback.print_exc()

    except Exception as e:
        print(f"Global Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    debug_suppliers()
