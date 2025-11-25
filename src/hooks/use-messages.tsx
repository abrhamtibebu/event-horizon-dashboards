import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getConversations,
  getDirectMessages,
  sendDirectMessage,
  sendEventMessageWithAttachment,
  markMessageRead,
  markConversationRead,
  deleteMessage,
  searchMessages,
  getUnreadMessageCount,
  getUnreadMessages,
} from '../lib/api'
import { api } from '../lib/api'
import { shouldUseWebsocket, getPollingInterval } from '@/config/messaging'
import type {
  Message,
  Conversation,
  MessageFormData,
  DirectMessageFormData,
  MessageSearchResult,
  MessageFilters,
} from '../types/message'
import { useAuth } from './use-auth'

// Hook for managing conversations
export const useConversations = () => {
  const { isAuthenticated } = useAuth()
  const refetchInterval = isAuthenticated ? getPollingInterval(3000) : false
  
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const timestamp = new Date().toISOString()
      console.log(`[${timestamp}] [useConversations] Fetching conversations list...`)
      
      try {
        const response = await getConversations()
        const conversations = response.data
        const conversationCount = Array.isArray(conversations) ? conversations.length : 
                                   Array.isArray(conversations?.data) ? conversations.data.length : 0
        
        console.log(`[${timestamp}] [useConversations] Received ${conversationCount} conversations`)
        
        // Log each conversation's last message if available
        const conversationsList = Array.isArray(conversations) ? conversations : 
                                    Array.isArray(conversations?.data) ? conversations.data : []
        conversationsList.forEach((conv: any) => {
          console.log(`[${timestamp}] [useConversations] Conversation ${conv.id}: last message at ${conv.lastMessage?.created_at || 'N/A'}, unread: ${conv.unreadCount || 0}`)
        })
        
        return response.data
      } catch (error) {
        console.error(`[${timestamp}] [useConversations] Error fetching conversations:`, error)
        throw error
      }
    },
    enabled: isAuthenticated, // Only run when user is authenticated
    refetchInterval,
    refetchOnWindowFocus: isAuthenticated && !shouldUseWebsocket,
    refetchIntervalInBackground: Boolean(refetchInterval),
    retry: (failureCount, error: any) => {
      // Don't retry on 401 errors
      if (error?.response?.status === 401) return false
      return failureCount < 3
    },
    retryDelay: 1000,
  })
}

// Hook for managing direct messages with a specific user
export const useDirectMessages = (userId: string | null, page = 1, perPage = 50) => {
  const { isAuthenticated } = useAuth()
  const refetchInterval = isAuthenticated ? getPollingInterval(30000) : false
  
  return useQuery({
    queryKey: ['directMessages', userId, page, perPage],
    queryFn: () => userId ? getDirectMessages(userId, page, perPage) : Promise.resolve({ data: [] }),
    enabled: !!userId && isAuthenticated, // Only run when user is authenticated and userId is provided
    refetchInterval,
    retry: (failureCount, error: any) => {
      // Don't retry on 401 errors
      if (error?.response?.status === 401) return false
      return failureCount < 3
    },
  })
}

// Hook for sending direct messages
export const useSendDirectMessage = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: sendDirectMessage,
    onSuccess: (data, variables) => {
      // Invalidate and refetch conversations
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      
      // Invalidate direct messages for this conversation
      const recipientId = variables.recipient_id.toString()
      queryClient.invalidateQueries({ queryKey: ['directMessages', recipientId] })
      
      // Update unread count
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] })
    },
  })
}

// Hook for sending event messages
export const useSendEventMessage = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: string; data: MessageFormData }) =>
      sendEventMessageWithAttachment(eventId, data),
    onSuccess: (data, variables) => {
      // Invalidate conversations
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      
      // Invalidate event messages
      queryClient.invalidateQueries({ queryKey: ['eventMessages', variables.eventId] })
      
      // Update unread count
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] })
    },
  })
}

// Hook for marking messages as read
export const useMarkMessageRead = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: markMessageRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] })
      queryClient.invalidateQueries({ queryKey: ['unreadMessages'] })
    },
  })
}

// Hook for marking entire conversation as read
export const useMarkConversationRead = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: markConversationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] })
      queryClient.invalidateQueries({ queryKey: ['unreadMessages'] })
    },
  })
}

// Hook for deleting messages
export const useDeleteMessage = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      queryClient.invalidateQueries({ queryKey: ['directMessages'] })
    },
  })
}

// Hook for searching messages
export const useSearchMessages = (query: string, filters: MessageFilters = {}) => {
  return useQuery({
    queryKey: ['messageSearch', query, filters],
    queryFn: () => searchMessages(query, filters),
    enabled: !!query && query.length >= 2,
  })
}

