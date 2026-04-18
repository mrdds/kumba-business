from typing import List, Optional
from ninja import Router, Schema
from django.shortcuts import get_object_or_404
from ninja_jwt.authentication import JWTAuth
from .models import ApprovalRequest, ApprovalLog, ApprovalDefinition, ApprovalStep
from .service import ApprovalService
from django.db.models import Q
from companies.models import Company

router = Router(auth=JWTAuth())

class ApprovalStepSchema(Schema):
    order: int
    role_required: Optional[str]

class ApprovalRequestOut(Schema):
    id: int
    content_type_model: str
    object_id: int
    status: str
    current_step_order: Optional[int]
    created_by_email: Optional[str]
    created_at: str

    @staticmethod
    def resolve_content_type_model(obj):
        return obj.content_type.model if obj.content_type else "unknown"
        
    @staticmethod
    def resolve_current_step_order(obj):
        return obj.current_step.order if obj.current_step else None

    @staticmethod
    def resolve_created_by_email(obj):
        try:
            return obj.created_by.email if obj.created_by else None
        except:
            return None

class ActionIn(Schema):
    comments: str = ""

@router.get("/pending", response=List[dict])
def list_pending_approvals(request):
    try:
        user = request.user
        qs = ApprovalRequest.objects.select_related(
            'company', 'content_type', 'current_step', 'created_by'
        ).filter(
            company=user.company,
            status=ApprovalRequest.Status.PENDING
        )
        
        # Filter: Designated approvers only (unless Super Admin/Admin? User said "seul les approuveurs designés")
        # Let's stick to the designated role/user in current_step
        qs = qs.filter(
            Q(current_step__role_required=user.role) | 
            Q(current_step__approver_user=user)
        )
        
        # Manually serialize to catch errors
        results = []
        for obj in qs:
            try:
                # Resolve document type label
                doc_label = obj.content_type.model
                description = ""
                
                if doc_label == 'purchaseorder':
                    try:
                        # Access the related object to check document_type and vendor
                        po = obj.content_object
                        if hasattr(po, 'document_type'):
                             dt = po.document_type
                             if dt == 'BILL':
                                 doc_label = 'Vendor Bill'
                             elif dt == 'PO':
                                 doc_label = 'Purchase Order'
                        
                        # Add Vendor Info
                        if hasattr(po, 'vendor'):
                            description = f"Vendor: {po.vendor.name}"
                            if po.project_name:
                                description += f" • {po.project_name}"
                    except:
                        pass
                elif doc_label == 'payrollrun':
                    doc_label = 'Payroll Run'
                    description = f"Period: {obj.content_object.period_start} - {obj.content_object.period_end}"
                elif doc_label == 'quote':
                    doc_label = 'Quote'
                    description = f"Customer: {obj.content_object.customer_name}"

                item = {
                    "id": obj.id,
                    "content_type_model": obj.content_type.model if obj.content_type else "unknown",
                    "object_id": obj.object_id,
                    "document_type_label": doc_label.title() if doc_label == 'purchaseorder' else doc_label,
                    "description": description,
                    "status": obj.status,
                    "current_step_order": obj.current_step.order if obj.current_step else None,
                    "created_by_email": obj.created_by.email if obj.created_by else None,
                    "created_by_name": f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() if obj.created_by else "System",
                    "created_at": str(obj.created_at)
                }
                results.append(item)
            except Exception as inner_e:
                with open("error_trace.log", "a") as f:
                    f.write(f"Error serializing ID {obj.id}: {inner_e}\n")
        
        return results

    except Exception as e:
        with open("error_trace.log", "a") as f:
            import traceback
            traceback.print_exc(file=f)
        raise e

@router.post("/{id}/approve", response={200: dict, 403: dict})
def approve_request(request, id: int, payload: ActionIn):
    try:
        req = ApprovalService.approve(id, request.user, payload.comments)
        
        # Manually serialize to avoid schema validation errors causing 500s
        return {
            "id": req.id,
            "content_type_model": req.content_type.model if req.content_type else "unknown",
            "object_id": req.object_id,
            "status": req.status,
            "current_step_order": req.current_step.order if req.current_step else None,
            "created_by_email": req.created_by.email if req.created_by else None,
            "created_at": str(req.created_at)
        }
    except Exception as e:
        with open("error_trace.log", "a") as f:
            f.write(f"Approval Error ID {id}: {e}\n")
            import traceback
            traceback.print_exc(file=f)
        raise e

@router.post("/{id}/reject", response={200: dict, 403: dict})
def reject_request(request, id: int, payload: ActionIn):
    try:
        req = ApprovalService.reject(id, request.user, payload.comments)
        
        return {
            "id": req.id,
            "content_type_model": req.content_type.model if req.content_type else "unknown",
            "object_id": req.object_id,
            "status": req.status,
            "current_step_order": req.current_step.order if req.current_step else None,
            "created_by_email": req.created_by.email if req.created_by else None,
            "created_at": str(req.created_at)
        }
    except Exception as e:
        return 403, {"message": str(e)}

@router.get("/{id}/timeline", response=dict)
def get_approval_timeline(request, id: int):
    req = get_object_or_404(ApprovalRequest, id=id, company=request.user.company)
    
    # 1. Get Logs (Completed steps)
    logs = req.logs.select_related('actor', 'step').order_by('timestamp')
    history = []
    for log in logs:
        history.append({
            "action": log.action,
            "actor_name": f"{log.actor.first_name} {log.actor.last_name}".strip() if log.actor else "System",
            "step_order": log.step.order if log.step else None,
            "comments": log.comments,
            "timestamp": log.timestamp.isoformat()
        })
        
    # 2. Get All Steps from Definition to show progress
    all_steps = req.definition.steps.order_by('order')
    steps_list = []
    for step in all_steps:
        status = 'PENDING'
        if req.status == ApprovalRequest.Status.APPROVED:
            status = 'COMPLETED'
        elif req.status == ApprovalRequest.Status.REJECTED:
             # If rejected at this step or before
             if req.current_step and step.order > req.current_step.order:
                 status = 'FUTURE'
             elif req.current_step and step.order == req.current_step.order:
                 status = 'REJECTED'
             else:
                 status = 'COMPLETED'
        elif req.current_step:
            if step.order < req.current_step.order:
                status = 'COMPLETED'
            elif step.order == req.current_step.order:
                status = 'CURRENT'
            else:
                status = 'FUTURE'
        else:
            # Should not happen for pending
            status = 'COMPLETED' if req.status == 'APPROVED' else 'PENDING'
                
        steps_list.append({
            "order": step.order,
            "role": step.role_required,
            "approver": f"{step.approver_user.first_name} {step.approver_user.last_name}".strip() if step.approver_user else None,
            "status": status
        })
        
    return {
        "id": req.id,
        "status": req.status,
        "history": history,
        "steps": steps_list
    }
