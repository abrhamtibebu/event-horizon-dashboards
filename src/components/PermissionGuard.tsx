import { ReactNode } from 'react'
import { useOrganizerPermissions } from '@/hooks/use-organizer-permissions'
import { toast } from 'sonner'
import { useEffect, useRef } from 'react'

interface PermissionGuardProps {
  permission: string
  children: ReactNode
  fallback?: ReactNode
  requireAll?: boolean
  permissions?: string[]
  showToast?: boolean
  actionName?: string
}

export function PermissionGuard({
  permission,
  children,
  fallback = null,
  requireAll = false,
  permissions,
  showToast = false,
  actionName,
}: PermissionGuardProps) {
  const { hasPermission, isLoading, isOrganizerAdmin } = useOrganizerPermissions()
  const toastShownRef = useRef(false)

  useEffect(() => {
    // Reset toast flag when permissions change
    toastShownRef.current = false
  }, [permission, permissions])

  if (isLoading) {
    return null // Or a loading spinner
  }

  let hasAccess = false

  // If multiple permissions provided, check based on requireAll flag
  if (permissions && permissions.length > 0) {
    const hasAll = permissions.every((p) => hasPermission(p))
    const hasAny = permissions.some((p) => hasPermission(p))
    hasAccess = requireAll ? hasAll : hasAny
  } else {
    // Single permission check
    hasAccess = hasPermission(permission) || isOrganizerAdmin
  }

  // Show toast notification if access denied and toast is enabled
  if (!hasAccess && showToast && !toastShownRef.current) {
    const actionText = actionName || 'access this feature'
    toast.error('Access Denied', {
      description: `You don't have permission to ${actionText}. Please contact your organizer admin to request access.`,
      duration: 5000,
    })
    toastShownRef.current = true
  }

  if (!hasAccess) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

