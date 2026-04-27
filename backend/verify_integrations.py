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
from accounting.models import Account, AccountType, JournalEntry, JournalEntryLine
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

    # 2. Create Dummy Journal Entries
    # Create required accounts if they don't exist
    rev_acc, _ = Account.objects.get_or_create(company=company, code='701', defaults={'name': 'Sales', 'type': AccountType.REVENUE})
    exp_acc, _ = Account.objects.get_or_create(company=company, code='601', defaults={'name': 'Rent', 'type': AccountType.EXPENSE})
    cash_acc, _ = Account.objects.get_or_create(company=company, code='53', defaults={'name': 'Cash', 'type': AccountType.ASSET})

    # Income entry
    entry1 = JournalEntry.objects.create(company=company, date=date.today(), description="Product A Sales", status='POSTED')
    JournalEntryLine.objects.create(journal_entry=entry1, account=cash_acc, debit=1000)
    JournalEntryLine.objects.create(journal_entry=entry1, account=rev_acc, credit=1000)
    
    # Expense entry
    entry2 = JournalEntry.objects.create(company=company, date=date.today(), description="Office Rent", status='POSTED')
    JournalEntryLine.objects.create(journal_entry=entry2, account=exp_acc, debit=500)
    JournalEntryLine.objects.create(journal_entry=entry2, account=cash_acc, credit=500)
    
    print(f"Created User & Journal Entries: {email}")

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
