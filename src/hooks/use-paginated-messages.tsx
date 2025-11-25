import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { echo } from '../lib/echo'
import type { Message } from '../types/message'
import { shouldUseWebsocket, getPollingInterval } from '@/config/messaging'

const sortMessagesByCreatedAt = (list: Message[]) =>
  [...list].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

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
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const queryClient = useQueryClient()
  
  // Use ref to prevent infinite loops
  const lastConversationId = useRef<string | null>(null)
  const isInitialLoad = useRef(true)
  const realtimeListener = useRef<any>(null)
  const nextCursorRef = useRef<string | null>(null)
  const hasLoadedMoreRef = useRef(false)

  const upsertMessage = useCallback((incoming: Message) => {
    setMessages(prev => {
      const index = prev.findIndex(
        msg => typeof msg.id !== 'string' && msg.id === incoming.id
      )

      if (index !== -1) {
        const next = [...prev]
        next[index] = { ...next[index], ...incoming }
        return sortMessagesByCreatedAt(next)
      }

      return sortMessagesByCreatedAt([...prev, incoming])
    })
  }, [])

  // Reset state when conversation changes
  useEffect(() => {
    if (lastConversationId.current !== conversationId) {
      setMessages([])
      setHasMore(true)
      setIsLoadingMore(false)
      lastConversationId.current = conversationId
      isInitialLoad.current = true
      hasLoadedMoreRef.current = false
      nextCursorRef.current = null
      
      if (realtimeListener.current) {
        realtimeListener.current.stopListening('.message.sent')
        realtimeListener.current.stopListening('.message.reaction.updated')
        realtimeListener.current = null
      }
    }
  }, [conversationId, currentUserId])

  const normalizePayload = (payload: any) => ({
    messages: payload?.data || [],
    nextCursor: payload?.next_cursor || null,
    hasMore: Boolean(payload?.has_more ?? payload?.next_cursor),
  })

  const fetchConversationPage = useCallback(async (conversationKey: string, cursor?: string) => {
    const params: Record<string, any> = {
      per_page: pageSize,
    }
    if (cursor) {
      params.cursor = cursor
    }

    if (conversationKey.startsWith('event_')) {
      const eventId = conversationKey.split('_')[1]
      const response = await api.get(`/events/${eventId}/messages`, { params })
      return normalizePayload(response.data)
    }

    const userId = conversationKey.replace('direct_', '')
    const response = await api.get(`/messages/direct/${userId}`, { params })
    return normalizePayload(response.data)
  }, [pageSize])

  // Fetch messages query with polling fallback
  const { data, isLoading } = useQuery({
    queryKey: ['messages', conversationId, pageSize],
    queryFn: async () => {
      if (!conversationId) return { messages: [], nextCursor: null, hasMore: false }
      
      const timestamp = new Date().toISOString()
      console.log(`[${timestamp}] [usePaginatedMessages] Fetching messages for conversation:`, conversationId)
      
      try {
        const payload = await fetchConversationPage(conversationId)
        console.log(`[${timestamp}] [usePaginatedMessages] Received ${(payload?.messages || []).length} messages`)
        return payload
      } catch (error) {
        console.error(`[${timestamp}] [usePaginatedMessages] Failed to fetch messages:`, error)
        return { messages: [], nextCursor: null, hasMore: false }
      }
    },
    enabled: !!conversationId && !!currentUserId,
    staleTime: 0, // Always consider data stale to enable polling
    refetchInterval:
      conversationId && !shouldUseWebsocket ? getPollingInterval(2000) : false,
    refetchOnWindowFocus: !shouldUseWebsocket,
    refetchIntervalInBackground: !shouldUseWebsocket,
  })

  // Update messages when data changes
  useEffect(() => {
    if (data) {
      const timestamp = new Date().toISOString()
      
      if (isInitialLoad.current) {
        // Initial load
        console.log(`[${timestamp}] [usePaginatedMessages] Initial load - ${data.messages?.length || 0} messages`)
        setMessages(sortMessagesByCreatedAt(data.messages || []))
        nextCursorRef.current = data.nextCursor || null
        setHasMore(Boolean(data.nextCursor))
        isInitialLoad.current = false
      } else {
        // Subsequent updates - check for new messages
        const newMessages = data.messages || []
        console.log(`[${timestamp}] [usePaginatedMessages] Polling update - received ${newMessages.length} messages`)
        console.log(`[${timestamp}] [usePaginatedMessages] Message IDs from server:`, newMessages.map((m: any) => m.id))
        
        setMessages(prev => {
          const map = new Map<string | number, Message>()
          prev.forEach(msg =>
            map.set(msg.id ?? (msg as any).tempId ?? `${msg.sender_id}-${msg.created_at}`, msg)
          )
          newMessages.forEach((msg: any) => {
            const key = msg.id ?? msg.tempId ?? `${msg.sender_id}-${msg.created_at}`
            map.set(key, msg)
          })

          const merged = sortMessagesByCreatedAt(Array.from(map.values()))

          console.log(
            `[${timestamp}] [usePaginatedMessages] Updated merged message count: ${merged.length}`
          )
          return merged
        })
        if (!hasLoadedMoreRef.current) {
          nextCursorRef.current = data.nextCursor || null
          setHasMore(Boolean(data.nextCursor))
        } else {
          setHasMore(Boolean(nextCursorRef.current))
        }
      }
    }
  }, [data])

  // Load more messages
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || !conversationId || !nextCursorRef.current) return
    
    setIsLoadingMore(true)
    try {
      const payload = await fetchConversationPage(conversationId, nextCursorRef.current)
      const newMessages = payload.messages || []

      setMessages(prev => {
        const map = new Map<string | number, Message>()
        prev.forEach(msg =>
          map.set(msg.id ?? (msg as any).tempId ?? `${msg.sender_id}-${msg.created_at}`, msg)
        )
        newMessages.forEach((msg: any) => {
          const key = msg.id ?? msg.tempId ?? `${msg.sender_id}-${msg.created_at}`
          map.set(key, msg)
        })

        return sortMessagesByCreatedAt(Array.from(map.values()))
      })

      nextCursorRef.current = payload.nextCursor || null
      hasLoadedMoreRef.current = true
      setHasMore(Boolean(payload.nextCursor))
    } catch (error) {
      console.error('Failed to load more messages:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [hasMore, isLoadingMore, conversationId, currentUserId, fetchConversationPage])

  // Add a new message
  const addMessage = useCallback(
    (message: Message) => {
      console.log('Adding message to local state:', message)
      upsertMessage(message)
    },
    [upsertMessage]
  )

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
        queryKey: ['messages', conversationId, pageSize]
      })
    }
  }, [conversationId, queryClient, pageSize])

  useEffect(() => {
    if (!shouldUseWebsocket || !conversationId || !currentUserId) {
      return
    }

    const channel = echo.private(`user.${currentUserId}`)
    realtimeListener.current = channel

    const handleMessageSent = (data: any) => {
      if (!data?.conversation_id || data.conversation_id !== conversationId || !data.message) {
        return
      }

      const incoming = data.message as Message
      upsertMessage(incoming)

      const optimisticTempId =
        data?.temp_id ||
        data?.client_temp_id ||
        data?.message?.temp_id ||
        data?.message?.client_temp_id

      if (
        incoming.sender_id === currentUserId &&
        optimisticTempId &&
        onConfirmOptimisticMessage
      ) {
        onConfirmOptimisticMessage(optimisticTempId, incoming)
      }
    }

    const handleReactionUpdated = (data: any) => {
      if (data?.conversation_id !== conversationId || !data?.message_id) return
      updateMessage(data.message_id, { reaction_counts: data.reaction_counts })
    }

    channel.listen('.message.sent', handleMessageSent)
    channel.listen('.message.reaction.updated', handleReactionUpdated)

    return () => {
      channel.stopListening('.message.sent')
      channel.stopListening('.message.reaction.updated')
      if (realtimeListener.current === channel) {
        realtimeListener.current = null
      }
    }
  }, [
    conversationId,
    currentUserId,
    onConfirmOptimisticMessage,
    upsertMessage,
    updateMessage,
  ])

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