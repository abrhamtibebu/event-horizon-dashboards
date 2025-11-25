import { useOrganizerPermissions } from './use-organizer-permissions'
import { toast } from 'sonner'
import { useCallback } from 'react'

/**
 * Hook to check permissions and show toast notifications when access is denied
 */
export function usePermissionCheck() {
  const { hasPermission, isLoading, isOrganizerAdmin } = useOrganizerPermissions()

  /**
   * Check if user has permission, show toast if not
   * @param permission - Permission to check
   * @param action - Action name for the toast message (e.g., "create vendor", "edit event")
   * @returns boolean - true if has permission, false otherwise
   */
  const checkPermission = useCallback(
    (permission: string, action?: string): boolean => {
      if (isLoading) {
        return false
      }

      // System admins always have permission
      if (isOrganizerAdmin) {
        return true
      }

      if (hasPermission(permission)) {
        return true
      }

      // Show toast notification
      const actionText = action || 'perform this action'
      toast.error('Access Denied', {
        description: `You don't have permission to ${actionText}. Please contact your organizer admin to request access.`,
        duration: 5000,
      })

      return false
    },
    [hasPermission, isLoading, isOrganizerAdmin]
  )

  /**
   * Execute a function only if user has permission
   * @param permission - Permission to check
   * @param fn - Function to execute if permission granted
   * @param action - Action name for toast message
   */
  const executeWithPermission = useCallback(
    <T extends (...args: any[]) => any>(
      permission: string,
      fn: T,
      action?: string
    ): ((...args: Parameters<T>) => void) => {
      return (...args: Parameters<T>) => {
        if (checkPermission(permission, action)) {
          return fn(...args)
        }
      }
    },
    [checkPermission]
  )

  return {
    checkPermission,
    executeWithPermission,
    hasPermission,
    isLoading,
    isOrganizerAdmin,
  }
}

