from django.db import models

class UserRole(models.TextChoices):
    SUPER_ADMIN = 'SUPER_ADMIN', 'Super Admin'
    ADMIN = 'ADMIN', 'Admin'
    MANAGER = 'MANAGER', 'Manager'
    PROJECT_MANAGER = 'PROJECT_MANAGER', 'Project Manager'
    ADVANCED_USER = 'ADVANCED_USER', 'Utilisateur Avancé'
    STANDARD_USER = 'STANDARD_USER', 'Utilisateur Standard'
    READ_ONLY = 'READ_ONLY', 'Lecteur (Read Only)'
    AUDITOR = 'AUDITOR', 'Auditeur'
    GUEST = 'GUEST', 'Invité'

class Permission:
    # --- Finance: Accounting & Treasury ---
    FINANCE_VIEW_DASHBOARD = 'finance_view_dashboard'
    FINANCE_VIEW_ACCOUNTS = 'finance_view_accounts'
    FINANCE_ENTRY_CREATE = 'finance_entry_create'
    FINANCE_ENTRY_EDIT = 'finance_entry_edit'
    FINANCE_ENTRY_VALIDATE = 'finance_entry_validate'
    FINANCE_ENTRY_DELETE = 'finance_entry_delete'
    FINANCE_PERIOD_CLOSE = 'finance_period_close'
    FINANCE_PERIOD_REOPEN = 'finance_period_reopen'
    FINANCE_VIEW_CASHFLOW = 'finance_view_cashflow'
    FINANCE_MANAGE_BANKS = 'finance_manage_banks'
    FINANCE_IMPORT_STATEMENTS = 'finance_import_statements'
    FINANCE_EXPORT_DATA = 'finance_export_data'

    # --- Finance: Expenses & Budgets ---
    EXPENSE_CREATE = 'expense_create'
    EXPENSE_EDIT = 'expense_edit'
    EXPENSE_VALIDATE = 'expense_validate'
    EXPENSE_REJECT = 'expense_reject'
    EXPENSE_DELETE = 'expense_delete'
    BUDGET_VIEW = 'budget_view'
    BUDGET_CREATE_EDIT = 'budget_create_edit'
    BUDGET_APPROVE = 'budget_approve'
    BUDGET_TRACK = 'budget_track'

    # --- Invoicing: Clients & Invoices ---
    CUSTOMER_VIEW = 'customer_view'
    CUSTOMER_CREATE = 'customer_create'
    CUSTOMER_EDIT = 'customer_edit'
    CUSTOMER_DELETE = 'customer_delete'
    INVOICE_CREATE = 'invoice_create'
    INVOICE_EDIT = 'invoice_edit'
    INVOICE_VALIDATE = 'invoice_validate'
    INVOICE_CANCEL = 'invoice_cancel'
    INVOICE_DELETE = 'invoice_delete'
    INVOICE_SEND = 'invoice_send'
    INVOICE_DOWNLOAD = 'invoice_download'
    INVOICE_APPLY_DISCOUNT = 'invoice_apply_discount'
    INVOICE_APPLY_TAX = 'invoice_apply_tax'
    INVOICE_MANAGE_NUMBERING = 'invoice_manage_numbering'

    # --- Invoicing: Payments ---
    PAYMENT_RECORD = 'payment_record'
    PAYMENT_EDIT = 'payment_edit'
    PAYMENT_DELETE = 'payment_delete'
    PAYMENT_REFUND = 'payment_refund'
    PAYMENT_VIEW_HISTORY = 'payment_view_history'
    PAYMENT_EXPORT = 'payment_export'

    # --- HR: Employees ---
    EMPLOYEE_VIEW_LIST = 'employee_view_list'
    EMPLOYEE_CREATE = 'employee_create'
    EMPLOYEE_EDIT = 'employee_edit'
    EMPLOYEE_DELETE = 'employee_delete'
    EMPLOYEE_UPLOAD_DOCS = 'employee_upload_docs'
    EMPLOYEE_VIEW_CONFIDENTIAL = 'employee_view_confidential'
    EMPLOYEE_ASSIGN_ROLE = 'employee_assign_role'

    # --- HR: Attendance & Leave ---
    ATTENDANCE_VIEW = 'attendance_view'
    ATTENDANCE_RECORD = 'attendance_record'
    ATTENDANCE_EDIT = 'attendance_edit'
    ATTENDANCE_APPROVE = 'attendance_approve'
    LEAVE_REQUEST = 'leave_request'
    LEAVE_APPROVE_REJECT = 'leave_approve_reject'
    LEAVE_VIEW_BALANCES = 'leave_view_balances'

    # --- HR: Payroll ---
    PAYROLL_VIEW = 'payroll_view'
    PAYROLL_GENERATE = 'payroll_generate'
    PAYROLL_EDIT = 'payroll_edit'
    PAYROLL_VALIDATE = 'payroll_validate'
    PAYROLL_EXPORT = 'payroll_export'
    PAYROLL_VIEW_SALARY = 'payroll_view_salary'

    # --- Purchasing & Suppliers ---
    SUPPLIER_VIEW = 'supplier_view'
    SUPPLIER_CREATE = 'supplier_create'
    SUPPLIER_EDIT = 'supplier_edit'
    SUPPLIER_DELETE = 'supplier_delete'
    PO_CREATE = 'po_create'
    PO_VALIDATE = 'po_validate'
    GOODS_RECEIVE = 'goods_receive'
    SUPPLIER_INVOICE_RECORD = 'supplier_invoice_record'
    SUPPLIER_INVOICE_APPROVE = 'supplier_invoice_approve'
    PURCHASE_EXPORT = 'purchase_export'

    # --- Projects ---
    PROJECT_VIEW = 'project_view'
    PROJECT_CREATE = 'project_create'
    PROJECT_EDIT = 'project_edit'
    PROJECT_DELETE = 'project_delete'
    PROJECT_ASSIGN_USERS = 'project_assign_users'
    PROJECT_TRACK_EXPENSES = 'project_track_expenses'
    PROJECT_VIEW_PROFITABILITY = 'project_view_profitability'
    PROJECT_CLOSE = 'project_close'
    PROJECT_GENERATE_REPORTS = 'project_generate_reports'

    # --- Users & Security ---
    USER_VIEW = 'user_view'
    USER_CREATE = 'user_create'
    USER_EDIT = 'user_edit'
    USER_DISABLE_ENABLE = 'user_disable_enable'
    USER_RESET_PASSWORD = 'user_reset_password'
    USER_ASSIGN_ROLES = 'user_assign_roles'
    USER_ASSIGN_PERMISSIONS = 'user_assign_permissions'
    AUDIT_VIEW_LOGS = 'audit_view_logs'
    AUTH_VIEW_LOGIN_HISTORY = 'auth_view_login_history'
    AUTH_MANAGE_MFA = 'auth_manage_mfa'

    # --- Settings ---
    SETTINGS_ACCESS = 'settings_access'
    SETTINGS_CONFIGURE_TAXES = 'settings_configure_taxes'
    SETTINGS_CONFIGURE_CURRENCIES = 'settings_configure_currencies'
    SETTINGS_CONFIGURE_PAYMENT_METHODS = 'settings_configure_payment_methods'
    SETTINGS_CONFIGURE_FISCAL_YEAR = 'settings_configure_fiscal_year'
    SETTINGS_CONFIGURE_COMPANY = 'settings_configure_company'
    SETTINGS_CONFIGURE_TEMPLATES = 'settings_configure_templates'
    SETTINGS_CONFIGURE_NOTIFICATIONS = 'settings_configure_notifications'
    SETTINGS_CONFIGURE_API = 'settings_configure_api'

    # --- Reporting ---
    REPORT_VIEW = 'report_view'
    REPORT_GENERATE_FINANCIAL = 'report_generate_financial'
    REPORT_GENERATE_HR = 'report_generate_hr'
    REPORT_GENERATE_SALES = 'report_generate_sales'
    REPORT_EXPORT = 'report_export'
    REPORT_SCHEDULE = 'report_schedule'
    REPORT_SHARE = 'report_share'

    # --- Security & Compliance ---
    SECURITY_EXPORT_AUDIT = 'security_export_audit'
    SECURITY_LOCK_RECORDS = 'security_lock_records'
    SECURITY_UNLOCK_RECORDS = 'security_unlock_records'
    SECURITY_ANONYMIZE_DATA = 'security_anonymize_data'
    SECURITY_GDPR_ACCESS = 'security_gdpr_access'
    SECURITY_BACKUP = 'security_backup'
    SECURITY_RESTORE = 'security_restore'

