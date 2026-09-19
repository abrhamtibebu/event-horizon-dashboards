import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { MessageCircle, Search, Info, Calendar, Menu, SearchX, SquarePen } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { MessageThread } from '../components/messaging/MessageThread'
import { MessageInput } from '../components/messaging/MessageInput'
import { ConversationInfoPanel } from '../components/messaging/ConversationInfoPanel'
import { NewMessageDialog } from '../components/messaging/NewMessageDialog'
import { GlobalSearchDialog } from '../components/messaging/GlobalSearchDialog'
import { ConversationSearch } from '../components/messaging/ConversationSearch'
import { useConversations, useMarkConversationRead } from '../hooks/use-messages'
import { useAuth } from '../hooks/use-auth'
import { usePermissionCheck } from '../hooks/use-permission-check'
import { useRealtimeMessages, setNotificationClickCallback } from '../hooks/use-realtime-messages'
import { useSingleUserOnlineStatus, useRealtimeOnlineStatus } from '../hooks/use-online-status'
import { useSearchParams } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { UsherMobileLayout } from '@/components/UsherMobileLayout'
import {
  resolveConversationRecipient,
  resolveReplyRecipient,
  uniqueCounterpartiesFromMessages,
} from '@/lib/messaging-recipient'
import type { Conversation, Message, User, Event } from '../types/message'

function useIsBelowLg() {
  const [isBelow, setIsBelow] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 1023px)').matches : false
  )
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const onChange = () => setIsBelow(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return isBelow
}

