from typing import Optional, List, Dict
from datetime import date
import json
import requests
import logging
from ninja_extra import api_controller, route
from ninja import Schema, File, Form, UploadedFile
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.models import Group
from companies.models import Company
from django.db import transaction
from django.shortcuts import get_object_or_404
from ninja_jwt.authentication import JWTAuth
from .permissions import UserRole, DEFAULT_ROLE_PERMISSIONS

User = get_user_model()

class UserRegisterSchema(Schema):
    username: str = ""
    email: str
    password: str
    first_name: str
    last_name: str
    company_name: str | None = None
    company_sector: str = ""
    company_country: str = "CI"
    phone: str = ""

class MessageSchema(Schema):
    message: str

class CompanyOutSchema(Schema):
    name: str
    sector: str
    country: str
    currency: str
    tax_rate: float

class UserProfileSchema(Schema):
    id: int
    employee_id: str | None = None
    email: str
    first_name: str
    last_name: str
    phone: str
    role: str
    groups: list[str] = []
    company: CompanyOutSchema | None = None
    job_title: str | None = None
    permissions: dict = {}
    is_activated: bool = False
    must_change_password: bool = False

class EmployeeCreateSchema(Schema):
    email: str
    password: str = "" # Auto-generated if empty
    first_name: str
    last_name: str
    phone: str = ""
    role: str  # dropdown: MANAGER, ACCOUNTANT, EMPLOYEE
    job_title: str = ""
    department: str = ""
    bio: str = ""
    base_salary: float = 0
    permissions: str | dict = {}

class EmployeeSchema(Schema):
    id: int
    first_name: str
    last_name: str
    email: str
    role: str
    phone: str
    job_title: str | None
    permissions: dict
    is_activated: bool
    must_change_password: bool

class EmployeeUpdateSchema(Schema):
    first_name: str | None = None
    last_name: str | None = None
    role: str | None = None
    job_title: str | None = None
    groups: list[str] | None = None
    phone: str | None = None

class ChangePasswordSchema(Schema):
    old_password: str
    new_password: str

