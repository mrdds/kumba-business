import os
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kumba_backend.settings')
django.setup()

# Override Email Backend to LocMem to capture emails in memory
settings.EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

from users.models import CustomUser, Company
from invoicing.models import Invoice
from django.core import mail
from ninja import NinjaAPI
from django.test import RequestFactory
from invoicing.api import InvoiceController
from ninja_jwt.tokens import AccessToken

def verify_email():
    print("Verifying Email Integration...")
    
    # 1. Setup Data
    user = CustomUser.objects.first()
    if not user:
        print("No user found. Please run migrations/setup first.")
        return

    # Create dummy invoice
    invoice = Invoice.objects.create(
        company=user.company,
        client_name="Test Client",
        client_email="testclient@example.com",
        date="2026-01-01",
        due_date="2026-02-01",
        status="SENT"
    )
    print(f"Created Invoice #{invoice.id}")

    # 2. Mock Request
    factory = RequestFactory()
    request = factory.post(f'/api/invoices/{invoice.id}/send-email')
    request.user = user
    request.auth = AccessToken.for_user(user)

    # 3. Call Controller directly
    controller = InvoiceController()
    status, response = controller.send_email(request, invoice.id)
    
    print(f"API Response: {status} {response}")

    # 4. Verify Email Sent
    if len(mail.outbox) > 0:
        email = mail.outbox[0]
        print(f"✅ Email Successfully Sent!")
        print(f"To: {email.to}")
        print(f"Subject: {email.subject}")
        print(f"Body: {email.body[:50]}...")
    else:
        print("❌ No email found in outbox.")

if __name__ == "__main__":
    verify_email()
