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
          'w-full rounded-2xl border px-4 py-3 text-left transition-all focus:outline-none',
          isActive
            ? 'border-primary/60 bg-primary/10 text-white shadow-lg'
            : 'border-white/5 bg-white/5 text-white/80 hover:border-white/20 hover:bg-white/10'
        )}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-11 w-11 border border-white/20">
              <AvatarImage src={conversation.avatar} />
              <AvatarFallback className="bg-white/10 text-sm font-semibold text-white">
                {getInitials(conversation.name || 'C')}
              </AvatarFallback>
            </Avatar>
            {conversation.type === 'direct' && participant && (
              <span
                className={cn(
                  'absolute -right-0 -bottom-0 h-3 w-3 rounded-full border-2 border-slate-900',
                  isDirectOnline ? 'bg-emerald-400' : 'bg-slate-500'
                )}
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="truncate text-sm font-semibold">{conversation.name}</p>
              {conversation.lastMessage?.created_at && (
                <span className="text-xs text-white/60">
                  {formatLastActivity(conversation.lastMessage.created_at)}
                </span>
              )}
            </div>
            <p className="mt-1 line-clamp-1 text-sm text-white/70">
              {conversation.lastMessage?.content || 'No messages yet'}
            </p>
            <div className="mt-2 flex items-center justify-between text-xs text-white/50">
              <span className="truncate">{presenceText}</span>
              {conversation.unreadCount > 0 && (
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
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
    <div className="flex h-screen flex-col bg-slate-950 text-white">
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
            className="bg-white text-slate-900 hover:bg-white/90"
            size="sm"
            actionName="send new messages"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Compose
          </ProtectedButton>
        }
      />

      <div className="relative flex flex-1 overflow-hidden bg-slate-900/40">
        {showSidebar && (
          <div
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}

        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 w-80 transform border-r border-white/10 bg-slate-900/95 shadow-2xl transition-transform md:hidden',
            showSidebar ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {renderSidebarContent()}
        </aside>

        <div className="hidden h-full w-[320px] flex-col border-r border-white/10 bg-slate-900/80 backdrop-blur md:flex">
          {renderSidebarContent()}
        </div>

        <main className="flex flex-1 flex-col bg-background/80 text-foreground shadow-inner">
          {selectedConversationId ? (
            <>
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 lg:px-8">
                <div className="flex flex-1 items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBackToConversations}
                    className="rounded-full border border-white/10 bg-white/10 text-white hover:bg-white/20 md:hidden"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                  <Avatar className="h-11 w-11 border border-white/20">
                    <AvatarImage src={getConversationAvatar() || undefined} />
                    <AvatarFallback className="bg-white/10 text-sm font-semibold text-white">
                      {getInitials(getConversationTitle())}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold">{getConversationTitle()}</h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedConversation?.type === 'direct'
                        ? onlineStatus?.is_online
                          ? 'Online'
                          : onlineStatus?.last_seen_text || 'Offline'
                        : selectedEvent?.title
                        ? `Event · ${selectedEvent.title}`
                        : getConversationSubtitle()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsConversationSearchOpen(prev => !prev)}
                    className="rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/15"
                    title="Search in conversation"
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsInspectorOpen(prev => !prev)}
                    className={cn(
                      'rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/15',
                      isInspectorOpen && 'bg-white/20'
                    )}
                    title="Toggle command drawer"
                  >
                    <Info className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {isConversationSearchOpen && selectedConversationId && (
                <div className="border-b border-white/10 bg-card/40 px-4 py-4 lg:px-8">
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

              <div className="border-t border-white/10 bg-card/40 px-4 py-4 lg:px-8">
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
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
                <MessageCircle className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-3xl font-semibold text-white">Welcome to Messaging</h2>
              <p className="mt-3 max-w-md text-base text-white/70">
                Select a conversation from the rail or start a new thread to collaborate with your
                team.
              </p>
              <Button
                onClick={handleStartNewConversation}
                className="mt-6 bg-brand-gradient px-6 py-3 font-semibold text-white shadow-lg"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Start New Conversation
              </Button>
            </div>
          )}
        </main>

        {isInspectorOpen && selectedConversationId && (
          <aside className="hidden w-[360px] flex-col border-l border-white/10 bg-card/80 text-foreground backdrop-blur xl:flex">
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
