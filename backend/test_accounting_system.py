#!/usr/bin/env python3
"""
Test script for the new accounting system
Tests chart of accounts initialization and journal entry creation
"""
import requests
import json
from datetime import date

BASE_URL = 'http://localhost:8000/api'
EMAIL = 'sano.daouda96@gmail.com'
PASSWORD = 'TestPass123!'

def test_accounting_system():
    print("=" * 60)
    print("TESTING KUMBA BUSINESS ACCOUNTING SYSTEM")
    print("=" * 60)
    
    # 1. Login
    print("\n1. Logging in...")
    resp = requests.post(f'{BASE_URL}/token/pair', json={'username': EMAIL, 'password': PASSWORD})
    if resp.status_code != 200:
        print(f"❌ Login failed: {resp.text}")
        return
    
    token = resp.json()['access']
    headers = {'Authorization': f'Bearer {token}'}
    print("✅ Login successful")
    
    # 2. Initialize Chart of Accounts
    print("\n2. Initializing Chart of Accounts (OHADA)...")
    resp = requests.post(f'{BASE_URL}/accounting/accounts/init?template=OHADA', headers=headers)
    print(f"Status: {resp.status_code}")
    if resp.status_code in [200, 400]:
        print(f"Response: {json.dumps(resp.json(), indent=2)}")
    else:
        print(f"Response: {resp.text}")
    
    if resp.status_code == 200:
        print("✅ Chart of accounts initialized")
    else:
        print("⚠️  Chart may already be initialized (check message)")
    
    # 3. List Accounts
    print("\n3. Listing accounts...")
    resp = requests.get(f'{BASE_URL}/accounting/accounts', headers=headers)
    if resp.status_code == 200:
        accounts = resp.json()
        print(f"✅ Found {len(accounts)} accounts")
        print("\nSample accounts:")
        for acc in accounts[:10]:
            print(f"  {acc['code']: <6} - {acc['name']: <40} ({acc['type']})")
    else:
        print(f"❌ Failed to list accounts: {resp.text}")
        return
    
    # 4. Create a simple journal entry
    print("\n4. Creating a manual journal entry...")
    
    # Find accounts for the entry
    cash_account = next((a for a in accounts if a['code'] == '53'), None)  # Caisse
    revenue_account = next((a for a in accounts if a['code'] == '706'), None)  # Services
    
    if not cash_account or not revenue_account:
        print("❌ Required accounts not found")
        return
    
    entry_data = {
        "date": str(date.today()),
        "reference": "TEST-001",
        "description": "Test entry - Cash sale",
        "entry_type": "MANUAL",
        "lines": [
            {
                "account_id": cash_account['id'],
                "debit": 100000,
                "credit": 0,
                "description": "Cash received"
            },
            {
                "account_id": revenue_account['id'],
                "debit": 0,
                "credit": 100000,
                "description": "Service revenue"
            }
        ]
    }
    
    resp = requests.post(f'{BASE_URL}/accounting/journal-entries', headers=headers, json=entry_data)
    if resp.status_code == 200:
        entry = resp.json()
        print(f"✅ Journal entry created: ID={entry['id']}")
        print(f"   Total Debit: {entry['total_debit']}")
        print(f"   Total Credit: {entry['total_credit']}")
        print(f"   Balanced: {entry['is_balanced']}")
        entry_id = entry['id']
    else:
        print(f"❌ Failed to create entry: {resp.text}")
        return
    
    # 5. Post the journal entry
    print("\n5. Posting the journal entry...")
    resp = requests.post(f'{BASE_URL}/accounting/journal-entries/{entry_id}/post', headers=headers)
    if resp.status_code == 200:
        result = resp.json()
        print(f"✅ Entry posted: {result['message']}")
    else:
        print(f"❌ Failed to post entry: {resp.text}")
    
    # 6. Get ledger for cash account
    print("\n6. Viewing ledger for Cash account...")
    resp = requests.get(
        f'{BASE_URL}/accounting/ledger',
        headers=headers,
        params={'account_id': cash_account['id']}
    )
    if resp.status_code == 200:
        ledger = resp.json()
        print(f"✅ Ledger entries: {len(ledger)}")
        for line in ledger:
            print(f"   {line['date']} | {line['reference']: <12} | D:{line['debit']: >10} C:{line['credit']: >10} | Bal:{line['balance']: >10}")
    else:
        print(f"❌ Failed to get ledger: {resp.text}")
    
    # 7. Get trial balance
    print("\n7. Getting trial balance...")
    resp = requests.get(f'{BASE_URL}/accounting/trial-balance', headers=headers)
    if resp.status_code == 200:
        trial_balance = resp.json()
        print(f"✅ Trial balance:")
        print(f"{'Account Code': <12} | {'Account Name': <40} | {'Debit': >12} | {'Credit': >12}")
        print("-" * 82)
        
        total_debit = 0
        total_credit = 0
        
        for line in trial_balance:
            debit = float(line['debit'])
            credit = float(line['credit'])
            
            if debit > 0 or credit > 0:
                print(f"{line['account_code']: <12} | {line['account_name']: <40} | {debit: >12.2f} | {credit: >12.2f}")
                total_debit += debit
                total_credit += credit
        
        print("-" * 82)
        print(f"{'TOTALS': <54} | {total_debit: >12.2f} | {total_credit: >12.2f}")
        print(f"\n   ✅ Trial Balance is {'BALANCED' if abs(total_debit - total_credit) < 0.01 else 'NOT BALANCED'}")
    else:
        print(f"❌ Failed to get trial balance: {resp.text}")
    
    # 8. Generate Income Statement
    print("\n8. Generating Income Statement...")
    resp = requests.get(
        f'{BASE_URL}/reports/income-statement',
        headers=headers,
        params={
            'from_date': f"{date.today().year}-01-01",
            'to_date': str(date.today())
        }
    )
    if resp.status_code == 200:
        pnl = resp.json()
        print(f"✅ Income Statement:")
        print(f"\n   REVENUE:")
        for line in pnl['revenue_lines']:
            print(f"     {line['account_code']} - {line['account_name']}: {line['amount']}")
        print(f"   TOTAL REVENUE: {pnl['total_revenue']}")
        
        print(f"\n   EXPENSES:")
        for line in pnl['expense_lines']:
            print(f"     {line['account_code']} - {line['account_name']}: {line['amount']}")
        print(f"   TOTAL EXPENSES: {pnl['total_expenses']}")
        
        print(f"\n   NET PROFIT: {pnl['net_profit']}")
    else:
        print(f"❌ Failed to get income statement: {resp.text}")
    
    # 9. Generate Balance Sheet
    print("\n9. Generating Balance Sheet...")
    resp = requests.get(f'{BASE_URL}/reports/balance-sheet', headers=headers)
    if resp.status_code == 200:
        bs = resp.json()
        print(f"✅ Balance Sheet:")
        print(f"\n   ASSETS: {bs['total_assets']}")
        print(f"   LIABILITIES: {bs['total_liabilities']}")
        print(f"   EQUITY: {bs['total_equity']}")
        print(f"\n   Balanced: {bs['is_balanced']}")
    else:
        print(f"❌ Failed to get balance sheet: {resp.text}")
    
    print("\n" + "=" * 60)
    print("ACCOUNTING SYSTEM TEST COMPLETE!")
    print("=" * 60)

if __name__ == '__main__':
    test_accounting_system()
