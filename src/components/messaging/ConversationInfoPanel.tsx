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
import { cn } from '@/lib/utils'
import type { Conversation, Message } from '../../types/message'
import { getMessageImageUrl, getMessageFileUrl } from '@/lib/image-utils'

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
    (msg.file_path || msg.file_url) && msg.file_type?.startsWith('image/')
  )

  const documentFiles = messages.filter(msg =>
    (msg.file_path || msg.file_url) && !msg.file_type?.startsWith('image/')
  )

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 KB'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="w-80 bg-white dark:bg-gray-950 border-l border-gray-100 dark:border-gray-800 flex flex-col h-full shadow-2xl animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">Profile Details</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-9 w-9 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-8">
          {/* Profile Section */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4">
              <Avatar className="w-24 h-24 border-4 border-white dark:border-gray-900 shadow-xl ring-1 ring-gray-100 dark:ring-gray-800">
                <AvatarImage src={conversation.avatar} />
                <AvatarFallback className={cn(
                  "text-2xl font-black text-white",
                  isEventConversation ? "bg-primary" : "bg-primary"
                )}>
                  {getInitials(conversation.name)}
                </AvatarFallback>
              </Avatar>
              {isDirect && (
                <div className="absolute bottom-1.5 right-1.5 w-6 h-6 bg-green-500 border-4 border-white dark:border-gray-950 rounded-full shadow-sm"></div>
              )}
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-black text-gray-900 dark:text-white">{conversation.name}</h2>
              {isDirect && participant && (
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500">{participant.email || '@username'}</p>
              )}
              {isEventConversation && (
                <div className="flex justify-center mt-2">
                  <Badge className="bg-primary/10 text-primary border-none text-[10px] font-bold px-2 py-0.5 rounded-full">
                    <Users className="w-3 h-3 mr-1" />
                    EVENT SPACE
                  </Badge>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 mt-6">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsMuted(!isMuted)}
                className={cn(
                  "h-10 w-10 rounded-xl border-gray-100 dark:border-gray-800 transition-all",
                  isMuted ? "bg-gray-50 dark:bg-gray-900 text-gray-400" : "text-gray-600 dark:text-gray-400 hover:border-primary/30 hover:text-primary"
                )}
              >
                {isMuted ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsStarred(!isStarred)}
                className={cn(
                  "h-10 w-10 rounded-xl border-gray-100 dark:border-gray-800 transition-all",
                  isStarred ? "bg-orange-50 dark:bg-orange-950/20 text-orange-500 border-orange-100 dark:border-orange-900/30" : "text-gray-600 dark:text-gray-400 hover:border-primary/30 hover:text-primary"
                )}
              >
                <Star className={cn("w-4 h-4", isStarred && "fill-current")} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-gray-100 dark:border-gray-800 text-gray-600 hover:border-primary/30 hover:text-primary">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl border-gray-100 dark:border-gray-800 p-1 shadow-2xl">
                  <DropdownMenuItem className="rounded-lg text-xs font-bold gap-2 focus:bg-gray-50 dark:focus:bg-gray-900">
                    <Archive className="w-4 h-4" />
                    Archive Chat
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-lg text-xs font-bold gap-2 text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/20">
                    <Trash2 className="w-4 h-4" />
                    Delete Everything
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="h-px bg-gray-50 dark:bg-gray-800" />

          {/* About Section */}
          {isEventConversation && conversation.event && (
            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">About Space</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {conversation.event.description || 'No description provided for this event space.'}
              </p>
              {conversation.event.location && (
                <div className="flex items-center gap-2 text-xs font-bold text-primary bg-primary/5 p-3 rounded-xl border border-primary/10">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="truncate">{conversation.event.location}</span>
                </div>
              )}
            </div>
          )}

          {isDirect && participant && (
            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">About</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {(participant as any).bio || 'Working professional and event enthusiast.'}
              </p>
            </div>
          )}

          {/* Tabs for Media & Files */}
          <Tabs defaultValue="media" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-50 dark:bg-gray-900 p-1 rounded-xl h-10">
              <TabsTrigger value="media" className="text-[10px] font-black uppercase tracking-tighter rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm">
                Media
              </TabsTrigger>
              <TabsTrigger value="files" className="text-[10px] font-black uppercase tracking-tighter rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm">
                Files
              </TabsTrigger>
            </TabsList>

            <TabsContent value="media" className="mt-4 outline-none">
              {mediaFiles.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {mediaFiles.slice(0, 9).map((msg) => {
                    const fileUrl = getMessageImageUrl(msg, 'medium') || getMessageFileUrl(msg)
                    if (!fileUrl) return null

                    return (
                      <div
                        key={msg.id}
                        className="aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-100 dark:border-gray-800 hover:border-primary transition-all cursor-pointer group relative"
                      >
                        <img
                          src={fileUrl}
                          alt={msg.file_name || 'Media'}
                          className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-300"
                        />
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <ImageIcon className="w-8 h-8 text-gray-200 dark:text-gray-800" />
                  <p className="text-xs font-bold text-gray-400">No media shared</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="files" className="mt-4 outline-none">
              {documentFiles.length > 0 ? (
                <div className="space-y-2">
                  {documentFiles.slice(0, 10).map((msg) => {
                    const fileUrl = getMessageFileUrl(msg)
                    return (
                      <div
                        key={msg.id}
                        className="flex items-center gap-3 p-2 rounded-xl border border-gray-50 dark:border-gray-900 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all group"
                      >
                        <div className="w-10 h-10 bg-primary/5 rounded-lg flex items-center justify-center flex-shrink-0 text-primary">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                            {msg.file_name || 'Document'}
                          </p>
                          <p className="text-[10px] font-medium text-gray-400">
                            {formatFileSize(msg.file_size)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-all"
                          onClick={() => fileUrl && window.open(fileUrl, '_blank')}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <FileText className="w-8 h-8 text-gray-200 dark:text-gray-800" />
                  <p className="text-xs font-bold text-gray-400">No documents</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="h-px bg-gray-50 dark:bg-gray-800" />

          {/* Participants */}
          {isEventConversation && conversation.participants && (
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                Participants ({conversation.participants.length})
              </h3>
              <div className="space-y-3">
                {conversation.participants.slice(0, 5).map((participant) => (
                  <div key={participant.id} className="flex items-center gap-3">
                    <Avatar className="w-8 h-8 shadow-sm">
                      <AvatarImage src={participant.profile_image} />
                      <AvatarFallback className="bg-gray-100 text-gray-400 text-[10px] font-bold">
                        {getInitials(participant.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{participant.name}</p>
                      <p className="text-[10px] font-medium text-gray-400 truncate">{participant.email || 'Participant'}</p>
                    </div>
                  </div>
                ))}
              </div>
              {conversation.participants.length > 5 && (
                <Button variant="ghost" className="w-full text-[10px] font-black uppercase text-primary hover:bg-primary/5">
                  View {conversation.participants.length - 5} More
                </Button>
              )}
            </div>
          )}

          {/* Settings Section */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Settings</h3>
            <div className="space-y-4 px-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400">
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </div>
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Notifications</span>
                </div>
                <Switch checked={!isMuted} onCheckedChange={(checked) => setIsMuted(!checked)} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400">
                    <Pin className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Pin Chat</span>
                </div>
                <Switch checked={conversation.is_pinned || false} onCheckedChange={() => { }} />
              </div>
            </div>
          </div>

          {/* Privacy Message */}
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="flex gap-3">
              <Shield className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-900 dark:text-white uppercase tracking-tight">Security Guaranteed</p>
                <p className="text-[10px] leading-relaxed text-gray-500 dark:text-gray-400">
                  This conversation is end-to-end encrypted. Your data remains private.
                </p>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>

  )
}
