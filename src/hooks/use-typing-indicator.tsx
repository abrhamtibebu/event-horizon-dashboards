import { useState, useEffect, useCallback } from 'react'

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

export const useTypingIndicator = (
  conversationId: string | null,
  currentUserId: number
): TypingIndicatorHook => {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)

  // Listen for typing events
  useEffect(() => {
    if (!conversationId) return

    // For now, we'll implement a simple mock version
    // In production, this would use Laravel Echo
    console.log('Typing indicator initialized for conversation:', conversationId)
  }, [conversationId, currentUserId])

  // Auto-cleanup typing users after 3 seconds
  useEffect(() => {
    if (typingUsers.length > 0) {
      const timeout = setTimeout(() => {
        setTypingUsers([])
      }, 3000)

      return () => clearTimeout(timeout)
    }
  }, [typingUsers])

  const startTyping = useCallback(() => {
    if (!conversationId || isTyping) return

    setIsTyping(true)
    
    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout)
    }

    // Set new timeout to stop typing
    const timeout = setTimeout(() => {
      stopTyping()
    }, 2000)

    setTypingTimeout(timeout)
  }, [conversationId, currentUserId, isTyping, typingTimeout])

  const stopTyping = useCallback(() => {
    if (!conversationId || !isTyping) return

    setIsTyping(false)

    // Clear timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout)
      setTypingTimeout(null)
    }
  }, [conversationId, currentUserId, isTyping, typingTimeout])

  return {
    typingUsers,
    isTyping,
    startTyping,
    stopTyping
  }
}