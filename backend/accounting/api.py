from ninja_extra import api_controller, route
from ninja import Schema
from typing import List, Optional
from datetime import date, datetime
from decimal import Decimal
from django.shortcuts import get_object_or_404
from companies.models import Company
from .models import (
    Account, AccountType, JournalEntry, JournalEntryLine,
    FiscalYear, BankAccount, TaxRate
)

# ============ SCHEMAS ============

class AccountSchema(Schema):
    id: int
    code: str
    name: str
    type: str
    parent_id: Optional[int] = None
    balance: Decimal
    is_active: bool
    description: Optional[str] = None

class AccountCreateSchema(Schema):
    code: str
    name: str
    type: str
    parent_id: Optional[int] = None
    description: Optional[str] = None

class AccountUpdateSchema(Schema):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class JournalEntryLineSchema(Schema):
    id: int
    account_id: int
    account_code: str
    account_name: str
    debit: Decimal
    credit: Decimal
    description: Optional[str] = None

class JournalEntryLineCreateSchema(Schema):
    account_id: int
    debit: Decimal = Decimal('0')
    credit: Decimal = Decimal('0')
    description: Optional[str] = None


class JournalEntrySchema(Schema):
    id: int
    date: date
    reference: str
    description: str
    status: str
    entry_type: str
    total_debit: Decimal
    total_credit: Decimal
    is_balanced: bool
    lines: List[JournalEntryLineSchema]
    created_at: datetime
    posted_at: Optional[datetime] = None

class JournalEntryCreateSchema(Schema):
    date: date
    reference: Optional[str] = None
    description: str
    entry_type: str = 'MANUAL'
    lines: List[JournalEntryLineCreateSchema]


class FiscalYearSchema(Schema):
    id: int
    name: str
    start_date: date
    end_date: date
    is_closed: bool

class FiscalYearCreateSchema(Schema):
    name: str
    start_date: date
    end_date: date


class BankAccountSchema(Schema):
    id: int
    name: str
    account_type: str
    account_number: str
    current_balance: Decimal
    bank_name: str
    is_active: bool
    linked_account_id: Optional[int] = None

class BankAccountCreateSchema(Schema):
    name: str
    account_type: str
    account_number: Optional[str] = None
    bank_name: Optional[str] = None
    opening_balance: Decimal = Decimal('0')
    linked_account_id: Optional[int] = None


class TaxRateSchema(Schema):
    id: int
    name: str
    rate: Decimal
    tax_type: str
    is_default: bool
    is_active: bool
    tax_account_id: Optional[int] = None

class TaxRateCreateSchema(Schema):
    name: str
    rate: Decimal
    tax_type: str = 'VAT'
    is_default: bool = False
    tax_account_id: Optional[int] = None


class LedgerEntrySchema(Schema):
    """Ligne du grand livre"""
    date: date
    reference: str
    description: str
    debit: Decimal
    credit: Decimal
    balance: Decimal


class TrialBalanceLineSchema(Schema):
    """Ligne de la balance"""
    account_code: str
    account_name: str
    account_type: str
    debit: Decimal
    credit: Decimal
    balance: Decimal



# ============ TRANSACTIONS (MOBILE) ============

class TransactionCreateSchema(Schema):
    amount: Decimal
    type: str  # 'IN' or 'OUT'
    category: str
    description: Optional[str] = None
    date: date

# ============ API CONTROLLER ============

