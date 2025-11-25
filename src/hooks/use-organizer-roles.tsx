import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './use-auth'
import api from '@/lib/api'

export interface OrganizerRole {
  id: number
  organizer_id: number
  name: string
  description?: string
  is_system_role: boolean
  created_by?: number
  permissions?: OrganizerRolePermission[]
  users?: any[]
  users_count?: number
  created_at?: string
  updated_at?: string
}

export interface OrganizerRolePermission {
  id: number
  organizer_role_id: number
  permission: string
  created_at?: string
  updated_at?: string
}

export interface CreateRoleData {
  name: string
  description?: string
  permissions?: string[]
}

export interface UpdateRoleData {
  name?: string
  description?: string
}

export function useOrganizerRoles() {
  const { user } = useAuth()
  const [roles, setRoles] = useState<OrganizerRole[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRoles = useCallback(async () => {
    if (!user || !user.organizer_id) {
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const response = await api.get<OrganizerRole[]>('/organizer/roles')
      setRoles(response.data)
    } catch (err: any) {
      console.error('Failed to fetch roles:', err)
      setError(err.response?.data?.error || 'Failed to fetch roles')
      setRoles([])
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  const createRole = useCallback(
    async (data: CreateRoleData): Promise<OrganizerRole> => {
      try {
        setError(null)
        const response = await api.post<OrganizerRole>('/organizer/roles', data)
        await fetchRoles() // Refresh list
        return response.data
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || 'Failed to create role'
        setError(errorMessage)
        throw new Error(errorMessage)
      }
    },
    [fetchRoles]
  )

  const updateRole = useCallback(
    async (roleId: number, data: UpdateRoleData): Promise<OrganizerRole> => {
      try {
        setError(null)
        const response = await api.put<OrganizerRole>(`/organizer/roles/${roleId}`, data)
        await fetchRoles() // Refresh list
        return response.data
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || 'Failed to update role'
        setError(errorMessage)
        throw new Error(errorMessage)
      }
    },
    [fetchRoles]
  )

  const deleteRole = useCallback(
    async (roleId: number): Promise<void> => {
      try {
        setError(null)
        await api.delete(`/organizer/roles/${roleId}`)
        await fetchRoles() // Refresh list
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || 'Failed to delete role'
        setError(errorMessage)
        throw new Error(errorMessage)
      }
    },
    [fetchRoles]
  )

  const assignPermissions = useCallback(
    async (roleId: number, permissions: string[]): Promise<OrganizerRole> => {
      try {
        setError(null)
        const response = await api.post<OrganizerRole>(`/organizer/roles/${roleId}/permissions`, {
          permissions,
        })
        await fetchRoles() // Refresh list
        return response.data
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || 'Failed to assign permissions'
        setError(errorMessage)
        throw new Error(errorMessage)
      }
    },
    [fetchRoles]
  )

  const assignRoleToUser = useCallback(
    async (roleId: number, userId: number): Promise<void> => {
      try {
        setError(null)
        await api.post(`/organizer/roles/${roleId}/assign`, {
          user_id: userId,
        })
        await fetchRoles() // Refresh list
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || 'Failed to assign role to user'
        setError(errorMessage)
        throw new Error(errorMessage)
      }
    },
    [fetchRoles]
  )

  const removeRoleFromUser = useCallback(
    async (roleId: number, userId: number): Promise<void> => {
      try {
        setError(null)
        await api.delete(`/organizer/roles/${roleId}/users/${userId}`)
        await fetchRoles() // Refresh list
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || 'Failed to remove role from user'
        setError(errorMessage)
        throw new Error(errorMessage)
      }
    },
    [fetchRoles]
  )

  const getRole = useCallback(
    async (roleId: number): Promise<OrganizerRole> => {
      try {
        setError(null)
        const response = await api.get<OrganizerRole>(`/organizer/roles/${roleId}`)
        return response.data
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || 'Failed to fetch role'
        setError(errorMessage)
        throw new Error(errorMessage)
      }
    },
    []
  )

  return {
    roles,
    isLoading,
    error,
    createRole,
    updateRole,
    deleteRole,
    assignPermissions,
    assignRoleToUser,
    removeRoleFromUser,
    getRole,
    refreshRoles: fetchRoles,
  }
}

