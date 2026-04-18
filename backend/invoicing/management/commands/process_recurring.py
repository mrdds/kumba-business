from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from invoicing.models import RecurringInvoice, Invoice, InvoiceItem

class Command(BaseCommand):
    help = 'Process recurring invoices that are due'

    def handle(self, *args, **options):
        today = timezone.now().date()
        recurring_list = RecurringInvoice.objects.filter(
            status=RecurringInvoice.Status.ACTIVE,
            next_run_date__lte=today
        )

        self.stdout.write(f"Found {recurring_list.count()} invoices to process.")

        for recurring in recurring_list:
            try:
                self.process_invoice(recurring)
                self.stdout.write(self.style.SUCCESS(f"Processed recurring invoice #{recurring.id}"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error processing #{recurring.id}: {str(e)}"))

    def process_invoice(self, recurring):
        base = recurring.base_invoice
        
        # 1. Create New Invoice
        new_invoice = Invoice.objects.create(
            company=recurring.company,
            customer=base.customer,
            client_name=base.client_name,
            client_email=base.client_email,
            date=recurring.next_run_date,
            due_date=recurring.next_run_date + timedelta(days=30), # Default 30 days
            status=Invoice.Status.DRAFT # Or SENT if auto-send is enabled
        )

        # 2. Clone Items
        for item in base.items.all():
            InvoiceItem.objects.create(
                invoice=new_invoice,
                description=item.description,
                quantity=item.quantity,
                unit_price=item.unit_price,
                amount=item.amount
            )

        # 3. Update Next Run Date
        if recurring.frequency == RecurringInvoice.Frequency.WEEKLY:
            recurring.next_run_date += timedelta(weeks=1)
        elif recurring.frequency == RecurringInvoice.Frequency.MONTHLY:
            # Simple month add (doesn't handle end of month edge cases perfectly but good enough for MVP)
            import calendar
            days_in_month = calendar.monthrange(recurring.next_run_date.year, recurring.next_run_date.month)[1]
            recurring.next_run_date += timedelta(days=days_in_month)
        elif recurring.frequency == RecurringInvoice.Frequency.YEARLY:
            recurring.next_run_date = recurring.next_run_date.replace(year=recurring.next_run_date.year + 1)
        
        recurring.save()
