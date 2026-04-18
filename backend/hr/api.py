from typing import List, Optional
from ninja import Router, Schema, File, UploadedFile, Form
from ninja_extra import ControllerBase, api_controller, route
from .models import Employee, PayrollRun, Payslip, SalaryAdvance, WorkSite, LeaveRequest, Information
from datetime import date, datetime, time
from django.shortcuts import get_object_or_404
import math
from ninja.errors import HttpError

class EmployeeSchema(Schema):
    company_id: Optional[int] = None # Inferred from user
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    phone_numbers: Optional[list] = None
    position: str
    department: Optional[str] = None
    bio: Optional[str] = None
    hire_date: Optional[date] = None
    base_salary: float = 0.0

class EmployeeOutSchema(Schema):
    id: int
    first_name: str
    last_name: str
    email: Optional[str]
    phone: Optional[str]
    phone_numbers: Optional[list]
    position: str
    department: Optional[str]
    bio: Optional[str] = ""
    address: Optional[str] = ""
    work_site_id: Optional[int] = None
    photo_url: Optional[str] = None
    hire_date: Optional[date] = None
    base_salary: float = 0
    status: str = "ACTIVE"
    leave_balance: int = 0
    kumba_id: Optional[str] = None
    device_id: Optional[str] = None
    device_locked: bool = False
    company_name: Optional[str] = None
    is_activated: bool = True
    must_change_password: bool = False

    @staticmethod
    def resolve_company_name(obj):
        return obj.company.name

    @staticmethod
    def resolve_kumba_id(obj):
        if obj.kumba_id:
            return obj.kumba_id
            
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            user = User.objects.get(email=obj.email)
            return user.kumba_id or user.employee_id or f"KMB{obj.id:06d}"
        except:
            return f"KMB{obj.id:06d}"

    @staticmethod
    def resolve_photo_url(obj, context):
        if obj.photo:
            try:
                request = context.get('request')
                if request:
                    return request.build_absolute_uri(obj.photo.url)
                return obj.photo.url
            except ValueError:
                return None
        return None

    @staticmethod
    def resolve_is_activated(obj):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            user = User.objects.get(email=obj.email)
            return user.is_activated
        except:
            return True

    @staticmethod
    def resolve_must_change_password(obj):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            user = User.objects.get(email=obj.email)
            return user.must_change_password
        except:
            return False


class EmployeeUpdateSchema(Schema):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    phone_numbers: Optional[list] = None # Or Any, but list helps documentation
    address: Optional[str] = None
    position: Optional[str] = None
    bio: Optional[str] = None
    work_site_id: Optional[int] = None

class EmployeeStatusSchema(Schema):
    status: str

# --- WorkSite Schemas ---

class WorkSiteSchema(Schema):
    name: str
    latitude: float
    longitude: float
    radius: int = 50

class WorkSiteOutSchema(Schema):
    id: int
    name: str
    latitude: float
    longitude: float
    radius: int


class PayrollCreateSchema(Schema):
    period_start: date
    period_end: date

class PayslipSchema(Schema):
    id: int
    employee_name: str
    basic_salary: float
    bonus: float
    deductions: float
    net_salary: float

    @staticmethod
    def resolve_employee_name(obj):
        return f"{obj.employee.first_name} {obj.employee.last_name}"

class PayrollRunOutSchema(Schema):
    id: int
    period_start: date
    period_end: date
    total_amount: float
    status: str
    created_at: datetime
    payslips: List[PayslipSchema]

class AdvanceCreateSchema(Schema):
    amount: float
    reason: Optional[str] = None

class AdvanceOutSchema(Schema):
    id: int
    employee_name: str
    amount: float
    status: str
    request_date: date
    reason: Optional[str]

    @staticmethod
    def resolve_employee_name(obj):
        return f"{obj.employee.first_name} {obj.employee.last_name}"

class LeaveRequestSchema(Schema):
    start_date: date
    end_date: date
    leave_type: str = 'ANNUAL'
    reason: Optional[str] = None

