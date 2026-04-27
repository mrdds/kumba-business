from django.core.management.base import BaseCommand
from kumba_id.models import KumbaUser
from users.models import Role, RolePermission
from companies.models import Company
from core.security.registry import ResourceRegistry
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Migrates legacy roles to the new dynamic security system'

    def handle(self, *args, **options):
        # Force loading all models to trigger @secure_resource decorators
        from django.apps import apps
        import importlib
        for app_config in apps.get_app_configs():
            try:
                importlib.import_module(f"{app_config.name}.models")
            except ImportError:
                pass
            
        resources = ResourceRegistry.get_resources()
        self.stdout.write(self.style.MIGRATE_HEADING(f"Found {len(resources)} resources: {list(resources.keys())}"))
        companies = Company.objects.all()

        for company in companies:
            self.stdout.write(f"Syncing roles for company: {company.name}")
            
            # 1. SUPER_ADMIN (Total Access)
            super_role, _ = Role.objects.get_or_create(
                name='SUPER_ADMIN', company=company,
                defaults={'description': 'Accès total', 'is_system': True}
            )
            for res_name, data in resources.items():
                for action in data['actions']:
                    RolePermission.objects.get_or_create(
                        role=super_role, resource=res_name, action=action,
                        defaults={'scope': 'organization'}
                    )

            # 2. GENERAL_MANAGER (Total Access as well)
            gm_role, _ = Role.objects.get_or_create(
                name='GENERAL_MANAGER', company=company,
                defaults={'description': 'Direction Générale', 'is_system': True}
            )
            for res_name, data in resources.items():
                for action in data['actions']:
                    RolePermission.objects.get_or_create(
                        role=gm_role, resource=res_name, action=action,
                        defaults={'scope': 'organization'}
                    )

            # 3. FINANCE (Finance focus)
            finance_role, _ = Role.objects.get_or_create(
                name='FINANCE', company=company,
                defaults={'description': 'Équipe Finance', 'is_system': True}
            )
            for res_name, data in resources.items():
                for action in data['actions']:
                    if any(x in res_name.lower() for x in ['finance', 'accounting', 'budget', 'report', 'invoice', 'income', 'expense', 'request']):
                        RolePermission.objects.get_or_create(
                            role=finance_role, resource=res_name, action=action,
                            defaults={'scope': 'organization'}
                        )

            # 4. HR (HR focus)
            hr_role, _ = Role.objects.get_or_create(
                name='HR', company=company,
                defaults={'description': 'Ressources Humaines', 'is_system': True}
            )
            for res_name, data in resources.items():
                for action in data['actions']:
                    if any(x in res_name.lower() for x in ['hr', 'employee', 'payroll', 'payslip', 'leave', 'advance']):
                        RolePermission.objects.get_or_create(
                            role=hr_role, resource=res_name, action=action,
                            defaults={'scope': 'organization'}
                        )

            # 5. PROJECT_MANAGER (Limited)
            pm_role, _ = Role.objects.get_or_create(
                name='PROJECT_MANAGER', company=company,
                defaults={'description': 'Gestionnaire de Projet', 'is_system': True}
            )
            for res_name, data in resources.items():
                if any(x in res_name.lower() for x in ['request', 'budget']):
                    for action in ['view', 'create', 'edit']:
                        RolePermission.objects.get_or_create(
                            role=pm_role, resource=res_name, action=action,
                            defaults={'scope': 'self'}
                        )

            # 6. Link users
            users = KumbaUser.objects.filter(company=company)
            for user in users:
                role_name = user.role or 'ADMIN'
                # Map legacy roles
                if role_name in ['ADMIN', 'OWNER']:
                    role_name = 'SUPER_ADMIN'
                elif role_name == 'MANAGER':
                    role_name = 'GENERAL_MANAGER'
                
                target_role = Role.objects.filter(name=role_name, company=company).first()
                if target_role:
                    user.custom_role = target_role
                    user.save()
                
            self.stdout.write(self.style.SUCCESS(f"Successfully synced roles for {company.name}"))
