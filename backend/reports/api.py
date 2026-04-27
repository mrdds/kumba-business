from ninja_extra import api_controller, route
from ninja import Schema
from ninja_jwt.authentication import JWTAuth
from kumba_id.auth import KumbaJWTAuth
from typing import List, Optional
from datetime import date
from decimal import Decimal
from django.db.models import Sum, Q
from django.http import HttpResponse
import csv
from accounting.models import Account, AccountType, JournalEntry, JournalEntryLine

# ============ SCHEMAS ============

class PnLItemSchema(Schema):
    month: str
    income: float
    expenses: float
    profit: float


class IncomeStatementLineSchema(Schema):
    """Ligne du compte de résultat"""
    account_code: str
    account_name: str
    amount: Decimal


class IncomeStatementSchema(Schema):
    """Compte de Résultat (P&L)"""
    from_date: date
    to_date: date
    
    # Revenus
    revenue_lines: List[IncomeStatementLineSchema]
    total_revenue: Decimal
    
    # Charges
    expense_lines: List[IncomeStatementLineSchema]
    total_expenses: Decimal
    
    # Résultat
    net_profit: Decimal


class BalanceSheetLineSchema(Schema):
    """Ligne du bilan"""
    account_code: str
    account_name: str
    amount: Decimal


class BalanceSheetSchema(Schema):
    """Bilan"""
    as_of_date: date
    
    # Actifs
    asset_lines: List[BalanceSheetLineSchema]
    total_assets: Decimal
    
    # Passifs
    liability_lines: List[BalanceSheetLineSchema]
    total_liabilities: Decimal
    
    # Capitaux propres
    equity_lines: List[BalanceSheetLineSchema]
    total_equity: Decimal
    
    # Vérification
    is_balanced: bool


class CashFlowLineSchema(Schema):
    """Ligne du flux de trésorerie"""
    description: str
    amount: Decimal


class CashFlowSchema(Schema):
    """État des flux de trésorerie"""
    from_date: date
    to_date: date
    
    operating_activities: List[CashFlowLineSchema]
    operating_cash_flow: Decimal
    
    investing_activities: List[CashFlowLineSchema]
    investing_cash_flow: Decimal
    
    financing_activities: List[CashFlowLineSchema]
    financing_cash_flow: Decimal
    
    net_cash_change: Decimal
    opening_cash: Decimal
    closing_cash: Decimal


class ARAgingLineSchema(Schema):
    """Ligne du compte client"""
    customer_name: str
    total_due: Decimal
    current: Decimal
    days_30: Decimal
    days_60: Decimal
    days_90: Decimal
    days_over_90: Decimal


class APAgingLineSchema(Schema):
    """Ligne du compte fournisseur"""
    supplier_name: str
    total_due: Decimal
    current: Decimal
    days_30: Decimal
    days_60: Decimal
    days_90: Decimal
    days_over_90: Decimal


# ============ API CONTROLLER ============

