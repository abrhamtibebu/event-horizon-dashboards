// Global notification toast manager
import { NotificationToast } from '../components/messaging/NotificationToast'

interface ToastNotification {
  id: string
  senderName: string
  message: string
  senderAvatar?: string
  conversationId: string
  onView?: () => void
}

class NotificationToastManager {
  private toasts: ToastNotification[] = []
  private listeners: Array<(toasts: ToastNotification[]) => void> = []

  addToast(toast: Omit<ToastNotification, 'id'>) {
    const id = `toast-${Date.now()}-${Math.random()}`
    const newToast = { ...toast, id }
    
    this.toasts.push(newToast)
    this.notifyListeners()
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      this.removeToast(id)
    }, 5000)
  }

  removeToast(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id)
    this.notifyListeners()
  }

  clearAll() {
    this.toasts = []
    this.notifyListeners()
  }

  subscribe(listener: (toasts: ToastNotification[]) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.toasts]))
  }

  getToasts() {
    return [...this.toasts]
  }
}

export const notificationToastManager = new NotificationToastManager()

// Convenience functions
export const showNotificationToast = (
  senderName: string,
  message: string,
  conversationId: string,
  senderAvatar?: string,
  onView?: () => void
) => {
  notificationToastManager.addToast({
    senderName,
    message,
    conversationId,
    senderAvatar,
    onView
  })
}

export const clearNotificationToasts = () => {
  notificationToastManager.clearAll()
}
