import os
import django
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kumba_backend.settings')
django.setup()

from hr.models import Employee, FieldResource
from companies.models import Company

# Target WEBKING HOLDINGS
company = Company.objects.filter(name__icontains='WEBKING').first()

if not company:
    print("No company found.")
    exit(1)

print(f"Creating employees for company: {company.name} (ID: {company.id})")

first_names = ["Jean", "Mamadou", "Kouassi", "Moussa", "Abdoulaye", "Ibrahim", "Patrick", "Christian", "Hervé", "Bakary", "Yao", "Koffi", "Konan", "Bamba", "Sidibé"]
last_names = ["Diallo", "Traoré", "Koné", "Coulibaly", "Ouattara", "Soro", "Touré", "Cissé", "Diabaté", "Fofana", "Keita", "Sangaré", "Diakité", "Sow", "Barry"]

# 5 Team Leaders
for i in range(5):
    fname = random.choice(first_names)
    lname = random.choice(last_names)
    email = f"{fname.lower()}.{lname.lower()}.tl{i+1}@example.com"
    
    emp = Employee.objects.create(
        company=company,
        first_name=fname,
        last_name=lname,
        email=email,
        position="Team Leader",
        department="FIELD",
        base_salary=450000 + random.randint(0, 100000)
    )
    
    FieldResource.objects.create(
        company=company,
        employee=emp,
        resource_type='INTERNAL',
        category='TEAM_LEAD',
        specialty='Télécommunications',
        can_lead_team=True,
        can_drive=True,
        can_handle_inventory=True
    )
    print(f"Created TL: {emp.first_name} {emp.last_name}")

# 10 Technicians
for i in range(10):
    fname = random.choice(first_names)
    lname = random.choice(last_names)
    email = f"{fname.lower()}.{lname.lower()}.tech{i+1}@example.com"
    
    emp = Employee.objects.create(
        company=company,
        first_name=fname,
        last_name=lname,
        email=email,
        position="Technicien",
        department="FIELD",
        base_salary=250000 + random.randint(0, 50000)
    )
    
    FieldResource.objects.create(
        company=company,
        employee=emp,
        resource_type='INTERNAL',
        category='TECH_FTTH',
        specialty='Fibre Optique',
        can_lead_team=False,
        can_drive=False,
        can_handle_inventory=True
    )
    print(f"Created Technician: {emp.first_name} {emp.last_name}")

print("Done.")