# --- Default Permission Sets ---
# This dictionary maps roles to their default list of permissions.
# SUPER_ADMIN gets everything by default (handled in logic or here).

ALL_PERMISSIONS = [getattr(Permission, attr) for attr in dir(Permission) if not attr.startswith('__')]

DEFAULT_ROLE_PERMISSIONS = {
    UserRole.SUPER_ADMIN: ALL_PERMISSIONS,
    
    UserRole.ADMIN: [
        p for p in ALL_PERMISSIONS 
        if p not in [
            Permission.SECURITY_RESTORE, 
            Permission.FINANCE_PERIOD_REOPEN,
            Permission.FINANCE_ENTRY_DELETE # Maybe restrict deletion?
        ]
    ],
    
    UserRole.MANAGER: [
        # Finance (limited)
        Permission.FINANCE_VIEW_DASHBOARD, Permission.FINANCE_VIEW_ACCOUNTS,
        Permission.EXPENSE_CREATE, Permission.EXPENSE_EDIT, Permission.EXPENSE_VALIDATE, Permission.EXPENSE_REJECT,
        Permission.BUDGET_VIEW, Permission.BUDGET_TRACK,
        # Invoicing
        Permission.CUSTOMER_VIEW, Permission.CUSTOMER_CREATE, Permission.CUSTOMER_EDIT,
        Permission.INVOICE_CREATE, Permission.INVOICE_EDIT, Permission.INVOICE_VALIDATE, Permission.INVOICE_SEND, Permission.INVOICE_DOWNLOAD,
        Permission.PAYMENT_RECORD, Permission.PAYMENT_VIEW_HISTORY,
        # HR
        Permission.EMPLOYEE_VIEW_LIST, Permission.ATTENDANCE_VIEW, Permission.ATTENDANCE_APPROVE,
        Permission.LEAVE_APPROVE_REJECT, Permission.LEAVE_VIEW_BALANCES,
        # Purchasing
        Permission.SUPPLIER_VIEW, Permission.PO_CREATE, Permission.PO_VALIDATE,
        # Projects
        Permission.PROJECT_VIEW, Permission.PROJECT_CREATE, Permission.PROJECT_EDIT, Permission.PROJECT_ASSIGN_USERS,
        # Reporting
        Permission.REPORT_VIEW, Permission.REPORT_GENERATE_SALES
    ],

    UserRole.PROJECT_MANAGER: [
        # Projects (Full Access)
        Permission.PROJECT_VIEW, Permission.PROJECT_CREATE, Permission.PROJECT_EDIT, Permission.PROJECT_DELETE,
        Permission.PROJECT_ASSIGN_USERS, Permission.PROJECT_TRACK_EXPENSES, Permission.PROJECT_VIEW_PROFITABILITY,
        Permission.PROJECT_CLOSE, Permission.PROJECT_GENERATE_REPORTS,
        # Purchasing (POs)
        Permission.SUPPLIER_VIEW, Permission.SUPPLIER_CREATE, Permission.SUPPLIER_EDIT,
        Permission.PO_CREATE, Permission.PO_VALIDATE, Permission.GOODS_RECEIVE,
        Permission.SUPPLIER_INVOICE_APPROVE,
        # Expense
        Permission.EXPENSE_CREATE, Permission.EXPENSE_EDIT, Permission.EXPENSE_VALIDATE,
        # Basic
        Permission.EMPLOYEE_VIEW_LIST, Permission.CUSTOMER_VIEW, Permission.ATTENDANCE_RECORD, Permission.LEAVE_REQUEST
    ],

    UserRole.ADVANCED_USER: [
        # Finance Focused
        Permission.FINANCE_VIEW_DASHBOARD, Permission.FINANCE_VIEW_ACCOUNTS, Permission.FINANCE_ENTRY_CREATE, Permission.FINANCE_ENTRY_EDIT,
        Permission.EXPENSE_CREATE, Permission.EXPENSE_EDIT,
        Permission.CUSTOMER_VIEW, Permission.CUSTOMER_CREATE, Permission.CUSTOMER_EDIT,
        Permission.INVOICE_CREATE, Permission.INVOICE_EDIT, Permission.INVOICE_VALIDATE, Permission.INVOICE_SEND,
        Permission.PAYMENT_RECORD,
        Permission.SUPPLIER_VIEW, Permission.SUPPLIER_CREATE,
        Permission.REPORT_VIEW, Permission.REPORT_GENERATE_FINANCIAL
    ],

    UserRole.STANDARD_USER: [
        # Basic Input
        Permission.EXPENSE_CREATE,
        Permission.ATTENDANCE_RECORD,
        Permission.LEAVE_REQUEST,
        Permission.PROJECT_VIEW,
        Permission.CUSTOMER_VIEW
    ],

    UserRole.READ_ONLY: [
        Permission.FINANCE_VIEW_DASHBOARD, Permission.FINANCE_VIEW_ACCOUNTS,
        Permission.CUSTOMER_VIEW, Permission.INVOICE_DOWNLOAD,
        Permission.EMPLOYEE_VIEW_LIST,
        Permission.PROJECT_VIEW,
        Permission.REPORT_VIEW
    ],
    
    UserRole.AUDITOR: [
        # Read Only + Export + Logs
        Permission.FINANCE_VIEW_DASHBOARD, Permission.FINANCE_VIEW_ACCOUNTS, Permission.FINANCE_VIEW_CASHFLOW, Permission.FINANCE_EXPORT_DATA,
        Permission.CUSTOMER_VIEW, Permission.INVOICE_DOWNLOAD, Permission.PAYMENT_VIEW_HISTORY, Permission.PAYMENT_EXPORT,
        Permission.EMPLOYEE_VIEW_LIST, Permission.PAYROLL_VIEW, Permission.PAYROLL_EXPORT,
        Permission.SUPPLIER_VIEW, Permission.PURCHASE_EXPORT,
        Permission.PROJECT_VIEW, Permission.PROJECT_GENERATE_REPORTS,
        Permission.AUDIT_VIEW_LOGS, Permission.AUTH_VIEW_LOGIN_HISTORY,
        Permission.REPORT_VIEW, Permission.REPORT_EXPORT, Permission.SECURITY_EXPORT_AUDIT
    ],
    
    UserRole.GUEST: [
        Permission.PROJECT_VIEW
    ]
}
