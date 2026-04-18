import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kumba_backend.settings')
django.setup()

from invoicing.models import Invoice

def check_invoices():
    # Find invoice for client 'Direct Test Client'
    invoices = Invoice.objects.filter(client_name__icontains='Direct')
    
    if not invoices.exists():
        print("No invoices found for 'Direct Test Client'")
        # Try listing all to see if name is slightly different
        print("Available clients:", list(Invoice.objects.values_list('client_name', flat=True)))
        return

    for inv in invoices:
        print(f"\n--- Invoice #{inv.id} ---")
        print(f"Client: {inv.client_name}")
        print(f"Status: {inv.status}")
        
        total = inv.get_total()
        paid = inv.get_total_paid()
        due = inv.get_balance_due()
        
        print(f"Total: {total}")
        print(f"Paid: {paid}")
        print(f"Due: {due}")
        
        print("Items:")
        for item in inv.items.all():
            print(f" - {item.description}: {item.quantity} x {item.unit_price} = {item.amount}")
            
        print("Payments:")
        for pay in inv.payments.all():
            print(f" - Date: {pay.payment_date} Amount: {pay.amount} Method: {pay.payment_method}")

if __name__ == '__main__':
    check_invoices()