// Hook for unread message count
export const useUnreadCount = () => {
  const { isAuthenticated } = useAuth()
  const refetchInterval = isAuthenticated ? getPollingInterval(3000) : false
  
  return useQuery({
    queryKey: ['unreadCount'],
    queryFn: getUnreadMessageCount,
    enabled: isAuthenticated, // Only run when user is authenticated
    refetchInterval,
    refetchOnWindowFocus: isAuthenticated && !shouldUseWebsocket,
    refetchIntervalInBackground: Boolean(refetchInterval),
    retry: (failureCount, error: any) => {
      // Don't retry on 401 errors
      if (error?.response?.status === 401) return false
      return failureCount < 3
    },
  })
}

// Hook for unread messages list
export const useUnreadMessages = () => {
  const { isAuthenticated } = useAuth()
  const refetchInterval = isAuthenticated ? getPollingInterval(3000) : false
  
  return useQuery({
    queryKey: ['unreadMessages'],
    queryFn: getUnreadMessages,
    enabled: isAuthenticated, // Only run when user is authenticated
    refetchInterval,
    refetchOnWindowFocus: isAuthenticated && !shouldUseWebsocket,
    refetchIntervalInBackground: Boolean(refetchInterval),
    retry: (failureCount, error: any) => {
      // Don't retry on 401 errors
      if (error?.response?.status === 401) return false
      return failureCount < 3
    },
  })
}

// Hook for real-time message updates
export const useMessageUpdates = (conversationId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState<number[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    
    intervalRef.current = setInterval(() => {
      // This would typically be replaced with WebSocket connection
      // For now, we'll rely on the polling in individual hooks
    }, 3000)
  }, [])

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    if (conversationId) {
      startPolling()
    } else {
      stopPolling()
    }

    return () => stopPolling()
  }, [conversationId, startPolling, stopPolling])

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message])
  }, [])

  const updateMessage = useCallback((messageId: number, updates: Partial<Message>) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, ...updates } : msg
      )
    )
  }, [])

  const removeMessage = useCallback((messageId: number) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId))
  }, [])

  const setTyping = useCallback((userId: number, typing: boolean) => {
    setTypingUsers(prev => {
      if (typing) {
        return prev.includes(userId) ? prev : [...prev, userId]
      } else {
        return prev.filter(id => id !== userId)
      }
    })
  }, [])

  return {
    messages,
    isTyping,
    typingUsers,
    addMessage,
    updateMessage,
    removeMessage,
    setTyping,
  }
}

// Hook for managing message reactions
export const useMessageReactions = (messageId: number) => {
  const { isAuthenticated } = useAuth()
  const refetchInterval = isAuthenticated ? getPollingInterval(30000) : false
  
  return useQuery({
    queryKey: ['messageReactions', messageId],
    queryFn: async () => {
      try {
        const response = await api.get(`/messages/${messageId}/reactions`)
        return response.data
      } catch (error) {
        console.error('Error fetching message reactions:', error)
        throw error
      }
    },
    enabled: !!messageId && isAuthenticated, // Only run when user is authenticated and messageId is provided
    staleTime: 30000, // 30 seconds
    refetchInterval,
    retry: (failureCount, error: any) => {
      // Don't retry on 401 errors
      if (error?.response?.status === 401) return false
      return failureCount < 3
    },
  })
}

// Hook for adding message reactions
export const useAddMessageReaction = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      const response = await api.post(`/messages/${messageId}/reactions`, { emoji })
      return response.data
    },
    onSuccess: (data, variables) => {
      // Invalidate reactions query for this message
      queryClient.invalidateQueries({ queryKey: ['messageReactions', variables.messageId] })
      
      // Also invalidate conversations to update reaction counts
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
    onError: (error) => {
      console.error('Failed to add reaction:', error)
    },
  })
}

// Hook for removing message reactions
export const useRemoveMessageReaction = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      const response = await api.delete(`/messages/${messageId}/reactions`, { 
        data: { emoji } 
      })
      return response.data
    },
    onSuccess: (data, variables) => {
      // Invalidate reactions query for this message
      queryClient.invalidateQueries({ queryKey: ['messageReactions', variables.messageId] })
      
      // Also invalidate conversations to update reaction counts
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
    onError: (error) => {
      console.error('Failed to remove reaction:', error)
    },
  })
}

// Hook for managing message input state
export const useMessageInput = () => {
  const [content, setContent] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent)
    
    // Handle typing indicator
    if (!isTyping && newContent.length > 0) {
      setIsTyping(true)
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
    }, 1000)
  }, [isTyping])

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file)
  }, [])

  const clearFile = useCallback(() => {
    setSelectedFile(null)
  }, [])

  const reset = useCallback(() => {
    setContent('')
    setSelectedFile(null)
    setIsTyping(false)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
  }, [])

  const canSend = content.trim().length > 0 || selectedFile !== null

  return {
    content,
    selectedFile,
    isTyping,
    canSend,
    handleContentChange,
    handleFileSelect,
    clearFile,
    reset,
  }
}
