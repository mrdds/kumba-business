from django.contrib import admin
from django.urls import path
from ninja_extra import NinjaExtraAPI
from ninja_jwt.controller import NinjaJWTDefaultController
from users.api import AuthController
from users.password_reset_api import router as password_reset_router
from approvals.api import router as approvals_router

from accounting.api import AccountingController
from invoicing.api import InvoiceController
from invoicing.api_quotes import QuoteController
from crm.api import CRMController
from hr.api import HRController
from budgets.api import BudgetController
from companies.api import CompanyController
from reports.api import ReportsController
from debts.api import DebtController
from tontines.api import TontineController
from notifications.api import NotificationController
from purchasing.api import PurchaseOrderController

from kumba_connect.api import ConnectController # Kumba Connect
from kumba_social.api import SocialController
from documents.api import DocumentsController
from kumba_id.api import KumbaIDController
from kumba_auth.api import KumbaAuthController, PresenceController

from kumba_id.auth import KumbaJWTAuth
from ninja.errors import ValidationError

api = NinjaExtraAPI(title="Kumba Business API", auth=KumbaJWTAuth())

@api.exception_handler(ValidationError)
def validation_errors(request, exc):
    print(f"DEBUG: Validation Error for {request.path}: {exc.errors}")
    return api.create_response(request, {"detail": exc.errors}, status=422)

api.register_controllers(
    NinjaJWTDefaultController, 
    KumbaAuthController, # Kumba Auth
    PresenceController,  # Presence
    KumbaIDController,   # Kumba ID
    AuthController,      # Legacy Users Auth
    AccountingController, 
    InvoiceController,
    QuoteController,
    CRMController,
    HRController,
    BudgetController,
    CompanyController,
    ReportsController,
    DebtController,
    TontineController,
    NotificationController,
    PurchaseOrderController,
    DocumentsController,
    ConnectController,
    SocialController,
)

# Add password reset endpoints (no auth required)
api.add_router('/auth', password_reset_router, tags=['Authentication'])
api.add_router('/approvals', approvals_router, tags=['Approvals'])

from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api.urls),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