@api_controller('/reports', tags=['Reports'], auth=KumbaJWTAuth())
class ReportsController:
    
    def get_user_company(self, request):
        return request.user.company
    
    # ========== OLD REPORTS (Keep for backward compatibility) ==========
    
    @route.get('/pnl', response=List[PnLItemSchema])
    def get_pnl_report(self, request, year: int = None):
        """Old P&L report refactored to use JournalEntries"""
        if not year:
            year = date.today().year
        
        company = self.get_user_company(request)
        
        report = []
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        
        for i, month_name in enumerate(months):
            month_num = i + 1
            
            # Income = Revenue accounts (Credit - Debit)
            income_entries = JournalEntryLine.objects.filter(
                account__company=company,
                account__type=AccountType.REVENUE,
                journal_entry__status='POSTED',
                journal_entry__date__year=year,
                journal_entry__date__month=month_num
            )
            income_total = (income_entries.aggregate(Sum('credit'))['credit__sum'] or Decimal('0')) - \
                           (income_entries.aggregate(Sum('debit'))['debit__sum'] or Decimal('0'))
            
            # Expenses = Expense accounts (Debit - Credit)
            expense_entries = JournalEntryLine.objects.filter(
                account__company=company,
                account__type=AccountType.EXPENSE,
                journal_entry__status='POSTED',
                journal_entry__date__year=year,
                journal_entry__date__month=month_num
            )
            expense_total = (expense_entries.aggregate(Sum('debit'))['debit__sum'] or Decimal('0')) - \
                            (expense_entries.aggregate(Sum('credit'))['credit__sum'] or Decimal('0'))
            
            report.append({
                "month": month_name,
                "income": float(income_total),
                "expenses": float(expense_total),
                "profit": float(income_total - expense_total)
            })
            
        return report
    
    # ========== NEW FINANCIAL REPORTS (Accounting-based) ==========
    
    @route.get('/income-statement', response=IncomeStatementSchema)
    def get_income_statement(self, request, from_date: Optional[date] = None, to_date: Optional[date] = None):
        """Compte de Résultat (Income Statement / P&L)"""
        company = self.get_user_company(request)
        
        if not from_date:
            from_date = date(date.today().year, 1, 1)
        if not to_date:
            to_date = date.today()
        
        # Récupérer tous les comptes de revenus et charges
        revenue_accounts = Account.objects.filter(
            company=company,
            type=AccountType.REVENUE,
            is_active=True
        )
        
        expense_accounts = Account.objects.filter(
            company=company,
            type=AccountType.EXPENSE,
            is_active=True
        )
        
        # Calculer les revenus
        revenue_lines = []
        total_revenue = Decimal('0')
        
        for account in revenue_accounts:
            # Somme des crédits - débits pour les comptes de revenus
            ledger_entries = JournalEntryLine.objects.filter(
                account=account,
                journal_entry__status='POSTED',
                journal_entry__date__gte=from_date,
                journal_entry__date__lte=to_date
            )
            
            credits = ledger_entries.aggregate(Sum('credit'))['credit__sum'] or Decimal('0')
            debits = ledger_entries.aggregate(Sum('debit'))['debit__sum'] or Decimal('0')
            amount = credits - debits
            
            if amount != 0:
                revenue_lines.append(IncomeStatementLineSchema(
                    account_code=account.code,
                    account_name=account.name,
                    amount=amount
                ))
                total_revenue += amount
        
        # Calculer les charges
        expense_lines = []
        total_expenses = Decimal('0')
        
        for account in expense_accounts:
            # Somme des débits - crédits pour les comptes de charges
            ledger_entries = JournalEntryLine.objects.filter(
                account=account,
                journal_entry__status='POSTED',
                journal_entry__date__gte=from_date,
                journal_entry__date__lte=to_date
            )
            
            debits = ledger_entries.aggregate(Sum('debit'))['debit__sum'] or Decimal('0')
            credits = ledger_entries.aggregate(Sum('credit'))['credit__sum'] or Decimal('0')
            amount = debits - credits
            
            if amount != 0:
                expense_lines.append(IncomeStatementLineSchema(
                    account_code=account.code,
                    account_name=account.name,
                    amount=amount
                ))
                total_expenses += amount
        
        net_profit = total_revenue - total_expenses
        
        return IncomeStatementSchema(
            from_date=from_date,
            to_date=to_date,
            revenue_lines=revenue_lines,
            total_revenue=total_revenue,
            expense_lines=expense_lines,
            total_expenses=total_expenses,
            net_profit=net_profit
        )
    
    @route.get('/balance-sheet', response=BalanceSheetSchema)
    def get_balance_sheet(self, request, as_of_date: Optional[date] = None):
        """Bilan (Balance Sheet)"""
        company = self.get_user_company(request)
        
        if not as_of_date:
            as_of_date = date.today()
        
        # ACTIFS
        asset_accounts = Account.objects.filter(
            company=company,
            type=AccountType.ASSET,
            is_active=True
        )
        
        asset_lines = []
        total_assets = Decimal('0')
        
        for account in asset_accounts:
            balance = account.get_balance_at_date(as_of_date)
            if balance != 0:
                asset_lines.append(BalanceSheetLineSchema(
                    account_code=account.code,
                    account_name=account.name,
                    amount=balance
                ))
                total_assets += balance
        
        # PASSIFS
        liability_accounts = Account.objects.filter(
            company=company,
            type=AccountType.LIABILITY,
            is_active=True
        )
        
        liability_lines = []
        total_liabilities = Decimal('0')
        
        for account in liability_accounts:
            balance = account.get_balance_at_date(as_of_date)
            if balance != 0:
                liability_lines.append(BalanceSheetLineSchema(
                    account_code=account.code,
                    account_name=account.name,
                    amount=balance
                ))
                total_liabilities += balance
        
        # CAPITAUX PROPRES
        equity_accounts = Account.objects.filter(
            company=company,
            type=AccountType.EQUITY,
            is_active=True
        )
        
        equity_lines = []
        total_equity = Decimal('0')
        
        for account in equity_accounts:
            balance = account.get_balance_at_date(as_of_date)
            if balance != 0:
                equity_lines.append(BalanceSheetLineSchema(
                    account_code=account.code,
                    account_name=account.name,
                    amount=balance
                ))
                total_equity += balance
        
        # Vérification: Actif = Passif + Capitaux propres
        is_balanced = abs(total_assets - (total_liabilities + total_equity)) < Decimal('0.01')
        
        return BalanceSheetSchema(
            as_of_date=as_of_date,
            asset_lines=asset_lines,
            total_assets=total_assets,
            liability_lines=liability_lines,
            total_liabilities=total_liabilities,
            equity_lines=equity_lines,
            total_equity=total_equity,
            is_balanced=is_balanced
        )
    
    @route.get('/cash-flow', response=CashFlowSchema)
    def get_cash_flow_statement(self, request, from_date: Optional[date] = None, to_date: Optional[date] = None):
        """État des flux de trésorerie (Cash Flow Statement)"""
        company = self.get_user_company(request)
        
        if not from_date:
            from_date = date(date.today().year, 1, 1)
        if not to_date:
            to_date = date.today()
        
        # Pour une version simplifiée, on calcule:
        # - Activités d'exploitation ~ Résultat net
        # - Activités d'investissement ~ Actifs immobilisés
        # - Activités de financement ~ Capitaux propres et dettes long terme
        
        # Flux d'exploitation (Operating Cash Flow)
        # Revenue - Expenses = Net Income (approximation)
        revenue = Account.objects.filter(
            company=company,
            type=AccountType.REVENUE
        )
        revenue_total = Decimal('0')
        for acc in revenue:
            entries = JournalEntryLine.objects.filter(
                account=acc,
                journal_entry__status='POSTED',
                journal_entry__date__gte=from_date,
                journal_entry__date__lte=to_date
            )
            credits = entries.aggregate(Sum('credit'))['credit__sum'] or Decimal('0')
            debits = entries.aggregate(Sum('debit'))['debit__sum'] or Decimal('0')
            revenue_total += (credits - debits)
        
        expenses = Account.objects.filter(
            company=company,
            type=AccountType.EXPENSE
        )
        expense_total = Decimal('0')
        for acc in expenses:
            entries = JournalEntryLine.objects.filter(
                account=acc,
                journal_entry__status='POSTED',
                journal_entry__date__gte=from_date,
                journal_entry__date__lte=to_date
            )
            debits = entries.aggregate(Sum('debit'))['debit__sum'] or Decimal('0')
            credits = entries.aggregate(Sum('credit'))['credit__sum'] or Decimal('0')
            expense_total += (debits - credits)
        
        operating_activities = [
            CashFlowLineSchema(description="Net Income", amount=revenue_total - expense_total)
        ]
        operating_cash_flow = revenue_total - expense_total
        
        # Investissements (simplifié)
        investing_activities = [
            CashFlowLineSchema(description="Capital Expenditures", amount=Decimal('0'))
        ]
        investing_cash_flow = Decimal('0')
        
        # Financement (simplifié)
        financing_activities = [
            CashFlowLineSchema(description="Owner Contributions", amount=Decimal('0'))
        ]
        financing_cash_flow = Decimal('0')
        
        net_cash_change = operating_cash_flow + investing_cash_flow + financing_cash_flow
        
        # Trésorerie d'ouverture et clôture
        cash_accounts = Account.objects.filter(
            company=company,
            code__in=['52', '53', '54'],  # Banque, Caisse, Mobile Money
            is_active=True
        )
        
        opening_cash = sum(acc.get_balance_at_date(from_date) for acc in cash_accounts)
        closing_cash = sum(acc.get_balance_at_date(to_date) for acc in cash_accounts)
        
        return CashFlowSchema(
            from_date=from_date,
            to_date=to_date,
            operating_activities=operating_activities,
            operating_cash_flow=operating_cash_flow,
            investing_activities=investing_activities,
            investing_cash_flow=investing_cash_flow,
            financing_activities=financing_activities,
            financing_cash_flow=financing_cash_flow,
            net_cash_change=net_cash_change,
            opening_cash=opening_cash,
            closing_cash=closing_cash
        )
    
    @route.get('/ar-aging', response=List[ARAgingLineSchema])
    def get_ar_aging(self, request, as_of_date: Optional[date] = None):
        """Créances clients par échéance (Accounts Receivable Aging)"""
        company = self.get_user_company(request)
        
        if not as_of_date:
            as_of_date = date.today()
        
        # Récupérer le compte clients (411)
        try:
            ar_account = Account.objects.get(company=company, code='411')
        except Account.DoesNotExist:
            return []
        
        # Pour l'instant, retourner un exemple
        # Dans une vraie implémentation, il faudrait analyser les factures impayées
        return []
    
    @route.get('/ap-aging', response=List[APAgingLineSchema])
    def get_ap_aging(self, request, as_of_date: Optional[date] = None):
        """Dettes fournisseurs par échéance (Accounts Payable Aging)"""
        company = self.get_user_company(request)
        
        if not as_of_date:
            as_of_date = date.today()
        
        # Récupérer le compte fournisseurs (401)
        try:
            ap_account = Account.objects.get(company=company, code='401')
        except Account.DoesNotExist:
            return []
        
        return []
    
    # ========== EXPORT FUNCTIONS ==========
    
    @route.get('/export/income-statement')
    def export_income_statement(self, request, from_date: Optional[date] = None, to_date: Optional[date] = None):
        """Export Income Statement as CSV"""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="income_statement.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['INCOME STATEMENT'])
        writer.writerow(['From:', from_date or 'Start of year', 'To:', to_date or 'Today'])
        writer.writerow([])
        
        # Get data
        data = self.get_income_statement(request, from_date, to_date)
        
        writer.writerow(['REVENUE'])
        writer.writerow(['Account Code', 'Account Name', 'Amount'])
        for line in data.revenue_lines:
            writer.writerow([line.account_code, line.account_name, line.amount])
        writer.writerow(['TOTAL REVENUE', '', data.total_revenue])
        writer.writerow([])
        
        writer.writerow(['EXPENSES'])
        writer.writerow(['Account Code', 'Account Name', 'Amount'])
        for line in data.expense_lines:
            writer.writerow([line.account_code, line.account_name, line.amount])
        writer.writerow(['TOTAL EXPENSES', '', data.total_expenses])
        writer.writerow([])
        
        writer.writerow(['NET PROFIT', '', data.net_profit])
        
        return response
    
    @route.get('/export/balance-sheet')
    def export_balance_sheet(self, request, as_of_date: Optional[date] = None):
        """Export Balance Sheet as CSV"""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="balance_sheet.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['BALANCE SHEET'])
        writer.writerow(['As of:', as_of_date or 'Today'])
        writer.writerow([])
        
        data = self.get_balance_sheet(request, as_of_date)
        
        writer.writerow(['ASSETS'])
        writer.writerow(['Account Code', 'Account Name', 'Amount'])
        for line in data.asset_lines:
            writer.writerow([line.account_code, line.account_name, line.amount])
        writer.writerow(['TOTAL ASSETS', '', data.total_assets])
        writer.writerow([])
        
        writer.writerow(['LIABILITIES'])
        for line in data.liability_lines:
            writer.writerow([line.account_code, line.account_name, line.amount])
        writer.writerow(['TOTAL LIABILITIES', '', data.total_liabilities])
        writer.writerow([])
        
        writer.writerow(['EQUITY'])
        for line in data.equity_lines:
            writer.writerow([line.account_code, line.account_name, line.amount])
        writer.writerow(['TOTAL EQUITY', '', data.total_equity])
        writer.writerow([])
        
        writer.writerow(['BALANCED?', data.is_balanced])
        
        return response
