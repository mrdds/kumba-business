import os
import django
from django.conf import settings
from datetime import date, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kumba_backend.settings')
django.setup()

from users.models import CustomUser
from invoicing.models import Invoice, InvoiceItem, RecurringInvoice
from django.core.management import call_command
from ninja import NinjaAPI
from django.test import RequestFactory
from invoicing.api import InvoiceController
from ninja_jwt.tokens import AccessToken

def verify_recurring():
    print("Verifying Recurring Invoices...")
    
    # 1. Setup Data
    user = CustomUser.objects.first()
    if not user:
        print("No user found.")
        return

    # Create base invoice
    base_invoice = Invoice.objects.create(
        company=user.company,
        client_name="Recurring Client",
        client_email="recurring@example.com",
        date=date.today(),
        due_date=date.today(),
        status="SENT"
    )
    InvoiceItem.objects.create(invoice=base_invoice, description="Service Subscription", quantity=1, unit_price=100.00, amount=100.00)
    print(f"Created Base Invoice #{base_invoice.id}")

    # 2. Call API to Create Schedule
    factory = RequestFactory()
    payload = InvoiceController.RecurringInvoiceSchema(
        frequency=RecurringInvoice.Frequency.MONTHLY,
        start_date=date.today() # Due today
    )
    
    controller = InvoiceController()
    request = factory.post(f'/api/invoices/{base_invoice.id}/recurring')
    request.user = user
    request.auth = AccessToken.for_user(user) # Mock auth
    
    status, response = controller.create_recurring(request, base_invoice.id, payload)
    print(f"API Response: {status} {response}")
    
    if status != 201:
        print("Failed to create schedule")
        return

    # 3. Run Management Command
    print("Running process_recurring command...")
    call_command('process_recurring')

    # 4. Verify New Invoice Created
    new_invoices = Invoice.objects.filter(client_name="Recurring Client").exclude(id=base_invoice.id)
    if new_invoices.exists():
        new_inv = new_invoices.first()
        print(f"✅ Success! New Invoice #{new_inv.id} created for {new_inv.date}")
        print(f"   Items: {new_inv.items.first()}")
    else:
        print("❌ Failed: No new invoice created.")

    # 5. Verify Next Run Date Updated
    recurring = RecurringInvoice.objects.get(id=response['id'])
    print(f"Next Run Date: {recurring.next_run_date} (Expected: {date.today() + timedelta(days=31) if date.today().month in [1,3,5,7,8,10,12] else 'approx 30 days'})")

if __name__ == "__main__":
    verify_recurring()
