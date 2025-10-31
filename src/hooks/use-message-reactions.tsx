import { useState, useEffect, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { echo } from '../lib/echo'
import type { MessageReaction } from '../types/message'

interface UseMessageReactionsOptions {
  messageId: number
  currentUserId: number
}

interface UseMessageReactionsReturn {
  reactions: MessageReaction[]
  reactionCounts: { [emoji: string]: number }
  isLoading: boolean
  addReaction: (emoji: string) => Promise<void>
  removeReaction: (emoji: string) => Promise<void>
  toggleReaction: (emoji: string) => Promise<void>
}

export const useMessageReactions = ({
  messageId,
  currentUserId,
}: UseMessageReactionsOptions): UseMessageReactionsReturn => {
  const queryClient = useQueryClient()
  const [reactions, setReactions] = useState<MessageReaction[]>([])
  const [reactionCounts, setReactionCounts] = useState<{ [emoji: string]: number }>({})

  // Fetch reactions from API
  const { data: reactionsData, isLoading } = useQuery({
    queryKey: ['messageReactions', messageId],
    queryFn: async () => {
      try {
        const response = await api.get(`/messages/${messageId}/reactions`)
        return response.data
      } catch (error) {
        console.error('Error fetching message reactions:', error)
        return { reactions: [], reaction_counts: {} }
      }
    },
    enabled: !!messageId,
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // Poll every 30 seconds for real-time updates
  })

  // Update local state when API data changes
  useEffect(() => {
    if (reactionsData) {
      setReactions(Array.isArray(reactionsData.reactions) ? reactionsData.reactions : [])
      setReactionCounts(reactionsData.reaction_counts || {})
    }
  }, [reactionsData])

  // Listen for real-time reaction updates
  useEffect(() => {
    if (!messageId || !currentUserId) return

    const channel = echo.private(`user.${currentUserId}`)
    
    const handleReactionUpdate = (data: any) => {
      if (data.message_id === messageId) {
        console.log('Real-time reaction update received:', data)
        setReactionCounts(data.reaction_counts || {})
        
        // Invalidate the query to refetch full reaction data
        queryClient.invalidateQueries({ queryKey: ['messageReactions', messageId] })
      }
    }

    channel.listen('.message.reaction.updated', handleReactionUpdate)

    return () => {
      channel.stopListening('.message.reaction.updated')
    }
  }, [messageId, currentUserId, queryClient])

  // Add reaction
  const addReaction = useCallback(async (emoji: string) => {
    try {
      await api.post(`/messages/${messageId}/reactions`, { emoji })
      // The real-time update will handle the UI update
    } catch (error) {
      console.error('Failed to add reaction:', error)
      throw error
    }
  }, [messageId])

  // Remove reaction
  const removeReaction = useCallback(async (emoji: string) => {
    try {
      await api.delete(`/messages/${messageId}/reactions`, { 
        data: { emoji } 
      })
      // The real-time update will handle the UI update
    } catch (error) {
      console.error('Failed to remove reaction:', error)
      throw error
    }
  }, [messageId])

  // Toggle reaction (add if not exists, remove if exists)
  const toggleReaction = useCallback(async (emoji: string) => {
    try {
      await api.post(`/messages/${messageId}/reactions`, { emoji })
      // The backend handles toggling, real-time update will handle the UI update
    } catch (error) {
      console.error('Failed to toggle reaction:', error)
      throw error
    }
  }, [messageId])

  return {
    reactions,
    reactionCounts,
    isLoading,
    addReaction,
    removeReaction,
    toggleReaction,
  }
}
