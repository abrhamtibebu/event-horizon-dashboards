import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './use-auth'
import api from '@/lib/api'

interface PermissionCheckResult {
  permission: string
  has_permission: boolean
}

interface UserPermissionsResponse {
  permissions: string[]
  is_organizer_admin: boolean
}

export function useOrganizerPermissions() {
  const { user } = useAuth()
  const [permissions, setPermissions] = useState<string[]>([])
  const [isOrganizerAdmin, setIsOrganizerAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPermissions = useCallback(async () => {
    if (!user || !user.organizer_id) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const response = await api.get<UserPermissionsResponse>('/permissions/user', {
        params: {
          organizer_id: user.organizer_id,
        },
      })

      setPermissions(response.data.permissions)
      setIsOrganizerAdmin(response.data.is_organizer_admin)
    } catch (err: any) {
      console.error('Failed to fetch permissions:', err)
      setError(err.response?.data?.error || 'Failed to fetch permissions')
      setPermissions([])
      setIsOrganizerAdmin(false)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchPermissions()
  }, [fetchPermissions])

  const hasPermission = useCallback(
    (permission: string): boolean => {
      // System admins have all permissions
      if (user && (user.role === 'admin' || user.role === 'superadmin')) {
        return true
      }

      // Organizer admin has all permissions
      if (isOrganizerAdmin) {
        return true
      }

      return permissions.includes(permission)
    },
    [permissions, isOrganizerAdmin, user]
  )

  const checkPermission = useCallback(
    async (permission: string): Promise<boolean> => {
      if (!user || !user.organizer_id) {
        return false
      }

      try {
        const response = await api.get<PermissionCheckResult>('/permissions/check', {
          params: {
            permission,
            organizer_id: user.organizer_id,
          },
        })
        return response.data.has_permission
      } catch (err: any) {
        console.error('Failed to check permission:', err)
        return false
      }
    },
    [user]
  )

  return {
    permissions,
    isOrganizerAdmin,
    isLoading,
    error,
    hasPermission,
    checkPermission,
    refreshPermissions: fetchPermissions,
  }
}

