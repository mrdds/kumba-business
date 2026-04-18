#!/usr/bin/env python3
"""
Direct Django test for invoice accounting integration
"""
import os
import sys
import django
from decimal import Decimal
from datetime import date, timedelta

# Set up Django
sys.path.insert(0, '/Users/mr.dds/.gemini/antigravity/scratch/kumba-business/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kumba_backend.settings')
django.setup()

from invoicing.models import Invoice, InvoiceItem, InvoicePayment
from accounting.models import Account
from users.models import CustomUser

print("=" * 70)
print("DIRECT DJANGO INVOICE ACCOUNTING TEST")
print("=" * 70)

# Get user and company
user = CustomUser.objects.filter(email='sano.daouda96@gmail.com').first()
if not user:
    print("❌ User not found")
    sys.exit(1)

company = user.company
print(f"\n✅ Company: {company.name}")

# Create invoice
print("\n1. Creating invoice...")
today = date.today()
due_date = today + timedelta(days=30)

invoice = Invoice.objects.create(
    company=company,
    client_name="Direct Test Client",
    client_email="direct@test.com",
    date=today,
    due_date=due_date,
    status=Invoice.Status.SENT  # This should trigger signal
)

# Add items
InvoiceItem.objects.create(
    invoice=invoice,
    description="Test Service 1",
    quantity=10,
    unit_price=Decimal('50000')
)

InvoiceItem.objects.create(
    invoice=invoice,
    description="Test Service 2",
    quantity=1,
    unit_price=Decimal('100000')
)

total = invoice.get_total()
print(f"✅ Invoice #{invoice.id} created")
print(f"   Total: ${total:,.2f}")
print(f"   Status: {invoice.status}")

# Check if signal created journal entry
print("\n2. Checking journal entry (from signal)...")
if invoice.journal_entry:
    print(f"✅ Journal entry created automatically: #{invoice.journal_entry.id}")
    print(f"   Reference: {invoice.journal_entry.reference}")
    print(f"   Status: {invoice.journal_entry.status}")
else:
    print("⚠️  No journal entry from signal - creating manually...")
    try:
        entry = invoice.create_accounting_entry()
        print(f"✅ Manual journal entry created: #{entry.id}")
    except Exception as e:
        print(f"❌ Failed to create entry: {e}")

# Verify journal entry
if invoice.journal_entry:
    print("\n3. Verifying journal entry...")
    entry = invoice.journal_entry
    print(f"   Total Debit: ${entry.total_debit():,.2f}")
    print(f"   Total Credit: ${entry.total_credit():,.2f}")
    print(f"   Balanced: {entry.is_balanced()}")
    
    print("\n   Lines:")
    for line in entry.lines.all():
        print(f"     {line.account.code} - {line.account.name}")
        print(f"       DR: ${line.debit:,.2f}  CR: ${line.credit:,.2f}")

# Check AR account
print("\n4. Checking AR balance...")
try:
    ar_account = Account.objects.get(company=company, code='411')
    print(f"✅ AR Account balance: ${ar_account.balance:,.2f}")
except Account.DoesNotExist:
    print("❌ AR account not found")

# Record a payment
print("\n5. Recording payment...")
payment = InvoicePayment.objects.create(
    invoice=invoice,
    amount=total * Decimal('0.5'),
    payment_date=today,
    payment_method=InvoicePayment.PaymentMethod.CASH,
    reference="TEST-CASH-001",
    notes="Test payment"
)

print(f"✅ Payment #{payment.id} created")
print(f"   Amount: ${payment.amount:,.2f}")

# Check if payment created journal entry
if payment.journal_entry:
    print(f"✅ Payment journal entry created: #{payment.journal_entry.id}")
else:
    print("⚠️  No payment journal entry - creating manually...")
    try:
        entry = payment.create_accounting_entry()
        print(f"✅ Manual payment entry created: #{entry.id}")
    except Exception as e:
        print(f"❌ Failed: {e}")

# Check invoice status
invoice.refresh_from_db()
print(f"\n6. Invoice status after payment:")
print(f"   Status: {invoice.status}")
print(f"   Total: ${invoice.get_total():,.2f}")
print(f"   Paid: ${invoice.get_total_paid():,.2f}")
print(f"   Balance Due: ${invoice.get_balance_due():,.2f}")

# Check AR account again
ar_account.refresh_from_db()
print(f"\n7. Updated AR balance: ${ar_account.balance:,.2f}")

print("\n" + "=" * 70)
print("TEST COMPLETE!")
print("=" * 70)