class LeaveRequestOutSchema(Schema):
    id: int
    start_date: date
    end_date: date
    leave_type: str
    reason: Optional[str]
    status: str
    created_at: datetime

class PayslipOutSchema(Schema):
    id: int
    employee_name: str
    period_start: date
    period_end: date
    basic_salary: float
    bonus: float
    deductions: float
    net_salary: float

    @staticmethod
    def resolve_employee_name(obj):
        return f"{obj.employee.first_name} {obj.employee.last_name}"

    @staticmethod
    def resolve_period_start(obj):
        return obj.payroll_run.period_start
        
    @staticmethod
    def resolve_period_end(obj):
        return obj.payroll_run.period_end

class ApprovalRequestOutSchema(Schema):
    id: int
    status: str
    current_step_order: Optional[int]
    
    def resolve_current_step_order(self, obj):
        return obj.current_step.order if obj.current_step else None

# --- Info Center Schemas ---
class InformationSchema(Schema):
    title: str
    content: str
    color: str = '#1E293B'

class InformationOutSchema(Schema):
    id: int
    title: str
    content: str
    color: str
    created_at: datetime
    created_by_name: Optional[str]

    @staticmethod
    def resolve_created_by_name(obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}"
        return None

@api_controller('/hr', tags=['HR'])
class HRController(ControllerBase):
    
    # --- Employees ---
    @route.get('/employees', response=List[EmployeeOutSchema])
    def list_employees(self, request):
        return Employee.objects.filter(company=request.user.company)

    @route.post('/employees', response=EmployeeOutSchema)
    def create_employee(self, request, payload: EmployeeSchema):
        data = payload.dict(exclude={'company_id'})
        return Employee.objects.create(
            company=request.user.company,
            **data
        )

    # --- WorkSites ---
    @route.get('/work-sites', response=List[WorkSiteOutSchema])
    def list_work_sites(self, request):
        return WorkSite.objects.filter(company=request.user.company)

    @route.post('/work-sites', response=WorkSiteOutSchema)
    def create_work_site(self, request, payload: WorkSiteSchema):
        if request.user.role not in ['SUPER_ADMIN', 'ADMIN']:
             raise HttpError(403, "Permission denied")
        return WorkSite.objects.create(
            company=request.user.company,
            **payload.dict()
        )

    @route.patch('/work-sites/{id}', response=WorkSiteOutSchema)
    def update_work_site(self, request, id: int, payload: WorkSiteSchema):
        if request.user.role not in ['SUPER_ADMIN', 'ADMIN']:
             raise HttpError(403, "Permission denied")
        site = get_object_or_404(WorkSite, id=id, company=request.user.company)
        for attr, value in payload.dict(exclude_unset=True).items():
            setattr(site, attr, value)
        site.save()
        return site

    @route.delete('/work-sites/{id}')
    def delete_work_site(self, request, id: int):
        if request.user.role not in ['SUPER_ADMIN', 'ADMIN']:
             raise HttpError(403, "Permission denied")
        site = get_object_or_404(WorkSite, id=id, company=request.user.company)
        site.delete()
        return {"success": True}

    @route.get('/me', response=EmployeeOutSchema)
    def current_employee(self, request):
        try:
            return Employee.objects.get(email=request.user.email)
        except Employee.DoesNotExist:
            # Auto-create Employee for the user
            return Employee.objects.create(
                company=request.user.company,
                first_name=request.user.first_name or request.user.username,
                last_name=request.user.last_name or 'User',
                email=request.user.email,
                phone=request.user.phone,
                position=request.user.job_title or request.user.role,
                hire_date=date.today()
            )
            
    @route.patch('/me', response=EmployeeOutSchema)
    def update_my_profile(self, request, payload: EmployeeUpdateSchema = Form(...), photo: Optional[UploadedFile] = File(None)):
        employee = get_object_or_404(Employee, email=request.user.email)
        data = payload.dict(exclude_unset=True)
        
        # Handle phone_numbers if it's a string or a list-wrapped string (FormData)
        if 'phone_numbers' in data:
            val = data['phone_numbers']
            # Ninja Form logic sometimes wraps strings in lists: ["[]"]
            if isinstance(val, list) and len(val) == 1 and isinstance(val[0], str) and (val[0].startswith('[') or val[0].startswith('{')):
                val = val[0]
            
            if isinstance(val, str):
                try:
                    import json
                    data['phone_numbers'] = json.loads(val)
                except:
                    pass
            elif not isinstance(val, list):
                data.pop('phone_numbers', None) # Invalid format

        restricted_fields = ['first_name', 'last_name', 'base_salary']
        is_admin = (request.user.role in ['SUPER_ADMIN', 'ADMIN'])
        
        for attr, value in data.items():
            if attr in restricted_fields and not is_admin:
                continue
            setattr(employee, attr, value)
            
        if photo:
            employee.photo = photo
            
        employee.save()
        return employee

    @route.get('/employees/{id}', response=EmployeeOutSchema)
    def get_employee(self, request, id: int):
        return get_object_or_404(Employee, id=id, company=request.user.company)

    @route.get('/employees/by-user/{user_id}', response=EmployeeOutSchema)
    def get_employee_by_user(self, request, user_id: int):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        target_user = get_object_or_404(User, id=user_id)
        return get_object_or_404(Employee, email=target_user.email, company=request.user.company)

    @route.patch('/employees/{id}', response=EmployeeOutSchema)
    def update_employee(self, request, id: int, payload: EmployeeUpdateSchema = Form(...), photo: Optional[UploadedFile] = File(None)):
        employee = get_object_or_404(Employee, id=id, company=request.user.company)
        
        is_me = (employee.email == request.user.email)
        is_admin = (request.user.role in ['SUPER_ADMIN', 'ADMIN', 'MANAGER'])
        
        if not is_me and not is_admin:
             raise HttpError(403, "Permission denied") 
        
        data = payload.dict(exclude_unset=True)
        
        # Restriction: Only Admin can update Name
        if not is_admin:
            data.pop('first_name', None)
            data.pop('last_name', None)

        for attr, value in data.items():
            setattr(employee, attr, value)
            
        if photo:
            employee.photo = photo
            
        employee.save()
        return employee

    @route.post('/employees/{id}/photo', response=EmployeeOutSchema)
    def upload_photo(self, request, id: int, file: UploadedFile = File(...)):
        employee = get_object_or_404(Employee, id=id, company=request.user.company)
        if employee.email != request.user.email and request.user.role not in ['SUPER_ADMIN', 'ADMIN', 'MANAGER']:
             raise HttpError(403, "Permission denied")

        employee.photo.save(file.name, file)
        employee.save()
        return employee

    @route.post('/employees/{id}/status', response=EmployeeOutSchema)
    def update_status(self, request, id: int, payload: EmployeeStatusSchema):
        if request.user.role not in ['SUPER_ADMIN', 'ADMIN']:
             raise HttpError(403, "Permission denied")

        employee = get_object_or_404(Employee, id=id, company=request.user.company)
        employee.status = payload.status
        employee.save()
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if employee.email:
            try:
                user_account = User.objects.get(email=employee.email)
                user_account.is_active = (payload.status == 'ACTIVE')
                user_account.save()
            except User.DoesNotExist:
                pass
        return employee

    @route.post('/employees/{id}/reset-device', response=EmployeeOutSchema)
    def reset_device(self, request, id: int):
        if request.user.role not in ['SUPER_ADMIN', 'ADMIN']:
             raise HttpError(403, "Permission denied")
        employee = get_object_or_404(Employee, id=id, company=request.user.company)
        employee.device_id = None
        employee.device_locked = False
        employee.save()
        return employee

    # --- Payroll ---
    @route.get('/payrolls', response=List[PayrollRunOutSchema])
    def list_payrolls(self, request):
        return PayrollRun.objects.filter(company=request.user.company).order_by('-period_start')

    @route.get('/payrolls/{id}', response=PayrollRunOutSchema)
    def get_payroll(self, request, id: int):
        return get_object_or_404(PayrollRun, id=id, company=request.user.company)

    @route.post('/payrolls', response=PayrollRunOutSchema)
    def create_payroll(self, request, payload: PayrollCreateSchema):
        company = request.user.company
        employees = Employee.objects.filter(company=company)
        
        # Calculate totals
        total_amount = sum(e.base_salary for e in employees) / 12 # Monthly assumption
        
        payroll = PayrollRun.objects.create(
            company=company,
            period_start=payload.period_start,
            period_end=payload.period_end,
            total_amount=total_amount,
            status='DRAFT'
        )

        for emp in employees:
            monthly_salary = emp.base_salary / 12
            # Simple simulation of taxes (10%) and social security (5%) for demo
            tax = monthly_salary * 0.1
            social = monthly_salary * 0.05
            net = monthly_salary - tax - social
            
            Payslip.objects.create(
                payroll_run=payroll,
                employee=emp,
                basic_salary=monthly_salary,
                bonus=0,
                deductions=0,
                tax_amount=tax,
                social_security_employee=social,
                social_security_employer=social, # Assuming equal parts for demo
                net_salary=net
            )
        
        # Recalculate total amount to match nets
        payroll.total_amount = sum(p.net_salary for p in payroll.payslips.all())
        payroll.save()
        
        return payroll


    @route.post('/payrolls/{id}/submit-approval', response={200: ApprovalRequestOutSchema})
    def submit_payroll_approval(self, request, id: int):
        payroll = get_object_or_404(PayrollRun, id=id, company=request.user.company)
        if payroll.status != 'DRAFT':
            return 400, {'error': 'Only draft payrolls can be submitted'}
            
        from approvals.service import ApprovalService
        req = ApprovalService.submit_for_approval(payroll, request.user)
        
        if not req:
            # Auto-approve
            if hasattr(payroll, 'approve'):
                payroll.approve()
            else:
                payroll.status = 'APPROVED'
                payroll.save()
            return 200, None
            
        return 200, req

    @route.post('/payrolls/{id}/approve', response=PayrollRunOutSchema)
    def approve_payroll(self, request, id: int):
        # Manual Force Approve (Admin style) or legacy endpoint
        # Ideally this should check permissions strictly
        payroll = get_object_or_404(PayrollRun, id=id, company=request.user.company)
        
        if payroll.status != 'DRAFT':
             raise HttpError(400, "Payroll can only be approved from Draft status")
             
        # Call model method
        payroll.approve()
        return payroll

    @route.post('/payrolls/{id}/pay', response=PayrollRunOutSchema)
    def pay_payroll(self, request, id: int, payment_account_id: int):
        from accounting.models import JournalEntry, JournalEntryLine, Account
        from decimal import Decimal

        payroll = get_object_or_404(PayrollRun, id=id, company=request.user.company)
        if payroll.status != 'APPROVED':
            raise HttpError(400, "Payroll must be approved before payment")
            
        amount_to_pay = payroll.total_amount # Net total
        
        # If nothing to pay, just update status
        if amount_to_pay <= 0:
            payroll.status = 'PAID'
            payroll.payment_date = date.today()
            payroll.save()
            return payroll
            
        payment_account = get_object_or_404(Account, id=payment_account_id, company=payroll.company)
        
        try:
            acc_dettes_personnel = Account.objects.get(company=payroll.company, code='422000')
        except Account.DoesNotExist:
             # Should have been created during approval, but safety net
             acc_dettes_personnel = Account.objects.create(
                company=payroll.company, 
                code='422000', 
                name='Personnel, rémunérations dues', 
                type='LIABILITY', 
                is_active=True
            )
        
        # Create Payment Entry
        payment_entry = JournalEntry.objects.create(
            company=payroll.company,
            date=date.today(),
            description=f"Payroll Payment {payroll.period_start} - {payroll.period_end}",
            entry_type='PAYMENT',
            status='POSTED'
        )
        
        # DEBIT: Liability (422)
        JournalEntryLine.objects.create(journal_entry=payment_entry, account=acc_dettes_personnel, debit=Decimal(amount_to_pay), description="Paiement salaires")
        
        # CREDIT: Bank/Cash
        JournalEntryLine.objects.create(journal_entry=payment_entry, account=payment_account, credit=Decimal(amount_to_pay), description="Sortie de trésorerie")
        
        payroll.payment_entry = payment_entry
        payroll.payment_date = date.today()
        payroll.status = 'PAID'
        payroll.save()
        
        return payroll

    # --- Salary Advances ---
    @route.post('/advances', response=AdvanceOutSchema)
    def request_advance(self, request, payload: AdvanceCreateSchema):
        employee = get_object_or_404(Employee, email=request.user.email)
        return SalaryAdvance.objects.create(
            employee=employee,
            amount=payload.amount,
            reason=payload.reason
        )

    @route.get('/advances', response=List[AdvanceOutSchema])
    def list_advances(self, request):
        return SalaryAdvance.objects.filter(employee__company=request.user.company).order_by('-request_date')

    @route.post('/advances/{id}/submit-approval', response={200: ApprovalRequestOutSchema})
    def submit_advance_approval(self, request, id: int):
        advance = get_object_or_404(SalaryAdvance, id=id, employee__company=request.user.company)
        if advance.status != 'PENDING':
            return 400, {'error': 'Only pending advances can be submitted'}
            
        from approvals.service import ApprovalService
        req = ApprovalService.submit_for_approval(advance, request.user)
        
        if not req:
            # Auto-approve
            advance.status = 'APPROVED'
            advance.save()
            return 200, None
            
        return 200, req

    @route.patch('/advances/{id}/approve', response=AdvanceOutSchema)
    def approve_advance(self, request, id: int):
        advance = get_object_or_404(SalaryAdvance, id=id, employee__company=request.user.company)
        if advance.status != 'PENDING':
             raise HttpError(400, "Advance can only be approved from Pending status")
             
        advance.status = 'APPROVED'
        advance.save()
        return advance

    # --- Employee Portal ---
    @route.get('/payslips/me', response=List[PayslipOutSchema])
    def get_my_payslips(self, request):
        return Payslip.objects.filter(employee__email=request.user.email).order_by('-payroll_run__period_start')

    @route.get('/leaves/me', response=List[LeaveRequestOutSchema])
    def get_my_leaves(self, request):
        return LeaveRequest.objects.filter(employee__email=request.user.email).order_by('-created_at')

    @route.post('/leaves', response=LeaveRequestOutSchema)
    def request_leave(self, request, payload: LeaveRequestSchema):
        employee = get_object_or_404(Employee, email=request.user.email)
        return LeaveRequest.objects.create(
            employee=employee,
            start_date=payload.start_date,
            end_date=payload.end_date,
            leave_type=payload.leave_type,
            reason=payload.reason
        )

    @route.patch('/advances/{id}/reject', response=AdvanceOutSchema)
    def reject_advance(self, request, id: int):
        advance = get_object_or_404(SalaryAdvance, id=id, employee__company=request.user.company)
        advance.status = 'REJECTED'
        advance.save()
        return advance

    # --- Info Center API ---
    @route.get('/informations', response=List[InformationOutSchema])
    def list_informations(self, request):
        company = getattr(request.user, 'company', None)
        if not company:
            return []
        return Information.objects.filter(company=company).order_by('-created_at')

    @route.post('/informations', response={201: InformationOutSchema, 403: dict})
    def create_information(self, request, payload: InformationSchema):
        company = getattr(request.user, 'company', None)
        if not company:
            return 403, {"detail": "No company linked to your account."}
        
        # Try to find associated employee for attribution
        employee = Employee.objects.filter(email=request.user.email).first()
        
        info = Information.objects.create(
            company=company,
            title=payload.title,
            content=payload.content,
            color=payload.color,
            created_by=employee
        )
        return 201, info

    @route.delete('/informations/{info_id}', response={204: dict, 403: dict, 404: dict})
    def delete_information(self, request, info_id: int):
        employee = get_object_or_404(Employee, email=request.user.email)
        info = get_object_or_404(Information, id=info_id, company=employee.company)
        
        info.delete()
        return 204, {"message": "Information deleted"}
