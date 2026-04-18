from django.contrib.contenttypes.models import ContentType
from users.models import CustomUser
from companies.models import Company
from hr.models import PayrollRun
from approvals.models import ApprovalDefinition, ApprovalStep, ApprovalRequest
from approvals.services import ApprovalService
from datetime import date

# Setup
user = CustomUser.objects.filter(email='sano.daouda96@gmail.com').first()
if not user:
    print("User not found")
    exit(1)

company = user.company
payroll_ctype = ContentType.objects.get_for_model(PayrollRun)

# Cleanup
ApprovalDefinition.objects.filter(company=company, content_type=payroll_ctype).delete()
ApprovalRequest.objects.filter(company=company, content_type=payroll_ctype).delete()

# 1. Define Workflow
print("Creating Approval Definition...")
definition = ApprovalDefinition.objects.create(
    company=company, 
    content_type=payroll_ctype,
    trigger_amount_min=0,
    is_active=True
)

# Step 1: Manager
step1 = ApprovalStep.objects.create(
    definition=definition,
    order=1,
    role_required="MANAGER"
)

# Step 2: Director
step2 = ApprovalStep.objects.create(
    definition=definition,
    order=2,
    role_required="DIRECTOR"
)

# 2. Create Object (PayrollRun)
print("Creating PayrollRun...")
payroll = PayrollRun.objects.create(
    company=company,
    period_start=date(2027, 1, 1),
    period_end=date(2027, 1, 31),
    status='DRAFT',
    total_amount=50000
)

# 3. Initiate Approval
print("Initiating Approval...")
req = ApprovalService.initiate_approval(payroll, user)
if not req:
    print("FAILED: No request created")
    exit(1)

print(f"Request Created: {req.status}, Step: {req.current_step.order}")

if req.status != 'PENDING' or req.current_step.order != 1:
    print("FAILED: Incorrect initial state")
    exit(1)
    
# 4. Approve Step 1
print("Approving Step 1...")
req, finalized = ApprovalService.approve_request(req.id, user, "LGTM Step 1")
print(f"After Step 1: {req.status}, Step: {req.current_step.order}, Finalized: {finalized}")

if finalized or req.current_step.order != 2:
    print("FAILED: Should be at step 2")
    exit(1)

# 5. Approve Step 2 (Final)
print("Approving Step 2...")
req, finalized = ApprovalService.approve_request(req.id, user, "LGTM Final")
print(f"After Step 2: {req.status}, Step: {req.current_step}, Finalized: {finalized}")

if not finalized or req.status != 'APPROVED':
    print("FAILED: Should be finalized and APPROVED")
    exit(1)

print("SUCCESS: Full workflow verified")
