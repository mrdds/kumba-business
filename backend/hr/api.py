from typing import List, Optional
from ninja import Router, Schema, File, UploadedFile, Form
from ninja_extra import ControllerBase, api_controller, route
from core.security.decorators import has_permission
from .models import Employee, PayrollRun, Payslip, SalaryAdvance, WorkSite, LeaveRequest, Information, EmployeeDocument, Attendance, FieldResource
from datetime import date, datetime, time
from django.shortcuts import get_object_or_404
import math
from ninja.errors import HttpError

class EmployeeDocumentSchema(Schema):
    id: int
    name: str
    file_url: str
    document_type: Optional[str]
    uploaded_at: datetime

    @staticmethod
    def resolve_file_url(obj, context):
        if obj.file:
            try:
                request = context.get('request')
                if request:
                    return request.build_absolute_uri(obj.file.url)
                return obj.file.url
            except ValueError:
                return None
        return None

class EmployeeSchema(Schema):
    first_name: str
    last_name: str
    gender: Optional[str] = None
    employee_id: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    position: str
    department: Optional[str] = None
    bio: Optional[str] = None
    address: Optional[str] = None
    hire_date: Optional[date] = None
    base_salary: float = 0.0
    birth_date: Optional[date] = None
    birth_place: Optional[str] = None
    nationality: Optional[str] = None
    marital_status: Optional[str] = None
    children_count: int = 0
    cnps_number: Optional[str] = None
    category: Optional[str] = None
    education_level: Optional[str] = None
    study_field: Optional[str] = None
    contract_type: Optional[str] = None
    contract_duration: Optional[int] = None
    emergency_contacts: Optional[str] = None # Received as JSON string in FormData
    experiences: Optional[str] = None        # Received as JSON string in FormData
    groups: Optional[str] = None             # Received as JSON string in FormData
    role: Optional[str] = 'STANDARD_USER'

class FieldResourceSchema(Schema):
    resource_type: str
    category: str
    specialty: Optional[str] = None
    skill_level: Optional[str] = None
    zone: Optional[str] = None
    mobility: Optional[str] = 'LOCAL'
    is_available: bool = True
    contractor_company: Optional[str] = None
    contract_reference: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    contract_start_date: Optional[date] = None
    contract_end_date: Optional[date] = None
    daily_rate: float = 0
    payment_mode: Optional[str] = None
    can_drive: bool = False
    can_handle_inventory: bool = False
    can_receive_inventory: bool = False
    can_approve_inventory: bool = False
    can_sign_delivery: bool = False
    can_lead_team: bool = False
    can_close_mission: bool = False

class FieldResourceOutSchema(Schema):
    id: int
    resource_type: str
    category: str
    specialty: Optional[str] = None
    skill_level: Optional[str] = None
    zone: Optional[str] = None
    mobility: str
    is_available: bool
    contractor_company: Optional[str] = None
    contract_reference: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    contract_start_date: Optional[date] = None
    contract_end_date: Optional[date] = None
    daily_rate: float
    payment_mode: Optional[str] = None
    can_drive: bool
    can_handle_inventory: bool
    can_receive_inventory: bool
    can_approve_inventory: bool
    can_sign_delivery: bool
    can_lead_team: bool
    can_close_mission: bool
    resource_uid: str
    status: str
    employee_id: Optional[int] = None
    employee_name: Optional[str] = None

    @staticmethod
    def resolve_employee_id(obj):
        return obj.employee.id if obj.employee else None

    @staticmethod
    def resolve_employee_name(obj):
        return f"{obj.employee.first_name} {obj.employee.last_name}" if obj.employee else (obj.contractor_company or 'Freelance')

