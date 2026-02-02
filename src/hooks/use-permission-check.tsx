import { useCallback } from 'react'
import { toast } from 'sonner'
import { useAuth } from './use-auth'

/**
 * Permission check hook - Updated to handle multi-role check
 */
export function usePermissionCheck() {
    const { user, isLoading } = useAuth()

    /**
     * Check if user has a specific role or any of the roles in an array
     */
    const hasRole = useCallback((requiredRoles: string | string[]) => {
        if (!user) return false

        // Superadmin and admin have all access
        if (user.role === 'superadmin' || user.role === 'admin') return true

        const rolesToCheck = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]

        // Check primary role
        if (rolesToCheck.includes(user.role)) return true

        // Check additional roles if they exist
        if (user.roles && user.roles.some(r => rolesToCheck.includes(r))) return true

        return false
    }, [user]);

    /**
     * Simplified permission check based on roles
     * Since granular permissions were removed, we map actions to roles
     */
    const hasPermission = useCallback((permission: string) => {
        if (!user) return false

        // Superadmin and admin see everything
        if (user.role === 'superadmin' || user.role === 'admin') return true

        // Organizer admins have all permissions within their organization
        if (user.role === 'organizer_admin') return true

        // Basic mapping for common permissions
        const permissionRoleMap: Record<string, string[]> = {
            'events.manage': ['event_manager', 'organizer', 'organizer_admin'],
            'events.create': ['event_manager', 'organizer', 'organizer_admin'],
            'events.edit': ['event_manager', 'organizer', 'organizer_admin'],
            'events.delete': ['event_manager', 'organizer', 'organizer_admin'],
            'events.publish': ['event_manager', 'organizer', 'organizer_admin'],
            'events.view': ['event_manager', 'marketing_specialist', 'finance_manager', 'operations_manager', 'procurement_manager', 'organizer', 'organizer_admin'],
            'organizer.edit': ['finance_manager'],
            'team.manage': [],
            'vendors.manage': ['procurement_manager', 'procurement_officer'],
            'vendors.create': ['procurement_manager', 'procurement_officer'],
            'vendors.delete': ['procurement_manager'],
            'vendors.view': ['procurement_manager', 'procurement_officer', 'finance_manager', 'purchase_requester', 'proforma_manager', 'purchase_approver', 'proforma_approver', 'purchase_order_issuer', 'payment_requester', 'payment_approver'],
            'finance.manage': ['finance_manager'],
            'operations.manage': ['operations_manager'],
            'marketing.manage': ['marketing_specialist'],
            'ushers.manage': ['event_manager', 'organizer', 'organizer_admin'],
            'ushers.assign': ['event_manager', 'organizer', 'organizer_admin'],
            'guests.manage': ['event_manager', 'organizer', 'organizer_admin'],
            'guests.export': ['event_manager', 'organizer', 'organizer_admin'],
            'badges.design': ['event_manager', 'marketing_specialist', 'organizer', 'organizer_admin'],
            'reports.view': ['event_manager', 'marketing_specialist', 'finance_manager', 'organizer', 'organizer_admin'],
            'reports.export': ['event_manager', 'marketing_specialist', 'finance_manager', 'organizer', 'organizer_admin'],
            'messages.manage': ['organizer', 'organizer_admin', 'event_manager', 'marketing_specialist', 'finance_manager', 'procurement_manager', 'operations_manager', 'purchase_requester', 'purchase_approver', 'proforma_manager', 'proforma_approver', 'purchase_order_issuer', 'payment_requester', 'payment_approver', 'usher', 'attendee', 'sales'],
            'messages.send': ['organizer', 'organizer_admin', 'event_manager', 'marketing_specialist', 'finance_manager', 'procurement_manager', 'operations_manager', 'purchase_requester', 'purchase_approver', 'proforma_manager', 'proforma_approver', 'purchase_order_issuer', 'payment_requester', 'payment_approver', 'usher', 'attendee', 'sales'],
            // Procurement permissions
            'pr.view': ['procurement_manager', 'procurement_officer', 'finance_manager', 'purchase_requester', 'purchase_approver'],
            'pr.create': ['procurement_manager', 'event_manager', 'operations_manager', 'purchase_requester'],
            'pr.approve': ['procurement_manager', 'finance_manager', 'purchase_approver'],
            'proforma.view': ['procurement_manager', 'procurement_officer', 'finance_manager', 'proforma_manager', 'proforma_approver'],
            'proforma.upload': ['procurement_manager', 'procurement_officer', 'proforma_manager'],
            'proforma.approve': ['finance_manager', 'procurement_manager', 'proforma_approver'],
            'po.view': ['procurement_manager', 'procurement_officer', 'finance_manager', 'purchase_order_issuer'],
            'po.send': ['procurement_manager', 'procurement_officer', 'purchase_order_issuer'],
            'po.approve': ['finance_manager', 'purchase_order_issuer'],
            'payment_request.view': ['finance_manager', 'procurement_manager', 'payment_requester', 'payment_approver'],
            'payment_request.create': ['procurement_manager', 'procurement_officer', 'payment_requester'],
            'payment_request.approve': ['finance_manager', 'payment_approver'],
            'payments.view': ['finance_manager', 'payment_requester'],
            'payments.process': ['finance_manager', 'payment_requester'],
        }

        const requiredRoles = permissionRoleMap[permission]
        if (requiredRoles) {
            return hasRole(requiredRoles)
        }

        // Default to true for unrecognized permissions to avoid breaking UI 
        // until migrations are fully handled
        return true
    }, [user, hasRole]);

    /**
     * Legacy checkPermission for backward compatibility with toast
     */
    const checkPermission = useCallback((permission: string, actionName?: string, showToast = true) => {
        const permitted = hasPermission(permission)
        if (!permitted && showToast) {
            toast.error('Access Denied', {
                description: `You don't have permission to ${actionName || 'perform this action'}.`,
            })
        }
        return permitted
    }, [hasPermission]);

    return {
        hasRole,
        hasPermission,
        checkPermission,
        isLoading,
    }
}
