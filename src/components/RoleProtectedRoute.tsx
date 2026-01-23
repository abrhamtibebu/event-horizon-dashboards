import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { usePermissionCheck } from '@/hooks/use-permission-check'
import { Spinner } from '@/components/ui/spinner'

interface RoleProtectedRouteProps {
  children: JSX.Element
  allowedRoles: string | string[]
  fallbackPath?: string
}

/**
 * Component that protects routes based on user roles
 * Checks both user.role and user.roles array
 */
export const RoleProtectedRoute = ({
  children,
  allowedRoles,
  fallbackPath = '/dashboard',
}: RoleProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth()
  const { hasRole } = usePermissionCheck()

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="md" text="Loading..." />
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />
  }

  // Check if user has required role(s)
  const rolesToCheck = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
  const hasAccess = hasRole(rolesToCheck)

  if (!hasAccess) {
    // Redirect to dashboard if user doesn't have access
    return <Navigate to={fallbackPath} replace />
  }

  return children
}

