import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Message } from '../types/message'

// Fetch replies for a parent message
export const useMessageReplies = (messageId: number | null) => {
  return useQuery({
    queryKey: ['messageReplies', messageId],
    queryFn: async () => {
      if (!messageId) return []
      
      try {
        const response = await api.get(`/messages/${messageId}/replies`)
        return response.data.replies as Message[]
      } catch (error) {
        console.error('Failed to fetch message replies:', error)
        return []
      }
    },
    enabled: !!messageId,
    refetchInterval: 5000, // Poll every 5 seconds for new replies
    staleTime: 3000,
  })
}

// Send a reply to a message
export const useSendReply = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      parentMessageId, 
      content, 
      recipientId,
      eventId,
      file 
    }: { 
      parentMessageId: number
      content: string
      recipientId?: number
      eventId?: number
      file?: File 
    }) => {
      const formData = new FormData()
      formData.append('content', content)
      formData.append('parent_message_id', parentMessageId.toString())
      
      if (recipientId) {
        formData.append('recipient_id', recipientId.toString())
      }
      
      if (file) {
        formData.append('file', file)
      }

      // Send to appropriate endpoint
      if (eventId) {
        const response = await api.post(`/events/${eventId}/messages`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        return response.data
      } else if (recipientId) {
        const response = await api.post('/messages/direct', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        return response.data
      }
      
      throw new Error('Either eventId or recipientId is required')
    },
    onSuccess: (data, variables) => {
      // Invalidate replies query to refetch
      queryClient.invalidateQueries({ 
        queryKey: ['messageReplies', variables.parentMessageId] 
      })
      
      // Also invalidate the main messages query
      queryClient.invalidateQueries({ queryKey: ['messages'] })
      queryClient.invalidateQueries({ queryKey: ['directMessages'] })
      queryClient.invalidateQueries({ queryKey: ['paginatedMessages'] })
    },
  })
}

// Get reply count for a message
export const useReplyCount = (messageId: number) => {
  return useQuery({
    queryKey: ['replyCount', messageId],
    queryFn: async () => {
      try {
        const response = await api.get(`/messages/${messageId}/replies`)
        return response.data.total_replies || 0
      } catch (error) {
        return 0
      }
    },
    staleTime: 10000, // Cache for 10 seconds
  })
}