class EmployeeOutSchema(Schema):
    id: int
    first_name: str
    last_name: str
    email: Optional[str]
    username: Optional[str] = None
    phone: Optional[str]
    gender: Optional[str]
    employee_id: Optional[str]
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
    birth_date: Optional[date] = None
    birth_place: Optional[str] = ""
    nationality: Optional[str] = ""
    marital_status: Optional[str] = ""
    children_count: int = 0
    cnps_number: Optional[str] = ""
    category: Optional[str] = ""
    education_level: Optional[str] = ""
    study_field: Optional[str] = ""
    contract_type: Optional[str] = ""
    contract_duration: Optional[int] = None
    emergency_contacts: list = []
    experiences: list = []
    documents: List[EmployeeDocumentSchema] = []
    role: str = "EMPLOYEE"
    groups: List[str] = []
    language: str = "fr"
    timezone: str = "Africa/Abidjan"
    field_resource: Optional[FieldResourceOutSchema] = None

    @staticmethod
    def resolve_documents(obj):
        if getattr(obj, '_hide_sensitive', False):
            return []
        return obj.documents.all()

    @staticmethod
    def resolve_company_name(obj):
        return obj.company.name if obj.company else None

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

    @staticmethod
    def resolve_role(obj):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            user = User.objects.get(email=obj.email)
            return user.role
        except:
            return "EMPLOYEE"

    @staticmethod
    def resolve_groups(obj):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            user = User.objects.get(email=obj.email)
            return [g.name for g in user.groups.all()]
        except:
            return []

    @staticmethod
    def resolve_username(obj):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            user = User.objects.get(email=obj.email)
            return user.username
        except:
            return None

    @staticmethod
    def resolve_language(obj):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            user = User.objects.get(email=obj.email)
            return user.language
        except:
            return "fr"

    @staticmethod
    def resolve_timezone(obj):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            user = User.objects.get(email=obj.email)
            return user.timezone
        except:
            return "Africa/Abidjan"


class EmployeeUpdateSchema(Schema):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    position: Optional[str] = None
    department: Optional[str] = None
    bio: Optional[str] = None
    work_site_id: Optional[int] = None
    base_salary: Optional[float] = None
    emergency_contacts: Optional[str] = None
    experiences: Optional[str] = None
    role: Optional[str] = None
    groups: Optional[List[str]] = None
    gender: Optional[str] = None
    birth_date: Optional[date] = None
    birth_place: Optional[str] = None
    nationality: Optional[str] = None
    marital_status: Optional[str] = None
    children_count: Optional[int] = None
    hire_date: Optional[date] = None
    category: Optional[str] = None
    cnps_number: Optional[str] = None
    education_level: Optional[str] = None
    study_field: Optional[str] = None
    contract_type: Optional[str] = None
    contract_duration: Optional[int] = None
    field_resource: Optional[FieldResourceSchema] = None

class EmployeeStatusSchema(Schema):
    status: str

# --- WorkSite Schemas ---

class WorkSiteSchema(Schema):
    name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius: Optional[int] = 50
    manager_name: Optional[str] = None
    project_type: Optional[str] = None
    start_date: Optional[date] = None
    status: Optional[str] = 'ACTIVE'
    progress: Optional[int] = 0

class WorkSiteOutSchema(Schema):
    id: int
    name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius: Optional[int] = None
    manager_name: Optional[str] = None
    project_type: Optional[str] = None
    start_date: Optional[date] = None
    status: Optional[str] = None
    progress: Optional[int] = None


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

class AttendanceSchema(Schema):
    work_site_id: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    notes: Optional[str] = None
    
class OperationalAttendanceSchema(Schema):
    status: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    work_site_id: Optional[int] = None
    mission_id: Optional[str] = None
    notes: Optional[str] = None

class OperationalAttendanceOutSchema(Schema):
    id: int
    resource_id: int
    resource_name: str
    resource_type: str
    status: str
    timestamp: datetime
    work_site_name: Optional[str]
    mission_id: Optional[str]
    notes: Optional[str]
    
    @staticmethod
    def resolve_resource_id(obj):
        return obj.resource.id
        
    @staticmethod
    def resolve_resource_name(obj):
        if obj.resource.employee:
            return f"{obj.resource.employee.first_name} {obj.resource.employee.last_name}"
        return obj.resource.contractor_company or 'Freelance'

    @staticmethod
    def resolve_resource_type(obj):
        return obj.resource.resource_type
    
    @staticmethod
    def resolve_work_site_name(obj):
        return obj.work_site.name if obj.work_site else None

class AttendanceOutSchema(Schema):
    id: int
    employee_id: int
    employee_name: str
    date: date
    check_in: Optional[str]
    check_out: Optional[str]
    work_site_name: Optional[str]
    status: str
    notes: Optional[str]

    @staticmethod
    def resolve_employee_id(obj):
        return obj.employee.id

    @staticmethod
    def resolve_employee_name(obj):
        return f"{obj.employee.first_name} {obj.employee.last_name}"

    @staticmethod
    def resolve_check_in(obj):
        return obj.clock_in.strftime('%H:%M') if obj.clock_in else None

    @staticmethod
    def resolve_check_out(obj):
        return obj.clock_out.strftime('%H:%M') if obj.clock_out else None

    @staticmethod
    def resolve_work_site_name(obj):
        return obj.work_site.name if obj.work_site else None

