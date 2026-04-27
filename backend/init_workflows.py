import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kumba_backend.settings')
django.setup()

from django.contrib.auth.models import Group
from django.contrib.contenttypes.models import ContentType
from approvals.models import ApprovalDefinition, ApprovalStep, ApprovalRequest, ApprovalLog
from companies.models import Company

# Models
from purchasing.models import PurchaseOrder
from invoicing.models import Invoice, Quote
from accounting.models import JournalEntry
from hr.models import Employee, SalaryAdvance, PayrollRun
from budgets.models import Budget

def init_workflows():
    print("--- Initializing Kumba Business Approval Workflows ---")
    
    # 1. Setup Roles (Groups)
    roles = ['PROJECT_MANAGER', 'OPERATOR_MANAGER', 'GENERAL_MANAGER', 'FINANCE', 'EMPLOYEE']
    print("\n1. Setting up Roles (Groups)...")
    for r in roles:
        Group.objects.get_or_create(name=r)
        print(f"   Verified Role: {r}")

    # 2. Get Company (Assume first company)
    company = Company.objects.first()
    if not company:
        print("ERROR: No company found. Please create a company first.")
        return
    print(f"\nContext: Company = {company.name}")

    # 3. Define Workflows
    # Format: (Model, DocumentSubtype, [Steps])
    
    workflows = [
        # 1. PO: PM -> OM -> GM
        (PurchaseOrder, 'PO', ['PROJECT_MANAGER', 'OPERATOR_MANAGER', 'GENERAL_MANAGER']),
        
        # 2. Bill: FIN -> PM -> OM -> GM
        (PurchaseOrder, 'BILL', ['FINANCE', 'PROJECT_MANAGER', 'OPERATOR_MANAGER', 'GENERAL_MANAGER']),
        
        # 5. Salary Advance: EMP -> PM -> FIN -> GM
        (SalaryAdvance, None, ['PROJECT_MANAGER', 'FINANCE', 'GENERAL_MANAGER']),
        
        # 6. Payroll: FIN -> PM -> GM
        (PayrollRun, None, ['PROJECT_MANAGER', 'GENERAL_MANAGER']),
        
        # 7. Quote: PM -> FIN
        (Quote, None, ['FINANCE']),
        
        # 8. Client Invoice: FIN -> PM
        (Invoice, None, ['PROJECT_MANAGER']),
        
        # 10. Budget: PM -> FIN -> GM
        (Budget, None, ['FINANCE', 'GENERAL_MANAGER']),
    ]
    
    print("\n2. Configuring Workflows...")
    
    # Clean existing
    print("   Clearing old requests and logs...")
    ApprovalLog.objects.filter(request__company=company).delete()
    ApprovalRequest.objects.filter(company=company).delete()
    
    ApprovalDefinition.objects.filter(company=company).delete()
    print("   Cleared existing definitions.")

    for model_class, subtype, steps in workflows:
        ct = ContentType.objects.get_for_model(model_class)
        model_name = model_class._meta.model_name.upper()
        label = f"{model_name} ({subtype})" if subtype else model_name
        
        print(f"   Configuring {label}...")
        
        # Create Definition
        definition = ApprovalDefinition.objects.create(
            company=company,
            content_type=ct,
            document_subtype=subtype, # Can be None
            trigger_amount_min=0 # Default trigger all
        )
        
        # Create Steps
        for i, role in enumerate(steps):
            ApprovalStep.objects.create(
                definition=definition,
                order=i+1,
                role_required=role
            )
            print(f"     - Step {i+1}: {role}")

    print("\n--- Workflow Initialization Complete ---")

if __name__ == "__main__":
    init_workflows()
