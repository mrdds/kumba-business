from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Invoice, InvoicePayment
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Invoice)
def create_invoice_journal_entry(sender, instance, created, **kwargs):
    """
    Automatically create journal entry when invoice status changes to SENT
    """
    # Only create entry when invoice is sent and doesn't have an entry yet
    if instance.status == Invoice.Status.SENT and not instance.journal_entry:
        try:
            instance.create_accounting_entry()
            logger.info(f"Created journal entry for Invoice #{instance.id}")
        except Exception as e:
            logger.error(f"Failed to create journal entry for Invoice #{instance.id}: {e}")
            # Don't raise - allow invoice to be saved even if accounting fails
            # In production, you might want to queue this for retry


@receiver(post_save, sender=InvoicePayment)
def create_payment_journal_entry(sender, instance, created, **kwargs):
    """
    Automatically create journal entry when payment is recorded
    """
    if created and not instance.journal_entry:
        try:
            instance.create_accounting_entry()
            logger.info(f"Created journal entry for Payment #{instance.id}")
        except Exception as e:
            logger.error(f"Failed to create journal entry for Payment #{instance.id}: {e}")
