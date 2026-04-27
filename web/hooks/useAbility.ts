import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext'; // Assuming this exists or similar

/**
 * Hook to check if current user can perform an action on a resource.
 * Usage:
 *   const { can } = useAbility();
 *   if (can('approve', 'invoice')) { ... }
 */
export const useAbility = () => {
    const { user } = useAuth();

    const can = useMemo(() => (action: string, resource: string, context?: any) => {
        if (!user) return false;
        
        // Super admin bypass
        if (user.is_superuser || user.role === 'SUPER_ADMIN') return true;

        // In a real implementation, we would fetch permissions from the user object 
        // or a global permissions state populated at login.
        // For now, we fallback to checking the user.permissions JSON if it exists
        const userPerms = user.permissions || {};
        
        // Dynamic check: action:resource
        const permKey = `${action}:${resource}`;
        if (userPerms[permKey] === true) return true;

        // Legacy/Generic checks
        if (action === 'view' && userPerms.allowed_modules?.includes(resource)) return true;

        return false;
    }, [user]);

    return { can };
};
