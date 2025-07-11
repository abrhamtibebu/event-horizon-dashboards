import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { MessageSquare, Search, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DashboardCard } from '@/components/DashboardCard'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import api, {
  getEventMessages,
  sendEventMessage,
  markMessageRead,
  getUnreadMessageCount,
  getUnreadMessages,
  getEventUshers,
  getEventById,
} from '@/lib/api'
import { useAuth } from '@/hooks/use-auth'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function Messages() {
  const { eventId } = useParams()
  const { user } = useAuth()
  const [conversations, setConversations] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null)
  const [newMessage, setNewMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState<any[]>([])
  const [showNewConv, setShowNewConv] = useState(false)
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [adminPairs, setAdminPairs] = useState<any[]>([])
  const [selectedAdminPair, setSelectedAdminPair] = useState<{
    organizer: any
    usher: any
  } | null>(null)
  const [adminEventId, setAdminEventId] = useState<string | null>(null)
  const [adminEvents, setAdminEvents] = useState<any[]>([])

  // Fetch conversations (for demo, use event participants as conversations)
  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'superadmin' && !eventId) {
      // Fetch all events for admin event selector
      api
        .get('/events')
        .then((res) => setAdminEvents(res.data))
        .catch(() => setAdminEvents([]))
    }
  }, [user, eventId])

  useEffect(() => {
    // For admin: use eventId from URL or from adminEventId selector
    const effectiveEventId = eventId || adminEventId
    if (!effectiveEventId || !user) return
    setLoading(true)
    if (user.role === 'admin' || user.role === 'superadmin') {
      Promise.all([
        getEventUshers(effectiveEventId),
        getEventById(effectiveEventId),
      ])
        .then(([ushersRes, eventRes]) => {
          const ushers = ushersRes.data || []
          const organizer = eventRes.data.organizer
          if (organizer && ushers.length > 0) {
            setAdminPairs(ushers.map((u: any) => ({ organizer, usher: u })))
            setSelectedAdminPair(null)
          }
        })
        .catch(() => setAdminPairs([]))
        .finally(() => setLoading(false))
    } else {
      // ... existing organizer/usher logic ...
      Promise.all([
        getEventUshers(effectiveEventId),
        getEventById(effectiveEventId),
      ])
        .then(([ushersRes, eventRes]) => {
          const ushers = ushersRes.data || []
          const organizer = eventRes.data.organizer
          let convs = []
          if (user.role === 'organizer') {
            convs = ushers.map((u: any) => ({
              id: u.id,
              name: u.name,
              email: u.email,
            }))
          } else if (user.role === 'usher') {
            convs = organizer
              ? [
                  {
                    id: organizer.id,
                    name: organizer.name,
                    email: organizer.email,
                  },
                ]
              : []
          }
          setConversations(convs)
          if (convs.length > 0) setSelectedConversation(convs[0].id.toString())
        })
        .catch(() => setConversations([]))
        .finally(() => setLoading(false))
    }
  }, [eventId, adminEventId, user])

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!eventId || !selectedConversation) return
    setLoading(true)
    getEventMessages(eventId)
      .then((res) => {
        // Filter messages for this conversation (between current user and selected participant)
        setMessages(
          res.data.filter(
            (m: any) =>
              (m.sender_id === user.id &&
                m.recipient_id === Number(selectedConversation)) ||
              (m.sender_id === Number(selectedConversation) &&
                m.recipient_id === user.id)
          )
        )
      })
      .catch(() => setMessages([]))
      .finally(() => setLoading(false))
  }, [eventId, selectedConversation, user.id])

  // Fetch unread count
  useEffect(() => {
    getUnreadMessageCount()
      .then((res) => setUnreadCount(res.data.unread_count))
      .catch(() => setUnreadCount(0))
  }, [])

  // Fetch unread messages
  useEffect(() => {
    getUnreadMessages()
      .then((res) => setUnreadMessages(res.data))
      .catch(() => setUnreadMessages([]))
  }, [])

  // Fetch all users for new conversation
  useEffect(() => {
    if (showNewConv) {
      getAllUsers()
        .then((res) => setAllUsers(res.data))
        .catch(() => setAllUsers([]))
    }
  }, [showNewConv])

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const availableUsers = allUsers.filter(
    (u) =>
      u.id !== user.id &&
      !conversations.some((c) => c.id === u.id) &&
      (u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearch.toLowerCase()))
  )

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !eventId || !selectedConversation) return
    setSending(true)
    try {
      await sendEventMessage(eventId, {
        recipient_id: selectedConversation,
        content: newMessage.trim(),
      })
      setNewMessage('')
      // Refresh messages
      getEventMessages(eventId).then((res) => {
        setMessages(
          res.data.filter(
            (m: any) =>
              (m.sender_id === user.id &&
                m.recipient_id === Number(selectedConversation)) ||
              (m.sender_id === Number(selectedConversation) &&
                m.recipient_id === user.id)
          )
        )
      })
    } catch (e) {
      // Optionally show error
    } finally {
      setSending(false)
    }
  }

  const activeConversation = conversations.find(
    (c) => c.id.toString() === selectedConversation
  )

  // Mark message as read
  const handleMarkRead = async (messageId: string) => {
    await markMessageRead(messageId)
    // Refresh unread count and list
    getUnreadMessageCount()
      .then((res) => setUnreadCount(res.data.unread_count))
      .catch(() => setUnreadCount(0))
    getUnreadMessages()
      .then((res) => setUnreadMessages(res.data))
      .catch(() => setUnreadMessages([]))
  }

  // For admin: fetch messages for selected pair
  useEffect(() => {
    if (user.role !== 'admin' && user.role !== 'superadmin' || !eventId || !selectedAdminPair) return
    setLoading(true)
    getEventMessages(eventId)
      .then((res) => {
        // Only messages between this organizer and usher
        setMessages(
          res.data.filter(
            (m: any) =>
              (m.sender_id === selectedAdminPair.organizer.id &&
                m.recipient_id === selectedAdminPair.usher.id) ||
              (m.sender_id === selectedAdminPair.usher.id &&
                m.recipient_id === selectedAdminPair.organizer.id)
          )
        )
      })
      .catch(() => setMessages([]))
      .finally(() => setLoading(false))
  }, [user, eventId, selectedAdminPair])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-1">
            Communicate with your team in real-time
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge className="bg-red-500 text-white text-xs">
              {unreadCount} Unread
            </Badge>
          )}
        </div>
      </div>

      {/* Admin Event Selector */}
      {user.role === 'admin' || user.role === 'superadmin' ? (
        <div className="mb-4 max-w-md">
          <Select value={adminEventId || ''} onValueChange={setAdminEventId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an event to view messages" />
            </SelectTrigger>
            <SelectContent>
              {adminEvents.map((event: any) => (
                <SelectItem key={event.id} value={String(event.id)}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {/* Unread Messages Section */}
      {unreadMessages.length > 0 && (
        <DashboardCard title="Unread Messages" className="mb-4">
          <div className="space-y-2">
            {unreadMessages.map((msg) => (
              <div
                key={msg.id}
                className="flex items-center gap-3 justify-between bg-yellow-50 p-2 rounded"
              >
                <div>
                  <span className="font-medium text-gray-900">
                    From: {msg.sender?.name || msg.sender_id}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">
                    {new Date(msg.created_at).toLocaleString()}
                  </span>
                  <div className="text-gray-700 mt-1">{msg.content}</div>
                </div>
                <Button size="sm" onClick={() => handleMarkRead(msg.id)}>
                  Mark as Read
                </Button>
              </div>
            ))}
          </div>
        </DashboardCard>
      )}

      {/* Messages Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Conversations List */}
        <DashboardCard title="Conversations" className="lg:col-span-1">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                disabled={user.role === 'admin' || user.role === 'superadmin'}
              />
            </div>
            <ScrollArea className="h-[480px]">
              <div className="space-y-2">
                {user.role === 'admin' || user.role === 'superadmin'
                  ? adminPairs
                      .filter(
                        (pair) =>
                          pair.organizer.name
                            ?.toLowerCase()
                            .includes(searchTerm.toLowerCase()) ||
                          pair.usher.name
                            ?.toLowerCase()
                            .includes(searchTerm.toLowerCase())
                      )
                      .map((pair, idx) => (
                        <div
                          key={pair.organizer.id + '-' + pair.usher.id}
                          className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                            selectedAdminPair &&
                            selectedAdminPair.organizer.id ===
                              pair.organizer.id &&
                            selectedAdminPair.usher.id === pair.usher.id
                              ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200'
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                          onClick={() => setSelectedAdminPair(pair)}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900 text-sm truncate">
                              Organizer: {pair.organizer.name}
                            </span>
                            <span className="text-xs text-gray-600 mb-1">
                              Usher: {pair.usher.name}
                            </span>
                          </div>
                        </div>
                      ))
                  : filteredConversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedConversation === conversation.id.toString()
                            ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={() =>
                          setSelectedConversation(conversation.id.toString())
                        }
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900 text-sm truncate">
                            {conversation.name}
                          </h4>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">
                          {conversation.email}
                        </p>
                      </div>
                    ))}
              </div>
            </ScrollArea>
          </div>
        </DashboardCard>

        {/* Message Thread */}
        <DashboardCard
          title={
            user.role === 'admin' || user.role === 'superadmin'
              ? selectedAdminPair
                ? `Organizer: ${selectedAdminPair.organizer.name} / Usher: ${selectedAdminPair.usher.name}`
                : 'Select a conversation'
              : activeConversation?.name || 'Select a conversation'
          }
          className="lg:col-span-2"
        >
          {user.role === 'admin' || user.role === 'superadmin' ? (
            selectedAdminPair ? (
              <div className="flex flex-col h-[480px]">
                {/* Participants */}
                <div className="flex items-center gap-2 pb-4 border-b mb-4">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center border-2 border-white">
                      <span className="text-white text-xs font-medium">
                        {selectedAdminPair.organizer.name
                          ?.split(' ')
                          .map((n: string) => n[0])
                          .join('')}
                      </span>
                    </div>
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center border-2 border-white">
                      <span className="text-white text-xs font-medium">
                        {selectedAdminPair.usher.name
                          ?.split(' ')
                          .map((n: string) => n[0])
                          .join('')}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Organizer: {selectedAdminPair.organizer.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Usher: {selectedAdminPair.usher.name}
                    </p>
                  </div>
                </div>
                {/* Messages */}
                <ScrollArea className="flex-1 mb-4">
                  <div className="space-y-4">
                    {messages.map((message: any) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.sender_id === selectedAdminPair.organizer.id
                            ? 'flex-row-reverse'
                            : ''
                        }`}
                      >
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-medium">
                            {message.sender_id ===
                            selectedAdminPair.organizer.id
                              ? selectedAdminPair.organizer.name
                                  .split(' ')
                                  .map((n: string) => n[0])
                                  .join('')
                              : selectedAdminPair.usher.name
                                  .split(' ')
                                  .map((n: string) => n[0])
                                  .join('')}
                          </span>
                        </div>
                        <div
                          className={`max-w-xs lg:max-w-md ${
                            message.sender_id === selectedAdminPair.organizer.id
                              ? 'text-right'
                              : ''
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {message.sender_id ===
                              selectedAdminPair.organizer.id
                                ? selectedAdminPair.organizer.name
                                : selectedAdminPair.usher.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(message.created_at).toLocaleTimeString(
                                [],
                                { hour: '2-digit', minute: '2-digit' }
                              )}
                            </span>
                          </div>
                          <div
                            className={`p-3 rounded-lg ${
                              message.sender_id ===
                              selectedAdminPair.organizer.id
                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            {message.content}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                {/* No input for admin */}
                <div className="text-center text-gray-400 text-sm mt-4">
                  Admins can only view messages and cannot participate in the
                  chat.
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[480px] text-gray-500">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Select a conversation to view messages</p>
                </div>
              </div>
            )
          ) : user.role === 'usher' &&
            !activeConversation &&
            conversations.length === 1 ? (
            <div className="flex flex-col items-center justify-center h-[480px] text-gray-500">
              <MessageSquare className="w-12 h-12 mb-4 text-gray-400" />
              <p className="mb-4">Start a chat with the event organizer</p>
              <Button
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                onClick={() =>
                  setSelectedConversation(conversations[0].id.toString())
                }
              >
                Start Chat
              </Button>
            </div>
          ) : activeConversation ? (
            <div className="flex flex-col h-[480px]">
              {/* Participants */}
              <div className="flex items-center gap-2 pb-4 border-b mb-4">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center border-2 border-white">
                    <span className="text-white text-xs font-medium">
                      {activeConversation.name
                        ?.split(' ')
                        .map((n: string) => n[0])
                        .join('')}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {activeConversation.name}
                  </p>
                  <p className="text-xs text-gray-500">Event Organizer</p>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 mb-4">
                <div className="space-y-4">
                  {messages.map((message: any) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.sender_id === user.id ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-medium">
                          {message.sender_id === user.id
                            ? 'ME'
                            : activeConversation.name
                                ?.split(' ')
                                .map((n: string) => n[0])
                                .join('')}
                        </span>
                      </div>
                      <div
                        className={`max-w-xs lg:max-w-md ${
                          message.sender_id === user.id ? 'text-right' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {message.sender_id === user.id
                              ? 'You'
                              : activeConversation.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(message.created_at).toLocaleTimeString(
                              [],
                              { hour: '2-digit', minute: '2-digit' }
                            )}
                          </span>
                        </div>
                        <div
                          className={`p-3 rounded-lg ${
                            message.sender_id === user.id
                              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          {message.content}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 resize-none"
                  rows={2}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  disabled={sending}
                />
                <Button
                  onClick={handleSendMessage}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={!newMessage.trim() || sending}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[480px] text-gray-500">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </DashboardCard>
      </div>
    </div>
  )
}
