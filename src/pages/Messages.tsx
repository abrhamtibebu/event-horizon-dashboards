import React, { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircle, Search, Settings, Bell, Menu, MoreVertical, Archive, Star, Info, ChevronRight } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu'
import { ConversationList } from '../components/messaging/ConversationList'
import { MessageThread } from '../components/messaging/MessageThread'
import { MessageInput } from '../components/messaging/MessageInput'
import { ConversationInfoPanel } from '../components/messaging/ConversationInfoPanel'
import { MessageThreadPanel } from '../components/messaging/MessageThreadPanel'
import { NewMessageDialog } from '../components/messaging/NewMessageDialog'
import { GlobalSearchDialog } from '../components/messaging/GlobalSearchDialog'
import { ConversationSearch } from '../components/messaging/ConversationSearch'
import { NotificationSettings } from '../components/messaging/NotificationSettings'
import { NotificationToast } from '../components/messaging/NotificationToast'
import { notificationToastManager } from '../lib/notification-toast-manager'
import { useConversations, useUnreadCount, useMarkConversationRead } from '../hooks/use-messages'
import { useMessageReplies, useSendReply } from '../hooks/use-message-threads'
import { useAuth } from '../hooks/use-auth'
import { useRealtimeMessages, setNotificationClickCallback } from '../hooks/use-realtime-messages'
import { useSingleUserOnlineStatus } from '../hooks/use-online-status'
import { useLocation, useSearchParams } from 'react-router-dom'
import type { Conversation, Message, User, Event } from '../types/message'

