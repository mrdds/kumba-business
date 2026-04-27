from django.db import models
from django.core.exceptions import ValidationError
from companies.models import Company
from decimal import Decimal


class AccountType(models.TextChoices):
    """Types de comptes selon le plan comptable"""
    ASSET = 'ASSET', 'Asset (Actif)'
    LIABILITY = 'LIABILITY', 'Liability (Passif)'
    EQUITY = 'EQUITY', 'Equity (Capitaux Propres)'
    REVENUE = 'REVENUE', 'Revenue (Produits)'
    EXPENSE = 'EXPENSE', 'Expense (Charges)'


from core.security.registry import secure_resource

@secure_resource('account', 'Comptabilité', actions=['view', 'create', 'edit', 'delete'])
class Account(models.Model):
    """
    Plan Comptable (Chart of Accounts)
    Structure hiérarchique des comptes comptables
    """
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='accounts')
    code = models.CharField(max_length=20, help_text="Code du compte (ex: 411, 701)")
    name = models.CharField(max_length=255, help_text="Nom du compte")
    type = models.CharField(max_length=20, choices=AccountType.choices)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='sub_accounts')
    
    # Soldes calculés
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=0, help_text="Solde actuel")
    
    # Métadonnées
    is_active = models.BooleanField(default=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('company', 'code')
        ordering = ['code']
        indexes = [
            models.Index(fields=['company', 'type']),
            models.Index(fields=['company', 'is_active']),
        ]

    def __str__(self):
        return f"{self.code} - {self.name}"

    def update_balance(self):
        """Recalcule le solde du compte depuis le grand livre"""
        from django.db.models import Sum, Q
        
        entries = self.ledger_entries.filter(journal_entry__status='POSTED')
        debits = entries.aggregate(total=Sum('debit'))['total'] or Decimal('0')
        credits = entries.aggregate(total=Sum('credit'))['total'] or Decimal('0')
        
        # Le solde dépend du type de compte
        if self.type in ['ASSET', 'EXPENSE']:
            self.balance = debits - credits
        else:  # LIABILITY, EQUITY, REVENUE
            self.balance = credits - debits
        
        self.save(update_fields=['balance'])
        return self.balance

    def get_balance_at_date(self, date):
        """Solde du compte à une date donnée"""
        from django.db.models import Sum
        
        entries = self.ledger_entries.filter(
            journal_entry__status='POSTED',
            journal_entry__date__lte=date
        )
        debits = entries.aggregate(total=Sum('debit'))['total'] or Decimal('0')
        credits = entries.aggregate(total=Sum('credit'))['total'] or Decimal('0')
        
        if self.type in ['ASSET', 'EXPENSE']:
            return debits - credits
        else:
            return credits - debits


class FiscalYear(models.Model):
    """Exercice Fiscal"""
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='fiscal_years')
    name = models.CharField(max_length=100, help_text="Ex: 2026, FY2026")
    start_date = models.DateField()
    end_date = models.DateField()
    is_closed = models.BooleanField(default=False, help_text="Exercice clôturé")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('company', 'name')
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.name} ({self.start_date} - {self.end_date})"

    def clean(self):
        if self.end_date <= self.start_date:
            raise ValidationError("End date must be after start date")


