from typing import List, Optional
from ninja import Schema
from ninja_extra import ControllerBase, api_controller, route
from django.shortcuts import get_object_or_404
from django.core.exceptions import PermissionDenied
from datetime import date
from django.db.models import Sum
from .models import Budget, BudgetItem
from core.security.decorators import has_permission
from django.db import transaction

class BudgetItemSchema(Schema):
    description: str
    quantity: float = 1
    unit_price: float

class BudgetItemOutSchema(Schema):
    id: int
    description: str
    quantity: float
    unit_price: float
    amount: float

class BudgetCreateSchema(Schema):
    category: str
    project_name: Optional[str] = ""
    amount_limit: Optional[float] = 0
    period_start: date
    period_end: date
    description: Optional[str] = ""
    items: Optional[List[BudgetItemSchema]] = []

class BudgetOutSchema(Schema):
    id: int
    category: str
    project_name: Optional[str]
    amount_limit: float
    current_amount: float
    status: str
    period_start: date
    period_end: date
    description: str
    items: List[BudgetItemOutSchema]

@api_controller('/budgets', tags=['Budgets'])
class BudgetController(ControllerBase):

    @route.get('', response=List[BudgetOutSchema])
    @has_permission('view', 'budget')
    def list_budgets(self, request):
        return Budget.objects.filter(company=request.user.company).prefetch_related('items')

    @route.post('', response=BudgetOutSchema)
    @has_permission('create', 'budget')
    @transaction.atomic
    def create_budget(self, request, payload: BudgetCreateSchema):
        data = payload.dict()
        items_data = data.pop('items', [])
        
        budget = Budget.objects.create(
            company=request.user.company,
            **data
        )
        
        total_limit = 0
        for item in items_data:
            BudgetItem.objects.create(budget=budget, **item)
            total_limit += item['quantity'] * item['unit_price']
        
        if items_data:
            budget.amount_limit = total_limit
            budget.save()
            
        return budget

    @route.put('/{budget_id}', response=BudgetOutSchema)
    @has_permission('edit', 'budget')
    @transaction.atomic
    def update_budget(self, request, budget_id: int, payload: BudgetCreateSchema):
        budget = get_object_or_404(Budget, id=budget_id, company=request.user.company)
        
        if budget.status == 'APPROVED':
            raise PermissionDenied("Cannot modify an approved budget")
            
        data = payload.dict()
        items_data = data.pop('items', [])
        
        for attr, value in data.items():
            setattr(budget, attr, value)
        
        # Replace items
        budget.items.all().delete()
        total_limit = 0
        for item in items_data:
            BudgetItem.objects.create(budget=budget, **item)
            total_limit += item['quantity'] * item['unit_price']
            
        if items_data:
            budget.amount_limit = total_limit
            
        budget.save()
        return budget

    @route.delete('/{budget_id}', response={204: None})
    @has_permission('delete', 'budget')
    def delete_budget(self, request, budget_id: int):
        budget = get_object_or_404(Budget, id=budget_id, company=request.user.company)
        
        if budget.status == 'APPROVED':
            raise PermissionDenied("Cannot delete an approved budget")
            
        budget.delete()
        return 204, None

    @route.post('/{budget_id}/submit', response={200: dict})
    @has_permission('approve', 'budget')
    def submit_budget(self, request, budget_id: int):
        from approvals.service import ApprovalService
        budget = get_object_or_404(Budget, id=budget_id, company=request.user.company)
        
        # Submit to approval engine
        req = ApprovalService.submit_for_approval(budget, request.user)
        
        if not req:
            # Auto-approve if no workflow defined
            budget.status = 'APPROVED'
            budget.save()
            return {"success": True, "message": "Budget approved automatically (no workflow defined)"}
        
        # ApprovalService already sets status to PENDING if req is created
        return {"success": True, "request_id": req.id}
