import logging

logger = logging.getLogger(__name__)

class ResourceRegistry:
    """
    Registry for all securable resources in the application.
    Allows automatic discovery of modules, resources, and actions.
    """
    _resources = {}

    @classmethod
    def register(cls, resource_name, module_name, actions=None):
        """
        Register a resource with its available actions.
        Default actions are standard CRUD + approve/export.
        """
        if actions is None:
            actions = ['view', 'create', 'edit', 'delete', 'approve', 'export']
        
        # Normalize actions to always be a list
        if not isinstance(actions, (list, tuple)):
            actions = [actions]

        cls._resources[resource_name] = {
            'module': module_name,
            'actions': list(actions)
        }
        logger.debug(f"Registered security resource: {resource_name} in module {module_name}")

    @classmethod
    def get_resources(cls):
        """Returns all registered resources"""
        return cls._resources

def secure_resource(name, module, actions=None):
    """
    Decorator to automatically register a model or view as a securable resource.
    Usage:
        @secure_resource('invoice', 'Finance')
        class Invoice(models.Model): ...
    """
    def decorator(cls):
        ResourceRegistry.register(name, module, actions)
        return cls
    return decorator