@secure_resource('journal_entry', 'Comptabilité', actions=['view', 'create', 'approve', 'post', 'delete'])
class JournalEntry(models.Model):
    """
    Écriture Comptable (Journal Entry)
    Représente une transaction en partie double
    """
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft (Brouillon)'
        POSTED = 'POSTED', 'Posted (Comptabilisé)'
        VOID = 'VOID', 'Void (Annulé)'

    class EntryType(models.TextChoices):
        MANUAL = 'MANUAL', 'Manual (Saisie manuelle)'
        INVOICE = 'INVOICE', 'Invoice (Facture)'
        PAYMENT = 'PAYMENT', 'Payment (Paiement)'
        PURCHASE = 'PURCHASE', 'Purchase (Achat)'
        PAYROLL = 'PAYROLL', 'Payroll (Paie)'
        OPENING = 'OPENING', 'Opening Balance (Solde d\'ouverture)'
        CLOSING = 'CLOSING', 'Closing (Clôture)'
        ADJUSTMENT = 'ADJUSTMENT', 'Adjustment (Ajustement)'

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='journal_entries')
    fiscal_year = models.ForeignKey(FiscalYear, null=True, blank=True, on_delete=models.SET_NULL)
    
    date = models.DateField()
    reference = models.CharField(max_length=100, help_text="Numéro de pièce", blank=True)
    description = models.TextField(help_text="Description de l'écriture")
    
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT)
    entry_type = models.CharField(max_length=20, choices=EntryType.choices, default=EntryType.MANUAL)
    
    # Liens vers documents sources
    source_model = models.CharField(max_length=50, blank=True, null=True, help_text="Type de document source")
    source_id = models.IntegerField(blank=True, null=True, help_text="ID du document source")
    
    # Métadonnées
    created_by = models.ForeignKey('users.CustomUser', null=True, on_delete=models.SET_NULL, related_name='created_entries')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    posted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-date', '-id']
        indexes = [
            models.Index(fields=['company', 'status']),
            models.Index(fields=['company', 'date']),
            models.Index(fields=['source_model', 'source_id']),
        ]

    def __str__(self):
        return f"JE-{self.id} - {self.date} - {self.description[:50]}"

    def total_debit(self):
        """Total des débits"""
        from django.db.models import Sum
        return self.lines.aggregate(total=Sum('debit'))['total'] or Decimal('0')

    def total_credit(self):
        """Total des crédits"""
        from django.db.models import Sum
        return self.lines.aggregate(total=Sum('credit'))['total'] or Decimal('0')

    def is_balanced(self):
        """Vérifie que Débit = Crédit"""
        return self.total_debit() == self.total_credit()

    def post(self):
        """Comptabiliser l'écriture (la verrouiller)"""
        if self.status == self.Status.POSTED:
            raise ValidationError("Entry already posted")
        
        if not self.is_balanced():
            raise ValidationError(f"Entry not balanced: Debit={self.total_debit()}, Credit={self.total_credit()}")
        
        if not self.lines.exists():
            raise ValidationError("Cannot post entry without lines")
        
        from django.utils import timezone
        self.status = self.Status.POSTED
        self.posted_at = timezone.now()
        self.save()
        
        # Mettre à jour les soldes des comptes
        for line in self.lines.all():
            line.account.update_balance()
        
        return True

    def void(self):
        """Annuler l'écriture (créer une écriture inverse)"""
        if self.status != self.Status.POSTED:
            raise ValidationError("Can only void posted entries")
        
        # Créer l'écriture inverse
        reversal = JournalEntry.objects.create(
            company=self.company,
            fiscal_year=self.fiscal_year,
            date=self.date,
            reference=f"REV-{self.reference or self.id}",
            description=f"Reversal of: {self.description}",
            status=JournalEntry.Status.POSTED,
            entry_type=JournalEntry.EntryType.ADJUSTMENT,
            created_by=self.created_by
        )
        
        # Inverser les lignes
        for line in self.lines.all():
            JournalEntryLine.objects.create(
                journal_entry=reversal,
                account=line.account,
                debit=line.credit,  # Inverser
                credit=line.debit,  # Inverser
                description=f"Reversal: {line.description}"
            )
        
        self.status = self.Status.VOID
        self.save()
        
        # Mettre à jour les soldes
        for line in self.lines.all():
            line.account.update_balance()
        
        return reversal


