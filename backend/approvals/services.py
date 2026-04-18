from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from django.core.exceptions import ValidationError
from .models import ApprovalDefinition, ApprovalRequest, ApprovalStep, ApprovalLog
from companies.models import Company

class ApprovalService:
    @staticmethod
    def get_definition(obj):
        """
        Find the active approval definition for an object.
        Checks ContentType and optionally amount thresholds.
        """
        ctype = ContentType.objects.get_for_model(obj)
        
        # Get definitions for this model and company
        # Filter by company if obj has company
        company = getattr(obj, 'company', None)
        if not company:
            return None # Cannot determine company context
            
        definitions = ApprovalDefinition.objects.filter(
            company=company,
            content_type=ctype,
            is_active=True
        ).order_by('-trigger_amount_min')
        
        # Check amount threshold if applicable
        amount = getattr(obj, 'total_amount', getattr(obj, 'amount', 0))
        
        for definition in definitions:
            if amount >= definition.trigger_amount_min:
                return definition
                
        return None

    @staticmethod
    @transaction.atomic
    def initiate_approval(obj, user):
        """
        Submit an object for approval.
        """
        definition = ApprovalService.get_definition(obj)
        if not definition:
            # No approval needed, auto-approve? 
            # For now, we return None indicating no flow started.
            return None
            
        steps = definition.steps.all().order_by('order')
        if not steps.exists():
            return None
            
        first_step = steps.first()
        
        # Create Request
        request = ApprovalRequest.objects.create(
            company=definition.company,
            content_type=definition.content_type,
            object_id=obj.id,
            definition=definition,
            status=ApprovalRequest.Status.PENDING,
            current_step=first_step,
            created_by=user
        )
        
        # Log submission
        ApprovalLog.objects.create(
            request=request,
            actor=user,
            action=ApprovalLog.Action.SUBMIT,
            step=first_step,
            comments="Submitted for approval"
        )
        
        return request

    @staticmethod
    @transaction.atomic
    def approve_request(request_id, user, comments=""):
        try:
            req = ApprovalRequest.objects.get(id=request_id)
        except ApprovalRequest.DoesNotExist:
            raise ValidationError("Request not found")

        if req.status != ApprovalRequest.Status.PENDING:
            raise ValidationError("Request is not pending")
            
        current_step = req.current_step
        if not current_step:
            raise ValidationError("Invalid state: Pending but no step")

        # Validate permission
        # TODO: Check if user has the role required by current_step
        # For MVP, we skip strict role check or assume it's checked by API
        
        # Log Approval
        ApprovalLog.objects.create(
            request=req,
            actor=user,
            action=ApprovalLog.Action.APPROVE,
            step=current_step,
            comments=comments
        )
        
        # Move to next step
        next_step = req.definition.steps.filter(order__gt=current_step.order).order_by('order').first()
        
        if next_step:
            req.current_step = next_step
            req.save()
            return req, False # Not finalized yet
        else:
            # Final Approval
            req.status = ApprovalRequest.Status.APPROVED
            req.current_step = None
            req.save()
            
            # TRIGGER FINAL ACTION HERE (e.g. Update PO status)
            # This could be handled by signals or explicit calls
            
            return req, True # Finalized

    @staticmethod
    @transaction.atomic
    def reject_request(request_id, user, comments=""):
        req = ApprovalRequest.objects.get(id=request_id)
        
        if req.status != ApprovalRequest.Status.PENDING:
            raise ValidationError("Request is not pending")
            
        req.status = ApprovalRequest.Status.REJECTED
        req.current_step = None
        req.save()
        
        ApprovalLog.objects.create(
            request=req,
            actor=user,
            action=ApprovalLog.Action.REJECT,
            step=req.current_step,
            comments=comments
        )
        
        return req
