import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { MessageCircle, Search, MoreVertical, Info, Users, Calendar, Pin, Bell, X, Menu, SearchX, Plus, RefreshCw, ChevronRight } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { MessageThread } from '../components/messaging/MessageThread'
import { MessageInput } from '../components/messaging/MessageInput'
import { ConversationInfoPanel } from '../components/messaging/ConversationInfoPanel'
import { MessageThreadPanel } from '../components/messaging/MessageThreadPanel'
import { NewMessageDialog } from '../components/messaging/NewMessageDialog'
import { GlobalSearchDialog } from '../components/messaging/GlobalSearchDialog'
import { ConversationSearch } from '../components/messaging/ConversationSearch'
import { notificationToastManager } from '../lib/notification-toast-manager'
import { useConversations, useUnreadCount, useMarkConversationRead } from '../hooks/use-messages'
import { useMessageReplies, useSendReply } from '../hooks/use-message-threads'
import { useAuth } from '../hooks/use-auth'
import { usePermissionCheck } from '../hooks/use-permission-check'
import { useRealtimeMessages, setNotificationClickCallback } from '../hooks/use-realtime-messages'
import { useSingleUserOnlineStatus, useRealtimeOnlineStatus } from '../hooks/use-online-status'
import { useLocation, useSearchParams } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import type { Conversation, Message, User, Event } from '../types/message'

