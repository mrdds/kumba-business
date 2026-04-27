
from ninja_extra import api_controller, http_get, http_post
from ninja import Schema, File, Form
from ninja.errors import HttpError
from ninja.files import UploadedFile
import json
from pydantic import field_validator
from django.contrib.auth import get_user_model
from typing import List
from pydantic import EmailStr

from uuid import UUID
from typing import Optional

class CompanyOutSchema(Schema):
    kumba_id: Optional[str] = None
    name: str
    sector: str
    country: str
    currency: str
    tax_rate: float
    address: Optional[str] = ""
    tax_id: Optional[str] = ""
    registration_number: Optional[str] = ""
    phone: Optional[str] = ""
    email: Optional[str] = ""
    website: Optional[str] = ""
    logo: Optional[str] = None

User = get_user_model()

class UserSchema(Schema):
    id: int
    kumba_uid: UUID
    kumba_id: Optional[str] = None
    username: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    type: str
    kyc_level: int
    avatar_url: Optional[str] = None
    company_id: Optional[int] = None
    company: Optional[CompanyOutSchema] = None
    role: Optional[str] = None
    groups: List[str] = []
    phone: Optional[str] = None
    phone_numbers: List[dict] = []
    job_title: Optional[str] = None
    employee_id: Optional[str] = None
    bio: Optional[str] = None
    language: Optional[str] = 'fr'
    timezone: Optional[str] = 'Africa/Abidjan'
    cover_image_url: Optional[str] = None

    @field_validator('phone_numbers', mode='before')
    @classmethod
    def parse_phone_numbers(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except:
                return []
        return v

class RegisterSchema(Schema):
    username: str
    email: EmailStr
    password: str
    first_name: str = None
    last_name: str = None
    phone: str = None

class ProfileUpdateSchema(Schema):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    phone_numbers: Optional[str] = None
    job_title: Optional[str] = None
    bio: Optional[str] = None
    language: Optional[str] = None
    timezone: Optional[str] = None

@api_controller('/id', tags=['Kumba ID'])
class KumbaIDController:
    @http_get('/me', response=UserSchema)
    def ms_me(self, request):
        user = request.user
        if not user or not user.is_authenticated:
            raise HttpError(401, "Not authenticated")
        
        return {
            "id": user.id,
            "kumba_uid": user.kumba_uid,
            "kumba_id": user.kumba_id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "type": user.type,
            "kyc_level": user.kyc_level,
            "avatar_url": request.build_absolute_uri(user.avatar.url) if user.avatar else user.avatar_url,
            "company_id": user.company_id,
            "company": {
                "kumba_id": user.company.kumba_id,
                "name": user.company.name,
                "sector": user.company.sector,
                "country": user.company.country,
                "currency": user.company.currency,
                "tax_rate": float(user.company.tax_rate),
                "address": user.company.address,
                "tax_id": user.company.tax_id,
                "registration_number": user.company.registration_number,
                "phone": user.company.phone,
                "email": user.company.email,
                "website": user.company.website,
                "logo": request.build_absolute_uri(user.company.logo.url) if user.company and user.company.logo else None
            } if user.company else None,
            "role": user.role, "groups": [g.name for g in user.groups.all()],
            "phone": user.phone,
            "phone_numbers": user.phone_numbers,
            "job_title": user.job_title,
            "employee_id": user.employee_id,
            "bio": user.bio,
            "language": user.language,
            "timezone": user.timezone,
            "cover_image_url": user.cover_image_url
        }

    @http_post('/me', response=UserSchema)
    def update_profile(self, request, payload: ProfileUpdateSchema = Form(...), avatar: Optional[UploadedFile] = File(None)):
        user = request.user
        data = payload.dict(exclude_unset=True)
        
        # If avatar is uploaded, update it
        if avatar:
            user.avatar = avatar

        # Explicitly handle all fields for reliability
        if 'first_name' in data: user.first_name = data['first_name']
        if 'last_name' in data: user.last_name = data['last_name']
        if 'phone' in data: user.phone = data['phone']
        if 'bio' in data: user.bio = data['bio']
        if 'job_title' in data: user.job_title = data['job_title']
        if 'phone_numbers' in data:
            val = data['phone_numbers']
            if isinstance(val, str):
                try:
                    val = json.loads(val)
                except:
                    pass
            user.phone_numbers = val
        
        if 'language' in data: user.language = data['language']
        if 'timezone' in data: user.timezone = data['timezone']
            
        user.save()
        user.refresh_from_db()
        
        return {
            "id": user.id,
            "kumba_uid": user.kumba_uid,
            "kumba_id": user.kumba_id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "type": user.type,
            "kyc_level": user.kyc_level,
            "avatar_url": request.build_absolute_uri(user.avatar.url) if user.avatar else user.avatar_url,
            "company_id": user.company_id,
            "company": {
                "kumba_id": user.company.kumba_id,
                "name": user.company.name,
                "sector": user.company.sector,
                "country": user.company.country,
                "currency": user.company.currency,
                "tax_rate": float(user.company.tax_rate),
                "address": user.company.address,
                "tax_id": user.company.tax_id,
                "registration_number": user.company.registration_number,
                "phone": user.company.phone,
                "email": user.company.email,
                "website": user.company.website,
                "logo": request.build_absolute_uri(user.company.logo.url) if user.company and user.company.logo else None
            } if user.company else None,
            "role": user.role,
            "phone": user.phone,
            "phone_numbers": user.phone_numbers,
            "job_title": user.job_title,
            "employee_id": user.employee_id,
            "bio": user.bio,
            "language": user.language,
            "timezone": user.timezone,
            "cover_image_url": user.cover_image_url
        }

    @http_post('/register', response=UserSchema, auth=None)
    def register(self, payload: RegisterSchema):
        if User.objects.filter(email=payload.email).exists():
            # In a real app, handle error properly
            pass 
        
        user = User.objects.create_user(
            username=payload.username,
            email=payload.email,
            password=payload.password,
            first_name=payload.first_name or "",
            last_name=payload.last_name or "",
            phone=payload.phone or "",
            type=User.Types.USER
        )
        return user
