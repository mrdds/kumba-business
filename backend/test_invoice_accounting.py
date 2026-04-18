#!/usr/bin/env python3
"""
Test Invoice Accounting Integration
Tests automatic journal entry creation for invoices and payments
"""
import requests
import json
from datetime import date, timedelta
from decimal import Decimal

BASE_URL = 'http://localhost:8000/api'
EMAIL = 'sano.daouda96@gmail.com'
PASSWORD = 'TestPass123!'

def test_invoice_accounting():
    print("=" * 70)
    print("TESTING INVOICE ACCOUNTING INTEGRATION")
    print("=" * 70)
    
    # 1. Login
    print("\n1. Logging in...")
    resp = requests.post(f'{BASE_URL}/token/pair', json={'username': EMAIL, 'password': PASSWORD})
    if resp.status_code != 200:
        print(f"❌ Login failed: {resp.text}")
        return
    
    token = resp.json()['access']
    headers = {'Authorization': f'Bearer {token}'}
    print("✅ Login successful")
    
    # 2. Create an invoice
    print("\n2. Creating an invoice...")
    today = date.today()
    due_date = today + timedelta(days=30)
    
    invoice_data = {
        "client_name": "Test Client Corp",
        "client_email": "testclient@example.com",
        "date": str(today),
        "due_date": str(due_date),
        "items": [
            {
                "description": "Web Development Services",
                "quantity": 10,
                "unit_price": 50000
            },
            {
                "description": "Hosting & Maintenance",
                "quantity": 1,
                "unit_price": 100000
            }
        ]
    }
    
    resp = requests.post(f'{BASE_URL}/invoices', headers=headers, json=invoice_data)
    if resp.status_code != 201:
        print(f"❌ Failed to create invoice: {resp.text}")
        return
    
    invoice = resp.json()
    invoice_id = invoice['id']
    total = float(invoice['total_amount'])
    
    print(f"✅ Invoice created: ID={invoice_id}")
    print(f"   Client: {invoice['client_name']}")
    print(f"   Total: ${total:,.2f}")
    print(f"   Status: {invoice['status']}")
    print(f"   Has Accounting Entry: {invoice['has_accounting_entry']}")
    
    # 3. Verify journal entry was created
    print("\n3. Checking journal entry...")
    if invoice['has_accounting_entry']:
        print("✅ Journal entry automatically created!")
        
        # Get all journal entries to find this one
        resp = requests.get(f'{BASE_URL}/accounting/journal-entries', headers=headers)
        if resp.status_code == 200:
            entries = resp.json()
            invoice_entry = next((e for e in entries if e['reference'] == f"INV-{invoice_id}"), None)
            
            if invoice_entry:
                print(f"   Entry ID: {invoice_entry['id']}")
                print(f"   Reference: {invoice_entry['reference']}")
                print(f"   Total Debit: ${invoice_entry['total_debit']:,.2f}")
                print(f"   Total Credit: ${invoice_entry['total_credit']:,.2f}")
                print(f"   Balanced: {invoice_entry['is_balanced']}")
                print(f"   Status: {invoice_entry['status']}")
                
                print("\n   Lines:")
                for line in invoice_entry['lines']:
                    print(f"     {line['account_code']} - {line['account_name']}")
                    print(f"       DR: ${line['debit']:,.2f}  CR: ${line['credit']:,.2f}")
    else:
        print("⚠️  No journal entry created (check signals)")
    
    # 4. Check AR balance
    print("\n4. Checking Accounts Receivable balance...")
    resp = requests.get(f'{BASE_URL}/accounting/accounts', headers=headers)
    if resp.status_code == 200:
        accounts = resp.json()
        ar_account = next((a for a in accounts if a['code'] == '411'), None)
        
        if ar_account:
            print(f"✅ AR Account (411): ${ar_account['balance']:,.2f}")
        else:
            print("❌ AR account not found")
    
    # 5. Record a partial payment
    print("\n5. Recording partial payment (50%)...")
    payment_amount = total * 0.5
    
    payment_data = {
        "amount": payment_amount,
        "payment_date": str(today),
        "payment_method": "CASH",
        "reference": "CASH-001",
        "notes": "Partial payment via cash"
    }
    
    resp = requests.post(
        f'{BASE_URL}/invoices/{invoice_id}/record-payment',
        headers=headers,
        json=payment_data
    )
    
    if resp.status_code == 201:
        payment = resp.json()
        print(f"✅ Payment recorded: ID={payment['id']}")
        print(f"   Amount: ${float(payment['amount']):,.2f}")
        print(f"   Method: {payment['payment_method']}")
        print(f"   Journal Entry ID: {payment.get('journal_entry_id')}")
    else:
        print(f"❌ Failed to record payment: {resp.text}")
        return
    
    # 6. Check updated invoice
    print("\n6. Checking updated invoice...")
    resp = requests.get(f'{BASE_URL}/invoices/{invoice_id}', headers=headers)
    if resp.status_code == 200:
        invoice = resp.json()
        print(f"✅ Invoice status: {invoice['status']}")
        print(f"   Total: ${invoice['total_amount']:,.2f}")
        print(f"   Paid: ${invoice['total_paid']:,.2f}")
        print(f"   Balance Due: ${invoice['balance_due']:,.2f}")
    
    # 7. Record second payment (remaining balance)
    print("\n7. Recording final payment...")
    remaining = total - payment_amount
    
    payment_data = {
        "amount": remaining,
        "payment_date": str(today),
        "payment_method": "BANK",
        "reference": "BANK-TRF-001",
        "notes": "Final payment via bank transfer"
    }
    
    resp = requests.post(
        f'{BASE_URL}/invoices/{invoice_id}/record-payment',
        headers=headers,
        json=payment_data
    )
    
    if resp.status_code == 201:
        payment = resp.json()
        print(f"✅ Final payment recorded: ID={payment['id']}")
        print(f"   Amount: ${float(payment['amount']):,.2f}")
    
    # 8. Check final invoice status
    print("\n8. Checking final invoice status...")
    resp = requests.get(f'{BASE_URL}/invoices/{invoice_id}', headers=headers)
    if resp.status_code == 200:
        invoice = resp.json()
        print(f"✅ Final Status: {invoice['status']}")
        print(f"   Balance Due: ${invoice['balance_due']:,.2f}")
        
        if invoice['status'] == 'PAID' and invoice['balance_due'] == 0:
            print("\n   🎉 Invoice fully paid!")
    
    # 9. Check AR balance again
    print("\n9. Checking updated AR balance...")
    resp = requests.get(f'{BASE_URL}/accounting/accounts', headers=headers)
    if resp.status_code == 200:
        accounts = resp.json()
        ar_account = next((a for a in accounts if a['code'] == '411'), None)
        
        if ar_account:
            print(f"✅ AR Account (411): ${ar_account['balance']:,.2f}")
            print(f"   Expected: $0.00 (if only this invoice exists)")
    
    # 10. Generate Income Statement
    print("\n10. Generating Income Statement...")
    resp = requests.get(
        f'{BASE_URL}/reports/income-statement',
        headers=headers,
        params={'from_date': str(today), 'to_date': str(today)}
    )
    
    if resp.status_code == 200:
        pnl = resp.json()
        print(f"✅ Income Statement:")
        print(f"   Total Revenue: ${pnl['total_revenue']:,.2f}")
        print(f"   Total Expenses: ${pnl['total_expenses']:,.2f}")
        print(f"   Net Profit: ${pnl['net_profit']:,.2f}")
        
        if len(pnl['revenue_lines']) > 0:
            print(f"\n   Revenue breakdown:")
            for line in pnl['revenue_lines']:
                print(f"     {line['account_code']} - {line['account_name']}: ${line['amount']:,.2f}")
    
    # 11. Check Trial Balance
    print("\n11. Checking Trial Balance...")
    resp = requests.get(f'{BASE_URL}/accounting/trial-balance', headers=headers)
    if resp.status_code == 200:
        trial_balance = resp.json()
        
        total_debit = sum(float(line['debit']) for line in trial_balance)
        total_credit = sum(float(line['credit']) for line in trial_balance)
        
        print(f"✅ Trial Balance:")
        print(f"   Total Debit: ${total_debit:,.2f}")
        print(f"   Total Credit: ${total_credit:,.2f}")
        print(f"   Balanced: {abs(total_debit - total_credit) < 0.01}")
        
        print(f"\n   Accounts with balances:")
        for line in trial_balance:
            if float(line['debit']) > 0 or float(line['credit']) > 0:
                print(f"     {line['account_code']} - {line['account_name']}")
                print(f"       DR: ${float(line['debit']):,.2f}  CR: ${float(line['credit']):,.2f}")
    
    print("\n" + "=" * 70)
    print("INVOICE ACCOUNTING INTEGRATION TEST COMPLETE!")
    print("=" * 70)

if __name__ == '__main__':
    test_invoice_accounting()