export default function Messages() {
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
  const [activeFilter, setActiveFilter] = useState<'all' | 'direct' | 'event' | 'unread' | 'pinned'>('all')
  const [conversationSearch, setConversationSearch] = useState('')

  const hasMarkedAsRead = useRef<string | null>(null)

  const { data: conversationsData = [], isLoading: loadingConversations } = useConversations()
  const { data: unreadData } = useUnreadCount()
  const markConversationReadMutation = useMarkConversationRead()
  const { user } = useAuth()
  const { checkPermission } = usePermissionCheck()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const otherUserId = selectedUser?.id || null
  const { data: onlineStatus } = useSingleUserOnlineStatus(otherUserId)

  useRealtimeMessages()

  const conversations = Array.isArray(conversationsData)
    ? conversationsData
    : Array.isArray(conversationsData?.data)
      ? conversationsData.data
      : []

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

  useEffect(() => {
    setNotificationClickCallback((conversationId: string) => {
      setSelectedConversationId(conversationId)
      if (window.innerWidth < 768) setShowSidebar(false)
    })
  }, [])

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
          setTimeout(() => markConversationReadMutation.mutate(readData), 500)
        }
      }
    }
  }, [selectedConversationId, conversations])

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId)
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
    setThreadMessage(null)
    if (window.innerWidth < 1024) setShowSidebar(false)
  }

  const { data: threadReplies = [], isLoading: isLoadingThreadReplies } = useMessageReplies(
    threadMessage?.id || null
  )
  const sendReplyMutation = useSendReply()

  const handleOpenThread = useCallback((message: Message) => {
    setThreadMessage(message)
    setIsInspectorOpen(true)
  }, [])

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
    if (!checkPermission('messages.send', 'send messages')) return
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

  const getConversationTitle = () => selectedUser?.name || selectedEvent?.title || 'Select a conversation'
  const getConversationAvatar = () => selectedUser?.profile_image || selectedEvent?.image_url || null

  const getInitials = (name: string) => name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)

  const formatLastActivity = (timestamp?: string) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMin = (now.getTime() - date.getTime()) / 60000
    if (diffInMin < 1) return 'now'
    if (diffInMin < 60) return `${Math.floor(diffInMin)}m`
    if (diffInMin < 1440) return `${Math.floor(diffInMin / 60)}h`
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  const renderConversationCard = (conversation: Conversation) => {
    const isActive = conversation.id === selectedConversationId
    const participant = conversation.participants?.[0]
    const isDirectOnline = conversation.type === 'direct' && participant ? isUserOnline(participant.id) : false

    return (
      <button
        key={conversation.id}
        onClick={() => handleSelectConversation(conversation.id)}
        className={cn(
          'group relative w-full flex items-center gap-3 px-5 py-3 transition-colors',
          isActive
            ? 'bg-muted/50'
            : 'hover:bg-muted/30'
        )}
      >
        {isActive && (
          <motion.div
            layoutId="active-indicator"
            className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary"
          />
        )}

        <div className="relative shrink-0">
          <Avatar className="h-11 w-11 border border-border/50">
            <AvatarImage src={conversation.avatar} />
            <AvatarFallback className="bg-muted text-foreground text-sm font-medium">
              {getInitials(conversation.name || 'C')}
            </AvatarFallback>
          </Avatar>
          {conversation.type === 'direct' && isDirectOnline && (
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-emerald-500" />
          )}
          {conversation.type === 'event' && (
            <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center border-2 border-background">
              <Calendar className="h-2 w-2 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <h4 className={cn(
              "text-sm truncate transition-colors",
              isActive ? "font-semibold text-foreground" : "font-medium text-foreground/90",
              conversation.unreadCount > 0 && !isActive && "font-semibold text-foreground"
            )}>
              {conversation.name}
            </h4>
            <span className="text-[11px] text-muted-foreground/60 ml-2">
              {formatLastActivity(conversation.lastMessage?.created_at)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className={cn(
              "text-xs line-clamp-1 transition-colors",
              conversation.unreadCount > 0 ? "text-foreground/80 font-medium" : "text-muted-foreground"
            )}>
              {conversation.lastMessage?.content || 'New conversation'}
            </p>
            {conversation.unreadCount > 0 && (
              <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-primary text-[10px] font-semibold text-primary-foreground flex items-center justify-center">
                {conversation.unreadCount}
              </span>
            )}
          </div>
        </div>
      </button>
    )
  }

  return (
    <div className="flex h-[100dvh] bg-background overflow-hidden">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {showSidebar && window.innerWidth < 1024 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSidebar(false)}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-80 flex flex-col bg-background border-r border-border/50 transition-all duration-300 ease-in-out lg:relative lg:translate-x-0',
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Sidebar Header */}
        <div className="px-5 py-6 border-b border-border/50">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-lg font-semibold tracking-tight">Messages</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleStartNewConversation}
              className="h-9 w-9 rounded-lg hover:bg-muted"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={conversationSearch}
              onChange={(e) => setConversationSearch(e.target.value)}
              placeholder="Search conversations..."
              className="pl-9 h-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/20 rounded-lg"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 border-b border-border/50">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            {[
              { id: 'all', label: 'All' },
              { id: 'direct', label: 'Direct' },
              { id: 'event', label: 'Events' },
              { id: 'unread', label: 'Unread' },
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id as any)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
                  activeFilter === filter.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length > 0 ? (
            <div>
              {filteredConversations.map(renderConversationCard)}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <SearchX className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No conversations found</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {selectedConversationId ? (
            <motion.div
              key={selectedConversationId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-full overflow-hidden"
            >
              {/* Header */}
              <header className="shrink-0 h-16 flex items-center justify-between px-6 border-b border-border/50 bg-background">
                <div className="flex items-center gap-3 min-w-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSidebar(true)}
                    className="lg:hidden h-9 w-9 rounded-lg"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                  <Avatar className="h-10 w-10 border border-border/50">
                    <AvatarImage src={getConversationAvatar() || undefined} />
                    <AvatarFallback className="bg-muted text-foreground font-medium">
                      {getInitials(getConversationTitle())}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold truncate">
                      {getConversationTitle()}
                    </h2>
                    <div className="flex items-center gap-1.5">
                      {selectedConversation?.type === 'direct' ? (
                        <>
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            onlineStatus?.is_online ? "bg-emerald-500" : "bg-muted-foreground/40"
                          )} />
                          <span className="text-[11px] text-muted-foreground">
                            {onlineStatus?.is_online ? 'Active now' : onlineStatus?.last_seen_text || 'Offline'}
                          </span>
                        </>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">
                          {selectedConversation?.participants?.length || 0} participants
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={() => setIsConversationSearchOpen(!isConversationSearchOpen)}>
                  <Search className="h-4 w-4" />
                </Button>
              </header>

              {/* Main content area */}
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Search Overlay */}
                <AnimatePresence>
                  {isConversationSearchOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="shrink-0 bg-background border-b border-border/50 overflow-hidden px-6 py-3"
                    >
                      <ConversationSearch
                        conversationId={selectedConversationId}
                        conversationName={getConversationTitle()}
                        onClose={() => setIsConversationSearchOpen(false)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Messages Area - Scrollable */}
                <div className="flex-1 min-h-0 overflow-hidden">
                  <MessageThread
                    conversationId={selectedConversationId}
                    currentUserId={user?.id || 1}
                    onReply={setReplyingTo}
                    onOpenThread={handleOpenThread}
                  />
                </div>

                {/* Message Input - Sticky at bottom */}
                <div className="shrink-0 p-4 border-t border-border/50 bg-background">
                  <MessageInput
                    conversationId={selectedConversationId}
                    recipientId={selectedUser?.id}
                    replyingTo={replyingTo}
                    onCancelReply={() => setReplyingTo(null)}
                    isGroup={selectedConversationId?.startsWith('event_')}
                  />
                </div>
              </div>
            </motion.div>
          ) : (
            /* Empty State */
            <div className="flex flex-1 flex-col items-center justify-center p-12 text-center animate-in fade-in duration-500">
              <div className="w-24 h-24 bg-primary/10 dark:bg-primary/20 rounded-[2.5rem] flex items-center justify-center mb-8 border border-primary/20 dark:border-primary/20">
                <MessageCircle className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-3xl font-black tracking-tight mb-4">Your Intelligent Network</h2>
              <p className="text-muted-foreground max-w-sm mb-10 text-sm font-medium leading-relaxed">
                Connect with team members, coordinate event logistics, or dive into group discussions.
              </p>
              <Button
                onClick={handleStartNewConversation}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl px-10 h-14 font-black text-sm uppercase tracking-widest shadow-sm transition-all hover:scale-105 active:scale-95"
              >
                Start New Thread
              </Button>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Dialogs */}
      <NewMessageDialog
        isOpen={isNewMessageDialogOpen}
        onClose={() => setIsNewMessageDialogOpen(false)}
        onSelectUser={handleSelectUser}
        onSelectEvent={handleSelectEvent}
      />

      <GlobalSearchDialog
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        onMessageClick={() => { }} // Handle navigation
        onConversationClick={handleSelectConversation}
      />
    </div>
  )
}
