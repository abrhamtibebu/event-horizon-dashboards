import React, { useState, useEffect } from 'react'
import { MessageCircle, X, Volume2, VolumeX } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { isSoundEnabled } from '../../lib/sounds'

interface NotificationToastProps {
  senderName: string
  message: string
  senderAvatar?: string
  conversationId: string
  onView?: () => void
  onDismiss?: () => void
  autoHide?: boolean
  duration?: number
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  senderName,
  message,
  senderAvatar,
  conversationId,
  onView,
  onDismiss,
  autoHide = true,
  duration = 5000
}) => {
  const [isVisible, setIsVisible] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        handleDismiss()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [autoHide, duration])

  const handleDismiss = () => {
    setIsAnimating(true)
    setTimeout(() => {
      setIsVisible(false)
      onDismiss?.()
    }, 300)
  }

  const handleView = () => {
    onView?.()
    handleDismiss()
  }

  if (!isVisible) return null

  return (
    <div 
      className={`
        fixed top-4 right-4 z-50 max-w-sm w-full
        transform transition-all duration-300 ease-in-out
        ${isAnimating ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
    >
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">New Message</h4>
              <p className="text-xs text-gray-500">from {senderName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {isSoundEnabled() ? (
              <Volume2 className="w-3 h-3 text-green-600" />
            ) : (
              <VolumeX className="w-3 h-3 text-gray-400" />
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="p-1 h-auto"
            >
              <X className="w-3 h-3 text-gray-400" />
            </Button>
          </div>
        </div>

        {/* Message Preview */}
        <div className="mb-3">
          <p className="text-sm text-gray-700 line-clamp-2">
            {message.length > 100 ? `${message.substring(0, 100)}...` : message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {isSoundEnabled() ? '🔊 Sound On' : '🔇 Sound Off'}
          </Badge>
          <Button
            size="sm"
            onClick={handleView}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            View Message
          </Button>
        </div>
      </div>
    </div>
  )
}

// Hook for managing notification toasts
export const useNotificationToast = () => {
  const [toasts, setToasts] = useState<Array<{
    id: string
    props: Omit<NotificationToastProps, 'onDismiss'>
  }>>([])

  const showToast = (props: Omit<NotificationToastProps, 'onDismiss'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`
    setToasts(prev => [...prev, { id, props }])
  }

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const dismissAll = () => {
    setToasts([])
  }

  return {
    toasts,
    showToast,
    dismissToast,
    dismissAll
  }
}
