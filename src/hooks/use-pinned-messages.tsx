import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pinMessage, unpinMessage, getPinnedMessages } from '../lib/api'
import { useModernAlerts } from './useModernAlerts'
import type { Message } from '../types/message'

export const usePinnedMessages = (conversationId: string | null) => {
  return useQuery({
    queryKey: ['pinnedMessages', conversationId],
    queryFn: async () => {
      if (!conversationId) return []
      
      try {
        const response = await getPinnedMessages(conversationId)
        return response.data as Message[]
      } catch (error) {
        console.error('Failed to fetch pinned messages:', error)
        return []
      }
    },
    enabled: !!conversationId,
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: true,
  })
}

export const usePinMessage = () => {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useModernAlerts()

  return useMutation({
    mutationFn: (messageId: number) => pinMessage(messageId),
    onSuccess: (_, messageId) => {
      // Invalidate pinned messages query
      queryClient.invalidateQueries({ queryKey: ['pinnedMessages'] })
      
      // Invalidate messages query to update pin status
      queryClient.invalidateQueries({ queryKey: ['messages'] })
      
      showSuccess('Message Pinned', 'Message has been pinned to this conversation')
    },
    onError: (error: any) => {
      console.error('Failed to pin message:', error)
      showError('Pin Failed', error.response?.data?.message || 'Failed to pin message')
    },
  })
}

export const useUnpinMessage = () => {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useModernAlerts()

  return useMutation({
    mutationFn: (messageId: number) => unpinMessage(messageId),
    onSuccess: () => {
      // Invalidate pinned messages query
      queryClient.invalidateQueries({ queryKey: ['pinnedMessages'] })
      
      // Invalidate messages query to update pin status
      queryClient.invalidateQueries({ queryKey: ['messages'] })
      
      showSuccess('Message Unpinned', 'Message has been removed from pinned messages')
    },
    onError: (error: any) => {
      console.error('Failed to unpin message:', error)
      showError('Unpin Failed', error.response?.data?.message || 'Failed to unpin message')
    },
  })
}

