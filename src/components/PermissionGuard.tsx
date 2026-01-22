import { ReactNode } from 'react'
import { usePermissionCheck } from '@/hooks/use-permission-check'

interface PermissionGuardProps {
    permission?: string
    roles?: string | string[]
    showToast?: boolean
    actionName?: string
    fallback?: ReactNode
    children: ReactNode
}

/**
 * Permission guard component - Updated to handle role-based access
 */
export function PermissionGuard({
    children,
    fallback = null,
    permission,
    roles
}: PermissionGuardProps) {
    const { hasPermission, hasRole } = usePermissionCheck()

    // If roles are specified, check them
    if (roles) {
        if (hasRole(roles)) {
            return <>{children}</>
        }
        return <>{fallback}</>
    }

    // If permission is specified, check it
    if (permission) {
        if (hasPermission(permission)) {
            return <>{children}</>
        }
        return <>{fallback}</>
    }

    // If neither is specified, render children
    return <>{children}</>
}
