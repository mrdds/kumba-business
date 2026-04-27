from typing import List, Optional
from ninja import Router, Schema, File, UploadedFile, Form
from ninja_extra import ControllerBase, api_controller, route
from django.shortcuts import get_object_or_404
from django.core.exceptions import PermissionDenied
from .models import Request, Expense, Income
from datetime import date, datetime
from core.security.decorators import has_permission

class RequestSchema(Schema):
    title: str
    project_name: Optional[str] = ""
    description: Optional[str] = ""
    amount: Optional[float] = None
    request_type: str = "MONEY"

class RequestOutSchema(Schema):
    id: int
    title: str
    project_name: Optional[str]
    description: str
    amount: Optional[float]
    request_type: str
    status: str
    date: date
    requester_name: Optional[str] = None

    @staticmethod
    def resolve_requester_name(obj):
        return f"{obj.requester.first_name} {obj.requester.last_name}"

class ExpenseSchema(Schema):
    title: str
    description: Optional[str] = ""
    amount: float
    date: date
    category: Optional[str] = ""
    document_type: Optional[str] = ""
    bank_account_id: Optional[int] = None
    payment_method: Optional[str] = ""
    related_request_id: Optional[int] = None

class ExpenseOutSchema(Schema):
    id: int
    title: str
    description: str
    amount: float
    date: date
    category: str
    document_type: Optional[str]
    status: str
    payment_method: str
    attachment_url: Optional[str] = None

    @staticmethod
    def resolve_attachment_url(obj):
        return obj.attachment.url if obj.attachment else None

class IncomeSchema(Schema):
    title: str
    description: Optional[str] = ""
    amount: float
    date: date
    category: Optional[str] = ""
    bank_account_id: Optional[int] = None
    payment_method: Optional[str] = ""

class IncomeOutSchema(Schema):
    id: int
    title: str
    description: str
    amount: float
    date: date
    category: str
    status: str
    payment_method: str
    attachment_url: Optional[str] = None

    @staticmethod
    def resolve_attachment_url(obj):
        return obj.attachment.url if obj.attachment else None

@api_controller('/finance', tags=['Finance'])
class FinanceController(ControllerBase):

    # --- REQUESTS ---

    @route.get('/requests', response=List[RequestOutSchema])
    @has_permission('view', 'finance_request')
    def list_requests(self, request):
        return Request.objects.filter(company=request.user.company)

    @route.post('/requests', response=RequestOutSchema)
    @has_permission('create', 'finance_request')
    def create_request(self, request, payload: RequestSchema):
        return Request.objects.create(
            company=request.user.company,
            requester=request.user,
            **payload.dict()
        )

    @route.put('/requests/{request_id}', response=RequestOutSchema)
    @has_permission('edit', 'finance_request')
    def update_request(self, request, request_id: int, payload: RequestSchema):
        obj = get_object_or_404(Request, id=request_id, company=request.user.company)
        if obj.status in ['APPROVED', 'COMPLETED']:
            raise PermissionDenied("Cannot edit approved requests")
        for attr, value in payload.dict().items():
            setattr(obj, attr, value)
        obj.save()
        return obj

    @route.delete('/requests/{request_id}', response={204: None})
    @has_permission('delete', 'finance_request')
    def delete_request(self, request, request_id: int):
        obj = get_object_or_404(Request, id=request_id, company=request.user.company)
        if obj.status in ['APPROVED', 'COMPLETED']:
            raise PermissionDenied("Cannot delete approved requests")
        obj.delete()
        return 204, None

    @route.post('/requests/{request_id}/submit', response={200: dict})
    @has_permission('approve', 'finance_request')
    def submit_request(self, request, request_id: int):
        from approvals.service import ApprovalService
        req = get_object_or_404(Request, id=request_id, company=request.user.company)
        ApprovalService.create_request(req, request.user)
        req.status = 'PENDING'
        req.save()
        return {"success": True}

    # --- EXPENSES ---

    @route.get('/expenses', response=List[ExpenseOutSchema])
    @has_permission('view', 'expense')
    def list_expenses(self, request):
        return Expense.objects.filter(company=request.user.company)

    @route.post('/expenses', response=ExpenseOutSchema)
    @has_permission('create', 'expense')
    def create_expense(self, request, payload: ExpenseSchema = Form(...), attachment: Optional[UploadedFile] = File(None)):
        data = payload.dict()
        req_id = data.pop('related_request_id', None)
        bank_id = data.pop('bank_account_id', None)
        expense = Expense.objects.create(
            company=request.user.company,
            created_by=request.user,
            related_request_id=req_id,
            bank_account_id=bank_id,
            attachment=attachment,
            **data
        )
        return expense

    @route.put('/expenses/{expense_id}', response=ExpenseOutSchema)
    @has_permission('edit', 'expense')
    def update_expense(self, request, expense_id: int, payload: ExpenseSchema = Form(...), attachment: Optional[UploadedFile] = File(None)):
        expense = get_object_or_404(Expense, id=expense_id, company=request.user.company)
        if expense.status == 'APPROVED':
            raise PermissionDenied("Cannot modify an approved expense")
        data = payload.dict()
        req_id = data.pop('related_request_id', None)
        bank_id = data.pop('bank_account_id', None)
        for attr, value in data.items():
            setattr(expense, attr, value)
        expense.related_request_id = req_id
        expense.bank_account_id = bank_id
        if attachment:
            expense.attachment = attachment
        expense.save()
        return expense

    @route.delete('/expenses/{expense_id}', response={204: None})
    @has_permission('delete', 'expense')
    def delete_expense(self, request, expense_id: int):
        expense = get_object_or_404(Expense, id=expense_id, company=request.user.company)
        if expense.status == 'APPROVED':
            raise PermissionDenied("Cannot delete an approved expense")
        expense.delete()
        return 204, None

    # --- INCOMES (Entrées) ---

    @route.get('/incomes', response=List[IncomeOutSchema])
    @has_permission('view', 'income')
    def list_incomes(self, request):
        return Income.objects.filter(company=request.user.company)

    @route.post('/incomes', response=IncomeOutSchema)
    @has_permission('create', 'income')
    def create_income(self, request, payload: IncomeSchema = Form(...), attachment: Optional[UploadedFile] = File(None)):
        data = payload.dict()
        bank_id = data.pop('bank_account_id', None)
        income = Income.objects.create(
            company=request.user.company,
            created_by=request.user,
            bank_account_id=bank_id,
            attachment=attachment,
            **data
        )
        return income

    @route.put('/incomes/{income_id}', response=IncomeOutSchema)
    @has_permission('edit', 'income')
    def update_income(self, request, income_id: int, payload: IncomeSchema = Form(...), attachment: Optional[UploadedFile] = File(None)):
        income = get_object_or_404(Income, id=income_id, company=request.user.company)
        if income.status == 'APPROVED':
            raise PermissionDenied("Cannot modify an approved income")
        data = payload.dict()
        bank_id = data.pop('bank_account_id', None)
        for attr, value in data.items():
            setattr(income, attr, value)
        income.bank_account_id = bank_id
        if attachment:
            income.attachment = attachment
        income.save()
        return income

    @route.delete('/incomes/{income_id}', response={204: None})
    @has_permission('delete', 'income')
    def delete_income(self, request, income_id: int):
        income = get_object_or_404(Income, id=income_id, company=request.user.company)
        if income.status == 'APPROVED':
            raise PermissionDenied("Cannot delete an approved income")
        income.delete()
        return 204, None
