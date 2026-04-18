from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from invoicing.models import Invoice
from debts.models import Debt
from notifications.utils import send_push_notification

class Command(BaseCommand):
    help = 'Check for due invoices and debts and send notifications'

    def handle(self, *args, **options):
        today = timezone.now().date()
        
        # 1. Invoices due in 3 days
        due_date_threshold = today + timedelta(days=3)
        due_invoices = Invoice.objects.filter(due_date=due_date_threshold, status='SENT')
        
        for invoice in due_invoices:
            # Assuming invoice linked to a customer, but notification goes to internal user?
            # Or if we had customer emails. For now, let's notify the creator of the invoice.
            # We don't have creator tracked on Invoice yet explicitly? Let's check model.
            # Checking implementation... we don't capture `created_by`.
            # Let's Skip invoice notification for now or broadcast to admins?
            # Let's just print for now as we refine user targeting.
            self.stdout.write(f"Invoice {invoice.invoice_number} due soon.")

        # 2. Debts due today
        due_debts = Debt.objects.filter(due_date=today, status__in=['PENDING', 'PARTIAL'])
        for debt in due_debts:
            if debt.user:
                title = "Debt Due Today"
                body = f"Reminder: You have a debt of ${debt.amount} to {debt.counterparty_name} due today."
                
                # Send Push
                sent = send_push_notification(debt.user, title, body)
                if sent:
                    self.stdout.write(f"Sent reminder for Debt {debt.id}")
                else:
                    self.stdout.write(f"Failed to send reminder for Debt {debt.id}")