export default function Messages() {
  // Force refresh - Fixed variable initialization issue
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isNewMessageDialogOpen, setIsNewMessageDialogOpen] = useState(false)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [threadMessage, setThreadMessage] = useState<Message | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [optimisticMessages, setOptimisticMessages] = useState<any[]>([])
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false)
  const [isConversationSearchOpen, setIsConversationSearchOpen] = useState(false)
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState(false)
  const [notificationToasts, setNotificationToasts] = useState<any[]>([])
  const [showInfoPanel, setShowInfoPanel] = useState(false)
  const hasMarkedAsRead = useRef<string | null>(null)

  const { data: conversationsData = [] } = useConversations()
  const { data: unreadData } = useUnreadCount()
  const markConversationReadMutation = useMarkConversationRead()
  const { user } = useAuth()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  
  // Get online status for the currently selected user (for direct messages)
  const otherUserId = selectedUser?.id || null
  const { data: onlineStatus } = useSingleUserOnlineStatus(otherUserId)
  
  // Initialize real-time messaging for notifications (disabled for now, using polling instead)
  // useRealtimeMessages()

  // Subscribe to notification toasts
  useEffect(() => {
    const unsubscribe = notificationToastManager.subscribe(setNotificationToasts)
    return unsubscribe
  }, [])

  // Handle different data structures from API - Fixed variable initialization
  const conversations = Array.isArray(conversationsData) 
    ? conversationsData 
    : Array.isArray(conversationsData?.data) 
      ? conversationsData.data 
      : []

  const unreadCount = unreadData?.unread_count || 0

  // Set up notification click handler
  useEffect(() => {
    setNotificationClickCallback((conversationId: string) => {
      setSelectedConversationId(conversationId)
      // Hide sidebar on mobile when opening conversation
      if (window.innerWidth < 768) {
        setShowSidebar(false)
      }
    })
  }, [])

  // Reset read marker when conversations change
  useEffect(() => {
    hasMarkedAsRead.current = null
  }, [conversations])

  // Handle conversation selection from navigation state (e.g., from popup)
  useEffect(() => {
    if (location.state?.selectedConversationId) {
      setSelectedConversationId(location.state.selectedConversationId)
      // Clear the state to prevent re-selection on refresh
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  // Handle URL query parameters for event/user conversations
  useEffect(() => {
    const conversationId = searchParams.get('conversationId')
    const eventId = searchParams.get('eventId')
    const userId = searchParams.get('userId')

    if (conversationId) {
      setSelectedConversationId(conversationId)
      
      // Find the conversation to get user/event info
      const conversation = conversations.find((c: Conversation) => c.id === conversationId)
      if (conversation) {
        if (conversation.type === 'direct' && conversation.participants?.length > 0) {
          setSelectedUser(conversation.participants[0])
          setSelectedEvent(null)
        } else if (conversation.type === 'event' && conversation.event) {
          setSelectedEvent(conversation.event)
          setSelectedUser(null)
        }
      } else if (eventId) {
        // If conversation doesn't exist yet, try to select by eventId
        const eventConversation = conversations.find((c: Conversation) => c.id === `event_${eventId}`)
        if (eventConversation) {
          setSelectedConversationId(`event_${eventId}`)
          if (eventConversation.event) {
            setSelectedEvent(eventConversation.event)
            setSelectedUser(null)
          }
        } else {
          // Create event object from eventId for new conversation
          setSelectedConversationId(`event_${eventId}`)
          setSelectedEvent({ id: Number(eventId) } as Event)
          setSelectedUser(null)
        }
      } else if (userId) {
        // If conversation doesn't exist yet, try to select by userId
        const directConversation = conversations.find((c: Conversation) => c.id === `direct_${userId}`)
        if (directConversation && directConversation.participants?.length > 0) {
          setSelectedConversationId(`direct_${userId}`)
          setSelectedUser(directConversation.participants[0])
          setSelectedEvent(null)
        } else {
          // For new direct conversation, we need to fetch user details
          setSelectedConversationId(`direct_${userId}`)
          // User will be loaded when conversation is created or fetched
        }
      }
    }
  }, [searchParams, conversations])

  // Handle mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setShowSidebar(!selectedConversationId)
      } else {
        setShowSidebar(true)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [selectedConversationId])

  // Mark conversation as read when selected (with debounce to prevent infinite loops)
  useEffect(() => {
    if (selectedConversationId && conversations.length > 0 && hasMarkedAsRead.current !== selectedConversationId) {
      const conversation = conversations.find((c: Conversation) => c.id === selectedConversationId)
      if (conversation) {
        const readData: any = {}
        if (selectedConversationId.startsWith('direct_') && conversation.participants?.[0]) {
          readData.other_user_id = conversation.participants[0].id
        } else if (selectedConversationId.startsWith('event_') && conversation.event) {
          readData.event_id = conversation.event.id
        }
        
        if (Object.keys(readData).length > 0) {
          hasMarkedAsRead.current = selectedConversationId
          // Use a longer timeout to prevent rapid calls and potential infinite loops
          const timeoutId = setTimeout(() => {
            markConversationReadMutation.mutate(readData)
          }, 500)
          
          return () => clearTimeout(timeoutId)
        }
      }
    }
  }, [selectedConversationId, conversations]) // Only depend on conversationId and conversations

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId)
    
    // Find the conversation to get user/event info
    const conversation = conversations.find((c: Conversation) => c.id === conversationId)
    if (conversation) {
      if (conversation.type === 'direct') {
        setSelectedUser(conversation.participants[0])
        setSelectedEvent(null)
      } else if (conversation.type === 'event') {
        setSelectedEvent(conversation.event)
        setSelectedUser(null)
      }
    }
    
    // Close thread panel when switching conversations
    setThreadMessage(null)
  }

  // Fetch thread replies when thread is opened
  const { data: threadReplies = [], isLoading: isLoadingThreadReplies } = useMessageReplies(
    threadMessage?.id || null
  )
  const sendReplyMutation = useSendReply()

  // Handle opening a message thread
  const handleOpenThread = useCallback((message: Message) => {
    setThreadMessage(message)
    setShowInfoPanel(false) // Close info panel when opening thread
  }, [])

  // Handle sending a reply to a thread
  const handleSendReply = useCallback(async (content: string, parentId: number) => {
    const selectedConv = conversations.find((c: Conversation) => c.id === selectedConversationId)
    if (!selectedConv || !user) return

    const isEvent = selectedConv.type === 'event'
    const eventId = isEvent ? parseInt(selectedConv.id.replace('event_', '')) : undefined
    const recipientId = isEvent ? undefined : selectedConv.participants[0]?.id

    await sendReplyMutation.mutateAsync({
      parentMessageId: parentId,
      content,
      eventId,
      recipientId,
    })
  }, [conversations, selectedConversationId, user, sendReplyMutation])

  const handleStartNewConversation = () => {
    setIsNewMessageDialogOpen(true)
  }

  const handleSelectUser = (user: User) => {
    setSelectedUser(user)
    setSelectedEvent(null)
    setSelectedConversationId(`direct_${user.id}`)
  }

  const handleSelectEvent = (event: Event) => {
    setSelectedEvent(event)
    setSelectedUser(null)
    setSelectedConversationId(`event_${event.id}`)
  }

  const handleMessageSent = (message: Message) => {
    // Clear optimistic messages for this conversation
    setOptimisticMessages(prev => 
      prev.filter(msg => 
        !(msg.conversationId === selectedConversationId && msg.isOptimistic)
      )
    )
    console.log('Message sent:', message)
  }

  const handleOptimisticMessage = (message: any) => {
    console.log('Received optimistic message in Messages page:', message)
    // The MessageThread will handle optimistic messages internally
    // This is just for logging/debugging purposes
  }

  const handleGlobalSearchMessageClick = (message: Message) => {
    // Navigate to the conversation containing this message
    if (message.event_id) {
      setSelectedConversationId(`event_${message.event_id}`)
      const conversation = conversations.find((c: Conversation) => c.id === `event_${message.event_id}`)
      if (conversation) {
        setSelectedEvent(conversation.event)
        setSelectedUser(null)
      }
    } else {
      // For direct messages, determine the other user
      const otherUserId = message.sender_id === user?.id ? message.recipient_id : message.sender_id
      setSelectedConversationId(`direct_${otherUserId}`)
      const conversation = conversations.find((c: Conversation) => c.id === `direct_${otherUserId}`)
      if (conversation) {
        setSelectedUser(conversation.participants[0])
        setSelectedEvent(null)
      }
    }
  }

  const handleGlobalSearchConversationClick = (conversationId: string) => {
    setSelectedConversationId(conversationId)
    
    // Find the conversation to get user/event info
    const conversation = conversations.find((c: Conversation) => c.id === conversationId)
    if (conversation) {
      if (conversation.type === 'direct') {
        setSelectedUser(conversation.participants[0])
        setSelectedEvent(null)
      } else if (conversation.type === 'event') {
        setSelectedEvent(conversation.event)
        setSelectedUser(null)
      }
    }
  }

  const handleConversationSearchMessageClick = (message: Message) => {
    // Scroll to the message in the current conversation
    // This would require implementing message scrolling functionality
    console.log('Navigate to message:', message.id)
  }

  const handleReply = (message: Message) => {
    setReplyingTo(message)
  }

  const handleCancelReply = () => {
    setReplyingTo(null)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setShowSearchResults(query.length > 0)
  }

  const getConversationTitle = () => {
    if (selectedUser) {
      return selectedUser.name
    }
    if (selectedEvent) {
      return selectedEvent.title
    }
    return 'Select a conversation'
  }

  const getConversationSubtitle = () => {
    if (selectedUser) {
      return selectedUser.email
    }
    if (selectedEvent) {
      return `Event chat for ${selectedEvent.title}`
    }
    return ''
  }

  const getConversationAvatar = () => {
    if (selectedUser) {
      return selectedUser.profile_image
    }
    if (selectedEvent) {
      return selectedEvent.image_url
    }
    return null
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleBackToConversations = () => {
    setSelectedConversationId(null)
    setSelectedUser(null)
    setSelectedEvent(null)
    setShowSidebar(true)
    hasMarkedAsRead.current = null // Reset the read marker
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Corporate Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Breadcrumb and Title */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center text-sm text-slate-500">
                <span className="hover:text-slate-700 cursor-pointer transition-colors">Dashboard</span>
                <ChevronRight className="w-4 h-4 mx-1" />
                <span className="text-slate-900 font-semibold">Messages</span>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Badge className="bg-blue-500 text-white px-2.5 py-1 text-xs font-semibold">
                  {unreadCount} Unread
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsGlobalSearchOpen(true)}
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                title="Search all messages (Ctrl+K)"
              >
                <Search className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsNotificationSettingsOpen(true)}
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                title="Notification settings"
              >
                <Settings className="w-5 h-5" />
              </Button>
              <Button
                onClick={handleStartNewConversation}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm"
                size="sm"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                New Message
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
      {/* Left Column - Conversations Sidebar */}
        <div className={`${showSidebar ? 'flex' : 'hidden'} md:flex flex-col w-80 lg:w-96 bg-white border-r border-slate-200 shadow-sm`}>
        <ConversationList
          selectedConversationId={selectedConversationId}
          onSelectConversation={handleSelectConversation}
          onStartNewConversation={handleStartNewConversation}
          onOpenSettings={() => setIsNotificationSettingsOpen(true)}
        />
      </div>

        {/* Middle Column - Chat Area */}
        <div className="flex-1 flex flex-col bg-white relative">
        {selectedConversationId ? (
          <>
            {/* Slack-style Clean Header */}
            <div className="bg-white border-b border-gray-200">
              <div className="px-6 py-3 flex items-center justify-between">
                {/* Left: Avatar and Title */}
                <div className="flex items-center space-x-3">
                  {/* Mobile back button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToConversations}
                    className="md:hidden p-2 hover:bg-gray-100"
                  >
                    <Menu className="w-5 h-5 text-gray-600" />
                  </Button>
                  
                  {/* Avatar */}
                  <div className="relative">
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={getConversationAvatar()} />
                      <AvatarFallback className="bg-gray-200 text-gray-700 text-sm font-medium">
                        {getInitials(getConversationTitle())}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  {/* Title */}
                  <h1 className="text-base font-bold text-gray-900 truncate">
                    {getConversationTitle()}
                  </h1>
                </div>
                
                {/* Right: Action Icons */}
                <div className="flex items-center space-x-1">
                  {/* Search icon */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsConversationSearchOpen(!isConversationSearchOpen)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                    title="Search in conversation"
                  >
                    <Search className="w-5 h-5 text-gray-600" />
                  </Button>

                  {/* Info icon */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowInfoPanel(!showInfoPanel)}
                    className={`p-2 hover:bg-gray-100 rounded-full ${showInfoPanel ? 'bg-gray-100' : ''}`}
                    title="Conversation info"
                  >
                    <Info className="w-5 h-5 text-gray-600" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Message Thread Container - Scrollable area above fixed input */}
            <div className="flex-1 overflow-hidden bg-[#FAFAFA] relative min-h-0">
              {/* Conversation Search */}
              {isConversationSearchOpen && selectedConversationId && (
                <ConversationSearch
                  conversationId={selectedConversationId}
                  conversationName={getConversationTitle()}
                  onMessageClick={handleConversationSearchMessageClick}
                  onClose={() => setIsConversationSearchOpen(false)}
                />
              )}

              <MessageThread
                conversationId={selectedConversationId}
                currentUserId={user?.id || 1}
                onReply={handleReply}
                onOptimisticMessage={handleOptimisticMessage}
                onOpenThread={handleOpenThread}
              />
            </div>
            
            {/* Fixed Message Input at Bottom - Slack Style */}
            <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-4">
              <MessageInput
                conversationId={selectedConversationId}
                recipientId={selectedUser?.id}
                onMessageSent={handleMessageSent}
                onOptimisticMessage={handleOptimisticMessage}
                replyingTo={replyingTo}
                onCancelReply={handleCancelReply}
                isGroup={selectedConversationId?.startsWith('event_')}
              />
            </div>
          </>
        ) : (
          /* Enhanced Empty State */
          <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <div className="text-center max-w-md px-6">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <MessageCircle className="w-16 h-16 text-blue-600" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-3">
                Welcome to Messages
              </h2>
              <p className="text-slate-600 mb-8 text-lg">
                Select a conversation from the sidebar to start messaging, or start a new conversation with your team.
              </p>
              <Button 
                onClick={handleStartNewConversation} 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md px-6 py-3 text-base"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Start New Conversation
              </Button>
            </div>
          </div>
        )}
        </div>

        {/* Right Column - Info Panel or Thread Panel (collapsible) */}
        {threadMessage && (
          <div className="hidden lg:block">
            <MessageThreadPanel
              parentMessage={threadMessage}
              replies={threadReplies}
              isLoading={isLoadingThreadReplies}
              onClose={() => setThreadMessage(null)}
              onReply={handleSendReply}
              conversationId={selectedConversationId || ''}
            />
          </div>
        )}
        
        {!threadMessage && showInfoPanel && selectedConversationId && (
          <div className="hidden lg:block">
            <ConversationInfoPanel
              conversation={conversations.find((c: Conversation) => c.id === selectedConversationId) || null}
              onClose={() => setShowInfoPanel(false)}
              messages={[]} // TODO: Pass actual messages
            />
          </div>
        )}
      </div>

      {/* New Message Dialog */}
      <NewMessageDialog
        isOpen={isNewMessageDialogOpen}
        onClose={() => setIsNewMessageDialogOpen(false)}
        onSelectUser={handleSelectUser}
        onSelectEvent={handleSelectEvent}
        events={[]} // This should be fetched from API
      />

      {/* Global Search Dialog */}
      <GlobalSearchDialog
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        onMessageClick={handleGlobalSearchMessageClick}
        onConversationClick={handleGlobalSearchConversationClick}
      />

      {/* Notification Settings Modal */}
      {isNotificationSettingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <NotificationSettings onClose={() => setIsNotificationSettingsOpen(false)} />
        </div>
      )}

      {/* Notification Toasts */}
      {notificationToasts.map((toast) => (
        <NotificationToast
          key={toast.id}
          senderName={toast.senderName}
          message={toast.message}
          senderAvatar={toast.senderAvatar}
          conversationId={toast.conversationId}
          onView={() => {
            handleSelectConversation(toast.conversationId)
            notificationToastManager.removeToast(toast.id)
          }}
          onDismiss={() => notificationToastManager.removeToast(toast.id)}
        />
      ))}
    </div>
  )
}
