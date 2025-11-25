import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../lib/api'
import { echo } from '../lib/echo'

interface TypingIndicatorOptions {
  conversationId: string | null
  currentUserId: number | null | undefined
}

interface TypingUser {
  id: number
  name: string
  avatar?: string
}

interface TypingIndicatorHook {
  typingUsers: TypingUser[]
  isTyping: boolean
  startTyping: () => void
  stopTyping: () => void
}

export const useTypingIndicator = ({
  conversationId,
  currentUserId,
}: TypingIndicatorOptions): TypingIndicatorHook => {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const typingTimersRef = useRef<Record<number, NodeJS.Timeout>>({})
  const lastStateRef = useRef<'idle' | 'typing'>('idle')

  const removeTypingUser = useCallback((userId: number) => {
    setTypingUsers(prev => prev.filter(user => user.id !== userId))
    if (typingTimersRef.current[userId]) {
      clearTimeout(typingTimersRef.current[userId])
      delete typingTimersRef.current[userId]
    }
  }, [])

  const sendTypingStatus = useCallback(async (isTypingStatus: boolean) => {
    if (!conversationId) return

    try {
      await api.post('/messages/typing', {
        conversation_id: conversationId,
        is_typing: isTypingStatus,
      })
    } catch (error) {
      console.warn('Failed to broadcast typing status', error)
    }
  }, [conversationId])

  const stopTyping = useCallback(() => {
    if (!conversationId || !currentUserId) return

    setIsTyping(false)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }

    if (lastStateRef.current === 'typing') {
      sendTypingStatus(false)
      lastStateRef.current = 'idle'
    }
  }, [conversationId, currentUserId, sendTypingStatus])

  const startTyping = useCallback(() => {
    if (!conversationId || !currentUserId) return

    setIsTyping(true)

    if (lastStateRef.current !== 'typing') {
      sendTypingStatus(true)
      lastStateRef.current = 'typing'
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping()
    }, 2000)
  }, [conversationId, currentUserId, sendTypingStatus, stopTyping])

  useEffect(() => {
    if (!currentUserId) return

    const channel = echo.private(`user.${currentUserId}`)

    const handler = (data: any) => {
      if (!conversationId || data.conversation_id !== conversationId) return
      if (data.user_id === currentUserId) return

      if (data.is_typing) {
        setTypingUsers(prev => {
          if (prev.some(user => user.id === data.user_id)) {
            return prev
          }
          return [
            ...prev,
            {
              id: data.user_id,
              name: data.user_name || 'Typing...',
              avatar: data.user_avatar || undefined,
            },
          ]
        })

        if (typingTimersRef.current[data.user_id]) {
          clearTimeout(typingTimersRef.current[data.user_id])
        }

        typingTimersRef.current[data.user_id] = setTimeout(() => {
          removeTypingUser(data.user_id)
        }, 4000)
      } else {
        removeTypingUser(data.user_id)
      }
    }

    channel.listen('.typing.updated', handler)

    return () => {
      channel.stopListening('.typing.updated', handler)
      Object.values(typingTimersRef.current).forEach(timeout => clearTimeout(timeout))
      typingTimersRef.current = {}
      setTypingUsers([])
    }
  }, [conversationId, currentUserId, removeTypingUser])

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      lastStateRef.current = 'idle'
    }
  }, [])

  return {
    typingUsers,
    isTyping,
    startTyping,
    stopTyping,
  }
}

