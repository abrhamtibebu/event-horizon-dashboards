import { useState, useEffect, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { echo } from '../lib/echo'
import type { Message } from '../types/message'

interface UseMessageRepliesOptions {
  messageId: number
  currentUserId: number
}

interface UseMessageRepliesReturn {
  replies: Message[]
  isLoading: boolean
  addReply: (reply: Message) => void
  updateReply: (replyId: number, updates: Partial<Message>) => void
  removeReply: (replyId: number) => void
  loadReplies: () => Promise<void>
}

export const useMessageReplies = ({
  messageId,
  currentUserId,
}: UseMessageRepliesOptions): UseMessageRepliesReturn => {
  const queryClient = useQueryClient()
  const [replies, setReplies] = useState<Message[]>([])

  // Fetch replies from API
  const { data: repliesData, isLoading } = useQuery({
    queryKey: ['messageReplies', messageId],
    queryFn: async () => {
      try {
        const response = await api.get(`/messages/${messageId}/replies`)
        return response.data
      } catch (error) {
        console.error('Error fetching message replies:', error)
        return { replies: [] }
      }
    },
    enabled: !!messageId,
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // Poll every 30 seconds for real-time updates
  })

  // Update local state when API data changes
  useEffect(() => {
    if (repliesData) {
      setReplies(repliesData.replies || [])
    }
  }, [repliesData])

  // Listen for real-time message updates (new replies)
  useEffect(() => {
    if (!messageId || !currentUserId) return

    const channel = echo.private(`user.${currentUserId}`)
    
    const handleNewMessage = (data: any) => {
      // Check if this is a reply to the current message
      if (data.message.parent_message_id === messageId) {
        console.log('Real-time reply received:', data)
        setReplies(prev => {
          // Check if reply already exists to prevent duplicates
          const exists = prev.some(reply => reply.id === data.message.id)
          if (exists) return prev
          return [...prev, data.message]
        })
      }
    }

    channel.listen('.message.sent', handleNewMessage)

    return () => {
      channel.stopListening('.message.sent')
    }
  }, [messageId, currentUserId])

  // Add reply to local state
  const addReply = useCallback((reply: Message) => {
    setReplies(prev => {
      // Check if reply already exists to prevent duplicates
      const exists = prev.some(r => r.id === reply.id)
      if (exists) return prev
      return [...prev, reply]
    })
  }, [])

  // Update reply in local state
  const updateReply = useCallback((replyId: number, updates: Partial<Message>) => {
    setReplies(prev => 
      prev.map(reply => 
        reply.id === replyId ? { ...reply, ...updates } : reply
      )
    )
  }, [])

  // Remove reply from local state
  const removeReply = useCallback((replyId: number) => {
    setReplies(prev => prev.filter(reply => reply.id !== replyId))
  }, [])

  // Load replies manually
  const loadReplies = useCallback(async () => {
    if (messageId) {
      queryClient.invalidateQueries({ queryKey: ['messageReplies', messageId] })
    }
  }, [messageId, queryClient])

  return {
    replies,
    isLoading,
    addReply,
    updateReply,
    removeReply,
    loadReplies,
  }
}
