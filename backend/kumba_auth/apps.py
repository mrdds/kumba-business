from django.apps import AppConfig


class KumbaAuthConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'kumba_auth'

    def ready(self):
        import kumba_auth.signals
