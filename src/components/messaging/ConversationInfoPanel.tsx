import React, { useState } from 'react'
import {
  X, Bell, BellOff, Star, Archive, Trash2,
  FileText, Download, MoreVertical,
} from 'lucide-react'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { ScrollArea } from '../ui/scroll-area'
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

  if (!conversation) return null

  const isEventConversation = conversation.type === 'event'
  const isDirect = conversation.type === 'direct'
  const participant = isDirect ? conversation.participants[0] : null

  const getInitials = (name: string) => name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)

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
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="h-14 px-4 border-b border-border flex items-center justify-end shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-8">
          <div className="flex flex-col items-center text-center">
            <Avatar className="w-24 h-24 border border-border mb-4">
              <AvatarImage src={conversation.avatar} />
              <AvatarFallback className="text-2xl font-semibold bg-muted">
                {getInitials(conversation.name)}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">{conversation.name}</h2>
              {isDirect && participant && (
                <p className="text-xs text-muted-foreground">{participant.email || 'Direct message'}</p>
              )}
              {isEventConversation && (
                <Badge variant="outline" className="text-[10px]">Event chat</Badge>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 w-full mt-6">
              <Button
                variant="outline"
                onClick={() => setIsMuted(!isMuted)}
                className={cn('flex-col h-14 gap-1 rounded-xl', isMuted && 'bg-muted')}
              >
                {isMuted ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                <span className="text-[10px]">{isMuted ? 'Muted' : 'Mute'}</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsStarred(!isStarred)}
                className={cn('flex-col h-14 gap-1 rounded-xl', isStarred && 'bg-muted')}
              >
                <Star className={cn('w-4 h-4', isStarred && 'fill-current')} />
                <span className="text-[10px]">{isStarred ? 'Saved' : 'Save'}</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex-col h-14 gap-1 rounded-xl">
                    <MoreVertical className="w-4 h-4" />
                    <span className="text-[10px]">More</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="rounded-xl w-44">
                  <DropdownMenuItem className="rounded-lg text-xs">
                    <Archive className="w-4 h-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-lg text-xs text-destructive focus:text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear chat
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Separator />

          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground">About</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isEventConversation && conversation.event
                  ? (conversation.event.description || 'Messages related to this event.')
                  : ((participant as any)?.bio) || 'Direct conversation.'}
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground">Shared</h3>
              <Tabs defaultValue="media" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-9 rounded-lg">
                  <TabsTrigger value="media" className="text-xs rounded-md">Media</TabsTrigger>
                  <TabsTrigger value="files" className="text-xs rounded-md">Files</TabsTrigger>
                </TabsList>

                <TabsContent value="media" className="mt-4">
                  {mediaFiles.length > 0 ? (
                    <div className="grid grid-cols-3 gap-1.5">
                      {mediaFiles.slice(0, 9).map((msg) => {
                        const fileUrl = getMessageImageUrl(msg, 'medium') || getMessageFileUrl(msg)
                        return fileUrl ? (
                          <div key={msg.id} className="aspect-square rounded-lg overflow-hidden bg-muted">
                            <img src={fileUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                        ) : null
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-8">No media yet</p>
                  )}
                </TabsContent>

                <TabsContent value="files" className="mt-4 space-y-2">
                  {documentFiles.length > 0 ? (
                    documentFiles.slice(0, 5).map((msg) => (
                      <div key={msg.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/40">
                        <FileText className="w-4 h-4 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">{msg.file_name || 'Document'}</p>
                          <p className="text-[10px] text-muted-foreground">{formatFileSize(msg.file_size)}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => window.open(getMessageFileUrl(msg) || '#', '_blank')}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-8">No files yet</p>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
