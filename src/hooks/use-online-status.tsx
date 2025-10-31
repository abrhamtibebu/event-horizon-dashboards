import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from './use-auth'

export interface OnlineStatus {
  user_id: number
  is_online: boolean
  last_seen_at: string | null
  last_seen_text: string
}

/**
 * Fetch online status for multiple users
 */
export const useOnlineStatus = (userIds: number[]) => {
  const { isAuthenticated } = useAuth()
  
  return useQuery<OnlineStatus[]>({
    queryKey: ['onlineStatus', userIds.sort().join(',')], // Sort for consistent cache keys
    queryFn: async () => {
      if (!userIds || userIds.length === 0) {
        return []
      }
      
      const response = await api.post('/users/online-status', {
        user_ids: userIds,
      })
      return response.data
    },
    enabled: isAuthenticated && userIds.length > 0,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    staleTime: 20000, // Data stays fresh for 20 seconds
  })
}

/**
 * Get online status for a single user
 */
export const useSingleUserOnlineStatus = (userId: number | null) => {
  const { isAuthenticated } = useAuth()
  
  return useQuery<OnlineStatus | null>({
    queryKey: ['onlineStatus', userId],
    queryFn: async () => {
      if (!userId) return null
      
      const response = await api.post('/users/online-status', {
        user_ids: [userId],
      })
      return response.data[0] || null
    },
    enabled: isAuthenticated && !!userId,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 20000, // Data stays fresh for 20 seconds
  })
}

/**
 * Real-time online status hook with optimistic updates
 * Updates every 15 seconds to show live status
 */
export const useRealtimeOnlineStatus = (userIds: number[]) => {
  const queryClient = useQueryClient()
  const { data: statuses = [], isLoading } = useOnlineStatus(userIds)
  const [localStatuses, setLocalStatuses] = useState<Record<number, OnlineStatus>>({})

  useEffect(() => {
    if (statuses.length > 0) {
      const statusMap: Record<number, OnlineStatus> = {}
      statuses.forEach(status => {
        statusMap[status.user_id] = status
      })
      setLocalStatuses(statusMap)
    }
  }, [statuses])

  // Optimistically update a user's online status
  const updateUserStatus = (userId: number, isOnline: boolean) => {
    setLocalStatuses(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        is_online: isOnline,
        last_seen_text: isOnline ? 'Online' : 'Just now',
        last_seen_at: isOnline ? null : new Date().toISOString(),
      },
    }))

    // Invalidate queries to fetch fresh data
    queryClient.invalidateQueries({ queryKey: ['onlineStatus'] })
  }

  const getStatusForUser = (userId: number): OnlineStatus | null => {
    return localStatuses[userId] || null
  }

  const isUserOnline = (userId: number): boolean => {
    return localStatuses[userId]?.is_online || false
  }

  const getLastSeenText = (userId: number): string => {
    return localStatuses[userId]?.last_seen_text || 'Offline'
  }

  return {
    statuses: localStatuses,
    isLoading,
    updateUserStatus,
    getStatusForUser,
    isUserOnline,
    getLastSeenText,
  }
}