@api_controller('/accounting', tags=['Accounting'], permissions=[])
class AccountingController:
    
    def get_user_company(self, request) -> Company:
        """Helper pour récupérer la company de l'utilisateur"""
        return request.user.company
    
    # ========== DASHBOARD ==========
    
    @route.get("/dashboard")
    def get_dashboard_summary(self, request):
        """Récupère le résumé du dashboard avec toutes les métriques clés"""
        from invoicing.models import Invoice, InvoicePayment
        from hr.models import Employee
        company = self.get_user_company(request)
        
        # Calcul du solde total (somme des comptes de banque et caisse)
        cash_accounts = Account.objects.filter(
            company=company,
            type__in=['BANK', 'CASH'],
            is_active=True
        )
        total_balance = sum(acc.balance for acc in cash_accounts)
        
        # Calcul des revenus (comptes de produits - type REVENUE)
        revenue_accounts = Account.objects.filter(
            company=company,
            type='REVENUE',
            is_active=True
        )
        total_revenue = sum(abs(acc.balance) for acc in revenue_accounts)
        
        # Calcul des dépenses (comptes de charges - type EXPENSE)
        expense_accounts = Account.objects.filter(
            company=company,
            type='EXPENSE',
            is_active=True
        )
        total_expenses = sum(abs(acc.balance) for acc in expense_accounts)
        
        # Factures impayées
        unpaid_invoices = Invoice.objects.filter(
            company=company,
            status__in=['SENT', 'PARTIAL']
        )
        unpaid_invoices_count = unpaid_invoices.count()
        unpaid_invoices_amount = sum(invoice.get_balance_due() for invoice in unpaid_invoices)
        
        # Masse salariale estimée (somme des salaires des employés)
        active_employees = Employee.objects.filter(company=company)
        pending_salaries_amount = sum(emp.base_salary for emp in active_employees if emp.base_salary)
        
        # Transactions récentes (dernières écritures de journal)
        recent_entries = JournalEntry.objects.filter(
            company=company,
            status='POSTED'
        ).order_by('-date', '-created_at')[:10]
        
        recent_transactions = []
        for entry in recent_entries:
            # Déterminer si c'est un revenu ou une dépense basé sur les lignes
            lines = entry.lines.all()
            total_amount = entry.total_debit()
            
            # Simplification: si ça touche un compte de revenue, c'est IN, sinon OUT
            is_income = any(line.account.type == 'REVENUE' for line in lines if line.credit > 0)
            
            recent_transactions.append({
                'id': entry.id,
                'description': entry.description,
                'date': entry.date.strftime('%Y-%m-%d'),
                'amount': float(total_amount),
                'type': 'IN' if is_income else 'OUT',
                'category': entry.entry_type
            })
        
        return {
            'balance': float(total_balance),
            'revenue': float(total_revenue),
            'expenses': float(total_expenses),
            'unpaid_invoices_count': unpaid_invoices_count,
            'unpaid_invoices_amount': float(unpaid_invoices_amount),
            'pending_salaries_amount': float(pending_salaries_amount),
            'recent_transactions': recent_transactions,
            'currency': company.currency
        }
    
    # ========== CHART OF ACCOUNTS ==========

    
    @route.get("/accounts", response=List[AccountSchema])
    def list_accounts(self, request, type: Optional[str] = None, active_only: bool = True):
        """Liste tous les comptes du plan comptable"""
        company = self.get_user_company(request)
        accounts = Account.objects.filter(company=company)
        
        if type:
            accounts = accounts.filter(type=type)
        if active_only:
            accounts = accounts.filter(is_active=True)
        
        return accounts
    
    @route.post("/accounts", response=AccountSchema)
    def create_account(self, request, data: AccountCreateSchema):
        """Créer un nouveau compte"""
        company = self.get_user_company(request)
        
        parent = None
        if data.parent_id:
            parent = get_object_or_404(Account, id=data.parent_id, company=company)
        
        account = Account.objects.create(
            company=company,
            code=data.code,
            name=data.name,
            type=data.type,
            parent=parent,
            description=data.description
        )
        return account
    
    @route.get("/accounts/{account_id}", response=AccountSchema)
    def get_account(self, request, account_id: int):
        """Détails d'un compte"""
        company = self.get_user_company(request)
        account = get_object_or_404(Account, id=account_id, company=company)
        return account
    
    @route.put("/accounts/{account_id}", response=AccountSchema)
    def update_account(self, request, account_id: int, data: AccountUpdateSchema):
        """Modifier un compte"""
        company = self.get_user_company(request)
        account = get_object_or_404(Account, id=account_id, company=company)
        
        for attr, value in data.dict(exclude_unset=True).items():
            setattr(account, attr, value)
        account.save()
        return account
    
    @route.delete("/accounts/{account_id}")
    def deactivate_account(self, request, account_id: int):
        """Désactiver un compte"""
        company = self.get_user_company(request)
        account = get_object_or_404(Account, id=account_id, company=company)
        account.is_active = False
        account.save()
        return {"success": True, "message": f"Account {account.code} deactivated"}
    
    @route.post("/accounts/init")
    def initialize_chart_of_accounts(self, request, template: str = "OHADA"):
        """Initialiser le plan comptable avec un template"""
        company = self.get_user_company(request)
        
        if Account.objects.filter(company=company).exists():
            return {"success": False, "message": "Chart of accounts already initialized"}
        
        # Comptes de base OHADA simplifié
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
        
        return {
            "success": True,
            "message": f"Chart of accounts initialized with {len(default_accounts)} accounts",
            "template": template
        }
    
    # ========== JOURNAL ENTRIES ==========
    
    @route.get("/journal-entries", response=List[JournalEntrySchema])
    def list_journal_entries(self, request, status: Optional[str] = None, from_date: Optional[date] = None, to_date: Optional[date] = None):
        """Liste des écritures comptables"""
        company = self.get_user_company(request)
        entries = JournalEntry.objects.filter(company=company).prefetch_related('lines__account')
        
        if status:
            entries = entries.filter(status=status)
        if from_date:
            entries = entries.filter(date__gte=from_date)
        if to_date:
            entries = entries.filter(date__lte=to_date)
        
        result = []
        for entry in entries[:100]:  # Limit for performance
            lines = [
                JournalEntryLineSchema(
                    id=line.id,
                    account_id=line.account.id,
                    account_code=line.account.code,
                    account_name=line.account.name,
                    debit=line.debit,
                    credit=line.credit,
                    description=line.description or ""
                )
                for line in entry.lines.all()
            ]
            
            result.append(JournalEntrySchema(
                id=entry.id,
                date=entry.date,
                reference=entry.reference or "",
                description=entry.description,
                status=entry.status,
                entry_type=entry.entry_type,
                total_debit=entry.total_debit(),
                total_credit=entry.total_credit(),
                is_balanced=entry.is_balanced(),
                lines=lines,
                created_at=entry.created_at,
                posted_at=entry.posted_at
            ))
        
        return result
    
    @route.post("/journal-entries", response=JournalEntrySchema)
    def create_journal_entry(self, request, data: JournalEntryCreateSchema):
        """Créer une écriture comptable"""
        company = self.get_user_company(request)
        
        entry = JournalEntry.objects.create(
            company=company,
            date=data.date,
            reference=data.reference or "",
            description=data.description,
            entry_type=data.entry_type,
            created_by=request.user
        )
        
        for line_data in data.lines:
            account = get_object_or_404(Account, id=line_data.account_id, company=company)
            JournalEntryLine.objects.create(
                journal_entry=entry,
                account=account,
                debit=line_data.debit,
                credit=line_data.credit,
                description=line_data.description or ""
            )
        
        return self.get_journal_entry(request, entry.id)
    
    @route.get("/journal-entries/{entry_id}", response=JournalEntrySchema)
    def get_journal_entry(self, request, entry_id: int):
        """Détails d'une écriture"""
        company = self.get_user_company(request)
        entry = get_object_or_404(JournalEntry, id=entry_id, company=company)
        
        lines = [
            JournalEntryLineSchema(
                id=line.id,
                account_id=line.account.id,
                account_code=line.account.code,
                account_name=line.account.name,
                debit=line.debit,
                credit=line.credit,
                description=line.description or ""
            )
            for line in entry.lines.all()
        ]
        
        return JournalEntrySchema(
            id=entry.id,
            date=entry.date,
            reference=entry.reference or "",
            description=entry.description,
            status=entry.status,
            entry_type=entry.entry_type,
            total_debit=entry.total_debit(),
            total_credit=entry.total_credit(),
            is_balanced=entry.is_balanced(),
            lines=lines,
            created_at=entry.created_at,
            posted_at=entry.posted_at
        )
    
    @route.post("/journal-entries/{entry_id}/post")
    def post_journal_entry(self, request, entry_id: int):
        """Comptabiliser une écriture"""
        company = self.get_user_company(request)
        entry = get_object_or_404(JournalEntry, id=entry_id, company=company)
        
        try:
            entry.post()
            return {"success": True, "message": "Entry posted successfully"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @route.post("/journal-entries/{entry_id}/void")
    def void_journal_entry(self, request, entry_id: int):
        """Annuler une écriture"""
        company = self.get_user_company(request)
        entry = get_object_or_404(JournalEntry, id=entry_id, company=company)
        
        try:
            reversal = entry.void()
            return {"success": True, "message": "Entry voided", "reversal_id": reversal.id}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    # ========== LEDGER & REPORTS ==========
    
    @route.get("/ledger", response=List[LedgerEntrySchema])
    def get_general_ledger(self, request, account_id: int, from_date: Optional[date] = None, to_date: Optional[date] = None):
        """Grand livre pour un compte"""
        company = self.get_user_company(request)
        account = get_object_or_404(Account, id=account_id, company=company)
        
        lines = JournalEntryLine.objects.filter(
            account=account,
            journal_entry__status='POSTED',
            journal_entry__company=company
        ).select_related('journal_entry')
        
        if from_date:
            lines = lines.filter(journal_entry__date__gte=from_date)
        if to_date:
            lines = lines.filter(journal_entry__date__lte=to_date)
        
        lines = lines.order_by('journal_entry__date', 'journal_entry__id')
        
        balance = Decimal('0')
        result = []
        
        for line in lines:
            if account.type in ['ASSET', 'EXPENSE']:
                balance += line.debit - line.credit
            else:
                balance += line.credit - line.debit
            
            result.append(LedgerEntrySchema(
                date=line.journal_entry.date,
                reference=line.journal_entry.reference or f"JE-{line.journal_entry.id}",
                description=line.description or line.journal_entry.description,
                debit=line.debit,
                credit=line.credit,
                balance=balance
            ))
        
        return result
    
    @route.get("/trial-balance", response=List[TrialBalanceLineSchema])
    def get_trial_balance(self, request, as_of_date: Optional[date] = None):
        """Balance de vérification"""
        company = self.get_user_company(request)
        
        if not as_of_date:
            as_of_date = date.today()
        
        accounts = Account.objects.filter(company=company, is_active=True)
        
        result = []
        for account in accounts:
            balance = account.get_balance_at_date(as_of_date)
            
            if account.type in ['ASSET', 'EXPENSE']:
                debit = balance if balance > 0 else Decimal('0')
                credit = -balance if balance < 0 else Decimal('0')
            else:
                credit = balance if balance > 0 else Decimal('0')
                debit = -balance if balance < 0 else Decimal('0')
            
            if debit != 0 or credit != 0:
                result.append(TrialBalanceLineSchema(
                    account_code=account.code,
                    account_name=account.name,
                    account_type=account.type,
                    debit=debit,
                    credit=credit,
                    balance=balance
                ))
        
        return result
    
    # ========== BANK ACCOUNTS ==========
    
    @route.get("/bank-accounts", response=List[BankAccountSchema])
    def list_bank_accounts(self, request):
        """Liste des comptes bancaires"""
        company = self.get_user_company(request)
        return BankAccount.objects.filter(company=company, is_active=True)
    
    @route.post("/bank-accounts", response=BankAccountSchema)
    def create_bank_account(self, request, data: BankAccountCreateSchema):
        """Créer un compte bancaire"""
        company = self.get_user_company(request)
        
        linked_account = None
        if data.linked_account_id:
            linked_account = get_object_or_404(Account, id=data.linked_account_id, company=company)
        
        bank_account = BankAccount.objects.create(
            company=company,
            name=data.name,
            account_type=data.account_type,
            account_number=data.account_number or "",
            bank_name=data.bank_name or "",
            opening_balance=data.opening_balance,
            current_balance=data.opening_balance,
            linked_account=linked_account
        )
        return bank_account
    
    # ========== TAX RATES ==========
    
    @route.get("/tax-rates", response=List[TaxRateSchema])
    def list_tax_rates(self, request):
        """Liste des taux de taxe"""
        company = self.get_user_company(request)
        return TaxRate.objects.filter(company=company, is_active=True)
    
    @route.post("/tax-rates", response=TaxRateSchema)
    def create_tax_rate(self, request, data: TaxRateCreateSchema):
        """Créer un taux de taxe"""
        company = self.get_user_company(request)
        
        tax_account = None
        if data.tax_account_id:
            tax_account = get_object_or_404(Account, id=data.tax_account_id, company=company)
        
        tax_rate = TaxRate.objects.create(
            company=company,
            name=data.name,
            rate=data.rate,
            tax_type=data.tax_type,
            is_default=data.is_default,
            tax_account=tax_account
        )
        return tax_rate
    
    # ========== FISCAL YEARS ==========
    
    @route.get("/fiscal-years", response=List[FiscalYearSchema])
    def list_fiscal_years(self, request):
        """Liste des exercices fiscaux"""
        company = self.get_user_company(request)
        return FiscalYear.objects.filter(company=company)
    
    @route.post("/fiscal-years", response=FiscalYearCreateSchema)
    def create_fiscal_year(self, request, data: FiscalYearCreateSchema):
        """Créer un exercice fiscal"""
        company = self.get_user_company(request)
        
        fiscal_year = FiscalYear.objects.create(
            company=company,
            name=data.name,
            start_date=data.start_date,
            end_date=data.end_date
        )
        return fiscal_year


    # ============ TRANSACTIONS (MOBILE) ============

    class TransactionOutSchema(Schema):
        id: int
        date: date
        description: str
        amount: float
        type: str
        category: str

    @route.get("/transactions", response=List[TransactionOutSchema])
    def list_transactions(self, request):
        """List simplified transactions (mobile view)"""
        company = self.get_user_company(request)
        # Filter JEs that look like simple transactions (e.g. 2 lines, involving Cash/Bank)
        # For MVP, just return all POSTED entries formatted as transactions
        entries = JournalEntry.objects.filter(
            company=company, 
            status='POSTED'
        ).order_by('-date', '-created_at')[:50]
        
        results = []
        for entry in entries:
            # Determine logic: 
            # If (lines have Revenue account AND Credit > 0) -> IN
            # If (lines have Expense account AND Debit > 0) -> OUT
            # Fallback: Check entry_type
            
            total_amount = entry.total_debit()
            is_income = any(line.account.type == 'REVENUE' for line in entry.lines.all() if line.credit > 0)
            
            # Category is likely the Other account name (not Cash/Bank)
            category = "General"
            for line in entry.lines.all():
                if line.account.type in ['REVENUE', 'EXPENSE']:
                    category = line.account.name
                    break
            
            results.append({
                'id': entry.id,
                'date': entry.date,
                'description': entry.description,
                'amount': float(total_amount),
                'type': 'IN' if is_income else 'OUT',
                'category': category
            })
        return results

    @route.post("/transactions", response={200: JournalEntrySchema})
    def create_transaction(self, request, payload: TransactionCreateSchema):
        """
        Create a transaction from the mobile app (Simplified entry)
        Auto-creates or finds account based on Category.
        """
        company = self.get_user_company(request)
        
        # 1. Identify/Create Account for Category
        account_name = payload.category.strip()
        account_type = 'REVENUE' if payload.type == 'IN' else 'EXPENSE'
        
        # Try to find existing account
        account = Account.objects.filter(
            company=company, 
            name__iexact=account_name,
            type=account_type
        ).first()
        
        if not account:
            # Create new account if not exists
            # Find a suitable parent (Root Revenue '7' or Expense '6')
            root_code = '7' if payload.type == 'IN' else '6'
            parent = Account.objects.filter(company=company, code=root_code).first()
            
            # Generate a code (simplistic for now: find max code in root)
            # Better: use a dedicated "Other" root like 799 or 699
            
            # Fallback: Just create under root with randomish suffix if root exists
            # Or use a specific "Mobile Transactions" bucket
            base_code = '799' if payload.type == 'IN' else '699'
            
            # Find next available code
            existing_count = Account.objects.filter(company=company, code__startswith=base_code).count()
            new_code = f"{base_code}{existing_count + 1:03d}"
            
            account = Account.objects.create(
                company=company,
                code=new_code,
                name=account_name,
                type=account_type,
                parent=parent,
                description=f"Auto-created from mobile app: {payload.category}"
            )

        # 2. Identify Cash Account (53 - Caisse usually)
        try:
            cash_account = Account.objects.get(company=company, code='53')
        except Account.DoesNotExist:
             # Fallback to Bank '52' or error
            cash_account = Account.objects.filter(company=company, code__startswith='5').first()
            if not cash_account:
                return 400, {"error": "No Cash/Bank account found to record transaction"}

        # 3. Create Journal Entry
        entry = JournalEntry.objects.create(
            company=company,
            date=payload.date,
            reference=f"MOB-{datetime.now().strftime('%Y%m%d%H%M')}",
            description=payload.description or f"{payload.category} ({payload.type})",
            entry_type='PAYMENT' if payload.type == 'OUT' else 'RECEIPT',
            created_by=request.user
        )
        
        # 4. Create Lines
        if payload.type == 'IN':
            # Debit Cash, Credit Revenue
            JournalEntryLine.objects.create(
                journal_entry=entry, account=cash_account, 
                debit=payload.amount, credit=Decimal('0'), description="Receipt"
            )
            JournalEntryLine.objects.create(
                journal_entry=entry, account=account, 
                debit=Decimal('0'), credit=payload.amount, description=payload.category
            )
        else: # OUT
            # Debit Expense, Credit Cash
            JournalEntryLine.objects.create(
                journal_entry=entry, account=account, 
                debit=payload.amount, credit=Decimal('0'), description=payload.category
            )
            JournalEntryLine.objects.create(
                journal_entry=entry, account=cash_account, 
                debit=Decimal('0'), credit=payload.amount, description="Payment"
            )
            
        # 5. Post Immediately
        entry.post()
        
        # Return formatted schema
        return 200, self.get_journal_entry(request, entry.id)

