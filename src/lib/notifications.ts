import { showInfoToast } from '@/components/ui/ModernToast'

export interface NotificationOptions {
  title: string
  body?: string
  icon?: string
  badge?: string
  tag?: string
  data?: any
  requireInteraction?: boolean
  silent?: boolean
  timestamp?: number
  actions?: NotificationAction[]
  onClick?: () => void
}

export interface NotificationAction {
  action: string
  title: string
  icon?: string
}

class NotificationManager {
  private permission: NotificationPermission = 'default'
  private isSupported: boolean = false

  constructor() {
    this.isSupported = 'Notification' in window
    this.permission = this.isSupported ? Notification.permission : 'denied'
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      console.warn('Notifications are not supported in this browser')
      return 'denied'
    }

    if (this.permission === 'default') {
      this.permission = await Notification.requestPermission()
    }

    return this.permission
  }

  async showNotification(options: NotificationOptions): Promise<Notification | null> {
    if (!this.isSupported || this.permission !== 'granted') {
      // Fallback to toast notification
      this.showToastFallback(options)
      return null
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        badge: options.badge || '/favicon.ico',
        tag: options.tag,
        data: options.data,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        timestamp: options.timestamp || Date.now(),
        actions: options.actions,
      })

      if (options.onClick) {
        notification.onclick = () => {
          options.onClick?.()
          notification.close()
        }
      }

      // Auto-close after 5 seconds unless requireInteraction is true
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close()
        }, 5000)
      }

      return notification
    } catch (error) {
      console.error('Failed to show notification:', error)
      this.showToastFallback(options)
      return null
    }
  }

  private showToastFallback(options: NotificationOptions) {
    showInfoToast(
      options.title,
      options.body,
      options.onClick ? {
        label: 'View',
        onClick: options.onClick,
      } : undefined
    )
  }

  async showMessageNotification(
    senderName: string,
    message: string,
    senderAvatar?: string,
    conversationId?: string,
    onClick?: () => void
  ): Promise<Notification | null> {
    return this.showNotification({
      title: `New message from ${senderName}`,
      body: message.length > 100 ? message.substring(0, 100) + '...' : message,
      icon: senderAvatar || '/favicon.ico',
      tag: `message-${conversationId}`,
      data: { conversationId, senderName },
      requireInteraction: false,
      onClick,
    })
  }

  async showSystemNotification(
    title: string,
    body?: string,
    onClick?: () => void
  ): Promise<Notification | null> {
    return this.showNotification({
      title,
      body,
      icon: '/favicon.ico',
      tag: 'system',
      requireInteraction: false,
      onClick,
    })
  }

  isPermissionGranted(): boolean {
    return this.permission === 'granted'
  }

  isPermissionDenied(): boolean {
    return this.permission === 'denied'
  }

  canRequestPermission(): boolean {
    return this.permission === 'default'
  }
}

// Create singleton instance
export const notificationManager = new NotificationManager()

// Export convenience functions
export const requestNotificationPermission = () => notificationManager.requestPermission()
export const showNotification = (options: NotificationOptions) => notificationManager.showNotification(options)
export const showMessageNotification = (
  senderName: string,
  message: string,
  senderAvatar?: string,
  conversationId?: string,
  onClick?: () => void
) => notificationManager.showMessageNotification(senderName, message, senderAvatar, conversationId, onClick)
export const showSystemNotification = (title: string, body?: string, onClick?: () => void) => 
  notificationManager.showSystemNotification(title, body, onClick)
export const isNotificationPermissionGranted = () => notificationManager.isPermissionGranted()
export const isNotificationPermissionDenied = () => notificationManager.isPermissionDenied()
export const canRequestNotificationPermission = () => notificationManager.canRequestPermission()




