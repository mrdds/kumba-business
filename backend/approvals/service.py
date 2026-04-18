from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from django.utils import timezone
from .models import ApprovalDefinition, ApprovalRequest, ApprovalStep, ApprovalLog

class ApprovalService:
    @staticmethod
    def submit_for_approval(obj, user):
        """
        Submit an object for approval.
        1. Find matching ApprovalDefinition.
        2. Create ApprovalRequest.
        3. Set initial step.
        4. Update object status if applicable.
        """
        company = user.company
        content_type = ContentType.objects.get_for_model(obj)
        
        # 1. Find Definition
        # Logic: Find definition for this model.
        # Priority: Specific Subtype (e.g. BILL) > Generic
        
        amount = getattr(obj, 'total_amount', getattr(obj, 'amount', 0))
        subtype = getattr(obj, 'document_type', None)
        
        definition = None
        base_qs = ApprovalDefinition.objects.filter(
            company=company,
            content_type=content_type,
            is_active=True
        )

        # 1a. Specific Subtype Match
        if subtype:
             definition = base_qs.filter(
                document_subtype=subtype,
                trigger_amount_min__lte=amount
             ).order_by('-trigger_amount_min').first()
             
        # 1b. Generic Match (subtype is null)
        if not definition:
             definition = base_qs.filter(
                document_subtype__isnull=True,
                trigger_amount_min__lte=amount
             ).order_by('-trigger_amount_min').first()

        if not definition:
            # No workflow defined for this object/amount
            return None

        # 2. Check if already pending
        existing = ApprovalRequest.objects.filter(
            company=company,
            content_type=content_type,
            object_id=obj.id,
            status=ApprovalRequest.Status.PENDING
        ).first()
        
        if existing:
            return existing

        with transaction.atomic():
            # 3. Create Request
            first_step = definition.steps.order_by('order').first()
            
            req = ApprovalRequest.objects.create(
                company=company,
                content_type=content_type,
                object_id=obj.id,
                definition=definition,
                status=ApprovalRequest.Status.PENDING,
                current_step=first_step,
                created_by=user
            )
            
            # Log
            ApprovalLog.objects.create(
                request=req,
                actor=user,
                action=ApprovalLog.Action.SUBMIT,
                comments="Submitted for approval"
            )
            
            # Update Object Status
            if hasattr(obj, 'status'):
               pass # We rely on caller or finalize for status updates? 
               # Or we can setting 'PENDING_APPROVAL' if model supports it.
               
            return req

    @staticmethod
    def approve(request_id, user, comments=""):
        req = ApprovalRequest.objects.get(id=request_id)
        
        if req.status != ApprovalRequest.Status.PENDING:
            raise ValueError("Request is not pending")
            
        current_step = req.current_step
        if not current_step:
             return req
             
        with transaction.atomic():
            # Log approval
            ApprovalLog.objects.create(
                request=req,
                actor=user,
                action=ApprovalLog.Action.APPROVE,
                step=current_step,
                comments=comments
            )
            
            # Move to next step
            next_step = ApprovalStep.objects.filter(
                definition=req.definition,
                order__gt=current_step.order
            ).order_by('order').first()
            
            if next_step:
                req.current_step = next_step
                req.save()
            else:
                # Fully Approved
                req.status = ApprovalRequest.Status.APPROVED
                req.current_step = None
                req.save()
                
                # Update Source Object Status
                ApprovalService._finalize_object_status(req.content_object, 'APPROVED')
                
        return req

    @staticmethod
    def reject(request_id, user, comments=""):
        req = ApprovalRequest.objects.get(id=request_id)
        
        if req.status != ApprovalRequest.Status.PENDING:
            raise ValueError("Request is not pending")
            
        with transaction.atomic():
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
            
            # Update Source Object Status
            ApprovalService._finalize_object_status(req.content_object, 'REJECTED')
            
        return req
        
    @staticmethod
    def _finalize_object_status(obj, status_type):
        """
        Helper to update the model status based on approval result.
        Adapts to different models (Invoice, PO, etc.)
        """
        model_name = obj.__class__.__name__
        
        if status_type == 'APPROVED':
            # Priority: Check if model has custom 'approve' method
            if hasattr(obj, 'approve') and callable(obj.approve):
                obj.approve()
                # We assume approve() sets the status, but if not, we can fall back?
                # Usually approve() handles everything.
                return

            if model_name == 'Invoice':
                # Invoice: Validated / Ready to Send
                if hasattr(obj, 'status'):
                    obj.status = 'SENT' 
            elif model_name == 'PurchaseOrder':
                if hasattr(obj, 'status'):
                    obj.status = 'SENT' # Ready to be sent to vendor
            elif model_name == 'Quote':
                if hasattr(obj, 'status'):
                    # Quote approved internally -> Ready to send to customer
                    obj.status = 'SENT' 
            elif model_name == 'PayrollRun':
                # Should be handled by .approve(), but fallback
                if hasattr(obj, 'status'):
                    obj.status = 'APPROVED'
            elif model_name == 'SalaryAdvance': # AdvanceRequest model name check
                 if hasattr(obj, 'status'):
                    obj.status = 'APPROVED'
                    
        elif status_type == 'REJECTED':
            if hasattr(obj, 'status'):
                if model_name in ['Invoice', 'PurchaseOrder', 'Quote']:
                    obj.status = 'DRAFT' # Revert to draft
                else:
                    obj.status = 'REJECTED'
        
        obj.save()
