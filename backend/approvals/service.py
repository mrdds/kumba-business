from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from django.utils import timezone
from .models import ApprovalDefinition, ApprovalRequest, ApprovalStep, ApprovalLog
from notifications.utils import send_push_notification

class ApprovalService:
    @staticmethod
    def get_approval_info(obj):
        """Helper to get latest approval status and rejection comment for an object"""
        from .models import ApprovalRequest, ApprovalLog
        from django.contrib.contenttypes.models import ContentType
        
        content_type = ContentType.objects.get_for_model(obj)
        req = ApprovalRequest.objects.filter(
            content_type=content_type,
            object_id=obj.id
        ).order_by('-created_at').first()
        
        if not req:
            return None
            
        rejection_log = ApprovalLog.objects.filter(
            request=req,
            action=ApprovalLog.Action.REJECT
        ).last()
        
        return {
            "id": req.id,
            "status": req.status,
            "rejection_reason": rejection_log.comments if rejection_log else None,
            "current_step": req.current_step.order if req.current_step else None
        }

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
            if hasattr(obj, 'status') and obj.status != 'PENDING':
                obj.status = 'PENDING'
                obj.save()
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
               obj.status = 'PENDING'
               obj.save()
               
            # Send Notification to approvers
            ApprovalService._notify_approvers(req)
               
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
                
                # Notify Requester
                ApprovalService._notify_result(req, 'APPROVED')
            
            # If not fully approved, notify next approvers
            if req.status == ApprovalRequest.Status.PENDING:
                ApprovalService._notify_approvers(req)
                
        return req

    @staticmethod
    def reject(request_id, user, comments=""):
        req = ApprovalRequest.objects.get(id=request_id)
        
        if req.status != ApprovalRequest.Status.PENDING:
            raise ValueError("Request is not pending")
            
        with transaction.atomic():
            last_step = req.current_step
            req.status = ApprovalRequest.Status.REJECTED
            req.current_step = None
            req.save()
            
            ApprovalLog.objects.create(
                request=req,
                actor=user,
                action=ApprovalLog.Action.REJECT,
                step=last_step,
                comments=comments
            )
            
            # Update Source Object Status
            ApprovalService._finalize_object_status(req.content_object, 'REJECTED')
            
            # Notify Requester
            ApprovalService._notify_result(req, 'REJECTED')
            
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

    @staticmethod
    def _notify_approvers(req):
        """
        Sends push and internal notifications to designated approvers for the current step.
        """
        from users.models import CustomUser
        
        current_step = req.current_step
        if not current_step:
            return

        # Identify targets
        targets = []
        if current_step.approver_user:
            targets.append(current_step.approver_user)
        elif current_step.role_required:
            targets = list(CustomUser.objects.filter(
                company=req.company,
                role=current_step.role_required,
                is_active=True
            ))

        if not targets:
            return

        # Prepare message
        model_name = req.content_type.model.title()
        title = f"Nouvelle Approbation : {model_name}"
        body = f"Une demande d'approbation pour {model_name} #{req.object_id} attend votre validation."
        
        data = {
            "type": "APPROVAL",
            "request_id": req.id,
            "object_id": req.object_id,
            "model": req.content_type.model,
            "url": f"/approvals?id={req.id}"
        }

        for user in targets:
            # 1. Create System Notification (for In-App bell)
            from notifications.models import Notification
            Notification.objects.create(
                user=user,
                title=title,
                body=body,
                type='SYSTEM',
                status='SENT'
            )
            
            # 2. Send Push Notification (if tokens exist)
            send_push_notification(user, title, body, data)

    @staticmethod
    def _notify_result(req, status_type):
        """
        Notifies the requester of the final decision (APPROVED or REJECTED).
        """
        from notifications.models import Notification
        
        user = req.created_by
        if not user:
            return

        model_name = req.content_type.model.title()
        action_verb = "approuvée" if status_type == 'APPROVED' else "rejetée"
        title = f"Requête {action_verb} : {model_name}"
        body = f"Votre demande d'approbation pour {model_name} #{req.object_id} a été {action_verb}."
        
        data = {
            "type": "APPROVAL_RESULT",
            "request_id": req.id,
            "object_id": req.object_id,
            "status": status_type,
            "url": f"/approvals?id={req.id}"
        }

        # System Notification
        Notification.objects.create(
            user=user,
            title=title,
            body=body,
            type='SYSTEM',
            status='SENT'
        )
        
        # Push Notification
        send_push_notification(user, title, body, data)
