#!/usr/bin/env python3
"""
Direct Django ORM test for accounting system
"""
import os
import sys
import django

# Set up Django
sys.path.insert(0, '/Users/mr.dds/.gemini/antigravity/scratch/kumba-business/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kumba_backend.settings')
django.setup()

from accounting.models import Account, AccountType
from companies.models import Company
from users.models import CustomUser

print("=" * 60)
print("DIRECT DJANGO ORM TEST")
print("=" * 60)

# Get or create test user
user = CustomUser.objects.filter(email='sano.daouda96@gmail.com').first()
if not user:
    print("❌ User not found")
    sys.exit(1)

company = user.company
print(f"\n✅ User: {user.email}")
print(f"✅ Company: {company.name}")

# Check if chart of accounts exists
account_count = Account.objects.filter(company=company).count()
print(f"\n📊 Current accounts: {account_count}")

if account_count == 0:
    print("\n🔧 Initializing chart of accounts...")
    
    default_accounts = [
        # ACTIFS
        ("2", "ACTIFS IMMOBILISES", AccountType.ASSET, None),
        ("21", "Immobilisations incorporelles", AccountType.ASSET, "2"),
        ("22", "Terrains", AccountType.ASSET, "2"),
        ("24", "Matériel", AccountType.ASSET, "2"),
        
        ("4", "COMPTES DE TIERS", AccountType.ASSET, None),
        ("411", "Clients", AccountType.ASSET, "4"),
        ("415", "Clients - Effets à recevoir", AccountType.ASSET, "4"),
        
        ("5", "COMPTES DE TRESORERIE", AccountType.ASSET, None),
        ("52", "Banques", AccountType.ASSET, "5"),
        ("53", "Caisse", AccountType.ASSET, "5"),
        ("54", "Mobile Money", AccountType.ASSET, "5"),
        
        # CAPITAUX PROPRES
        ("1", "CAPITAUX PROPRES", AccountType.EQUITY, None),
        ("10", "Capital", AccountType.EQUITY, "1"),
        ("12", "Résultat de l'exercice", AccountType.EQUITY, "1"),
        
        # PASSIFS
        ("40", "DETTES", AccountType.LIABILITY, None),
        ("401", "Fournisseurs", AccountType.LIABILITY, "40"),
        ("421", "Personnel - Rémunérations dues", AccountType.LIABILITY, "40"),
        ("43", "Organismes sociaux", AccountType.LIABILITY, "40"),
        ("44", "État et collectivités", AccountType.LIABILITY, "40"),
        ("443", "TVA collectée", AccountType.LIABILITY, "44"),
        ("445", "TVA déductible", AccountType.ASSET, "44"),
        
        # PRODUITS
        ("7", "VENTES ET PRODUITS", AccountType.REVENUE, None),
        ("70", "Ventes de marchandises", AccountType.REVENUE, "7"),
        ("701", "Ventes de produits finis", AccountType.REVENUE, "7"),
        ("706", "Prestations de services", AccountType.REVENUE, "7"),
        
        # CHARGES
        ("6", "ACHATS ET CHARGES", AccountType.EXPENSE, None),
        ("60", "Achats de marchandises", AccountType.EXPENSE, "6"),
        ("601", "Achats de matières premières", AccountType.EXPENSE, "6"),
        ("604", "Achats de fournitures", AccountType.EXPENSE, "6"),
        ("61", "Transports", AccountType.EXPENSE, "6"),
        ("62", "Services extérieurs", AccountType.EXPENSE, "6"),
        ("63", "Autres services", AccountType.EXPENSE, "6"),
        ("64", "Impôts et taxes", AccountType.EXPENSE, "6"),
        ("66", "Charges de personnel", AccountType.EXPENSE, "6"),
        ("661", "Salaires", AccountType.EXPENSE, "66"),
        ("664", "Charges sociales", AccountType.EXPENSE, "66"),
    ]
    
    accounts_map = {}
    for code, name, acc_type, parent_code in default_accounts:
        parent = accounts_map.get(parent_code) if parent_code else None
        account = Account.objects.create(
            company=company,
            code=code,
            name=name,
            type=acc_type,
            parent=parent
        )
        accounts_map[code] = account
        print(f"  Created: {code} - {name}")
    
    print(f"\n✅ Created {len(default_accounts)} accounts")
else:
    print("\n✅ Chart of accounts already initialized")
    print("\nSample accounts:")
    for acc in Account.objects.filter(company=company)[:10]:
        print(f"  {acc.code: <6} - {acc.name: <40} ({acc.type})")

print("\n" + "=" * 60)
