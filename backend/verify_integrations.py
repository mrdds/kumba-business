import os
import django
import requests
from datetime import date
import csv
import io

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kumba_backend.settings')
django.setup()

from users.models import CustomUser
from companies.models import Company
from accounting.models import Transaction
from ninja_jwt.tokens import RefreshToken

def verify_integrations():
    print("--- Verifying Integrations ---")

    # 1. Setup User & Company
    email = "accountant@test.com"
    password = "password123"
    
    # Clean up
    CustomUser.objects.filter(email=email).delete()
    
    user = CustomUser.objects.create_user(username=email, email=email, password=password)
    company, _ = Company.objects.get_or_create(name="Export Corp")
    user.company = company
    user.save()

    # 2. Create Dummy Transactions
    Transaction.objects.create(company=company, amount=1000, type='IN', category='Sales', description='Product A', date=date.today())
    Transaction.objects.create(company=company, amount=500, type='OUT', category='Rent', description='Office Rent', date=date.today())
    
    print(f"Created User & Transactions: {email}")

    # 3. Login
    refresh = RefreshToken.for_user(user)
    token = str(refresh.access_token)
    headers = {"Authorization": f"Bearer {token}"}
    base_url = "http://127.0.0.1:8000/api"

    # 4. Test Accountant Export
    print("\n--- Testing Accountant Export ---")
    resp = requests.get(f"{base_url}/reports/export?type=accountant&year={date.today().year}", headers=headers)
    
    if resp.status_code == 200:
        print("Export Success. Checking Content...")
        content = resp.content.decode('utf-8')
        reader = csv.reader(io.StringIO(content))
        rows = list(reader)
        
        # Verify Header
        expected_header = ['Journal', 'Date', 'Ref', 'Description', 'Account/Category', 'Debit', 'Credit']
        if rows[0] == expected_header:
            print("✅ Header Matches")
        else:
            print(f"❌ Header Mismatch: {rows[0]}")
            
        # Verify Rows (We added 2 transactions)
        if len(rows) >= 3: # Header + 2 rows
            print(f"✅ Received {len(rows)-1} transaction rows")
            print("Sample Row:", rows[1])
        else:
             print(f"❌ Not enough rows: {len(rows)}")

    else:
        print("Export Failed:", resp.text)

if __name__ == "__main__":
    verify_integrations()
