from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import PurchaseOrder, PurchasePayment
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=PurchaseOrder)
def create_po_journal_entry(sender, instance, created, **kwargs):
    """
    Automatically create journal entry when PO status changes to RECEIVED
    """
    # Only create entry when PO is received and doesn't have an entry yet
    if instance.status == PurchaseOrder.Status.RECEIVED and not instance.journal_entry:
        try:
            instance.create_accounting_entry()
            logger.info(f"Created journal entry for PO #{instance.id}")
        except Exception as e:
            logger.error(f"Failed to create journal entry for PO #{instance.id}: {e}")


@receiver(post_save, sender=PurchasePayment)
def create_purchase_payment_journal_entry(sender, instance, created, **kwargs):
    """
    Automatically create journal entry when payment is recorded
    """
    if created and not instance.journal_entry:
        try:
            instance.create_accounting_entry()
            logger.info(f"Created journal entry for Purchase Payment #{instance.id}")
        except Exception as e:
            logger.error(f"Failed to create journal entry for Purchase Payment #{instance.id}: {e}")
