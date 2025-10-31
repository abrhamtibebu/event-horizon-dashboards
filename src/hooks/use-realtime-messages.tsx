import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNotifications } from '../contexts/NotificationContext'
import { useAuth } from '../hooks/use-auth'
import { echo } from '../lib/echo'
import { showMessageNotification, requestNotificationPermission } from '../lib/notifications'
import { playMessageReceived, playMessageSent } from '../lib/sounds'
import { showMessageToast } from '../components/ui/ModernToast'
import { showNotificationToast } from '../lib/notification-toast-manager'

// Global callback for notification clicks
let notificationClickCallback: ((conversationId: string) => void) | null = null

export const setNotificationClickCallback = (callback: (conversationId: string) => void) => {
  notificationClickCallback = callback
}

export const useRealtimeMessages = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useNotifications()
  const { user } = useAuth()
  const isConnected = useRef(false)

  useEffect(() => {
    if (!user?.id || isConnected.current) return

    isConnected.current = true
    console.log(`Connecting to real-time messaging for user ${user.id}`)

    // Request notification permission on first connection
    requestNotificationPermission()

    // Listen for new messages on user's private channel
    const channel = echo.private(`user.${user.id}`)
    
    channel.listen('.message.sent', (data: any) => {
      console.log('Received real-time message:', data)
      
      // Update the relevant query cache
      const conversationId = data.conversation_id
      
      if (conversationId.startsWith('direct_')) {
        const userId = conversationId.replace('direct_', '')
        queryClient.invalidateQueries({ queryKey: ['directMessages', userId] })
      } else if (conversationId.startsWith('event_')) {
        const eventId = conversationId.replace('event_', '')
        queryClient.invalidateQueries({ queryKey: ['eventMessages', eventId] })
      }
      
      // Invalidate conversations list
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] })

      // Show notification if message is from another user
      if (data.message.sender_id !== user.id) {
        // Play sound for received message
        playMessageReceived()

        // Show browser notification
        showMessageNotification(
          data.message.sender.name,
          data.message.content,
          data.message.sender.profile_image,
          data.conversation_id,
          () => {
            // Handle notification click
            if (notificationClickCallback) {
              notificationClickCallback(data.conversation_id)
            }
            console.log('Notification clicked for conversation:', data.conversation_id)
          }
        )

        // Also show in-app notification
        addNotification({
          type: 'message',
          title: `New message from ${data.message.sender.name}`,
          message: data.message.content.length > 50 
            ? data.message.content.substring(0, 50) + '...' 
            : data.message.content,
          senderName: data.message.sender.name,
          senderAvatar: data.message.sender.profile_image,
          conversationId: data.conversation_id,
          onClick: () => {
            // Handle notification click
            if (notificationClickCallback) {
              notificationClickCallback(data.conversation_id)
            }
            console.log('Notification clicked for conversation:', data.conversation_id)
          }
        })

        // Show modern toast notification
        showMessageToast(
          data.message.sender.name,
          data.message.content,
          data.message.sender.profile_image,
          data.conversation_id,
          {
            label: 'View',
            onClick: () => {
              if (notificationClickCallback) {
                notificationClickCallback(data.conversation_id)
              }
            }
          }
        )

        // Show notification toast
        showNotificationToast(
          data.message.sender.name,
          data.message.content,
          data.conversation_id,
          data.message.sender.profile_image,
          () => {
            if (notificationClickCallback) {
              notificationClickCallback(data.conversation_id)
            }
          }
        )
      } else {
        // Play sound for sent message confirmation
        playMessageSent()
      }
    })

    // Listen for typing indicators
    channel.listen('.typing.started', (data: any) => {
      console.log('User started typing:', data)
      // TODO: Implement typing indicator UI
    })

    channel.listen('.typing.stopped', (data: any) => {
      console.log('User stopped typing:', data)
      // TODO: Implement typing indicator UI
    })

    // Listen for reaction updates
    channel.listen('.message.reaction.updated', (data: any) => {
      console.log('Received reaction update:', data)
      
      // Update the message in the relevant query cache
      const conversationId = data.conversation_id
      
      if (conversationId.startsWith('direct_')) {
        const userId = conversationId.replace('direct_', '')
        queryClient.invalidateQueries({ queryKey: ['directMessages', userId] })
      } else if (conversationId.startsWith('event_')) {
        const eventId = conversationId.replace('event_', '')
        queryClient.invalidateQueries({ queryKey: ['eventMessages', eventId] })
      }
      
      // Also invalidate conversations list to update reaction counts
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    })

    return () => {
      isConnected.current = false
      console.log('Disconnecting from real-time messaging')
      channel.stopListening('.message.sent')
      channel.stopListening('.typing.started')
      channel.stopListening('.typing.stopped')
      channel.stopListening('.message.reaction.updated')
    }
  }, [user?.id, queryClient, addNotification])

  // Function to broadcast typing indicator
  const broadcastTyping = (conversationId: string, isTyping: boolean) => {
    if (!user?.id) return
    
    const event = isTyping ? 'typing.started' : 'typing.stopped'
    const channel = echo.private(`user.${user.id}`)
    
    channel.whisper(event, {
      user_id: user.id,
      conversation_id: conversationId,
      timestamp: new Date().toISOString()
    })
  }

  return { broadcastTyping }
}
