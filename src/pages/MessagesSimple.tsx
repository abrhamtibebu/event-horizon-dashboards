import React, { useState, useEffect, useMemo } from 'react'
import { MessageCircle, Send, Search, X } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { ScrollArea } from '../components/ui/scroll-area'
import { useWebSocketMessages } from '../hooks/use-websocket-messages'
import { useAuth } from '../hooks/use-auth'
import { getMessagingContacts } from '../lib/api'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import type { Conversation, Message, User } from '../types/message'

export default function MessagesSimple() {
  const { user } = useAuth()
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [messageContent, setMessageContent] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false)
  const [newConversationSearch, setNewConversationSearch] = useState('')

  const { data: contactsData = [] } = useQuery({
    queryKey: ['messagingContacts'],
    queryFn: getMessagingContacts,
    enabled: isNewConversationOpen,
  })

  const contacts = Array.isArray(contactsData) 
    ? contactsData 
    : Array.isArray(contactsData?.data) 
      ? contactsData.data 
      : []

  const filteredContacts = useMemo(() => {
    if (!newConversationSearch) return contacts
    const query = newConversationSearch.toLowerCase()
    return contacts.filter((contact: User) =>
      contact.name.toLowerCase().includes(query) ||
      contact.email.toLowerCase().includes(query)
    )
  }, [contacts, newConversationSearch])

  const {
    messages,
    conversations,
    isLoading,
    sendMessage,
    markAsRead,
  } = useWebSocketMessages({
    conversationId: selectedConversationId,
  })

  // Mark conversation as read when selected
  useEffect(() => {
    if (selectedConversationId) {
      markAsRead(selectedConversationId)
    }
  }, [selectedConversationId, markAsRead])

  // Filter conversations by search
  const filteredConversations = useMemo(() => {
    if (!searchQuery) return conversations
    const query = searchQuery.toLowerCase()
    return conversations.filter((conv: Conversation) => {
      if (conv.type === 'direct' && conv.participants?.[0]) {
        return (
          conv.participants[0].name.toLowerCase().includes(query) ||
          conv.participants[0].email.toLowerCase().includes(query)
        )
      }
      if (conv.type === 'event' && conv.event) {
        return conv.event.title.toLowerCase().includes(query)
      }
      return false
    })
  }, [conversations, searchQuery])

  // Get selected conversation
  const selectedConversation = useMemo(() => {
    return conversations.find((c: Conversation) => c.id === selectedConversationId) || null
  }, [conversations, selectedConversationId])

  // Get conversation name
  const getConversationName = (conv: Conversation) => {
    if (conv.type === 'direct' && conv.participants?.[0]) {
      return conv.participants[0].name
    }
    if (conv.type === 'event' && conv.event) {
      return conv.event.title
    }
    return 'Unknown'
  }

  // Get conversation avatar
  const getConversationAvatar = (conv: Conversation) => {
    if (conv.type === 'direct' && conv.participants?.[0]) {
      return conv.participants[0].profile_image
    }
    return null
  }

  // Handle sending message
  const handleSendMessage = async () => {
    if (!messageContent.trim() || !selectedConversation) return

    try {
      if (selectedConversation.type === 'direct' && selectedConversation.participants?.[0]) {
        await sendMessage(messageContent, selectedConversation.participants[0].id)
      } else if (selectedConversation.type === 'event' && selectedConversation.event) {
        await sendMessage(messageContent, undefined, selectedConversation.event.id)
      }
      setMessageContent('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  // Format message time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  if (isLoading && conversations.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-slate-900">
        <div className="text-center">
          <MessageCircle className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500 animate-pulse" />
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
      {/* Sidebar */}
      <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Messages</h1>
            <Button
              size="sm"
              onClick={() => setIsNewConversationOpen(true)}
              className="bg-primary hover:bg-primary/90"
            >
              New
            </Button>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-slate-500 dark:text-slate-400">
              <p>No conversations found</p>
            </div>
          ) : (
            filteredConversations.map((conv: Conversation) => {
              const isSelected = conv.id === selectedConversationId
              const name = getConversationName(conv)
              const avatar = getConversationAvatar(conv)
              const unread = (conv.unreadCount || 0) > 0

              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversationId(conv.id)}
                  className={cn(
                    'w-full p-4 text-left border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors',
                    isSelected && 'bg-slate-100 dark:bg-slate-800'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={avatar || undefined} />
                      <AvatarFallback className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate text-slate-900 dark:text-white">{name}</p>
                        {conv.lastMessage && (
                          <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                            {formatTime(conv.lastMessage.created_at)}
                          </span>
                        )}
                      </div>
                      {conv.lastMessage && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 truncate mt-1">
                          {conv.lastMessage.content}
                        </p>
                      )}
                    </div>
                    {unread && (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={getConversationAvatar(selectedConversation) || undefined} />
                  <AvatarFallback className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {getConversationName(selectedConversation).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{getConversationName(selectedConversation)}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {selectedConversation.type === 'direct' ? 'Direct message' : 'Event chat'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-slate-900">
              {messages.length === 0 ? (
                <div className="text-center text-slate-500 dark:text-slate-400 mt-8">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message: Message) => {
                  const isOwn = message.sender_id === user?.id
                  const sender = message.sender

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        'flex gap-3',
                        isOwn && 'flex-row-reverse'
                      )}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={sender?.profile_image || undefined} />
                        <AvatarFallback className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {sender?.name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className={cn('flex flex-col max-w-[70%]', isOwn && 'items-end')}>
                        <div
                          className={cn(
                            'rounded-lg px-4 py-2',
                            isOwn
                              ? 'bg-primary text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                          )}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {formatTime(message.created_at)}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageContent.trim()}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-900">
            <div className="text-center">
              <MessageCircle className="mx-auto h-16 w-16 text-slate-400 dark:text-slate-500 mb-4" />
              <p className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Select a conversation</p>
              <p className="text-slate-600 dark:text-slate-400">Choose a conversation from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* New Conversation Dialog */}
      <Dialog open={isNewConversationOpen} onOpenChange={setIsNewConversationOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white">New Conversation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Search users..."
              value={newConversationSearch}
              onChange={(e) => setNewConversationSearch(e.target.value)}
              className="bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            <ScrollArea className="h-96">
              {filteredContacts.length === 0 ? (
                <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                  <p>No contacts found</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredContacts.map((contact: User) => (
                    <button
                      key={contact.id}
                      onClick={() => {
                        setSelectedConversationId(`direct_${contact.id}`)
                        setIsNewConversationOpen(false)
                        setNewConversationSearch('')
                      }}
                      className="w-full p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left flex items-center gap-3"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={contact.profile_image || undefined} />
                        <AvatarFallback className="bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300">
                          {contact.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{contact.name}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{contact.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