@api_controller('/hr', tags=['HR'])
class HRController(ControllerBase):
    
    # --- Employees ---
    @route.get('/employees', response=List[EmployeeOutSchema])
    @has_permission('view', 'employee')
    def list_employees(self, request):
        return Employee.objects.filter(company=request.user.company)

    @route.post('/employees', response=EmployeeOutSchema)
    @has_permission('create', 'employee')
    def create_employee(self, request, payload: EmployeeSchema = Form(...), avatar: Optional[UploadedFile] = File(None)):
        data = payload.dict()
        
        # Parse JSON strings from FormData
        import json
        for field in ['experiences', 'emergency_contacts', 'groups']:
            if data.get(field):
                try:
                    data[field] = json.loads(data[field])
                except:
                    data[field] = []
            else:
                data[field] = []
        
        # Map education_field to study_field if present
        if 'education_field' in data:
            data['study_field'] = data.pop('education_field')
        
        # Remove non-model fields before creating Employee
        groups_raw = data.pop('groups', '[]')
        role = data.pop('role', 'STANDARD_USER')
        
        # Map job_title to position is now handled in frontend
            
        # Instantiate without saving to set temporary attributes for the signal
        employee = Employee(
            company=request.user.company,
            **data
        )
        employee._role = role
        employee._groups = groups_raw
        employee.save()
        
        if avatar:
            employee.photo = avatar
            employee.save()

        # Handle Field Resource creation
        field_resource_data = data.get('field_resource')
        if field_resource_data:
            if isinstance(field_resource_data, str):
                try:
                    field_resource_data = json.loads(field_resource_data)
                except:
                    field_resource_data = None
            
            if field_resource_data:
                FieldResource.objects.create(
                    company=request.user.company,
                    employee=employee,
                    **field_resource_data
                )
            
        return employee

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

    @route.get('/field-resources', response=List[FieldResourceOutSchema])
    def list_field_resources(self, request, type: Optional[str] = None):
        qs = FieldResource.objects.filter(company=request.user.company)
        if type:
            qs = qs.filter(resource_type=type)
        return qs

    @route.get('/me', response=EmployeeOutSchema)
    def current_employee(self, request):
        if not request.user.is_authenticated:
            raise HttpError(401, "Not authenticated")
        try:
            # Primary lookup by Kumba ID
            if request.user.kumba_id:
                return Employee.objects.get(kumba_id=request.user.kumba_id)
            # Fallback to email if Kumba ID is missing
            return Employee.objects.get(email=request.user.email)
        except (Employee.DoesNotExist, Employee.MultipleObjectsReturned):
            if not request.user.company:
                # Return a virtual employee profile for users not attached to a company
                # This avoids the 404/IntegrityError and allows seeing the profile
                class VirtualEmployee:
                    def __init__(self, user):
                        self.id = 0
                        self.first_name = user.first_name or user.username
                        self.last_name = user.last_name or 'User'
                        self.email = user.email if "@kumba-auto.com" not in user.email else ""
                        self.username = user.username
                        self.phone = user.phone
                        self.gender = "M" # Default
                        self.employee_id = ""
                        self.phone_numbers = user.phone_numbers or []
                        self.position = user.job_title or ""
                        self.department = ""
                        self.bio = user.bio or ""
                        self.address = ""
                        self.work_site_id = None
                        self.photo = user.avatar
                        self.hire_date = None
                        self.base_salary = 0
                        self.status = "ACTIVE"
                        self.leave_balance = 0
                        self.kumba_id = user.kumba_id
                        self.device_id = None
                        self.device_locked = False
                        self.birth_date = None
                        self.birth_place = ""
                        self.nationality = ""
                        self.marital_status = ""
                        self.children_count = 0
                        self.cnps_number = ""
                        self.category = ""
                        self.education_level = ""
                        self.study_field = ""
                        self.emergency_contacts = []
                        self.experiences = []
                        self.documents = Employee.objects.none() # Empty queryset
                        self.company = None
                
                return VirtualEmployee(request.user)
                
            # Auto-create Employee for the user
            return Employee.objects.create(
                company=request.user.company,
                first_name=request.user.first_name or request.user.username,
                last_name=request.user.last_name or 'User',
                email=request.user.email,
                phone=request.user.phone,
                position=request.user.job_title or request.user.role,
                kumba_id=request.user.kumba_id,
                hire_date=date.today()
            )
            
    def _apply_privacy(self, request, employee):
        """
        Hides sensitive fields if the requester is not the owner or an authorized admin.
        """
        is_me = (employee.email == request.user.email)
        is_admin = (request.user.role in ['SUPER_ADMIN', 'ADMIN', 'RH', 'MANAGER'])
        
        if not is_me and not is_admin:
            # Hide sensitive fields for public view
            employee.base_salary = 0
            employee.children_count = 0
            employee.education_level = ""
            employee.study_field = ""
            employee.birth_date = None
            employee.birth_place = ""
            employee.marital_status = ""
            employee.hire_date = None
            employee.experiences = []
            employee.cnps_number = ""
            employee.emergency_contacts = []
            employee._hide_sensitive = True
            
            # Note: We don't save the employee object here, it's only modified in memory for serialization
            
        return employee

    @route.patch('/me', response=EmployeeOutSchema)
    def update_my_profile(self, request, payload: EmployeeUpdateSchema):
        employee = get_object_or_404(Employee, email=request.user.email)
        data = payload.dict(exclude_unset=True)
        
        # Handle phone_numbers if it's a string or a list-wrapped string (FormData)
        if 'phone_numbers' in data:
            val = data['phone_numbers']
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
            
        employee.save()
        return employee

    @route.get('/employees/{id}', response=EmployeeOutSchema)
    def get_employee(self, request, id: int):
        employee = get_object_or_404(Employee, id=id, company=request.user.company)
        return self._apply_privacy(request, employee)

    @route.get('/employees/by-user/{user_id}', response=EmployeeOutSchema)
    def get_employee_by_user(self, request, user_id: int):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        target_user = get_object_or_404(User, id=user_id)
        employee = get_object_or_404(Employee, email=target_user.email, company=request.user.company)
        return self._apply_privacy(request, employee)

    @route.patch('/employees/{id}', response=EmployeeOutSchema)
    def update_employee(self, request, id: int, payload: EmployeeUpdateSchema):
        employee = get_object_or_404(Employee, id=id, company=request.user.company)
        
        is_me = (employee.email == request.user.email)
        is_admin = (request.user.role in ['SUPER_ADMIN', 'ADMIN', 'MANAGER'])
        
        if not is_me and not is_admin:
             raise HttpError(403, "Permission denied") 
        
        data = payload.dict(exclude_unset=True)
        
        # Security roles/groups update (only for admins)
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            user_account = User.objects.get(email=employee.email)
            
            # Update Role
            if 'role' in data:
                new_role = data.pop('role')
                if is_admin:
                    user_account.role = new_role
                    user_account.save()
            
            # Update Groups (Fonctionnalités)
            if 'groups' in data:
                groups_list = data.pop('groups')
                if is_admin:
                    from django.contrib.auth.models import Group
                    user_account.groups.clear()
                    for g_name in groups_list:
                        try:
                            g = Group.objects.get(name=g_name)
                            user_account.groups.add(g)
                        except Group.DoesNotExist:
                            pass
        except User.DoesNotExist:
            pass

        # Restriction: Only Admin can update sensitive fields
        if not is_admin:
            data.pop('first_name', None)
            data.pop('last_name', None)
            data.pop('base_salary', None)

        # Handle Field Resource update
        field_resource_data = data.pop('field_resource', None)
        if field_resource_data:
            from .models import FieldResource
            field_res, created = FieldResource.objects.get_or_create(
                employee=employee,
                defaults={'company': employee.company, **field_resource_data}
            )
            if not created:
                for attr, value in field_resource_data.items():
                    setattr(field_res, attr, value)
                field_res.save()

        for attr, value in data.items():
            setattr(employee, attr, value)
        employee.save()
        
        return self._apply_privacy(request, employee)

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
        employees = Employee.objects.filter(company=company, status='ACTIVE')
        
        # Calculate totals — base_salary is already monthly
        total_amount = sum(e.base_salary for e in employees)
        
        payroll = PayrollRun.objects.create(
            company=company,
            period_start=payload.period_start,
            period_end=payload.period_end,
            total_amount=total_amount,
            status='DRAFT'
        )

        for emp in employees:
            monthly_salary = emp.base_salary  # Already monthly
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

    @route.post('/employees/{id}/documents', response={201: EmployeeDocumentSchema, 403: dict})
    def upload_document(self, request, id: int, name: str = Form(...), document_type: str = Form(None), file: UploadedFile = File(...)):
        employee = get_object_or_404(Employee, id=id, company=request.user.company)
        if employee.email != request.user.email and request.user.role not in ['SUPER_ADMIN', 'ADMIN', 'MANAGER']:
             raise HttpError(403, "Permission denied")

        doc = EmployeeDocument.objects.create(
            employee=employee,
            name=name,
            file=file,
            document_type=document_type
        )
        return 201, doc

    @route.get('/employees/{id}/documents', response=List[EmployeeDocumentSchema])
    def list_documents(self, request, id: int):
        employee = get_object_or_404(Employee, id=id, company=request.user.company)
        return employee.documents.all()

    @route.delete('/documents/{doc_id}', response={204: dict})
    def delete_document(self, request, doc_id: int):
        doc = get_object_or_404(EmployeeDocument, id=doc_id, employee__company=request.user.company)
        # Auth check
        if doc.employee.email != request.user.email and request.user.role not in ['SUPER_ADMIN', 'ADMIN', 'MANAGER']:
             raise HttpError(403, "Permission denied")
        doc.delete()
        return 204, {"success": True}

    # --- Attendance ---
    @route.get('/attendance', response=List[AttendanceOutSchema])
    def list_attendance(self, request):
        return Attendance.objects.filter(employee__company=request.user.company).order_by('-date', '-clock_in')

    @route.get('/attendance/me', response=List[AttendanceOutSchema])
    def my_attendance(self, request):
        return Attendance.objects.filter(employee__email=request.user.email).order_by('-date', '-clock_in')

    @route.post('/attendance/clock-in', response=AttendanceOutSchema)
    def clock_in(self, request, payload: AttendanceSchema):
        employee = get_object_or_404(Employee, email=request.user.email)
        
        # Check if already clocked in today
        today = date.today()
        attendance, created = Attendance.objects.get_or_create(
            employee=employee,
            date=today,
            defaults={'clock_in': datetime.now(), 'status': 'PRESENT'}
        )
        
        if not created and attendance.clock_in:
             # Already clocked in
             return attendance
             
        if payload.work_site_id:
            attendance.work_site_id = payload.work_site_id
        attendance.latitude = payload.latitude
        attendance.longitude = payload.longitude
        attendance.notes = payload.notes
        attendance.clock_in = datetime.now()
        attendance.save()
        return attendance

    @route.post('/attendance/clock-out', response=AttendanceOutSchema)
    def clock_out(self, request):
        employee = get_object_or_404(Employee, email=request.user.email)
        today = date.today()
        attendance = get_object_or_404(Attendance, employee=employee, date=today)
        
        attendance.clock_out = datetime.now()
        attendance.save()
        return attendance

    # --- Operational Attendance ---
    @route.get('/field-resources/attendance', response=List[OperationalAttendanceOutSchema])
    def list_ops_attendance(self, request, resource_id: Optional[int] = None):
        qs = OperationalAttendance.objects.filter(company=request.user.company)
        if resource_id:
            qs = qs.filter(resource_id=resource_id)
        return qs

    @route.post('/field-resources/status', response=OperationalAttendanceOutSchema)
    def update_resource_status(self, request, payload: OperationalAttendanceSchema):
        from .models import OperationalAttendance
        # Find the FieldResource associated with the user or by explicit resource_id
        # For now, let's assume the user is reporting their own status or an admin is reporting for someone
        # If resource_id is not in payload, we look for the current user's field resource
        
        resource = None
        employee = Employee.objects.filter(email=request.user.email).first()
        if employee:
            resource = getattr(employee, 'field_resource', None)
            
        if not resource:
            raise HttpError(404, "Field Resource profile not found for current user")
            
        attendance = OperationalAttendance.objects.create(
            company=request.user.company,
            resource=resource,
            **payload.dict()
        )
        
        # If internal employee and status is OFFICE or DEPOT, also update HR Attendance status
        if resource.resource_type == 'INTERNAL' and payload.status in ['OFFICE', 'DEPOT', 'MISSION']:
             today = date.today()
             hr_att, created = Attendance.objects.get_or_create(
                 employee=resource.employee,
                 date=today,
                 defaults={'status': payload.status, 'clock_in': datetime.now()}
             )
             if not created:
                 hr_att.status = payload.status
                 if payload.work_site_id:
                     hr_att.work_site_id = payload.work_site_id
                 hr_att.save()
                 
        return attendance
