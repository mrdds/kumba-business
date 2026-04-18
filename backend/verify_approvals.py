import os
import django
from datetime import date

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kumba_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from approvals.models import ApprovalDefinition, ApprovalStep, ApprovalRequest
from approvals.services import ApprovalService
from hr.models import SalaryAdvance, Employee
from companies.models import Company

User = get_user_model()

def verify_approvals():
    print("--- Verifying Approval Workflow Engine ---")
    
    # 1. Setup Data
    user = User.objects.first()
    if not user:
        print("No user found. Please create a superuser or register first.")
        return

    company = user.company
    if not company:
        print(f"User {user} has no company.")
        return

    print(f"1. Context: User={user.email}, Company={company.name}")

    # Get ContentType for SalaryAdvance
    ct = ContentType.objects.get_for_model(SalaryAdvance)

    # 2. Create Approval Definition
    print("\n2. Setting up Approval Definition for SalaryAdvance...")
    
    # Clean up existing definitions for test
    ApprovalDefinition.objects.filter(company=company, content_type=ct).delete()
    
    definition = ApprovalDefinition.objects.create(
        company=company,
        content_type=ct,
        trigger_amount_min=0, # Trigger for all
        is_active=True
    )
    
    # Add a Step (Manager Approval)
    ApprovalStep.objects.create(
        definition=definition,
        order=1,
        role_required="MANAGER"
    )
    print("   Created Definition with 1 Step (Manager)")

    # 3. Create a Test Object (Salary Advance)
    print("\n3. Creating Expense/Advance Request...")
    employee = Employee.objects.filter(company=company).first()
    if not employee:
        # Create dummy employee if needed
        employee = Employee.objects.create(
            company=company,
            first_name="Test",
            last_name="Employee",
            position="Tester",
            base_salary=50000
        )
    
    advance = SalaryAdvance.objects.create(
        employee=employee,
        amount=15000,
        reason="Test Approval Flow",
        request_date=date.today()
    )
    print(f"   Created SalaryAdvance #{advance.id} for {15000}")

    # 4. Initiate Approval
    print("\n4. Initiating Approval Workflow...")
    request = ApprovalService.initiate_approval(advance, user)
    
    if request:
        print(f"   SUCCESS: Request Created (ID: {request.id})")
        print(f"   Status: {request.status}")
        print(f"   Current Step: {request.current_step}")
    else:
        print("   FAILED: No request created (check initiate_approval logic)")
        return

    # 5. Verify Pending List (Simulate API)
    print("\n5. Checking Pending Approvals...")
    pending = ApprovalRequest.objects.filter(status='PENDING', company=company)
    print(f"   Pending Count: {pending.count()}")
    if request in pending:
        print("   Request is in pending list.")

    # 6. Approve the Request
    print("\n6. Approving Request...")
    try:
        updated_req, finalized = ApprovalService.approve_request(request.id, user, "Approved via Test Script")
        print(f"   Action Result: {updated_req.status}")
        print(f"   Finalized: {finalized}")
        
        if updated_req.status == 'APPROVED':
            print("   SUCCESS: Workflow completed successfully.")
        else:
            print(f"   Partial Success: Moved to next step (Step Order: {updated_req.current_step.order})")
            
    except Exception as e:
        print(f"   FAILED: {e}")

if __name__ == "__main__":
    verify_approvals()
