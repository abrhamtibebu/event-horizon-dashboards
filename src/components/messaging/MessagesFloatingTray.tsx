import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Maximize2,
  MessageCircle,
  SquarePen,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageThread } from '@/components/messaging/MessageThread'
import { MessageInput } from '@/components/messaging/MessageInput'
import { MessagesComposeView } from '@/components/messaging/MessagesComposeView'
import { useMessagesTray } from '@/components/messaging/MessagesTrayContext'
import { useConversations, useMarkConversationRead } from '@/hooks/use-messages'
import { useAuth } from '@/hooks/use-auth'
import { usePermissionCheck } from '@/hooks/use-permission-check'
import { useRealtimeMessages } from '@/hooks/use-realtime-messages'
import { useSingleUserOnlineStatus } from '@/hooks/use-online-status'
import {
  resolveConversationRecipient,
  resolveReplyRecipient,
  uniqueCounterpartiesFromMessages,
} from '@/lib/messaging-recipient'
import { cn } from '@/lib/utils'
import type { Conversation, Message, User } from '@/types/message'

function getInitials(name: string) {
  return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
}

function formatLastActivity(timestamp?: string) {
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

export function MessagesFloatingTray() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { checkPermission } = usePermissionCheck()
  const {
    view,
    conversationId,
    openInbox,
    openChat,
    openCompose,
    backToInbox,
    collapse,
  } = useMessagesTray()
  const { data: conversationsData = [] } = useConversations()
  const markConversationReadMutation = useMarkConversationRead()
  const hasMarkedAsRead = useRef<string | null>(null)
  const onOptimisticMessageRef = useRef<((message: any) => void) | null>(null)

  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [threadMessages, setThreadMessages] = useState<Message[]>([])

  useRealtimeMessages()

  const hideOnMessagesPage = location.pathname.includes('/dashboard/messages')

  const conversations: Conversation[] = Array.isArray(conversationsData)
    ? conversationsData
    : Array.isArray((conversationsData as any)?.data)
      ? (conversationsData as any).data
      : []

  const unreadCount = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0)
  const recentAvatars = conversations.slice(0, 2)

  const selectedConversation = useMemo(
    () => conversations.find(c => c.id === conversationId) || null,
    [conversations, conversationId]
  )

  const otherUserId = selectedUser?.id || null
  const { data: onlineStatus } = useSingleUserOnlineStatus(otherUserId)

  const eventCounterparties = useMemo(
    () => uniqueCounterpartiesFromMessages(threadMessages, user?.id ? Number(user.id) : null),
    [threadMessages, user?.id]
  )

  useEffect(() => {
    if (view !== 'chat' || !conversationId) return
    const conversation = conversations.find(c => c.id === conversationId)
    if (!conversation) {
      if (conversationId.startsWith('direct_')) {
        const id = Number(conversationId.replace('direct_', ''))
        setSelectedUser(prev => prev?.id === id ? prev : {
          id,
          name: 'User',
          email: '',
          role: '',
          created_at: '',
          updated_at: '',
        })
      }
      return
    }

    if (conversation.type === 'direct') {
      setSelectedUser(conversation.participants?.[0] || null)
    } else {
      setSelectedUser(resolveConversationRecipient(conversation, user?.id ? Number(user.id) : null))
    }
  }, [view, conversationId, conversations, user?.id])

  useEffect(() => {
    if (view !== 'chat' || !conversationId || !selectedConversation) return
    if (hasMarkedAsRead.current === conversationId) return

    const readData: Record<string, number> = {}
    if (conversationId.startsWith('direct_') && selectedConversation.participants?.[0]) {
      readData.other_user_id = selectedConversation.participants[0].id
    } else if (conversationId.startsWith('event_')) {
      const eventId = selectedConversation.event?.id || Number(conversationId.replace('event_', ''))
      if (eventId) readData.event_id = eventId
    }

    if (Object.keys(readData).length > 0) {
      hasMarkedAsRead.current = conversationId
      markConversationReadMutation.mutate(readData)
    }
  }, [view, conversationId, selectedConversation, markConversationReadMutation])

  const handleReply = useCallback((message: Message) => {
    setReplyingTo(message)
    const replyUser = resolveReplyRecipient(message, user?.id ? Number(user.id) : null)
    if (replyUser) setSelectedUser(replyUser)
  }, [user?.id])

  const handleComposeChat = (nextUser: User) => {
    setSelectedUser(nextUser)
    setReplyingTo(null)
    openChat(`direct_${nextUser.id}`)
  }

  const handleStartCompose = () => {
    if (!checkPermission('messages.send', 'send messages')) return
    openCompose()
  }

  const handleMaximize = () => {
    if (view === 'chat' && conversationId) {
      navigate(`/dashboard/messages?conversationId=${conversationId}`)
    } else if (view === 'compose') {
      navigate('/dashboard/messages?compose=1')
    } else {
      navigate('/dashboard/messages')
    }
    collapse()
  }

  const title =
    selectedUser?.name ||
    selectedConversation?.name ||
    'Messages'

  const avatar =
    selectedUser?.profile_image ||
    selectedConversation?.avatar ||
    undefined

  if (hideOnMessagesPage) return null

  const showPanel = view === 'inbox' || view === 'chat' || view === 'compose'

  return (
    <div className="fixed bottom-4 right-4 z-[60] hidden md:block">
      {view === 'collapsed' && (
        <button
          type="button"
          onClick={openInbox}
          className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-lg hover:bg-muted/40 transition-colors min-w-[220px]"
        >
          <div className="relative">
            <MessageCircle className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 h-4 min-w-4 px-1 rounded-full bg-red-500 text-[10px] font-semibold text-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <span className="text-sm font-semibold flex-1 text-left">Messages</span>
          <div className="flex -space-x-2">
            {recentAvatars.map((c) => (
              <Avatar key={c.id} className="h-6 w-6 border-2 border-card">
                <AvatarImage src={c.avatar} />
                <AvatarFallback className="text-[9px] bg-muted">
                  {getInitials(c.name || '?')}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        </button>
      )}

      {showPanel && (
        <div className="w-[380px] h-[520px] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col">
          {view === 'inbox' && (
            <div className="relative flex flex-col h-full">
              <div className="h-14 px-4 border-b border-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold">Messages</h3>
                  {unreadCount > 0 && (
                    <span className="h-5 min-w-5 px-1.5 rounded-full bg-red-500 text-[11px] font-semibold text-white flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={handleMaximize}>
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={collapse}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pb-16">
                {conversations.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                    <MessageCircle className="h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">No conversations yet</p>
                  </div>
                ) : (
                  conversations.map((conversation) => {
                    const unread = (conversation.unreadCount || 0) > 0
                    return (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() => openChat(conversation.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 text-left"
                      >
                        <Avatar className="h-12 w-12 shrink-0">
                          <AvatarImage src={conversation.avatar} />
                          <AvatarFallback className="bg-muted text-xs">
                            {getInitials(conversation.name || '?')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={cn('text-sm truncate', unread ? 'font-semibold' : 'font-medium')}>
                              {conversation.name}
                            </p>
                            <span className="text-[11px] text-muted-foreground shrink-0">
                              {formatLastActivity(conversation.lastMessage?.created_at)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <p className={cn('text-xs truncate', unread ? 'text-foreground' : 'text-muted-foreground')}>
                              {conversation.lastMessage?.content || 'New conversation'}
                            </p>
                            {unread && <span className="h-2 w-2 rounded-full bg-sky-500 shrink-0" />}
                          </div>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>

              <Button
                size="icon"
                className="absolute bottom-4 right-4 h-12 w-12 rounded-full shadow-lg"
                onClick={handleStartCompose}
              >
                <SquarePen className="h-5 w-5" />
              </Button>
            </div>
          )}

          {view === 'compose' && (
            <div className="flex flex-col h-full min-h-0">
              <div className="h-14 px-2 border-b border-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1 min-w-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={backToInbox}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <h3 className="text-sm font-semibold">New message</h3>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={collapse}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <MessagesComposeView
                enabled={view === 'compose'}
                onChat={handleComposeChat}
                className="flex-1 min-h-0"
              />
            </div>
          )}

          {view === 'chat' && (
            <>
              <div className="h-14 px-2 border-b border-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1 min-w-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full shrink-0" onClick={backToInbox}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={avatar} />
                    <AvatarFallback className="text-[10px] bg-muted">
                      {getInitials(title)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 pl-1">
                    <p className="text-sm font-semibold truncate">{title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {selectedConversation?.type === 'direct'
                        ? (onlineStatus?.is_online ? 'Active now' : onlineStatus?.last_seen_text || 'Offline')
                        : 'Event chat'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={handleMaximize}>
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={collapse}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {selectedConversation?.type === 'event' && !selectedUser && eventCounterparties.length > 0 && (
                <div className="px-3 py-2 border-b border-border flex items-center gap-2 overflow-x-auto">
                  <span className="text-[11px] text-muted-foreground shrink-0">To:</span>
                  {eventCounterparties.map((person) => (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => setSelectedUser(person)}
                      className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] hover:bg-muted"
                    >
                      {person.name}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex-1 min-h-0 overflow-hidden">
                <MessageThread
                  conversationId={conversationId}
                  currentUserId={user?.id ? Number(user.id) : 1}
                  onReply={handleReply}
                  onOptimisticMessage={(fn) => { onOptimisticMessageRef.current = fn }}
                  onMessagesChange={setThreadMessages}
                  compact
                />
              </div>

              <div className="p-2 border-t border-border shrink-0">
                <MessageInput
                  conversationId={conversationId}
                  recipientId={selectedUser?.id}
                  replyingTo={replyingTo}
                  onCancelReply={() => setReplyingTo(null)}
                  isGroup={Boolean(conversationId?.startsWith('event_'))}
                  variant="compact"
                  onOptimisticMessage={(msg) => onOptimisticMessageRef.current?.(msg)}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
