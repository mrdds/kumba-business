from django.db import models
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.conf import settings
from companies.models import Company

class ApprovalDefinition(models.Model):
    """
    Defines which models require approval and under what conditions.
    """
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='approval_definitions')
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    
    # Optional: Trigger conditions
    trigger_amount_min = models.DecimalField(
        max_digits=15, 
        decimal_places=2, 
        default=0,
        help_text="Minimum amount to trigger this workflow. 0 for all."
    )
    
    # Optional: Document Subtype (e.g. 'BILL' vs 'PO' for PurchaseOrder)
    document_subtype = models.CharField(
        max_length=50, 
        null=True, 
        blank=True,
        help_text="Specific subtype if model is generic (e.g. BILL, PO)"
    )
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('company', 'content_type', 'trigger_amount_min', 'document_subtype')

    def __str__(self):
        subtype_str = f" ({self.document_subtype})" if self.document_subtype else ""
        return f"{self.content_type.model.upper()}{subtype_str} Approval (> {self.trigger_amount_min})"


class ApprovalStep(models.Model):
    """
    A specific step in an approval workflow (e.g., Step 1: Manager).
    """
    definition = models.ForeignKey(ApprovalDefinition, on_delete=models.CASCADE, related_name='steps')
    order = models.PositiveIntegerField(default=1)
    
    # Who approves?
    # Ideally linked to a Role or Group. providing simple string key for now users.models.Role
    role_required = models.CharField(max_length=50, blank=True, help_text="e.g. MANAGER, FINANCE, DIRECTOR")
    
    # Or specific user
    approver_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL,
        related_name='assigned_approval_steps'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Step {self.order}: {self.role_required or self.approver_user}"


class ApprovalRequest(models.Model):
    """
    An instance of an object waiting for approval.
    """
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
        CANCELLED = 'CANCELLED', 'Cancelled'

    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    
    # The object being approved
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Workflow state
    definition = models.ForeignKey(ApprovalDefinition, on_delete=models.PROTECT)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    
    # Progress
    current_step = models.ForeignKey(ApprovalStep, on_delete=models.SET_NULL, null=True, blank=True)
    
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='approval_requests')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Request for {self.content_type.model} #{self.object_id} ({self.status})"


class ApprovalLog(models.Model):
    """
    Audit trail for approval actions.
    """
    class Action(models.TextChoices):
        SUBMIT = 'SUBMIT', 'Submitted'
        APPROVE = 'APPROVE', 'Approved'
        REJECT = 'REJECT', 'Rejected'
        CANCEL = 'CANCEL', 'Cancelled'

    request = models.ForeignKey(ApprovalRequest, on_delete=models.CASCADE, related_name='logs')
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=20, choices=Action.choices)
    step = models.ForeignKey(ApprovalStep, on_delete=models.SET_NULL, null=True, blank=True)
    
    comments = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.actor} {self.action} {self.request}"