export default function Messages() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isNewMessageDialogOpen, setIsNewMessageDialogOpen] = useState(false)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [showSidebar, setShowSidebar] = useState(true)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false)
  const [isConversationSearchOpen, setIsConversationSearchOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<'all' | 'direct' | 'event' | 'unread' | 'pinned'>('all')
  const [conversationSearch, setConversationSearch] = useState('')
  const [threadMessages, setThreadMessages] = useState<Message[]>([])
  const onOptimisticMessageRef = useRef<((message: any) => void) | null>(null)
  const hasMarkedAsRead = useRef<string | null>(null)
  const deepLinkApplied = useRef(false)
  const isBelowLg = useIsBelowLg()

  const { data: conversationsData = [] } = useConversations()
  const markConversationReadMutation = useMarkConversationRead()
  const { user } = useAuth()
  const { checkPermission } = usePermissionCheck()
  const [searchParams] = useSearchParams()

  const otherUserId = selectedUser?.id || null
  const { data: onlineStatus } = useSingleUserOnlineStatus(otherUserId)
  useRealtimeMessages()

  const conversations = Array.isArray(conversationsData)
    ? conversationsData
    : Array.isArray((conversationsData as any)?.data)
      ? (conversationsData as any).data
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

  const { isUserOnline } = useRealtimeOnlineStatus(participantIds)

  const eventCounterparties = useMemo(
    () => uniqueCounterpartiesFromMessages(threadMessages, user?.id ? Number(user.id) : null),
    [threadMessages, user?.id]
  )

  const filteredConversations = useMemo(() => {
    let data = [...conversations]
    if (activeFilter === 'direct') data = data.filter((c: Conversation) => c.type === 'direct')
    else if (activeFilter === 'event') data = data.filter((c: Conversation) => c.type === 'event')
    else if (activeFilter === 'unread') data = data.filter((c: Conversation) => (c.unreadCount || 0) > 0)
    else if (activeFilter === 'pinned') data = data.filter((c: Conversation) => !!c.is_pinned)

    if (conversationSearch.trim()) {
      const search = conversationSearch.toLowerCase()
      data = data.filter((conversation: Conversation) =>
        conversation.name?.toLowerCase().includes(search)
      )
    }
    return data
  }, [conversations, activeFilter, conversationSearch])

  const applyConversationSelection = useCallback((conversationId: string, list: Conversation[] = conversations) => {
    setSelectedConversationId(conversationId)
    setReplyingTo(null)
    setIsDetailsOpen(false)
    const conversation = list.find((c: Conversation) => c.id === conversationId)
    if (conversation) {
      if (conversation.type === 'direct') {
        setSelectedUser(conversation.participants?.[0] || null)
        setSelectedEvent(null)
      } else if (conversation.type === 'event') {
        setSelectedEvent(conversation.event || null)
        const recipient = resolveConversationRecipient(conversation, user?.id ? Number(user.id) : null)
        setSelectedUser(recipient)
      }
    }
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches) {
      setShowSidebar(false)
    }
  }, [conversations, user?.id])

  useEffect(() => {
    setNotificationClickCallback((conversationId: string) => {
      applyConversationSelection(conversationId)
    })
  }, [applyConversationSelection])

  useEffect(() => {
    if (deepLinkApplied.current) return
    const conversationId = searchParams.get('conversationId')
    const userId = searchParams.get('userId') || searchParams.get('user')
    const eventId = searchParams.get('eventId')
    const compose = searchParams.get('compose')

    if (compose === '1') {
      deepLinkApplied.current = true
      setIsNewMessageDialogOpen(true)
      return
    }

    if (conversationId) {
      deepLinkApplied.current = true
      if (conversations.length > 0) {
        applyConversationSelection(conversationId)
      } else {
        setSelectedConversationId(conversationId)
        if (conversationId.startsWith('direct_')) {
          const id = Number(conversationId.replace('direct_', ''))
          if (id) setSelectedUser({ id, name: 'User', email: '', role: '', created_at: '', updated_at: '' })
        } else if (conversationId.startsWith('event_')) {
          const id = Number(conversationId.replace('event_', ''))
          if (id) setSelectedEvent({ id, title: 'Event', description: '', start_date: '', end_date: '', location: '', organizer_id: 0, created_at: '', updated_at: '' })
        }
      }
      return
    }

    if (userId) {
      deepLinkApplied.current = true
      const id = Number(userId)
      setSelectedConversationId(`direct_${id}`)
      const existing = conversations.find((c: Conversation) => c.id === `direct_${id}`)
      setSelectedUser(existing?.participants?.[0] || { id, name: 'User', email: '', role: '', created_at: '', updated_at: '' })
      setSelectedEvent(null)
      return
    }

    if (eventId) {
      deepLinkApplied.current = true
      applyConversationSelection(`event_${eventId}`)
    }
  }, [searchParams, conversations, applyConversationSelection])

  useEffect(() => {
    if (!selectedConversationId || conversations.length === 0) return
    if (hasMarkedAsRead.current === selectedConversationId) return
    const conversation = conversations.find((c: Conversation) => c.id === selectedConversationId)
    if (!conversation) return

    const readData: Record<string, number> = {}
    if (selectedConversationId.startsWith('direct_') && conversation.participants?.[0]) {
      readData.other_user_id = conversation.participants[0].id
    } else if (selectedConversationId.startsWith('event_')) {
      const eventId = conversation.event?.id || Number(selectedConversationId.replace('event_', ''))
      if (eventId) readData.event_id = eventId
    }

    if (Object.keys(readData).length > 0) {
      hasMarkedAsRead.current = selectedConversationId
      setTimeout(() => markConversationReadMutation.mutate(readData), 400)
    }
  }, [selectedConversationId, conversations, markConversationReadMutation])

  const handleSelectConversation = (conversationId: string) => {
    applyConversationSelection(conversationId)
  }

  const handleReply = useCallback((message: Message) => {
    setReplyingTo(message)
    const replyUser = resolveReplyRecipient(message, user?.id ? Number(user.id) : null)
    if (replyUser) setSelectedUser(replyUser)
  }, [user?.id])

  const handleStartNewConversation = () => {
    if (!checkPermission('messages.send', 'send messages')) return
    setIsNewMessageDialogOpen(true)
  }

  const handleSelectUser = (nextUser: User) => {
    setSelectedUser(nextUser)
    setSelectedEvent(null)
    setSelectedConversationId(`direct_${nextUser.id}`)
    setShowSidebar(false)
  }

  const getConversationTitle = () =>
    selectedUser?.name || selectedEvent?.title || selectedConversation?.name || 'Messages'

  const getConversationAvatar = () =>
    selectedUser?.profile_image || selectedEvent?.image_url || selectedConversation?.avatar || null

  const getInitials = (name: string) =>
    name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)

  const formatLastActivity = (timestamp?: string) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMin = (now.getTime() - date.getTime()) / 60000
    if (diffInMin < 1) return 'now'
    if (diffInMin < 60) return `${Math.floor(diffInMin)}m`
    if (diffInMin < 1440) return `${Math.floor(diffInMin / 60)}h`
    if (diffInMin < 10080) return `${Math.floor(diffInMin / 1440)}d`
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  const handleGlobalMessageClick = (message: Message) => {
    if (message.event_id) {
      applyConversationSelection(`event_${message.event_id}`)
    } else {
      const otherId = message.sender_id === user?.id ? message.recipient_id : message.sender_id
      applyConversationSelection(`direct_${otherId}`)
    }
  }

  const renderConversationCard = (conversation: Conversation) => {
    const isActive = conversation.id === selectedConversationId
    const participant = conversation.participants?.[0]
    const isDirectOnline = conversation.type === 'direct' && participant ? isUserOnline(participant.id) : false
    const unread = (conversation.unreadCount || 0) > 0

    return (
      <button
        key={conversation.id}
        onClick={() => handleSelectConversation(conversation.id)}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
          isActive ? 'bg-muted/70' : 'hover:bg-muted/40'
        )}
      >
        <div className="relative shrink-0">
          <Avatar className="h-14 w-14">
            <AvatarImage src={conversation.avatar} />
            <AvatarFallback className="bg-muted text-sm font-medium">
              {getInitials(conversation.name || 'C')}
            </AvatarFallback>
          </Avatar>
          {conversation.type === 'direct' && isDirectOnline && (
            <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-emerald-500" />
          )}
          {conversation.type === 'event' && (
            <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-sky-500 flex items-center justify-center border-2 border-background">
              <Calendar className="h-2 w-2 text-white" />
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <h4 className={cn('text-sm truncate', unread || isActive ? 'font-semibold' : 'font-medium')}>
              {conversation.name}
            </h4>
            <span className="text-[11px] text-muted-foreground shrink-0">
              {formatLastActivity(conversation.lastMessage?.created_at)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className={cn('text-xs line-clamp-1', unread ? 'text-foreground font-medium' : 'text-muted-foreground')}>
              {conversation.lastMessage?.content || 'New conversation'}
            </p>
            {unread && <span className="h-2 w-2 rounded-full bg-sky-500 shrink-0" />}
          </div>
        </div>
      </button>
    )
  }

  const content = (
    <div
      className={cn(
        'flex bg-background overflow-hidden border border-border rounded-xl',
        user?.role === 'usher' ? 'h-[calc(100vh-130px)] md:h-[calc(100vh-96px)]' : 'h-[calc(100vh-112px)]'
      )}
    >
      <AnimatePresence>
        {showSidebar && isBelowLg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSidebar(false)}
            className="fixed inset-0 z-40 bg-background/70 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[380px] max-w-[90vw] flex flex-col bg-background border-r border-border transition-transform duration-300 lg:relative lg:translate-x-0',
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="px-4 py-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold tracking-tight">Messages</h1>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsGlobalSearchOpen(true)}
                className="h-9 w-9 rounded-full"
              >
                <Search className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleStartNewConversation}
                className="h-9 w-9 rounded-full"
              >
                <SquarePen className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={conversationSearch}
              onChange={(e) => setConversationSearch(e.target.value)}
              placeholder="Search"
              className="pl-9 h-9 bg-muted/50 border-0 rounded-xl"
            />
          </div>
        </div>

        <div className="px-4 py-2 border-b border-border">
          <div className="flex items-center gap-4 overflow-x-auto scrollbar-none text-sm">
            {([
              { id: 'all', label: 'All' },
              { id: 'direct', label: 'Direct' },
              { id: 'event', label: 'Events' },
              { id: 'unread', label: 'Unread' },
              { id: 'pinned', label: 'Pinned' },
            ] as const).map(filter => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={cn(
                  'pb-2 whitespace-nowrap border-b-2 transition-colors',
                  activeFilter === filter.id
                    ? 'border-foreground text-foreground font-semibold'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length > 0 ? (
            filteredConversations.map(renderConversationCard)
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <SearchX className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No conversations found</p>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 flex min-w-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <AnimatePresence mode="wait">
            {selectedConversationId ? (
              <motion.div
                key={selectedConversationId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col h-full overflow-hidden"
              >
                <header className="shrink-0 h-14 flex items-center justify-between px-4 border-b border-border bg-background">
                  <div className="flex items-center gap-3 min-w-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowSidebar(true)}
                      className="lg:hidden h-9 w-9 rounded-full"
                    >
                      <Menu className="h-4 w-4" />
                    </Button>
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={getConversationAvatar() || undefined} />
                      <AvatarFallback className="bg-muted text-sm">
                        {getInitials(getConversationTitle())}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold truncate">{getConversationTitle()}</h2>
                      <p className="text-[11px] text-muted-foreground">
                        {selectedConversation?.type === 'direct'
                          ? (onlineStatus?.is_online ? 'Active now' : onlineStatus?.last_seen_text || 'Offline')
                          : 'Event chat'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full"
                      onClick={() => setIsConversationSearchOpen(v => !v)}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full"
                      onClick={() => setIsDetailsOpen(v => !v)}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </div>
                </header>

                <AnimatePresence>
                  {isConversationSearchOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="shrink-0 border-b border-border overflow-hidden px-4 py-3"
                    >
                      <ConversationSearch
                        conversationId={selectedConversationId}
                        conversationName={getConversationTitle()}
                        onClose={() => setIsConversationSearchOpen(false)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {selectedConversation?.type === 'event' && !selectedUser && eventCounterparties.length > 0 && (
                  <div className="shrink-0 px-4 py-2 border-b border-border flex items-center gap-2 overflow-x-auto">
                    <span className="text-xs text-muted-foreground shrink-0">To:</span>
                    {eventCounterparties.map((person) => (
                      <button
                        key={person.id}
                        type="button"
                        onClick={() => setSelectedUser(person)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs hover:bg-muted"
                      >
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={person.profile_image} />
                          <AvatarFallback className="text-[9px]">{getInitials(person.name)}</AvatarFallback>
                        </Avatar>
                        {person.name}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  <MessageThread
                    conversationId={selectedConversationId}
                    currentUserId={user?.id ? Number(user.id) : 1}
                    onReply={handleReply}
                    onOptimisticMessage={(fn) => { onOptimisticMessageRef.current = fn }}
                    onMessagesChange={setThreadMessages}
                  />
                </div>

                <div className="shrink-0 p-3 border-t border-border bg-background">
                  <MessageInput
                    conversationId={selectedConversationId}
                    recipientId={selectedUser?.id}
                    replyingTo={replyingTo}
                    onCancelReply={() => setReplyingTo(null)}
                    isGroup={selectedConversationId?.startsWith('event_')}
                    onOptimisticMessage={(msg) => onOptimisticMessageRef.current?.(msg)}
                  />
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center p-10 text-center">
                <div className="w-20 h-20 rounded-full border border-border flex items-center justify-center mb-6">
                  <MessageCircle className="h-9 w-9 text-foreground" />
                </div>
                <h2 className="text-2xl font-light tracking-tight mb-2">Your messages</h2>
                <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                  Send a message to start a chat.
                </p>
                <Button onClick={handleStartNewConversation} className="rounded-lg px-5">
                  Send message
                </Button>
              </div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {isDetailsOpen && selectedConversation && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 360, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="hidden xl:flex border-l border-border overflow-hidden"
            >
              <div className="w-[360px] h-full">
                <ConversationInfoPanel
                  conversation={selectedConversation}
                  onClose={() => setIsDetailsOpen(false)}
                  messages={threadMessages}
                />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </main>

      <NewMessageDialog
        isOpen={isNewMessageDialogOpen}
        onClose={() => setIsNewMessageDialogOpen(false)}
        onSelectUser={handleSelectUser}
      />

      <GlobalSearchDialog
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        onMessageClick={handleGlobalMessageClick}
        onConversationClick={handleSelectConversation}
      />
    </div>
  )

  if (user?.role === 'usher') {
    return <UsherMobileLayout title="Messages">{content}</UsherMobileLayout>
  }

  return content
}
