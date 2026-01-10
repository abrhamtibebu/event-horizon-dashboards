import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { MessageCircle, Search, Settings, Bell, Menu, MoreVertical, Info, Users, Calendar, Pin } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
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
import { usePermissionCheck } from '../hooks/use-permission-check'
import { ProtectedButton } from '../components/ProtectedButton'
import { useRealtimeMessages, setNotificationClickCallback } from '../hooks/use-realtime-messages'
import { useSingleUserOnlineStatus, useRealtimeOnlineStatus } from '../hooks/use-online-status'
import { useLocation, useSearchParams } from 'react-router-dom'
import { MessagingHeader } from '../components/messaging/MessagingHeader'
import { ConversationFilters, ConversationFilter } from '../components/messaging/ConversationFilters'
import { cn } from '@/lib/utils'
import type { Conversation, Message, User, Event } from '../types/message'

export default function Messages() {
  // Force refresh - Fixed variable initialization issue
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isNewMessageDialogOpen, setIsNewMessageDialogOpen] = useState(false)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [threadMessage, setThreadMessage] = useState<Message | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false)
  const [isConversationSearchOpen, setIsConversationSearchOpen] = useState(false)
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState(false)
  const [notificationToasts, setNotificationToasts] = useState<any[]>([])
  const [activeFilter, setActiveFilter] = useState<'all' | 'direct' | 'event' | 'unread' | 'pinned'>('all')
  const [conversationSearch, setConversationSearch] = useState('')
  const [isInspectorOpen, setIsInspectorOpen] = useState(true)
  const hasMarkedAsRead = useRef<string | null>(null)

  const { data: conversationsData = [] } = useConversations()
  const { data: unreadData } = useUnreadCount()
  const markConversationReadMutation = useMarkConversationRead()
  const { user } = useAuth()
  const { checkPermission } = usePermissionCheck()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  
  // Get online status for the currently selected user (for direct messages)
  const otherUserId = selectedUser?.id || null
  const { data: onlineStatus } = useSingleUserOnlineStatus(otherUserId)
  
  // Initialize real-time messaging for notifications
  useRealtimeMessages()

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

  const selectedConversation = useMemo(
    () => conversations.find((c: Conversation) => c.id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  )

  const participantIds = useMemo(() => {
    const ids = new Set<number>()
    conversations.forEach((conversation: Conversation) => {
      if (conversation.type === 'direct' && Array.isArray(conversation.participants)) {
        conversation.participants.forEach(participant => ids.add(participant.id))
      }
    })
    return Array.from(ids)
  }, [conversations])

  const { isUserOnline, getLastSeenText } = useRealtimeOnlineStatus(participantIds)

  const filterStats = useMemo(
    () => ({
      all: conversations.length,
      direct: conversations.filter((c: Conversation) => c.type === 'direct').length,
      event: conversations.filter((c: Conversation) => c.type === 'event').length,
      unread: conversations.filter((c: Conversation) => (c.unreadCount || 0) > 0).length,
      pinned: conversations.filter((c: Conversation) => c.is_pinned).length,
    }),
    [conversations]
  )

  const conversationFilterOptions = useMemo(() => {
    const options: ConversationFilter[] = [
      { id: 'all', label: 'All', count: filterStats.all },
      { id: 'direct', label: '1:1', count: filterStats.direct, icon: <Users className="h-3.5 w-3.5" /> },
      { id: 'event', label: 'Events', count: filterStats.event, icon: <Calendar className="h-3.5 w-3.5" /> },
      { id: 'unread', label: 'Unread', count: filterStats.unread, icon: <Bell className="h-3.5 w-3.5" /> },
      { id: 'pinned', label: 'Pinned', count: filterStats.pinned, icon: <Pin className="h-3.5 w-3.5" /> },
    ]
    return options
  }, [filterStats])

  const filteredConversations = useMemo(() => {
    let data = [...conversations]

    if (activeFilter === 'direct') {
      data = data.filter((c: Conversation) => c.type === 'direct')
    } else if (activeFilter === 'event') {
      data = data.filter((c: Conversation) => c.type === 'event')
    } else if (activeFilter === 'unread') {
      data = data.filter((c: Conversation) => (c.unreadCount || 0) > 0)
    } else if (activeFilter === 'pinned') {
      data = data.filter((c: Conversation) => !!c.is_pinned)
    }

    if (conversationSearch.trim()) {
      const search = conversationSearch.toLowerCase()
      data = data.filter((conversation: Conversation) =>
        conversation.name?.toLowerCase().includes(search)
      )
    }

    return data
  }, [conversations, activeFilter, conversationSearch])

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
    setIsInspectorOpen(true)
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
    if (!checkPermission('messages.send', 'send messages')) {
      return
    }
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

  const formatLastActivity = (timestamp?: string) => {
    if (!timestamp) return '—'
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60)

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${Math.floor(diffInMinutes)}m ago`
    if (diffInMinutes < 60 * 24) return `${Math.floor(diffInMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  const insightCards = useMemo(
    () => [
      { label: 'Avg response', value: '2m 15s' },
      { label: 'SLA', value: 'On track' },
      { label: 'Sentiment', value: 'Positive' },
      { label: 'Priority', value: selectedConversation?.is_pinned ? 'High' : 'Normal' },
    ],
    [selectedConversation?.is_pinned]
  )

  const renderConversationCard = (conversation: Conversation) => {
    const isActive = conversation.id === selectedConversationId
    const participant = conversation.participants?.[0]
    const isDirectOnline = conversation.type === 'direct' && participant ? isUserOnline(participant.id) : false
    const presenceText =
      conversation.type === 'direct' && participant
        ? getLastSeenText(participant.id)
        : conversation.event?.title || 'Event space'

    return (
      <button
        key={conversation.id}
        onClick={() => handleSelectConversation(conversation.id)}
        className={cn(
          'group w-full rounded-2xl border px-4 py-3 text-left transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-slate-900',
          isActive
            ? 'border-primary/60 bg-gradient-to-r from-primary/20 to-primary/10 text-white shadow-xl shadow-primary/20 scale-[1.02]'
            : 'border-white/10 bg-gradient-to-r from-white/5 to-white/5 text-white/80 hover:border-white/30 hover:bg-gradient-to-r hover:from-white/10 hover:to-white/15 hover:scale-[1.01] hover:shadow-lg'
        )}
        aria-label={`Open conversation with ${conversation.name}`}
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center gap-3">
          <div className="relative group/avatar">
            <Avatar className="h-12 w-12 border-2 border-white/30 shadow-lg ring-1 ring-white/10 transition-all duration-300 group-hover/avatar:scale-110 group-hover/avatar:shadow-xl">
              <AvatarImage src={conversation.avatar} className="transition-all duration-300" />
              <AvatarFallback className="bg-gradient-to-br from-white/20 to-white/10 text-sm font-semibold text-white transition-all duration-300">
                {getInitials(conversation.name || 'C')}
              </AvatarFallback>
            </Avatar>
            {/* Enhanced online status indicator */}
            {conversation.type === 'direct' && participant && (
              <span
                className={cn(
                  'absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-3 border-slate-900 shadow-lg ring-2 ring-white/10 transition-all duration-300',
                  isDirectOnline ? 'bg-emerald-400 animate-pulse shadow-emerald-400/50' : 'bg-slate-500'
                )}
              />
            )}
            {/* Event indicator */}
            {conversation.type === 'event' && (
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-info flex items-center justify-center shadow-lg ring-2 ring-white/10">
                <Calendar className="h-3 w-3 text-info-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className={cn(
                "truncate text-sm font-semibold transition-all duration-200",
                isActive ? "text-white" : "text-white/90 group-hover:text-white"
              )}>
                {conversation.name}
              </p>
              {conversation.lastMessage?.created_at && (
                <span className="text-xs text-white/60 transition-all duration-200 group-hover:text-white/80">
                  {formatLastActivity(conversation.lastMessage.created_at)}
                </span>
              )}
            </div>
            <p className="mt-1 line-clamp-1 text-sm text-white/70 transition-all duration-200 group-hover:text-white/80">
              {conversation.lastMessage?.content || 'No messages yet'}
            </p>
            <div className="mt-2 flex items-center justify-between text-xs text-white/50 transition-all duration-200 group-hover:text-white/70">
              <span className="truncate flex items-center gap-1">
                {conversation.type === 'direct' && (
                  <span className={`inline-block w-2 h-2 rounded-full ${isDirectOnline ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                )}
                {presenceText}
              </span>
              {conversation.unreadCount > 0 && (
                <span className="rounded-full bg-gradient-to-r from-primary to-info px-2.5 py-1 text-[11px] font-semibold text-white shadow-lg animate-in zoom-in-50 duration-200">
                  {conversation.unreadCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </button>
    )
  }

  const renderSidebarContent = () => (
    <>
      <div className="border-b border-white/10 px-5 py-4">
        <div className="flex items-center justify-between text-xs uppercase tracking-widest text-white/60">
          <span>Inbox overview</span>
          <span>{filteredConversations.length} active</span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              value={conversationSearch}
              onChange={(event) => setConversationSearch(event.target.value)}
              placeholder="Search or start a chat"
              className="border-white/10 bg-white/5 pl-9 text-white placeholder:text-white/50 focus:border-white/30 focus:ring-white/30"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsGlobalSearchOpen(true)}
            className="rounded-2xl border border-white/10 bg-white/10 text-white hover:bg-white/20"
            title="Advanced search"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-3">
          <ConversationFilters
            filters={conversationFilterOptions}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-6">
        {filteredConversations.length > 0 ? (
          <div className="space-y-3">{filteredConversations.map(renderConversationCard)}</div>
        ) : (
          <div className="mt-8 rounded-3xl border border-dashed border-white/20 px-4 py-8 text-center text-sm text-white/60">
            <p className="font-semibold text-white">No conversations</p>
            <p className="mt-2 text-xs text-white/50">
              Try adjusting your filters or start a new conversation.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={handleStartNewConversation}
            >
              Start New Message
            </Button>
          </div>
        )}
      </div>
    </>
  )

  const handleBackToConversations = () => {
    setSelectedConversationId(null)
    setSelectedUser(null)
    setSelectedEvent(null)
    setShowSidebar(true)
    hasMarkedAsRead.current = null // Reset the read marker
  }

  return (
    <div
      className="flex h-screen flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden"
      role="application"
      aria-label="Messaging Application"
    >
      {/* Enhanced Messaging Header with better spacing and animations */}
      <div className="animate-in slide-in-from-top-2 duration-300">
        <MessagingHeader
          user={user}
          unreadCount={unreadCount}
          isSidebarOpen={showSidebar}
          isInspectorOpen={isInspectorOpen}
          onToggleSidebar={() => setShowSidebar(prev => !prev)}
          onToggleInspector={() => setIsInspectorOpen(prev => !prev)}
          onOpenSearch={() => setIsGlobalSearchOpen(true)}
          onOpenNotifications={() => setIsNotificationSettingsOpen(true)}
          newMessageButton={
            <ProtectedButton
              permission="messages.send"
              onClick={handleStartNewConversation}
              className="bg-gradient-to-r from-white to-gray-50 text-slate-900 hover:from-gray-50 hover:to-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              size="sm"
              actionName="send new messages"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Compose
            </ProtectedButton>
          }
        />
      </div>

      {/* Enhanced main content area with improved glassmorphism */}
      <div className="relative flex flex-1 overflow-hidden bg-gradient-to-br from-slate-900/30 via-slate-800/20 to-slate-900/40 backdrop-blur-sm">
        {showSidebar && (
          <div
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* Enhanced Mobile Sidebar with smooth animations */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 w-80 transform border-r border-white/20 bg-gradient-to-b from-slate-900/95 to-slate-800/95 shadow-2xl backdrop-blur-xl transition-all duration-300 ease-out md:hidden',
            showSidebar ? 'translate-x-0 opacity-100 scale-100' : '-translate-x-full opacity-0 scale-95'
          )}
          style={{
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)'
          }}
        >
          <div className="animate-in slide-in-from-left-4 duration-200 delay-100">
            {renderSidebarContent()}
          </div>
        </aside>

        {/* Enhanced Desktop Sidebar with glassmorphism */}
        <div className="hidden h-full w-[320px] flex-col border-r border-white/20 bg-gradient-to-b from-slate-900/90 to-slate-800/85 backdrop-blur-xl md:flex shadow-2xl"
             style={{
               backdropFilter: 'blur(24px) saturate(180%)',
               WebkitBackdropFilter: 'blur(24px) saturate(180%)'
             }}>
          <div className="animate-in slide-in-from-left-2 duration-300">
            {renderSidebarContent()}
          </div>
        </div>

        {/* Enhanced Main Content Area with improved glassmorphism */}
        <main className="flex flex-1 flex-col bg-gradient-to-br from-background/90 via-background/80 to-background/70 text-foreground shadow-2xl backdrop-blur-sm border-l border-white/5"
              style={{
                backdropFilter: 'blur(16px) saturate(160%)',
                WebkitBackdropFilter: 'blur(16px) saturate(160%)'
              }}>
          {selectedConversationId ? (
            <>
              {/* Enhanced Conversation Header with better spacing and animations */}
              <div className="flex items-center justify-between border-b border-white/20 px-4 py-4 lg:px-8 bg-gradient-to-r from-white/5 via-white/5 to-transparent backdrop-blur-sm animate-in slide-in-from-top-1 duration-200">
                <div className="flex flex-1 items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBackToConversations}
                    className="rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20 hover:scale-105 transition-all duration-200 md:hidden shadow-lg"
                    aria-label="Back to conversations"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                  <div className="relative">
                    <Avatar className="h-12 w-12 border-2 border-white/30 shadow-xl ring-2 ring-white/10">
                      <AvatarImage src={getConversationAvatar() || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-white/20 to-white/10 text-sm font-semibold text-white">
                        {getInitials(getConversationTitle())}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online status indicator with animation */}
                    {selectedConversation?.type === 'direct' && (
                      <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-3 border-slate-900 shadow-lg transition-all duration-300 ${
                        onlineStatus?.is_online ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                      }`} />
                    )}
                  </div>
                  <div className="min-w-0 animate-in slide-in-from-left-2 duration-200 delay-100">
                    <h2 className="truncate text-lg font-semibold text-white">{getConversationTitle()}</h2>
                    <p className="text-sm text-white/70 flex items-center gap-2">
                      {selectedConversation?.type === 'direct' ? (
                        <>
                          <span className={`inline-block w-2 h-2 rounded-full ${onlineStatus?.is_online ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                          {onlineStatus?.is_online ? 'Online' : onlineStatus?.last_seen_text || 'Offline'}
                        </>
                      ) : selectedEvent?.title ? (
                        <>
                          <Calendar className="w-3 h-3" />
                          Event · {selectedEvent.title}
                        </>
                      ) : (
                        getConversationSubtitle()
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 animate-in slide-in-from-right-2 duration-200 delay-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsConversationSearchOpen(prev => !prev)}
                    className="rounded-full border border-white/20 bg-white/5 text-white hover:bg-white/15 hover:scale-105 transition-all duration-200 shadow-lg"
                    title="Search in conversation"
                    aria-label="Search in conversation"
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsInspectorOpen(prev => !prev)}
                    className={cn(
                      'rounded-full border border-white/20 bg-white/5 text-white hover:bg-white/15 hover:scale-105 transition-all duration-200 shadow-lg',
                      isInspectorOpen && 'bg-white/20 shadow-xl'
                    )}
                    title="Toggle command drawer"
                    aria-label="Toggle command drawer"
                  >
                    <Info className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Enhanced Conversation Search with glassmorphism */}
              {isConversationSearchOpen && selectedConversationId && (
                <div className="border-b border-white/20 bg-gradient-to-r from-white/5 via-white/5 to-transparent px-4 py-4 lg:px-8 backdrop-blur-sm animate-in slide-in-from-top-1 duration-200"
                     style={{
                       backdropFilter: 'blur(12px) saturate(150%)',
                       WebkitBackdropFilter: 'blur(12px) saturate(150%)'
                     }}>
                  <ConversationSearch
                    conversationId={selectedConversationId}
                    conversationName={getConversationTitle()}
                    onMessageClick={handleConversationSearchMessageClick}
                    onClose={() => setIsConversationSearchOpen(false)}
                  />
                </div>
              )}

              <div className="flex-1 min-h-0">
                <MessageThread
                  conversationId={selectedConversationId}
                  currentUserId={user?.id || 1}
                  onReply={handleReply}
                  onOptimisticMessage={handleOptimisticMessage}
                  onOpenThread={handleOpenThread}
                />
              </div>

              {/* Enhanced Message Input Area with glassmorphism */}
              <div className="border-t border-white/20 bg-gradient-to-t from-white/5 via-white/5 to-transparent px-4 py-4 lg:px-8 backdrop-blur-sm animate-in slide-in-from-bottom-1 duration-200"
                   style={{
                     backdropFilter: 'blur(12px) saturate(150%)',
                     WebkitBackdropFilter: 'blur(12px) saturate(150%)'
                   }}>
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
            /* Enhanced Empty State with modern design and animations */
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center animate-in fade-in-0 duration-500">
              <div className="relative mb-8">
                <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-white/10 via-white/5 to-transparent ring-2 ring-white/20 shadow-2xl backdrop-blur-sm animate-in zoom-in-50 duration-700 delay-200">
                  <MessageCircle className="h-14 w-14 text-primary drop-shadow-lg" />
                </div>
                {/* Floating animation elements */}
                <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary/20 animate-bounce delay-300"></div>
                <div className="absolute -bottom-1 -left-3 h-4 w-4 rounded-full bg-info/30 animate-bounce delay-500"></div>
              </div>
              <h2 className="text-4xl font-bold text-white mb-4 animate-in slide-in-from-bottom-4 duration-500 delay-100">
                Welcome to Messaging
              </h2>
              <p className="mt-3 max-w-md text-lg text-white/70 leading-relaxed animate-in slide-in-from-bottom-2 duration-500 delay-200">
                Select a conversation from the sidebar or start a new thread to collaborate with your team.
              </p>
              <div className="mt-8 animate-in slide-in-from-bottom-2 duration-500 delay-300">
                <Button
                  onClick={handleStartNewConversation}
                  className="bg-gradient-to-r from-primary via-primary to-info hover:from-primary/90 hover:via-primary/90 hover:to-info/90 px-8 py-4 font-semibold text-white shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 rounded-xl"
                  size="lg"
                >
                  <MessageCircle className="mr-3 h-6 w-6" />
                  Start New Conversation
                </Button>
              </div>
            </div>
          )}
        </main>

        {/* Enhanced Inspector Panel with modern glassmorphism */}
        {isInspectorOpen && selectedConversationId && (
          <aside className="hidden w-[360px] flex-col border-l border-white/20 bg-gradient-to-b from-card/90 to-card/70 text-foreground backdrop-blur-xl xl:flex shadow-2xl animate-in slide-in-from-right-2 duration-300"
                 style={{
                   backdropFilter: 'blur(20px) saturate(170%)',
                   WebkitBackdropFilter: 'blur(20px) saturate(170%)'
                 }}>
            {threadMessage ? (
              <MessageThreadPanel
                parentMessage={threadMessage}
                replies={threadReplies}
                isLoading={isLoadingThreadReplies}
                onClose={() => setThreadMessage(null)}
                onReply={handleSendReply}
                conversationId={selectedConversationId || ''}
              />
            ) : (
              <>
                <div className="border-b border-white/10 px-5 py-4">
                  <div className="flex items-center justify-between text-sm font-semibold text-white">
                    <span>Command drawer</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsInspectorOpen(false)}
                      className="rounded-full text-white hover:bg-white/10"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {insightCards.map(card => (
                      <div
                        key={card.label}
                        className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-white/70"
                      >
                        <p className="uppercase tracking-widest">{card.label}</p>
                        <p className="mt-2 text-base font-semibold text-white">{card.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <ConversationInfoPanel
                    conversation={selectedConversation}
                    onClose={() => setIsInspectorOpen(false)}
                    messages={[]}
                  />
                </div>
              </>
            )}
          </aside>
        )}
      </div>

      <NewMessageDialog
        isOpen={isNewMessageDialogOpen}
        onClose={() => setIsNewMessageDialogOpen(false)}
        onSelectUser={handleSelectUser}
        onSelectEvent={handleSelectEvent}
        events={[]}
      />

      <GlobalSearchDialog
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        onMessageClick={handleGlobalSearchMessageClick}
        onConversationClick={handleGlobalSearchConversationClick}
      />

      {isNotificationSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <NotificationSettings onClose={() => setIsNotificationSettingsOpen(false)} />
        </div>
      )}

      {notificationToasts.map(toast => (
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
