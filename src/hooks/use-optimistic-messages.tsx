import { useState, useCallback, useRef } from 'react'
import type { Message } from '../types/message'

interface OptimisticMessage extends Message {
  id: string // Temporary ID for optimistic messages
  isOptimistic: boolean
  status: 'sending' | 'sent' | 'failed'
  tempId: string
}

interface UseOptimisticMessagesProps {
  onAddMessage: (message: Message) => void
  onUpdateMessage: (messageId: number, updates: Partial<Message>) => void
  onRemoveMessage: (messageId: number) => void
}

export const useOptimisticMessages = ({
  onAddMessage,
  onUpdateMessage,
  onRemoveMessage,
}: UseOptimisticMessagesProps) => {
  const [optimisticMessages, setOptimisticMessages] = useState<OptimisticMessage[]>([])
  const tempIdCounter = useRef(0)

  // Generate a temporary ID for optimistic messages
  const generateTempId = useCallback(() => {
    return `temp_${++tempIdCounter.current}_${Date.now()}`
  }, [])

  // Add an optimistic message
  const addOptimisticMessage = useCallback((
    content: string,
    senderId: number,
    recipientId: number,
    eventId?: number,
    file?: File,
    parentMessageId?: number
  ): OptimisticMessage => {
    const tempId = generateTempId()
    const objectUrl = file ? URL.createObjectURL(file) : undefined
    const optimisticMessage: OptimisticMessage = {
      id: tempId,
      tempId,
      content,
      sender_id: senderId,
      recipient_id: recipientId,
      event_id: eventId,
      parent_message_id: parentMessageId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sender: {
        id: senderId,
        name: 'You', // This should come from auth context
        email: '',
        profile_image: undefined,
        role: 'user',
        created_at: '',
        updated_at: '',
      },
      recipient: {
        id: recipientId,
        name: 'Recipient', // This should come from user data
        email: '',
        profile_image: undefined,
        role: 'user',
        created_at: '',
        updated_at: '',
      },
      isOptimistic: true,
      status: 'sending',
      // File handling
      file_path: objectUrl,
      file_url: objectUrl,
      file_name: file?.name,
      file_type: file?.type,
      file_size: file?.size,
    }

    setOptimisticMessages(prev => [...prev, optimisticMessage])
    return optimisticMessage
  }, [generateTempId])

  // Confirm an optimistic message (replace with real message from server)
  const confirmMessage = useCallback((tempId: string, realMessage: Message) => {
    setOptimisticMessages(prev => {
      const messageIndex = prev.findIndex(msg => msg.tempId === tempId)
      if (messageIndex === -1) return prev

      // Remove the optimistic message
      const newOptimisticMessages = prev.filter(msg => msg.tempId !== tempId)
      
      // Add the real message
      onAddMessage(realMessage)
      
      return newOptimisticMessages
    })
  }, [onAddMessage])

  // Mark an optimistic message as failed
  const failMessage = useCallback((tempId: string, error?: string) => {
    setOptimisticMessages(prev => 
      prev.map(msg => 
        msg.tempId === tempId 
          ? { ...msg, status: 'failed' as const }
          : msg
      )
    )
  }, [])

  // Retry a failed message
  const retryMessage = useCallback((tempId: string) => {
    setOptimisticMessages(prev => 
      prev.map(msg => 
        msg.tempId === tempId 
          ? { ...msg, status: 'sending' as const }
          : msg
      )
    )
  }, [])

  // Remove an optimistic message
  const removeOptimisticMessage = useCallback((tempId: string) => {
    setOptimisticMessages(prev => prev.filter(msg => msg.tempId !== tempId))
  }, [])

  // Clear all optimistic messages
  const clearOptimisticMessages = useCallback(() => {
    setOptimisticMessages([])
  }, [])

  return {
    optimisticMessages,
    addOptimisticMessage,
    confirmMessage,
    failMessage,
    retryMessage,
    removeOptimisticMessage,
    clearOptimisticMessages,
  }
}