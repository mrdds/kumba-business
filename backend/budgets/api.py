from typing import List
from ninja import Schema
from ninja_extra import ControllerBase, api_controller, route
from datetime import date
from django.db.models import Sum
from .models import Budget
from accounting.models import Transaction

class BudgetCreateSchema(Schema):
    category: str
    amount_limit: float
    period_start: date
    period_end: date

class BudgetOutSchema(Schema):
    id: int
    category: str
    amount_limit: float
    spent: float
    remaining: float
    percentage: float
    period_start: date
    period_end: date

@api_controller('/budgets', tags=['Budgets'])
class BudgetController(ControllerBase):

    @route.get('', response=List[BudgetOutSchema])
    def list_budgets(self, request):
        company = request.user.company
        budgets = Budget.objects.filter(company=company)
        
        result = []
        for budget in budgets:
            # Calculate spent amount
            spent_aggr = Transaction.objects.filter(
                company=company,
                type='OUT',
                category=budget.category,
                date__gte=budget.period_start,
                date__lte=budget.period_end
            ).aggregate(total=Sum('amount'))
            
            spent = float(spent_aggr['total'] or 0)
            remaining = float(budget.amount_limit) - spent
            percentage = (spent / float(budget.amount_limit)) * 100 if budget.amount_limit > 0 else 0
            
            result.append({
                "id": budget.id,
                "category": budget.category,
                "amount_limit": budget.amount_limit,
                "spent": spent,
                "remaining": remaining,
                "percentage": min(percentage, 100), # Cap at 100 for display safety, or let UI handle over 100
                "period_start": budget.period_start,
                "period_end": budget.period_end
            })
            
        return result

    @route.post('', response=BudgetOutSchema)
    def create_budget(self, request, payload: BudgetCreateSchema):
        budget = Budget.objects.create(
            company=request.user.company,
            **payload.dict()
        )
        # Initial state return
        return {
            "id": budget.id,
            "category": budget.category,
            "amount_limit": budget.amount_limit,
            "spent": 0.0,
            "remaining": budget.amount_limit,
            "percentage": 0.0,
            "period_start": budget.period_start,
            "period_end": budget.period_end
        }
