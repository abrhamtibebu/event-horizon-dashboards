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
  const [isInspectorOpen, setIsInspectorOpen] = useState(true)
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
          'group relative w-full flex items-center gap-4 p-4 transition-all duration-300',
          isActive
            ? 'bg-orange-50/50 dark:bg-orange-950/10'
            : 'hover:bg-muted/30'
        )}
      >
        {isActive && (
          <motion.div
            layoutId="active-indicator"
            className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-600 rounded-r-full"
          />
        )}

        <div className="relative shrink-0">
          <Avatar className="h-12 w-12 border-2 border-background shadow-md">
            <AvatarImage src={conversation.avatar} />
            <AvatarFallback className="bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 text-xs font-black">
              {getInitials(conversation.name || 'C')}
            </AvatarFallback>
          </Avatar>
          {conversation.type === 'direct' && isDirectOnline && (
            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-emerald-500 shadow-sm" />
          )}
          {conversation.type === 'event' && (
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center border-2 border-background shadow-sm">
              <Calendar className="h-2.5 w-2.5 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className={cn(
              "text-sm tracking-tight truncate transition-colors",
              isActive ? "font-bold text-orange-600" : "font-semibold text-foreground/90",
              conversation.unreadCount > 0 && !isActive && "text-foreground font-black"
            )}>
              {conversation.name}
            </h4>
            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
              {formatLastActivity(conversation.lastMessage?.created_at)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className={cn(
              "text-xs line-clamp-1 transition-colors",
              conversation.unreadCount > 0 ? "text-foreground font-bold" : "text-muted-foreground/80"
            )}>
              {conversation.lastMessage?.content || 'New conversation'}
            </p>
            {conversation.unreadCount > 0 && (
              <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-orange-600 text-[10px] font-black text-white flex items-center justify-center shadow-sm shadow-orange-600/20">
                {conversation.unreadCount}
              </span>
            )}
          </div>
        </div>
      </button>
    )
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
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
          'fixed inset-y-0 left-0 z-50 w-[360px] flex flex-col border-r border-border/40 bg-background transition-all duration-300 ease-in-out lg:relative lg:translate-x-0',
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Sidebar Header */}
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">Inbox</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleStartNewConversation}
              className="rounded-full h-10 w-10 hover:bg-orange-50 hover:text-orange-600"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>

          {/* Unified Search Bar */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-orange-500 transition-colors" />
            <Input
              value={conversationSearch}
              onChange={(e) => setConversationSearch(e.target.value)}
              placeholder="Search people or events..."
              className="pl-11 h-12 bg-muted/30 border-transparent rounded-2xl focus-visible:ring-1 focus-visible:ring-orange-500/20 transition-all font-medium text-sm"
            />
          </div>

          {/* Minimalist Filters */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {[
              { id: 'all', label: 'All', icon: <MessageCircle className="h-3 w-3" /> },
              { id: 'direct', label: '1:1', icon: <Users className="h-3 w-3" /> },
              { id: 'event', label: 'Events', icon: <Calendar className="h-3 w-3" /> },
              { id: 'unread', label: 'Unread', icon: <Bell className="h-3 w-3" /> },
              { id: 'pinned', label: 'Pinned', icon: <Pin className="h-3 w-3" /> },
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id as any)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border",
                  activeFilter === filter.id
                    ? "bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-600/20"
                    : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted/50"
                )}
              >
                {filter.icon}
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto scrollbar-none pb-6">
          {filteredConversations.length > 0 ? (
            <div className="divide-y divide-border/5">
              {filteredConversations.map(renderConversationCard)}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center opacity-40">
              <SearchX className="h-10 w-10 mb-4" />
              <p className="text-xs font-bold uppercase tracking-widest">No conversations</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-card/30 relative min-w-0">
        <AnimatePresence mode="wait">
          {selectedConversationId ? (
            <motion.div
              key={selectedConversationId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col h-full"
            >
              {/* Premium Navbar */}
              <header className="h-20 flex items-center justify-between px-8 border-b border-border/40 bg-background/50 backdrop-blur-md sticky top-0 z-30">
                <div className="flex items-center gap-4 min-w-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSidebar(true)}
                    className="lg:hidden h-10 w-10 -ml-2 rounded-xl"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                  <Avatar className="h-11 w-11 border-2 border-background shadow-lg">
                    <AvatarImage src={getConversationAvatar() || undefined} />
                    <AvatarFallback className="bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 font-black">
                      {getInitials(getConversationTitle())}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold tracking-tight truncate leading-none mb-1.5">
                      {getConversationTitle()}
                    </h2>
                    <div className="flex items-center gap-1.5">
                      {selectedConversation?.type === 'direct' ? (
                        <>
                          <span className={cn(
                            "w-2 h-2 rounded-full",
                            onlineStatus?.is_online ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-muted-foreground/40"
                          )} />
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            {onlineStatus?.is_online ? 'Active' : onlineStatus?.last_seen_text || 'Offline'}
                          </span>
                        </>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full uppercase tracking-widest">
                            Group Event
                          </span>
                          <span className="w-1 h-1 rounded-full bg-border" />
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            {selectedConversation?.participants?.length || 0} participants
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 hover:bg-orange-50 hover:text-orange-600" onClick={() => setIsConversationSearchOpen(!isConversationSearchOpen)}>
                    <Search className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "rounded-xl h-10 w-10 transition-colors",
                      isInspectorOpen ? "bg-orange-100 text-orange-600 hover:bg-orange-200" : "hover:bg-orange-50 hover:text-orange-600"
                    )}
                    onClick={() => setIsInspectorOpen(!isInspectorOpen)}
                  >
                    <Info className="h-5 w-5" />
                  </Button>
                </div>
              </header>

              <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 flex flex-col min-w-0">
                  {/* Search Overlay */}
                  <AnimatePresence>
                    {isConversationSearchOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-background border-b border-border/40 overflow-hidden px-8 py-3"
                      >
                        <ConversationSearch
                          conversationId={selectedConversationId}
                          conversationName={getConversationTitle()}
                          onClose={() => setIsConversationSearchOpen(false)}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Messages Feed */}
                  <div className="flex-1 min-h-0">
                    <MessageThread
                      conversationId={selectedConversationId}
                      currentUserId={user?.id || 1}
                      onReply={setReplyingTo}
                      onOpenThread={handleOpenThread}
                    />
                  </div>

                  {/* Elegant Input Bar */}
                  <div className="p-6 lg:px-12 bg-background/50 backdrop-blur-md">
                    <MessageInput
                      conversationId={selectedConversationId}
                      recipientId={selectedUser?.id}
                      replyingTo={replyingTo}
                      onCancelReply={() => setReplyingTo(null)}
                      isGroup={selectedConversationId?.startsWith('event_')}
                    />
                  </div>
                </div>

                {/* Information Sidebar */}
                <AnimatePresence>
                  {isInspectorOpen && (
                    <motion.aside
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 380, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      className="border-l border-border/40 bg-background flex flex-col overflow-hidden"
                    >
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
                        <div className="flex flex-col h-full p-6">
                          <div className="flex items-center justify-between mb-8">
                            <h3 className="font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Analytics & Context</h3>
                            <Button variant="ghost" size="icon" onClick={() => setIsInspectorOpen(false)} className="h-8 w-8 rounded-full">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="flex-1 overflow-y-auto scrollbar-none">
                            <ConversationInfoPanel
                              conversation={selectedConversation}
                              onClose={() => setIsInspectorOpen(false)}
                              messages={[]}
                            />
                          </div>
                        </div>
                      )}
                    </motion.aside>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            /* Empty State */
            <div className="flex flex-1 flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-500">
              <div className="w-24 h-24 bg-orange-100 dark:bg-orange-950/20 rounded-[2.5rem] flex items-center justify-center mb-8 border border-orange-200/50 dark:border-orange-800/50 relative">
                <div className="absolute inset-0 bg-orange-500 rounded-[2.5rem] blur-2xl opacity-10 animate-pulse" />
                <MessageCircle className="h-10 w-10 text-orange-600 dark:text-orange-400 relative z-10" />
              </div>
              <h2 className="text-3xl font-black tracking-tight mb-4">Your Intelligent Network</h2>
              <p className="text-muted-foreground max-w-sm mb-10 text-sm font-medium leading-relaxed">
                Connect with team members, coordinate event logistics, or dive into group discussions.
              </p>
              <Button
                onClick={handleStartNewConversation}
                className="bg-orange-600 hover:bg-orange-700 text-white rounded-2xl px-10 h-14 font-black text-sm uppercase tracking-widest shadow-xl shadow-orange-600/20 transition-all hover:scale-105 active:scale-95"
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
