import React, { useState, useMemo } from 'react'
import { Search, MessageCircle, Users, Calendar, Filter, MoreVertical, Archive, Star, Settings } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { ScrollArea } from '../ui/scroll-area'
import { Separator } from '../ui/separator'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { useConversations } from '../../hooks/use-messages'
import { useRealtimeOnlineStatus } from '../../hooks/use-online-status'
import { isSoundEnabled } from '../../lib/sounds'
import type { Conversation } from '../../types/message'

interface ConversationListProps {
  selectedConversationId: string | null
  onSelectConversation: (conversationId: string) => void
  onStartNewConversation: () => void
  onOpenSettings?: () => void
}

export const ConversationList: React.FC<ConversationListProps> = ({
  selectedConversationId,
  onSelectConversation,
  onStartNewConversation,
  onOpenSettings,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'event' | 'direct'>('all')
  
  const { data: conversationsData, isLoading, error } = useConversations()
  
  // Debug logging
  console.log('ConversationList Debug:', {
    conversationsData,
    isLoading,
    error,
    rawData: conversationsData
  })
  
  // Handle different data structures from API
  const conversations = Array.isArray(conversationsData) 
    ? conversationsData 
    : Array.isArray(conversationsData?.data) 
      ? conversationsData.data 
      : []

  console.log('Processed conversations:', conversations)
  
  // Debug individual conversation
  if (conversations.length > 0) {
    console.log('First conversation details:', {
      id: conversations[0].id,
      type: conversations[0].type,
      name: conversations[0].name,
      lastMessage: conversations[0].lastMessage,
      unreadCount: conversations[0].unreadCount
    })
  }

  // Extract all participant user IDs from direct conversations for online status tracking
  const participantIds = useMemo(() => {
    return conversations
      .filter((conv: Conversation) => conv.type === 'direct')
      .flatMap((conv: Conversation) => conv.participants.map(p => p.id))
      .filter((id, index, self) => self.indexOf(id) === index) // Remove duplicates
  }, [conversations])

  // Get realtime online status for all participants
  const { isUserOnline, getLastSeenText } = useRealtimeOnlineStatus(participantIds)

  const filteredConversations = Array.isArray(conversations) 
    ? conversations.filter((conversation: Conversation) => {
        const matchesSearch = conversation.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesType = filterType === 'all' || conversation.type === filterType
        return matchesSearch && matchesType
      })
    : []

  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b">
          <div className="h-10 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex-1 p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <MessageCircle className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">Failed to load conversations</h3>
        <p className="text-sm text-gray-500 mb-4">Please try refreshing the page</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Refresh
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Corporate Gradient Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-white">Messages</h2>
            {isSoundEnabled() && (
              <Badge variant="outline" className="text-xs bg-white/20 text-white border-white/30 backdrop-blur-sm">
                🔊 On
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 text-white hover:bg-white/10"
              onClick={onOpenSettings}
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Button 
              onClick={onStartNewConversation} 
              size="sm" 
              className="bg-white text-blue-600 hover:bg-blue-50 font-semibold shadow-sm"
            >
              <MessageCircle className="w-4 h-4 mr-1.5" />
              New
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/95 backdrop-blur-sm border-white/20 focus:border-white focus:ring-2 focus:ring-white/50 placeholder:text-slate-400 text-slate-900"
          />
        </div>
        
        {/* Filter tabs */}
        <div className="flex space-x-2 mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilterType('all')}
            className={`flex-1 transition-all ${
              filterType === 'all' 
                ? 'bg-white text-blue-600 hover:bg-white font-semibold shadow-sm' 
                : 'text-white hover:bg-white/10 border border-white/20'
            }`}
          >
            All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilterType('direct')}
            className={`flex-1 transition-all ${
              filterType === 'direct' 
                ? 'bg-white text-blue-600 hover:bg-white font-semibold shadow-sm' 
                : 'text-white hover:bg-white/10 border border-white/20'
            }`}
          >
            <Users className="w-3.5 h-3.5 mr-1.5" />
            Direct
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilterType('event')}
            className={`flex-1 transition-all ${
              filterType === 'event' 
                ? 'bg-white text-blue-600 hover:bg-white font-semibold shadow-sm' 
                : 'text-white hover:bg-white/10 border border-white/20'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 mr-1.5" />
            Events
          </Button>
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1 elegant-scrollbar">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <MessageCircle className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {searchQuery 
                ? 'Try adjusting your search terms'
                : 'Start a conversation to get started'
              }
            </p>
            {!searchQuery && (
              <Button onClick={onStartNewConversation} variant="outline">
                Start Conversation
              </Button>
            )}
          </div>
        ) : (
          <div className="py-1">
            {filteredConversations.map((conversation: Conversation) => (
              <div
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={`
                  flex items-center px-4 py-4 cursor-pointer transition-all duration-150 relative group
                  ${selectedConversationId === conversation.id
                    ? 'bg-blue-50 border-l-4 border-blue-600 shadow-sm'
                    : 'hover:bg-slate-50 border-l-4 border-transparent'
                  }
                `}
              >
                <div className="relative flex-shrink-0">
                  <Avatar className="w-14 h-14 ring-2 ring-white shadow-sm">
                    <AvatarImage src={conversation.avatar} />
                    <AvatarFallback className={`${
                      conversation.type === 'event' 
                        ? 'bg-indigo-100 text-indigo-700' 
                        : 'bg-blue-100 text-blue-700'
                    } font-semibold text-base`}>
                      {getInitials(conversation.name)}
                    </AvatarFallback>
                  </Avatar>
                  {/* Online status indicator for direct messages */}
                  {conversation.type === 'direct' && (() => {
                    const participant = conversation.participants[0]
                    const isOnline = participant ? isUserOnline(participant.id) : false
                    return (
                      <div className={`absolute bottom-0 right-0 w-4 h-4 border-2 border-white rounded-full ${
                        isOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                    )
                  })()}
                  {/* Event badge for event conversations */}
                  {conversation.type === 'event' && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center shadow-sm">
                      <Calendar className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 ml-4 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className={`truncate text-sm ${
                      conversation.unreadCount > 0 
                        ? 'font-bold text-slate-900' 
                        : 'font-semibold text-slate-800'
                    }`}>
                      {conversation.name}
                    </h3>
                    <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                      {conversation.lastMessage && (
                        <span className="text-xs font-medium text-slate-500">
                          {formatLastMessageTime(conversation.lastMessage.created_at)}
                        </span>
                      )}
                      {conversation.unreadCount > 0 && (
                        <Badge className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold shadow-sm">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
            <div className="flex items-center justify-between">
              <p className={`text-sm truncate flex-1 ${
                conversation.unreadCount > 0 
                  ? 'text-slate-700 font-medium' 
                  : 'text-slate-600'
              }`}>
                {(() => {
                  // For direct messages, show last seen if no recent message
                  if (conversation.type === 'direct' && !conversation.lastMessage) {
                    const participant = conversation.participants[0]
                    if (participant) {
                      const lastSeenText = getLastSeenText(participant.id)
                      return <span className="text-xs text-slate-500">{lastSeenText}</span>
                    }
                  }
                  return conversation.lastMessage?.content || 'No messages yet'
                })()}
              </p>
                    <div className="flex items-center space-x-1 ml-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 h-7 w-7 hover:bg-slate-200"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="w-4 h-4 text-slate-600" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem>
                            <Star className="w-4 h-4 mr-2" />
                            Star
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Archive className="w-4 h-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
