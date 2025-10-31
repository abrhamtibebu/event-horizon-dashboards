import React, { useState } from 'react'
import { 
  X, Bell, BellOff, Star, Archive, Trash2, Settings, 
  Users, Image as ImageIcon, FileText, Download, ExternalLink,
  Shield, Lock, Volume2, VolumeX, Pin, MoreVertical
} from 'lucide-react'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { ScrollArea } from '../ui/scroll-area'
import { Switch } from '../ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'
import type { Conversation, Message } from '../../types/message'

interface ConversationInfoPanelProps {
  conversation: Conversation | null
  onClose: () => void
  messages?: Message[]
}

export const ConversationInfoPanel: React.FC<ConversationInfoPanelProps> = ({
  conversation,
  onClose,
  messages = [],
}) => {
  const [isMuted, setIsMuted] = useState(conversation?.is_muted || false)
  const [isStarred, setIsStarred] = useState(conversation?.is_starred || false)

  if (!conversation) {
    return null
  }

  const isEventConversation = conversation.type === 'event'
  const isDirect = conversation.type === 'direct'
  const participant = isDirect ? conversation.participants[0] : null

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Extract media files from messages
  const mediaFiles = messages.filter(msg => 
    msg.file_path && msg.file_type?.startsWith('image/')
  )

  const documentFiles = messages.filter(msg => 
    msg.file_path && !msg.file_type?.startsWith('image/')
  )

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 KB'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Details</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-white hover:bg-white/10 p-2 rounded-lg"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Profile Section */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative">
              <Avatar className="w-24 h-24 ring-4 ring-white shadow-lg">
                <AvatarImage src={conversation.avatar} />
                <AvatarFallback className={`${
                  isEventConversation 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'bg-blue-100 text-blue-700'
                } text-2xl font-bold`}>
                  {getInitials(conversation.name)}
                </AvatarFallback>
              </Avatar>
              {isDirect && (
                <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-400 border-4 border-white rounded-full"></div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900">{conversation.name}</h2>
              {isDirect && participant && (
                <p className="text-sm text-slate-500 mt-1">{participant.email}</p>
              )}
              {isEventConversation && (
                <Badge className="mt-2 bg-indigo-100 text-indigo-700 border-indigo-200">
                  <Users className="w-3 h-3 mr-1" />
                  Event Chat
                </Badge>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMuted(!isMuted)}
                className={`${isMuted ? 'bg-slate-100' : ''}`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsStarred(!isStarred)}
                className={`${isStarred ? 'bg-yellow-50 text-yellow-600' : ''}`}
                title={isStarred ? 'Unstar' : 'Star'}
              >
                <Star className={`w-4 h-4 ${isStarred ? 'fill-current' : ''}`} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Archive className="w-4 h-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Chat
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Separator />

          {/* About Section */}
          {isEventConversation && conversation.event && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">About Event</h3>
              <p className="text-sm text-slate-600">
                {conversation.event.description || 'No description available'}
              </p>
              {conversation.event.location && (
                <p className="text-xs text-slate-500 mt-2">
                  📍 {conversation.event.location}
                </p>
              )}
            </div>
          )}

          {isDirect && participant && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">About</h3>
              <p className="text-sm text-slate-600">
                {(participant as any).bio || 'No bio available'}
              </p>
            </div>
          )}

          <Separator />

          {/* Tabs for Media & Files */}
          <Tabs defaultValue="media" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="media" className="text-xs">
                <ImageIcon className="w-3 h-3 mr-1" />
                Media ({mediaFiles.length})
              </TabsTrigger>
              <TabsTrigger value="files" className="text-xs">
                <FileText className="w-3 h-3 mr-1" />
                Files ({documentFiles.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="media" className="mt-4">
              {mediaFiles.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {mediaFiles.slice(0, 9).map((msg) => {
                    const fileUrl = msg.file_path?.startsWith('blob:')
                      ? msg.file_path
                      : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/${msg.file_path}`
                    
                    return (
                      <div
                        key={msg.id}
                        className="aspect-square rounded-lg overflow-hidden bg-slate-100 hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer group relative"
                      >
                        <img
                          src={fileUrl}
                          alt={msg.file_name || 'Image'}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <ExternalLink className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">No media shared yet</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="files" className="mt-4">
              {documentFiles.length > 0 ? (
                <div className="space-y-2">
                  {documentFiles.slice(0, 10).map((msg) => (
                    <div
                      key={msg.id}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {msg.file_name || 'Unknown file'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatFileSize(msg.file_size)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">No files shared yet</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <Separator />

          {/* Participants (for group chats) */}
          {isEventConversation && conversation.participants && conversation.participants.length > 0 && (
            <>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3">
                  Participants ({conversation.participants.length})
                </h3>
                <div className="space-y-2">
                  {conversation.participants.slice(0, 5).map((participant) => (
                    <div key={participant.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={participant.profile_image} />
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
                          {getInitials(participant.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {participant.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {participant.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {conversation.participants.length > 5 && (
                  <Button variant="ghost" size="sm" className="w-full mt-2 text-xs">
                    View all {conversation.participants.length} participants
                  </Button>
                )}
              </div>
              <Separator />
            </>
          )}

          {/* Settings */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-slate-500" />}
                  <span className="text-sm text-slate-700">Notifications</span>
                </div>
                <Switch
                  checked={!isMuted}
                  onCheckedChange={(checked) => setIsMuted(!checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Pin className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-700">Pin to top</span>
                </div>
                <Switch
                  checked={conversation.is_pinned || false}
                  onCheckedChange={() => {}}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Privacy Info */}
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Shield className="w-4 h-4 text-slate-500 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-slate-900 mb-1">
                  Privacy & Security
                </h4>
                <p className="text-xs text-slate-600">
                  Messages are encrypted and stored securely. Only participants can see this conversation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

