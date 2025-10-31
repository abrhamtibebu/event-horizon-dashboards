import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { echo } from '../lib/echo'
import type { Message } from '../types/message'

interface UsePaginatedMessagesOptions {
  conversationId: string | null
  currentUserId: number
  pageSize?: number
  onConfirmOptimisticMessage?: (tempId: string, realMessage: Message) => void
}

interface UsePaginatedMessagesReturn {
  messages: Message[]
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  loadMore: () => void
  addMessage: (message: Message) => void
  updateMessage: (messageId: number, updates: Partial<Message>) => void
  removeMessage: (messageId: number) => void
  refresh: () => void
}

export const usePaginatedMessages = ({
  conversationId,
  currentUserId,
  pageSize = 50,
  onConfirmOptimisticMessage,
}: UsePaginatedMessagesOptions): UsePaginatedMessagesReturn => {
  const [messages, setMessages] = useState<Message[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const queryClient = useQueryClient()
  
  // Use ref to prevent infinite loops
  const lastConversationId = useRef<string | null>(null)
  const isInitialLoad = useRef(true)
  const realtimeListener = useRef<any>(null)

  // Reset state when conversation changes
  useEffect(() => {
    if (lastConversationId.current !== conversationId) {
      setMessages([])
      setCurrentPage(1)
      setHasMore(true)
      setIsLoadingMore(false)
      lastConversationId.current = conversationId
      isInitialLoad.current = true
      
      // Clean up previous real-time listener
      if (realtimeListener.current) {
        realtimeListener.current.stopListening('.message.sent')
        realtimeListener.current.stopListening('.message.reaction.updated')
      }
      
      // Set up real-time listener for this conversation (disabled for now, using polling instead)
      // if (conversationId && currentUserId) {
      //   const channel = echo.private(`user.${currentUserId}`)
      //   
      //   // Listen for new messages in this conversation
      //   channel.listen('.message.sent', (data: any) => {
      //     if (data.conversation_id === conversationId) {
      //       console.log('Real-time message received for current conversation:', data)
      //       
      //       // Check if this is a confirmation of an optimistic message
      //       const realMessage = data.message
      //       if (realMessage.sender_id === currentUserId && onConfirmOptimisticMessage) {
      //         // This is likely a confirmation of a message we sent optimistically
      //         // Try to find and confirm the optimistic message
      //         console.log('Checking for optimistic message confirmation')
      //         // We'll use a simple approach - if it's from current user and recent, confirm it
      //         const recentTime = new Date(Date.now() - 10000) // 10 seconds ago
      //         if (new Date(realMessage.created_at) > recentTime) {
      //           // This is likely our optimistic message confirmed
      //           console.log('Confirming optimistic message with real message')
      //           onConfirmOptimisticMessage(`temp_${realMessage.created_at}`, realMessage)
      //         }
      //       }
      //       
      //       // Check if message already exists to prevent duplicates
      //       setMessages(prev => {
      //         const exists = prev.some(msg => msg.id === data.message.id)
      //         if (exists) {
      //           console.log('Message already exists, skipping duplicate')
      //           return prev
      //         }
      //         console.log('Adding new real-time message to local state')
      //         return [...prev, data.message]
      //       })
      //     }
      //   })
      //   
      //   // Listen for reaction updates in this conversation
      //   channel.listen('.message.reaction.updated', (data: any) => {
      //     if (data.conversation_id === conversationId) {
      //       console.log('Real-time reaction update received:', data)
      //       // Update the specific message with new reaction counts
      //       updateMessage(data.message_id, {
      //         reaction_counts: data.reaction_counts
      //       })
      //     }
      //   })
      //   
      //   realtimeListener.current = channel
      // }
    }
  }, [conversationId, currentUserId])

  // Fetch messages query with polling for real-time updates
  const { data, isLoading, error } = useQuery({
    queryKey: ['messages', conversationId, currentPage, pageSize],
    queryFn: async () => {
      if (!conversationId) return { messages: [], hasMore: false }
      
      const timestamp = new Date().toISOString()
      console.log(`[${timestamp}] [usePaginatedMessages] Fetching messages for conversation:`, conversationId)
      
      try {
        // Handle different conversation types
        if (conversationId.startsWith('event_')) {
          // Event conversation
          const eventId = conversationId.split('_')[1]
          console.log(`[${timestamp}] [usePaginatedMessages] Fetching event messages for event:`, eventId)
          const response = await api.get(`/events/${eventId}/messages`, {
            params: {
              page: currentPage,
              per_page: pageSize,
            }
          })
          
          console.log(`[${timestamp}] [usePaginatedMessages] Received ${response.data.data?.length || 0} event messages`)
          
          return {
            messages: response.data.data || [],
            hasMore: response.data.current_page < response.data.last_page,
            total: response.data.total || 0,
          }
        } else {
          // Direct conversation - extract user ID from conversationId (e.g., "direct_30" -> "30")
          const userId = conversationId.replace('direct_', '')
          console.log(`[${timestamp}] [usePaginatedMessages] Fetching direct messages with user:`, userId)
          const response = await api.get(`/messages/direct/${userId}`, {
            params: {
              page: currentPage,
              per_page: pageSize,
            }
          })
          
          console.log(`[${timestamp}] [usePaginatedMessages] Received ${response.data.data?.length || 0} direct messages`)
          console.log(`[${timestamp}] [usePaginatedMessages] Message IDs:`, response.data.data?.map((m: any) => m.id) || [])
          
          return {
            messages: response.data.data || [],
            hasMore: response.data.current_page < response.data.last_page,
            total: response.data.total || 0,
          }
        }
      } catch (error) {
        console.error(`[${timestamp}] [usePaginatedMessages] Failed to fetch messages:`, error)
        return { messages: [], hasMore: false, total: 0 }
      }
    },
    enabled: !!conversationId && !!currentUserId,
    staleTime: 0, // Always consider data stale to enable polling
    refetchInterval: 2000, // Poll every 2 seconds for real-time updates
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchIntervalInBackground: true, // Continue polling even when tab is not active
  })

  // Update messages when data changes
  useEffect(() => {
    if (data) {
      const timestamp = new Date().toISOString()
      
      if (isInitialLoad.current) {
        // Initial load
        console.log(`[${timestamp}] [usePaginatedMessages] Initial load - ${data.messages?.length || 0} messages`)
        setMessages(data.messages || [])
        setHasMore(data.hasMore)
        isInitialLoad.current = false
      } else {
        // Subsequent updates - check for new messages
        const newMessages = data.messages || []
        console.log(`[${timestamp}] [usePaginatedMessages] Polling update - received ${newMessages.length} messages`)
        console.log(`[${timestamp}] [usePaginatedMessages] Message IDs from server:`, newMessages.map((m: any) => m.id))
        
        setMessages(prev => {
          const existingIds = new Set(prev.map(msg => msg.id))
          const hasNewMessages = newMessages.some((msg: any) => !existingIds.has(msg.id))
          
          if (hasNewMessages) {
            console.log(`[${timestamp}] [usePaginatedMessages] NEW MESSAGES DETECTED - Updating UI`)
            console.log(`[${timestamp}] [usePaginatedMessages] Previous count: ${prev.length}, New count: ${newMessages.length}`)
            return newMessages
          }
          
          console.log(`[${timestamp}] [usePaginatedMessages] No new messages, keeping existing ${prev.length} messages`)
          return prev
        })
        setHasMore(data.hasMore)
      }
    }
  }, [data])

  // Load more messages
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || !conversationId) return
    
    setIsLoadingMore(true)
    try {
      const nextPage = currentPage + 1
      const response = await api.get(`/messages/conversation/${conversationId}`, {
        params: {
          page: nextPage,
          per_page: pageSize,
          user_id: currentUserId,
        }
      })
      
      const newMessages = response.data.messages || []
      setMessages(prev => [...prev, ...newMessages])
      setCurrentPage(nextPage)
      setHasMore(response.data.has_more || false)
    } catch (error) {
      console.error('Failed to load more messages:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [hasMore, isLoadingMore, conversationId, currentPage, pageSize, currentUserId])

  // Add a new message
  const addMessage = useCallback((message: Message) => {
    console.log('Adding message to local state:', message)
    setMessages(prev => {
      // Check if message already exists to prevent duplicates
      const exists = prev.some(msg => msg.id === message.id)
      if (exists) {
        console.log('Message already exists in local state, skipping')
        return prev
      }
      
      console.log('Adding new message to local state')
      return [...prev, message]
    })
  }, [])

  // Update an existing message
  const updateMessage = useCallback((messageId: number, updates: Partial<Message>) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, ...updates } : msg
      )
    )
  }, [])

  // Remove a message
  const removeMessage = useCallback((messageId: number) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId))
  }, [])

  // Refresh messages
  const refresh = useCallback(() => {
    if (conversationId) {
      queryClient.invalidateQueries({
        queryKey: ['messages', conversationId]
      })
    }
  }, [conversationId, queryClient])

  // Cleanup real-time listener on unmount
  useEffect(() => {
    return () => {
      if (realtimeListener.current) {
        realtimeListener.current.stopListening('.message.sent')
        realtimeListener.current.stopListening('.message.reaction.updated')
      }
    }
  }, [])

  return {
    messages,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    addMessage,
    updateMessage,
    removeMessage,
    refresh,
  }
}