@api_controller('/auth', tags=['Authentication'])
class AuthController:
    @route.get('/permissions', auth=None, response=dict)
    def get_permissions_metadata(self, request):
        """Returns the mapping of Roles to their default Permissions."""
        return {str(role.value): perms for role, perms in DEFAULT_ROLE_PERMISSIONS.items()}

    @route.get('/me', auth=JWTAuth(), response=UserProfileSchema)
    def me(self, request):
        user = request.user
        
        # Calculate effective permissions: Start with default for role, then merge overrides
        effective_permissions = DEFAULT_ROLE_PERMISSIONS.get(user.role, [])
        if user.permissions and isinstance(user.permissions, dict) and user.permissions.get('all'):
             effective_permissions = ["*"]

        return {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "phone": user.phone,
            "role": user.role,
            "groups": [g.name for g in user.groups.all()],
            "company": {
                "name": user.company.name,
                "sector": user.company.sector,
                "country": user.company.country,
                "currency": user.company.currency,
                "tax_rate": user.company.tax_rate
            } if user.company else None,
            "job_title": user.job_title,
            "permissions": {p: True for p in effective_permissions},
            "is_activated": user.is_activated,
            "must_change_password": user.must_change_password
        }

    @route.post('/change-password', auth=JWTAuth(), response={200: MessageSchema, 400: MessageSchema})
    def change_password(self, request, payload: ChangePasswordSchema):
        user = request.user
        if not user.check_password(payload.old_password):
             return 400, {"message": "Incorrect old password"}
        
        user.set_password(payload.new_password)
        user.must_change_password = False
        user.save()
        return 200, {"message": "Password updated successfully"}

    @route.post('/register', auth=None, response={201: MessageSchema, 400: MessageSchema})
    @transaction.atomic
    def register(self, payload: UserRegisterSchema):
        # Sanitize inputs
        email = payload.email.strip().lower()
        password = payload.password.strip()
        username = payload.username.strip() if payload.username else email

        if User.objects.filter(username=username).exists():
            return 400, {"message": "Username already exists"}

        # Create Company only if company_name is provided
        company = None
        if payload.company_name:
            company = Company.objects.create(
                name=payload.company_name.strip(),
                sector=payload.company_sector,
                country=payload.company_country
            )

        # Create User
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=payload.first_name.strip(),
            last_name=payload.last_name.strip(),
            phone=payload.phone.strip(),
            company=company,
            role=UserRole.SUPER_ADMIN if company else UserRole.STANDARD_USER,
            job_title="CEO" if company else "", 
            permissions={"all": True} if company else {}
        )

        # --- SYNC TO KUMBA AUTH (SSO) ---
        try:
            auth_url = f"{settings.AUTH_SERVER_URL}/api/auth/internal/provision-user/"
            provision_payload = {
                "email": email,
                "password": password,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "phone": user.phone,
                "role": user.role,
                "kumba_id": user.kumba_id
            }
            headers = {
                "X-Service-Secret": settings.KUMBA_INTERNAL_SECRET,
                "Content-Type": "application/json"
            }
            # Mandatory sync for new registrations
            auth_res = requests.post(auth_url, json=provision_payload, headers=headers, timeout=10)
            if auth_res.status_code not in [200, 201]:
                print(f"ERROR: SSO Provisioning failed for {email}: {auth_res.text}")
                # We don't rollback here as the local account is created, but we log the error
        except Exception as e:
            print(f"ERROR: SSO Provisioning exception for {email}: {str(e)}")
        
        return 201, {"message": "Account created successfully"}

    @route.post('/employees', auth=JWTAuth(), response={201: MessageSchema, 400: MessageSchema, 403: MessageSchema, 500: MessageSchema})
    @transaction.atomic
    def create_employee(self, request, payload: EmployeeCreateSchema = Form(...), avatar: Optional[UploadedFile] = File(None)):
        # Allow SUPER_ADMIN (Owner) and MANAGER to create employees
        if request.user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]:
             return 403, {"message": "Permission denied"}

        if not request.user.company:
             return 400, {"message": "User must be associated with a company to create employees"}

        if User.objects.filter(email=payload.email).exists():
            return 400, {"message": "Email already exists"}

        try:
            # Handle permissions parsing if it comes as a JSON string from Form
            permissions_data = payload.permissions
            if isinstance(permissions_data, str) and permissions_data:
                try:
                    permissions_data = json.loads(permissions_data)
                except:
                    permissions_data = {}

            # Auto-generate Password
            import secrets
            import string
            import random
            alphabet = string.ascii_letters + string.digits
            password = secrets.choice(alphabet) # Placeholder for the generated one below or use one
            password = ''.join(secrets.choice(alphabet) for i in range(12))

            # Auto-generate Employee ID
            dept_code = payload.department[:3].upper() if payload.department else "GEN"
            role_code = payload.role[:3].upper() # e.g., MAN, ACC, EMP
            
            # Infer Dept Code from Job Title if department is empty
            if not dept_code or dept_code == "GEN":
                job_title_upper = payload.job_title.upper() if payload.job_title else ""
                if "IT" in job_title_upper or "DEV" in job_title_upper or "TECH" in job_title_upper:
                    dept_code = "IT"
                elif "FINANCE" in job_title_upper or "COMPTA" in job_title_upper:
                     dept_code = "FIN"
                elif "HR" in job_title_upper or "RH" in job_title_upper:
                     dept_code = "HR"
                elif "SALE" in job_title_upper or "COMMERCIAL" in job_title_upper:
                     dept_code = "SAL"

            random_suffix = ''.join(random.choices(string.digits, k=4))
            employee_id = f"{role_code}-{dept_code}-{random_suffix}"

            while User.objects.filter(employee_id=employee_id).exists():
                 random_suffix = ''.join(random.choices(string.digits, k=4))
                 employee_id = f"{role_code}-{dept_code}-{random_suffix}"

            # 1. Create HR Employee record
            from hr.models import Employee
            employee = Employee.objects.create(
                company=request.user.company,
                first_name=payload.first_name,
                last_name=payload.last_name,
                email=payload.email,
                phone=payload.phone,
                position=payload.job_title,
                department=payload.department,
                bio=payload.bio,
                base_salary=payload.base_salary,
                photo=avatar,
                hire_date=date.today()
            )

            # 2. Create User account
            user = User.objects.create_user(
                username=payload.email,
                email=payload.email,
                password=password,
                first_name=payload.first_name,
                last_name=payload.last_name,
                phone=payload.phone,
                company=request.user.company,
                role=payload.role,
                job_title=payload.job_title,
                bio=payload.bio,
                permissions=permissions_data,
                employee_id=employee_id,
                avatar=avatar,
                must_change_password=True,
                is_activated=True,
            )
            
            # Update Employee with generated kumba_id (from user creation)
            employee.kumba_id = user.kumba_id or user.employee_id
            employee.save()

            # --- SYNC TO KUMBA AUTH (SSO) ---
            try:
                auth_url = f"{settings.AUTH_SERVER_URL}/api/auth/internal/provision-user/"
                provision_payload = {
                    "email": payload.email,
                    "password": password,
                    "first_name": payload.first_name,
                    "last_name": payload.last_name,
                    "phone": payload.phone,
                    "role": payload.role,
                    "kumba_id": user.kumba_id or user.employee_id
                }
                headers = {
                    "X-Service-Secret": settings.KUMBA_INTERNAL_SECRET,
                    "Content-Type": "application/json"
                }
                
                print(f"DEBUG: Provisioning user {payload.email} in Kumba Auth...")
                auth_res = requests.post(auth_url, json=provision_payload, headers=headers, timeout=10)
                
                if auth_res.status_code not in [200, 201]:
                    error_data = auth_res.json() if auth_res.status_code != 500 else "Internal Server Error"
                    print(f"ERROR: Failed to provision user in Kumba Auth. Status: {auth_res.status_code}, Response: {error_data}")
                    # Raise exception to trigger transaction rollback
                    raise Exception(f"SSO Provisioning failed: {error_data}")
                    
                print(f"DEBUG: Successfully provisioned user in Kumba Auth: {payload.email}")
                
            except requests.exceptions.RequestException as e:
                print(f"ERROR: Network error during Kumba Auth provisioning: {str(e)}")
                raise Exception(f"Failed to reach SSO server: {str(e)}")
            except Exception as e:
                # Re-raise to trigger rollback
                raise e

            logo_url = request.build_absolute_uri(settings.MEDIA_URL + 'klock-logo.png')
            
            # --- PREMIUM HTML EMAIL CONTENT ---
            html_message = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 40px 20px; }}
                    .header {{ text-align: center; margin-bottom: 40px; }}
                    .logo {{ font-size: 28px; font-weight: 800; color: #2563eb; letter-spacing: -1px; }}
                    .card {{ background: #ffffff; border-radius: 24px; padding: 40px; border: 1px solid #f0f0f0; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); }}
                    h1 {{ font-size: 24px; font-weight: 800; margin-bottom: 16px; letter-spacing: -0.5px; }}
                    p {{ font-size: 16px; color: #4b5563; margin-bottom: 24px; }}
                    .credentials-box {{ background: #f8fafc; border-radius: 16px; padding: 24px; margin-bottom: 32px; border: 1px solid #e2e8f0; }}
                    .credential-item {{ margin-bottom: 12px; font-size: 14px; }}
                    .credential-label {{ font-weight: 700; color: #64748b; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; margin-bottom: 4px; display: block; }}
                    .credential-value {{ font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: 16px; font-weight: 600; color: #0f172a; }}
                    .btn {{ display: inline-block; background: #2563eb; color: #ffffff; padding: 16px 32px; border-radius: 14px; text-decoration: none; font-weight: 700; font-size: 16px; text-align: center; }}
                    .footer {{ text-align: center; margin-top: 40px; font-size: 12px; color: #9ca3af; }}
                    .warning {{ font-size: 13px; color: #b45309; background: #fffbeb; padding: 16px; border-radius: 12px; border-left: 4px solid #f59e0b; margin-top: 24px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header" style="text-align: center;">
                        <img src="{logo_url}" alt="Klock Logo" style="width: 80px; height: 80px; border-radius: 20px; border: 1px solid #f0f0f0; margin-bottom: 20px;">
                        <div class="logo" style="margin-top: 10px;">Kumba Business</div>
                    </div>
                    <div class="card">
                        <h1>Welcome to the Team, {payload.first_name}!</h1>
                        <p>We're excited to have you on board. Your professional Kumba Business account is ready for use.</p>
                        
                        <div class="credentials-box">
                            <div class="credential-item">
                                <span class="credential-label">Professional Email</span>
                                <span class="credential-value" style="color: #2563eb;">{payload.email}</span>
                            </div>
                            <div class="credential-item">
                                <span class="credential-label">Employee ID</span>
                                <span class="credential-value">{employee_id}</span>
                            </div>
                            <div class="credential-item" style="background: #fff; padding: 16px; border-radius: 12px; border: 1px dashed #cbd5e1; margin-top: 16px;">
                                <span class="credential-label" style="color: #eb4432;">Temporary Password</span>
                                <span class="credential-value" style="font-size: 20px; letter-spacing: 2px;">{password}</span>
                            </div>
                        </div>

                        <div style="text-align: center;">
                            <a href="{settings.FRONTEND_URL}" class="btn">Access Dashboard</a>
                        </div>

                        <div class="warning">
                            <strong>Security Notice:</strong> You will be required to activate your account and set a new personal password upon your first login.
                        </div>
                    </div>
                    <div class="footer">
                        &copy; 2026 Kumba Ecosystem. All rights reserved.<br>
                        Sent by Kumba HR for {request.user.company.name if request.user.company else "Kumba Business"}
                    </div>
                </div>
            </body>
            </html>
            """
            
            # Fallback plain text version
            text_message = f"""
            Hello {payload.first_name},

            Welcome to Kumba Business! Your account has been created.

            CREDENTIALS:
            - Email: {payload.email}
            - ID: {employee_id}
            - Password: {password}

            Please log in at {settings.FRONTEND_URL} to activate your account.
            """

            subject = f"Welcome to {request.user.company.name if request.user.company else 'Kumba'} - Your Credentials"
            
            print(f"DEBUG: Attempting to send HTML email to {payload.email}")
            try:
                send_mail(
                    subject,
                    text_message,
                    settings.DEFAULT_FROM_EMAIL,
                    [payload.email],
                    fail_silently=False,
                    html_message=html_message
                )
                email_status = "Credentials sent via HTML email."
                print(f"DEBUG: Email sent successfully to {payload.email}")
            except Exception as mail_err:
                import traceback
                traceback.print_exc()
                print(f"DEBUG Error sending email to {payload.email}: {mail_err}")
                email_status = "Employee created, but failed to send credential email. Please provide credentials manually."

            print(f"--- EMAIL LOG ---")
            print(f"To: {payload.email} | Status: {email_status}")
            print(f"------------------")

            return 201, {"message": f"Employee created. ID: {employee_id}. {email_status}"}
        except Exception as e:
            import traceback
            traceback.print_exc()
            return 500, {"message": f"Internal Error: {str(e)}"}

    @route.post('/request-activation', auth=JWTAuth(), response={200: MessageSchema, 400: MessageSchema})
    def request_activation(self, request):
        user = request.user
        if user.is_activated:
            return 400, {"message": "Account already activated"}
        
        # Generate token and send email
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.http import urlsafe_base64_encode
        from django.utils.encoding import force_bytes
        
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        activation_link = f"{settings.FRONTEND_URL}/activate?uid={uid}&token={token}"
        
        logo_url = request.build_absolute_uri(settings.MEDIA_URL + 'klock-logo.png')
        
        # --- PREMIUM HTML ACTIVATION EMAIL ---
        subject = "Activez votre compte Kumba Business"
        message = f"Bonjour {user.first_name}, veuillez activer votre compte en suivant ce lien : {activation_link}"
        
        html_message = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; margin: 0; padding: 0; color: #e2e8f0;">
            <div style="max-width: 600px; margin: 40px auto; background-color: #1e293b; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); border: 1px solid #334155;">
                <!-- Header with Logo -->
                <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 40px 30px; text-align: center; border-bottom: 1px solid #334155;">
                    <div style="font-size: 28px; font-weight: 800; color: #fff; letter-spacing: -1px; margin-bottom: 8px;">
                        Kumba<span style="color: #3b82f6;">Business</span>
                    </div>
                    <div style="height: 2px; width: 40px; background: #3b82f6; margin: 0 auto; border-radius: 2px;"></div>
                </div>

                <!-- Main Content -->
                <div style="padding: 50px 40px; text-align: center;">
                    <div style="width: 80px; height: 80px; border-radius: 20px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 24px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.1);">
                         <img src="{logo_url}" alt="Klock Logo" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    
                    <h1 style="font-size: 24px; font-weight: 700; color: #fff; margin-bottom: 16px; margin-top: 0; letter-spacing: -0.5px;">Activez votre compte</h1>
                    
                    <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
                        Bonjour <strong>{user.first_name}</strong>,<br><br>
                        Ravi de vous compter parmi nous ! Pour sécuriser votre accès et commencer à utiliser Kumba Business et Klock, veuillez confirmer votre adresse email.
                    </p>

                    <!-- Primary Action Button (Deep Link) -->
                    <a href="klock://activate?uid={uid}&token={token}" style="display: inline-block; background: #3b82f6; color: #ffffff; padding: 18px 36px; border-radius: 14px; font-weight: 700; text-decoration: none; font-size: 16px; transition: all 0.3s ease; box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3);">
                        Ouvrir dans l'application Klock
                    </a>

                    <div style="margin: 30px 0; border-top: 1px solid #334155;"></div>

                    <p style="color: #94a3b8; font-size: 14px; margin-bottom: 20px;">
                        Si l'application ne s'ouvre pas, utilisez le lien web :
                    </p>

                    <!-- Secondary Web Link -->
                    <a href="{activation_link}" style="color: #3b82f6; text-decoration: none; font-weight: 600; font-size: 14px;">
                        Activer via mon navigateur &rarr;
                    </a>
                </div>

                <!-- Footer -->
                <div style="background-color: #0f172a; padding: 30px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #334155;">
                    <p style="margin-bottom: 12px;">Cet email a été envoyé pour la sécurité de votre compte Kumba.</p>
                    <p style="margin-bottom: 0;">&copy; 2026 Kumba Ecosystem. Tous droits réservés.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            html_message=html_message,
            fail_silently=False,
        )
        
        return 200, {"message": "Activation email sent"}

    @route.get('/activate', auth=None, response={200: MessageSchema, 400: MessageSchema})
    def activate(self, request, uid: str, token: str):
        from django.utils.http import urlsafe_base64_decode
        from django.utils.encoding import force_str
        from django.contrib.auth.tokens import default_token_generator
        
        try:
            id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=id)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            user.is_activated = True
            user.save()
            return 200, {"message": "Account activated successfully"}
        else:
            return 400, {"message": "Invalid activation link"}


    @route.get('/employees', auth=JWTAuth(), response=list[EmployeeSchema])
    def list_employees(self, request):
        return User.objects.filter(company=request.user.company)

    @route.get('/employees/{id}', auth=JWTAuth(), response=UserProfileSchema)
    def get_employee(self, request, id: int):
        user = get_object_or_404(User, id=id, company=request.user.company)
        
        effective_permissions = DEFAULT_ROLE_PERMISSIONS.get(user.role, [])
        if user.permissions and isinstance(user.permissions, dict) and user.permissions.get('all'):
             effective_permissions = ["*"]

        return {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "phone": user.phone,
            "role": user.role,
            "groups": [g.name for g in user.groups.all()],
            "company": {
                "name": user.company.name,
                "sector": user.company.sector,
                "country": user.company.country,
                "currency": user.company.currency,
                "tax_rate": user.company.tax_rate
            } if user.company else None,
            "job_title": user.job_title,
            "permissions": {p: True for p in effective_permissions},
            "is_activated": user.is_activated,
            "must_change_password": user.must_change_password
        }

    @route.patch('/employees/{id}', auth=JWTAuth(), response=UserProfileSchema)
    def update_employee(self, request, id: int, payload: EmployeeUpdateSchema):
        if request.user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]:
             return 403, {"message": "Permission denied"}

        user = get_object_or_404(User, id=id, company=request.user.company)
        
        for attr, value in payload.dict(exclude_unset=True).items():
            if attr == 'groups' and value is not None:
                user.groups.clear()
                for group_name in value:
                    try:
                        g = Group.objects.get(name=group_name)
                        user.groups.add(g)
                    except Group.DoesNotExist:
                        pass
            else:
                 setattr(user, attr, value)
        
        user.save()
        
        effective_permissions = DEFAULT_ROLE_PERMISSIONS.get(user.role, [])
        if user.permissions and isinstance(user.permissions, dict) and user.permissions.get('all'):
             effective_permissions = ["*"]

        return {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "phone": user.phone,
            "role": user.role,
            "groups": [g.name for g in user.groups.all()],
            "company": {
                "name": user.company.name,
                "sector": user.company.sector,
                "country": user.company.country,
                "currency": user.company.currency,
                "tax_rate": user.company.tax_rate
            } if user.company else None,
            "job_title": user.job_title,
            "permissions": {p: True for p in effective_permissions},
            "is_activated": user.is_activated,
            "must_change_password": user.must_change_password
        }
