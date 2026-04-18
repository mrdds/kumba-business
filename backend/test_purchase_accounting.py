#!/usr/bin/env python3
"""
Direct Django test for purchase order accounting integration
"""
import os
import sys
import django
from decimal import Decimal
from datetime import date

sys.path.insert(0, '/Users/mr.dds/.gemini/antigravity/scratch/kumba-business/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kumba_backend.settings')
django.setup()

from purchasing.models import PurchaseOrder, PurchaseItem, PurchasePayment
from crm.models import Supplier
from accounting.models import Account
from users.models import CustomUser

print("=" * 70)
print("PURCHASE ORDER ACCOUNTING INTEGRATION TEST")
print("=" * 70)

# Get user and company
user = CustomUser.objects.filter(email='sano.daouda96@gmail.com').first()
company = user.company
print(f"\n✅ Company: {company.name}")

# Get or create a supplier
supplier, created = Supplier.objects.get_or_create(
    company=company,
    name="Test Supplier Co",
    defaults={'email': 'supplier@test.com'}
)
print(f"✅ Supplier: {supplier.name}")

# Create Purchase Order
print("\n1. Creating Purchase Order...")
po = PurchaseOrder.objects.create(
    company=company,
    vendor=supplier,
    project_name="Office Supplies Purchase",
    date=date.today(),
    status=PurchaseOrder.Status.DRAFT
)

# Add items
PurchaseItem.objects.create(
    purchase_order=po,
    description="Office Chairs",
    quantity=Decimal('10'),
    unit_price=Decimal('50000')
)

PurchaseItem.objects.create(
    purchase_order=po,
    description="Desks",
    quantity=Decimal('5'),
    unit_price=Decimal('100000')
)

po.update_total()
total = po.get_total()

print(f"✅ PO #{po.id} created")
print(f"   Vendor: {po.vendor.name}")
print(f"   Project: {po.project_name}")
print(f"   Total: ${total:,.2f}")
print(f"   Status: {po.status}")

# Mark as received
print("\n2. Marking PO as RECEIVED...")
po.status = PurchaseOrder.Status.RECEIVED
po.save()

# Check if signal created journal entry
if not po.journal_entry:
    print("⚠️  No journal entry from signal - creating manually...")
    try:
        entry = po.create_accounting_entry()
        print(f"✅ Manual journal entry created: #{entry.id}")
    except Exception as e:
        print(f"❌ Failed: {e}")
else:
    print(f"✅ Journal entry auto-created: #{po.journal_entry.id}")

# Verify journal entry
if po.journal_entry:
    print("\n3. Verifying journal entry...")
    entry = po.journal_entry
    print(f"   Reference: {entry.reference}")
    print(f"   Total Debit: ${entry.total_debit():,.2f}")
    print(f"   Total Credit: ${entry.total_credit():,.2f}")
    print(f"   Balanced: {entry.is_balanced()}")
    
    print("\n   Lines:")
    for line in entry.lines.all():
        print(f"     {line.account.code} - {line.account.name}")
        print(f"       DR: ${line.debit:,.2f}  CR: ${line.credit:,.2f}")

# Check AP account
print("\n4. Checking Accounts Payable balance...")
try:
    ap_account = Account.objects.get(company=company, code='401')
    print(f"✅ AP Account (401) balance: ${ap_account.balance:,.2f}")
except Account.DoesNotExist:
    print("❌ AP account not found")

# Record a payment
print("\n5. Recording payment...")
payment = PurchasePayment.objects.create(
    purchase_order=po,
    amount=total * Decimal('0.5'),
    payment_date=date.today(),
    payment_method=PurchasePayment.PaymentMethod.BANK,
    reference="BANK-TRF-001",
    notes="Partial payment via bank transfer"
)

print(f"✅ Payment #{payment.id} created")
print(f"   Amount: ${payment.amount:,.2f}")

# Check if payment created journal entry
if not payment.journal_entry:
    print("⚠️  No payment journal entry - creating manually...")
    try:
        entry = payment.create_accounting_entry()
        print(f"✅ Manual payment entry created: #{entry.id}")
    except Exception as e:
        print(f"❌ Failed: {e}")
else:
    print(f"✅ Payment journal entry auto-created: #{payment.journal_entry.id}")

# Check PO status
po.refresh_from_db()
print(f"\n6. PO status after payment:")
print(f"   Status: {po.status}")
print(f"   Total: ${po.get_total():,.2f}")
print(f"   Paid: ${po.get_total_paid():,.2f}")
print(f"   Balance Due: ${po.get_balance_due():,.2f}")

# Check AP balance again
ap_account.refresh_from_db()
print(f"\n7. Updated AP balance: ${ap_account.balance:,.2f}")

# Verify expense account
print("\n8. Checking Expense account...")
try:
    expense_account = Account.objects.get(company=company, code='60')
    print(f"✅ Expense Account (60) balance: ${expense_account.balance:,.2f}")
except Account.DoesNotExist:
    print("❌ Expense account not found")

print("\n" + "=" * 70)
print("TEST COMPLETE!")
print("=" * 70)