class JournalEntryLine(models.Model):
    """
    Ligne d'Écriture Comptable
    Chaque ligne affecte un compte avec un débit ou crédit
    """
    journal_entry = models.ForeignKey(JournalEntry, on_delete=models.CASCADE, related_name='lines')
    account = models.ForeignKey(Account, on_delete=models.PROTECT, related_name='ledger_entries')
    
    debit = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    credit = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    description = models.CharField(max_length=255, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['id']
        indexes = [
            models.Index(fields=['account', 'journal_entry']),
        ]

    def __str__(self):
        return f"{self.account.code} - D:{self.debit} C:{self.credit}"

    def clean(self):
        """Validation: une ligne doit être soit débit soit crédit, pas les deux"""
        if self.debit > 0 and self.credit > 0:
            raise ValidationError("A line cannot have both debit and credit")
        if self.debit == 0 and self.credit == 0:
            raise ValidationError("A line must have either debit or credit")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


class BankAccount(models.Model):
    """
    Compte Bancaire / Caisse
    Représente les comptes de trésorerie
    """
    class AccountType(models.TextChoices):
        BANK = 'BANK', 'Bank Account'
        CASH = 'CASH', 'Cash / Caisse'
        MOBILE_MONEY = 'MOBILE', 'Mobile Money'
        CREDIT_CARD = 'CARD', 'Credit Card'

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='bank_accounts')
    name = models.CharField(max_length=255, help_text="Nom du compte")
    account_type = models.CharField(max_length=10, choices=AccountType.choices, default=AccountType.BANK)
    account_number = models.CharField(max_length=100, blank=True, help_text="Numéro de compte")
    
    # Lien vers le compte comptable
    linked_account = models.ForeignKey(Account, null=True, on_delete=models.SET_NULL, related_name='bank_accounts')
    
    # Soldes
    current_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    opening_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Informations bancaires
    bank_name = models.CharField(max_length=255, blank=True)
    branch = models.CharField(max_length=255, blank=True)
    swift_code = models.CharField(max_length=20, blank=True)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.get_account_type_display()})"

    def update_balance(self):
        """Synchroniser avec le solde du compte comptable lié"""
        if self.linked_account:
            self.current_balance = self.linked_account.balance
            self.save(update_fields=['current_balance'])


class TaxRate(models.Model):
    """
    Taux de Taxe (TVA, etc.)
    """
    class TaxType(models.TextChoices):
        VAT = 'VAT', 'VAT / TVA'
        SALES_TAX = 'SALES', 'Sales Tax'
        WITHHOLDING = 'WITH', 'Withholding Tax'
        CUSTOMS = 'CUSTOMS', 'Customs Duty'
        OTHER = 'OTHER', 'Other'

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='tax_rates')
    name = models.CharField(max_length=100, help_text="Ex: TVA 18%")
    rate = models.DecimalField(max_digits=5, decimal_places=2, help_text="Taux en pourcentage")
    tax_type = models.CharField(max_length=10, choices=TaxType.choices, default=TaxType.VAT)
    
    # Comptes comptables pour la taxe
    tax_account = models.ForeignKey(Account, null=True, on_delete=models.SET_NULL, related_name='tax_rates')
    
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.rate}%)"


class BankStatement(models.Model):
    """Relevé Bancaire Importé"""
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='bank_statements')
    bank_account = models.ForeignKey(BankAccount, on_delete=models.CASCADE, related_name='statements')
    
    file_name = models.CharField(max_length=255)
    import_date = models.DateTimeField(auto_now_add=True)
    
    start_date = models.DateField()
    end_date = models.DateField()
    
    opening_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    closing_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    is_fully_reconciled = models.BooleanField(default=False)

    class Meta:
        ordering = ['-end_date']

    def __str__(self):
        return f"Statement {self.start_date} - {self.end_date} ({self.bank_account.name})"


class BankStatementLine(models.Model):
    """Ligne de relevé bancaire à rapprocher"""
    statement = models.ForeignKey(BankStatement, on_delete=models.CASCADE, related_name='lines')
    
    date = models.DateField()
    description = models.TextField()
    reference = models.CharField(max_length=100, blank=True)
    
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    type = models.CharField(max_length=10, choices=[('IN', 'Income'), ('OUT', 'Expense')])
    
    # Rapprochement
    is_reconciled = models.BooleanField(default=False)
    reconciled_with = models.ForeignKey(JournalEntry, null=True, blank=True, on_delete=models.SET_NULL, related_name='reconciliation_lines')
    
    # Matching suggestions
    suggested_entry = models.ForeignKey(JournalEntry, null=True, blank=True, on_delete=models.SET_NULL, related_name='suggested_matches')
    confidence_score = models.FloatField(default=0)

    class Meta:
        ordering = ['date', 'id']

    def __str__(self):
        return f"{self.date} - {self.amount} - {self.description[:30]}"
