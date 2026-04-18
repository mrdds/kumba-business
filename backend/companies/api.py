from typing import Optional, List
from ninja import Schema, File, Form
from ninja.files import UploadedFile
from ninja_extra import ControllerBase, api_controller, route
from .models import Company
from users.permissions import UserRole

class CompanySchema(Schema):
    id: int
    kumba_id: Optional[str] = None
    name: str
    sector: str
    country: str
    currency: str
    tax_rate: float
    logo: Optional[str] = None
    address: Optional[str] = ""
    tax_id: Optional[str] = ""
    registration_number: Optional[str] = ""
    phone: Optional[str] = ""
    email: Optional[str] = ""
    website: Optional[str] = ""

class CompanyUpdateSchema(Schema):
    name: Optional[str] = None
    sector: Optional[str] = ""
    country: Optional[str] = "CI"
    currency: Optional[str] = "USD"
    tax_rate: Optional[float] = 0.0
    address: Optional[str] = ""
    tax_id: Optional[str] = ""
    registration_number: Optional[str] = ""
    phone: Optional[str] = ""
    email: Optional[str] = ""
    website: Optional[str] = ""

class SubscriptionUpdateSchema(Schema):
    plan: str

@api_controller('/companies', tags=['Companies'])
class CompanyController(ControllerBase):

    @route.post('/me', response=CompanySchema)
    def update_company(self, request, payload: CompanyUpdateSchema = Form(...), logo: Optional[UploadedFile] = File(None)):
        company = request.user.company
        if not company:
            return 404, {"message": "No company associated with this user"}
        
        data = payload.dict(exclude_unset=True)
        
        # Handle logo
        if logo:
            company.logo = logo

        # Explicitly handle all fields for reliability
        if 'name' in data: company.name = data['name']
        if 'sector' in data: company.sector = data['sector']
        if 'country' in data: company.country = data['country']
        if 'currency' in data: company.currency = data['currency']
        if 'tax_rate' in data: company.tax_rate = data['tax_rate']
        if 'address' in data: company.address = data['address']
        if 'tax_id' in data: company.tax_id = data['tax_id']
        if 'registration_number' in data: company.registration_number = data['registration_number']
        if 'phone' in data: company.phone = data['phone']
        if 'email' in data: company.email = data['email']
        if 'website' in data: company.website = data['website']
            
        company.save()
        
        # Manually construct response to include absolute URL for logo
        return {
            "id": company.id,
            "kumba_id": company.kumba_id,
            "name": company.name,
            "sector": company.sector,
            "country": company.country,
            "currency": company.currency,
            "tax_rate": float(company.tax_rate),
            "logo": request.build_absolute_uri(company.logo.url) if company.logo else None,
            "address": company.address,
            "tax_id": company.tax_id,
            "registration_number": company.registration_number,
            "phone": company.phone,
            "email": company.email,
            "website": company.website
        }

    @route.post('', response=CompanySchema)
    def create_company(self, request, payload: CompanyUpdateSchema):
        company = Company.objects.create(**payload.dict())
        request.user.company = company
        request.user.role = UserRole.SUPER_ADMIN
        request.user.save()
        return company

    @route.post('/subscription', response=CompanySchema)
    def update_subscription(self, request, payload: SubscriptionUpdateSchema):
        company = request.user.company
        if not company:
            return 404, {"message": "No company associated with this user"}
        company.subscription_plan = payload.plan
        company.save()
        return company
