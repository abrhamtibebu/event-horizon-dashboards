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
          'group w-full rounded-xl border p-3 text-left transition-all duration-200 focus:outline-none relative mb-2',
          isActive
            ? 'border-primary/50 bg-primary/[0.03] dark:bg-primary/[0.05]'
            : 'border-gray-100 dark:border-gray-800/50 bg-white dark:bg-gray-900/40 hover:border-primary/30 hover:bg-gray-50 dark:hover:bg-gray-800/60'
        )}
        aria-label={`Open conversation with ${conversation.name}`}
        role="button"
        tabIndex={0}
      >
        {isActive && (
          <div className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full" />
        )}
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <Avatar className="h-12 w-12 border border-gray-100 dark:border-gray-800 shadow-sm">
              <AvatarImage src={conversation.avatar} />
              <AvatarFallback className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-bold">
                {getInitials(conversation.name || 'C')}
              </AvatarFallback>
            </Avatar>
            {conversation.type === 'direct' && participant && (
              <span
                className={cn(
                  'absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-gray-900 shadow-sm',
                  isDirectOnline ? 'bg-green-500' : 'bg-gray-400'
                )}
              />
            )}
            {conversation.type === 'event' && (
              <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center border-2 border-white dark:border-gray-900 shadow-sm">
                <Calendar className="h-2.5 w-2.5 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className={cn(
                "truncate text-sm font-bold",
                conversation.unreadCount > 0 ? "text-gray-900 dark:text-gray-100" : "text-gray-700 dark:text-gray-300"
              )}>
                {conversation.name}
              </p>
              {conversation.lastMessage?.created_at && (
                <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap">
                  {formatLastActivity(conversation.lastMessage.created_at)}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 mt-0.5">
              <p className={cn(
                "line-clamp-1 text-xs",
                conversation.unreadCount > 0 ? "text-gray-800 dark:text-gray-200 font-medium" : "text-gray-500 dark:text-gray-400"
              )}>
                {conversation.lastMessage?.content || 'No messages yet'}
              </p>
              {conversation.unreadCount > 0 && (
                <Badge className="h-4.5 min-w-[18px] px-1 text-[9px] bg-primary text-white flex items-center justify-center font-bold rounded-full">
                  {conversation.unreadCount}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </button>
    )
  }

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950">
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Messages</h1>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setIsGlobalSearchOpen(true)}>
              <MoreVertical className="h-4 w-4 text-gray-500" />
            </Button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={conversationSearch}
            onChange={(event) => setConversationSearch(event.target.value)}
            placeholder="Search conversations..."
            className="pl-9 bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800 focus:bg-white dark:focus:bg-gray-900 transition-all rounded-xl"
          />
        </div>
        <ConversationFilters
          filters={conversationFilterOptions}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
      </div>
      <div className="flex-1 overflow-y-auto p-3 scrollbar-none">
        {filteredConversations.length > 0 ? (
          <div>{filteredConversations.map(renderConversationCard)}</div>
        ) : (
          <div className="py-12 px-6 text-center">
            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-8 w-8 text-gray-300" />
            </div>
            <p className="font-bold text-gray-900 dark:text-white">No results found</p>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or search terms.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-6 rounded-xl border-gray-200 dark:border-gray-800"
              onClick={handleStartNewConversation}
            >
              Start New Message
            </Button>
          </div>
        )}
      </div>
    </div>
  )

  const handleBackToConversations = () => {
    setSelectedConversationId(null)
    setSelectedUser(null)
    setSelectedEvent(null)
    setShowSidebar(true)
    hasMarkedAsRead.current = null
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-950 overflow-hidden" role="application">
      <div className="relative flex flex-1 overflow-hidden">
        {showSidebar && (
          <div
            className="fixed inset-0 z-30 bg-black/20 md:hidden animate-in fade-in duration-200"
            onClick={() => setShowSidebar(false)}
          />
        )}

        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 w-80 transform border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 transition-transform duration-300 ease-in-out md:relative md:translate-x-0',
            showSidebar ? 'translate-x-0 shadow-2xl md:shadow-none' : '-translate-x-full'
          )}
        >
          {renderSidebarContent()}
        </aside>

        <main className="flex flex-1 flex-col min-w-0 bg-white dark:bg-gray-950 relative overflow-hidden transition-all duration-300">
          {selectedConversationId ? (
            <>
              {/* Conversation Header */}
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-4 py-4 lg:px-8 bg-white dark:bg-gray-950">
                <div className="flex flex-1 items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBackToConversations}
                    className="h-9 w-9 border border-gray-100 dark:border-gray-800 md:hidden"
                    aria-label="Back to conversations"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                  <div className="relative">
                    <Avatar className="h-11 w-11 border border-gray-100 dark:border-gray-800 shadow-sm">
                      <AvatarImage src={getConversationAvatar() || undefined} />
                      <AvatarFallback className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-bold">
                        {getInitials(getConversationTitle())}
                      </AvatarFallback>
                    </Avatar>
                    {selectedConversation?.type === 'direct' && (
                      <div className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-gray-950 shadow-sm ${onlineStatus?.is_online ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-bold text-gray-900 dark:text-white leading-tight">{getConversationTitle()}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      {selectedConversation?.type === 'direct' ? (
                        <>
                          <span className={`inline-block w-2 h-2 rounded-full ${onlineStatus?.is_online ? 'bg-green-500' : 'bg-gray-400'}`} />
                          <span className="text-[11px] font-medium text-gray-500">{onlineStatus?.is_online ? 'Online' : onlineStatus?.last_seen_text || 'Offline'}</span>
                        </>
                      ) : selectedEvent?.title ? (
                        <>
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-[11px] font-medium text-gray-500">Event chat</span>
                        </>
                      ) : (
                        <span className="text-[11px] font-medium text-gray-500">{getConversationSubtitle()}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsConversationSearchOpen(prev => !prev)}
                    className={cn(
                      "h-9 w-9 rounded-lg transition-colors",
                      isConversationSearchOpen ? "bg-primary/10 text-primary" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900"
                    )}
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsInspectorOpen(prev => !prev)}
                    className={cn(
                      "h-9 w-9 rounded-lg transition-colors",
                      isInspectorOpen ? "bg-primary/10 text-primary" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900"
                    )}
                  >
                    <Info className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Conversation Search Area */}
              {isConversationSearchOpen && selectedConversationId && (
                <div className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/10 px-4 py-3 lg:px-8">
                  <ConversationSearch
                    conversationId={selectedConversationId}
                    conversationName={getConversationTitle()}
                    onMessageClick={handleConversationSearchMessageClick}
                    onClose={() => setIsConversationSearchOpen(false)}
                  />
                </div>
              )}

              <div className="flex-1 min-h-0 bg-white dark:bg-gray-950">
                <MessageThread
                  conversationId={selectedConversationId}
                  currentUserId={user?.id || 1}
                  onReply={handleReply}
                  onOptimisticMessage={handleOptimisticMessage}
                  onOpenThread={handleOpenThread}
                />
              </div>

              {/* Message Input Area */}
              <div className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 lg:px-8">
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
            /* Empty State */
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center animate-in fade-in-0 duration-500">
              <div className="w-24 h-24 bg-gray-50 dark:bg-gray-900 rounded-[32px] flex items-center justify-center mb-6 border border-gray-100 dark:border-gray-800">
                <MessageCircle className="h-12 w-12 text-primary/40" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Your conversations
              </h2>
              <p className="text-gray-500 max-w-sm mb-8 text-sm">
                Select a conversation from the list to start messaging or search for a specific chat.
              </p>
              <Button
                onClick={handleStartNewConversation}
                className="rounded-xl px-8 h-11 font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200"
              >
                Start New Conversation
              </Button>
            </div>
          )}
        </main>

        {/* Inspector Panel */}
        {isInspectorOpen && selectedConversationId && (
          <aside className="hidden w-[360px] flex-col border-l border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 xl:flex animate-in slide-in-from-right-2 duration-300">
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
              <div className="flex flex-col h-full uppercase tracking-tight">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <span className="font-bold text-gray-900 dark:text-white">Conversation Details</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsInspectorOpen(false)}
                    className="h-8 w-8 rounded-lg text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-4 bg-gray-50/30 dark:bg-gray-900/10 border-b border-gray-100 dark:border-gray-800">
                  <div className="grid grid-cols-2 gap-3">
                    {insightCards.map(card => (
                      <div
                        key={card.label}
                        className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-3"
                      >
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-bold">{card.label}</p>
                        <p className="mt-1 text-sm font-bold text-gray-900 dark:text-gray-100">{card.value}</p>
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
              </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-300">
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
