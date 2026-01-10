import { useState, useEffect, useCallback, useRef } from 'react'
import { echo } from '../lib/echo'
import { api } from '../lib/api'
import { useAuth } from './use-auth'
import type { Message, Conversation } from '../types/message'

interface UseWebSocketMessagesOptions {
  conversationId: string | null
}

interface UseWebSocketMessagesReturn {
  messages: Message[]
  conversations: Conversation[]
  isLoading: boolean
  sendMessage: (content: string, recipientId?: number, eventId?: number) => Promise<void>
  markAsRead: (conversationId: string) => Promise<void>
}

// Global state for messages and conversations
const messageStore = new Map<string, Message[]>()
const conversationStore = new Map<string, Conversation>()
let globalListeners: Set<() => void> = new Set()

const notifyListeners = () => {
  globalListeners.forEach(listener => listener())
}

export const useWebSocketMessages = ({
  conversationId,
}: UseWebSocketMessagesOptions): UseWebSocketMessagesReturn => {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const isInitialized = useRef(false)
  const channelRef = useRef<any>(null)

  // Get current state from store
  const [messages, setMessages] = useState<Message[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])

  // Load messages for a conversation
  const loadMessagesForConversation = useCallback(async (convId: string): Promise<Message[]> => {
    try {
      if (convId.startsWith('direct_')) {
        const userId = convId.replace('direct_', '')
        const response = await api.get(`/messages/direct/${userId}`, {
          params: { per_page: 100 },
        })
        const messages = Array.isArray(response.data.data) ? response.data.data : []
        // Sort by created_at ascending
        return messages.sort((a: Message, b: Message) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      } else if (convId.startsWith('event_')) {
        const eventId = convId.replace('event_', '')
        const response = await api.get(`/events/${eventId}/messages`, {
          params: { per_page: 100 },
        })
        const messages = Array.isArray(response.data.data) ? response.data.data : []
        // Sort by created_at ascending
        return messages.sort((a: Message, b: Message) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      }
      return []
    } catch (error) {
      console.error('Error loading messages:', error)
      return []
    }
  }, [])

  // Update local state when store changes
  useEffect(() => {
    const updateState = () => {
      if (conversationId) {
        setMessages(messageStore.get(conversationId) || [])
      }
      // Get all conversations from store
      setConversations(Array.from(conversationStore.values()))
    }

    globalListeners.add(updateState)
    updateState()

    return () => {
      globalListeners.delete(updateState)
    }
  }, [conversationId])

  // Initialize WebSocket connection and load initial data
  useEffect(() => {
    if (!user?.id || isInitialized.current) return

    isInitialized.current = true
    setIsLoading(true)

    // Load initial conversations
    const loadInitialData = async () => {
      try {
        // Load conversations list
        const convResponse = await api.get('/messages/conversations')
        const convs = Array.isArray(convResponse.data) 
          ? convResponse.data 
          : Array.isArray(convResponse.data?.data) 
            ? convResponse.data.data 
            : []

        // Store conversations
        convs.forEach((conv: Conversation) => {
          conversationStore.set(conv.id, conv)
        })

        // Load messages for current conversation if selected
        if (conversationId) {
          const messages = await loadMessagesForConversation(conversationId)
          messageStore.set(conversationId, messages)
        }

        notifyListeners()
        setIsLoading(false)
      } catch (error) {
        console.error('Error loading initial data:', error)
        setIsLoading(false)
      }
    }

    loadInitialData()

    // Set up WebSocket listeners
    const channel = echo.private(`user.${user.id}`)
    channelRef.current = channel

    // Listen for new messages
    channel.listen('.message.sent', (data: any) => {
      const message: Message = data.message
      const convId = data.conversation_id

      // Add message to store (avoid duplicates)
      const existingMessages = messageStore.get(convId) || []
      const messageExists = existingMessages.some(m => m.id === message.id)
      
      if (!messageExists) {
        const updatedMessages = [...existingMessages, message]
        // Sort by created_at ascending
        updatedMessages.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
        messageStore.set(convId, updatedMessages)

        // Update conversation
        const conv = conversationStore.get(convId)
        if (conv) {
          conversationStore.set(convId, {
            ...conv,
            lastMessage: message,
            unreadCount: message.sender_id !== user.id ? (conv.unreadCount || 0) + 1 : conv.unreadCount,
          })
        } else {
          // If conversation doesn't exist, create it
          // This will be populated when conversations are loaded
        }

        notifyListeners()
      }
    })

    // Listen for read receipts
    channel.listen('.message.read', (data: any) => {
      const convId = data.conversation_id
      const conv = conversationStore.get(convId)
      if (conv) {
        conversationStore.set(convId, {
          ...conv,
          unreadCount: 0,
        })
        notifyListeners()
      }
    })

    return () => {
      if (channelRef.current) {
        channelRef.current.stopListening('.message.sent')
        channelRef.current.stopListening('.message.read')
      }
    }
  }, [user?.id, conversationId, loadMessagesForConversation])

  // Load messages when conversation changes
  useEffect(() => {
    if (!conversationId) {
      setMessages([])
      return
    }

    const existingMessages = messageStore.get(conversationId)
    if (existingMessages && existingMessages.length > 0) {
      setMessages(existingMessages)
      return
    }

    // Load messages if not in store
    setIsLoading(true)
    loadMessagesForConversation(conversationId).then(loadedMessages => {
      messageStore.set(conversationId, loadedMessages)
      notifyListeners()
      setIsLoading(false)
    })
  }, [conversationId, loadMessagesForConversation])

  // Send message
  const sendMessage = useCallback(async (
    content: string,
    recipientId?: number,
    eventId?: number
  ) => {
    if (!user?.id) return

    try {
      if (eventId) {
        await api.post(`/events/${eventId}/messages`, { content })
      } else if (recipientId) {
        await api.post('/messages/direct', {
          recipient_id: recipientId,
          content,
        })
      }
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }, [user?.id])

  // Mark conversation as read
  const markAsRead = useCallback(async (convId: string) => {
    try {
      if (convId.startsWith('direct_')) {
        const userId = convId.replace('direct_', '')
        await api.post(`/messages/direct/${userId}/read`)
      } else if (convId.startsWith('event_')) {
        const eventId = convId.replace('event_', '')
        await api.post(`/events/${eventId}/messages/read`)
      }

      // Update local state
      const conv = conversationStore.get(convId)
      if (conv) {
        conversationStore.set(convId, {
          ...conv,
          unreadCount: 0,
        })
        notifyListeners()
      }
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }, [])

  return {
    messages,
    conversations,
    isLoading,
    sendMessage,
    markAsRead,
  }
}

