import React, { useState } from 'react'
import {
  X, Bell, BellOff, Star, Archive, Trash2, Settings,
  Users, Image as ImageIcon, FileText, Download, ExternalLink,
  Shield, Lock, Volume2, VolumeX, Pin, MoreVertical, Calendar, Mail
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
import { motion } from 'framer-motion'
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

  // Extract media and documents
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
    <div className="flex flex-col h-full bg-background animate-in slide-in-from-right duration-500">
      <ScrollArea className="flex-1">
        <div className="p-8 space-y-10">
          {/* Hero Profile Section */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-orange-500 blur-3xl opacity-10 rounded-full" />
                <Avatar className="w-28 h-28 border-4 border-background shadow-2xl relative z-10">
                  <AvatarImage src={conversation.avatar} />
                  <AvatarFallback className="text-3xl font-black bg-orange-100 text-orange-600 dark:bg-orange-900/30">
                    {getInitials(conversation.name)}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
              {isDirect && (
                <span className="absolute bottom-2 right-2 w-6 h-6 bg-emerald-500 border-4 border-background rounded-full shadow-lg z-20" />
              )}
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-foreground">{conversation.name}</h2>
              {isDirect && participant && (
                <div className="flex items-center justify-center gap-1 text-muted-foreground/60">
                  <Mail className="w-3 h-3" />
                  <span className="text-xs font-bold uppercase tracking-widest">{participant.email || 'Private Member'}</span>
                </div>
              )}
              {isEventConversation && (
                <Badge variant="outline" className="bg-orange-50/50 border-orange-200 text-orange-600 text-[10px] font-black uppercase tracking-widest px-3 py-1">
                  <Calendar className="w-3 h-3 mr-1.5" />
                  Event Collaboration
                </Badge>
              )}
            </div>

            {/* Premium Action Grid */}
            <div className="grid grid-cols-3 gap-3 w-full mt-8">
              <Button
                variant="outline"
                onClick={() => setIsMuted(!isMuted)}
                className={cn(
                  "flex-col h-16 gap-1 rounded-2xl border-border/40 transition-all",
                  isMuted ? "bg-muted text-muted-foreground" : "hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600"
                )}
              >
                {isMuted ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                <span className="text-[9px] font-black uppercase tracking-tighter">{isMuted ? 'Muted' : 'Alerts'}</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsStarred(!isStarred)}
                className={cn(
                  "flex-col h-16 gap-1 rounded-2xl border-border/40 transition-all",
                  isStarred ? "bg-orange-600 text-white border-orange-600" : "hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600"
                )}
              >
                <Star className={cn("w-4 h-4", isStarred && "fill-current")} />
                <span className="text-[9px] font-black uppercase tracking-tighter">{isStarred ? 'Saved' : 'Save'}</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex-col h-16 gap-1 rounded-2xl border-border/40 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600">
                    <MoreVertical className="w-4 h-4" />
                    <span className="text-[9px] font-black uppercase tracking-tighter">More</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="rounded-2xl border-border/40 p-1.5 shadow-2xl w-48 backdrop-blur-md">
                  <DropdownMenuItem className="rounded-xl font-bold text-xs p-3">
                    <Archive className="w-4 h-4 mr-2 opacity-60" />
                    Archive Conversation
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-xl font-bold text-xs p-3 text-red-500 focus:text-red-500">
                    <Trash2 className="w-4 h-4 mr-2 opacity-60" />
                    Clear Chat History
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Separator className="bg-border/40" />

          {/* Context Sections */}
          <div className="space-y-8">
            {/* About / Bio */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">About Context</h3>
              <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                {isEventConversation && conversation.event
                  ? (conversation.event.description || 'Global collaboration space for event logistics and coordination.')
                  : (isDirect && (participant as any)?.bio) || 'Professional network communication channel.'
                }
              </p>
            </div>

            {/* Shared Assets Hub */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Shared Hub</h3>
              <Tabs defaultValue="media" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-muted/30 p-1 rounded-2xl h-11 border border-border/20">
                  <TabsTrigger value="media" className="text-[10px] font-black uppercase tracking-widest rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-lg">
                    Media
                  </TabsTrigger>
                  <TabsTrigger value="files" className="text-[10px] font-black uppercase tracking-widest rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-lg">
                    Docs
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="media" className="mt-6">
                  {mediaFiles.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {mediaFiles.slice(0, 9).map((msg) => {
                        const fileUrl = getMessageImageUrl(msg, 'medium') || getMessageFileUrl(msg)
                        return fileUrl ? (
                          <motion.div
                            key={msg.id}
                            whileHover={{ scale: 1.05 }}
                            className="aspect-square rounded-2xl overflow-hidden bg-muted border border-border/40 cursor-pointer shadow-sm"
                          >
                            <img src={fileUrl} alt="Shared" className="w-full h-full object-cover transition-transform duration-500" />
                          </motion.div>
                        ) : null
                      })}
                    </div>
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center bg-muted/20 rounded-[2rem] border border-dashed border-border/40">
                      <ImageIcon className="w-8 h-8 text-muted-foreground/20 mb-2" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">No media found</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="files" className="mt-6 space-y-2">
                  {documentFiles.length > 0 ? (
                    documentFiles.slice(0, 5).map((msg) => (
                      <div key={msg.id} className="flex items-center gap-4 p-3 rounded-2xl bg-muted/30 border border-border/20 hover:bg-muted/50 transition-colors group">
                        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 rounded-xl flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate pr-2">{msg.file_name || 'Document'}</p>
                          <p className="text-[9px] font-black uppercase tracking-tighter opacity-40">{formatFileSize(msg.file_size)}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100" onClick={() => window.open(getMessageFileUrl(msg), '_blank')}>
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center bg-muted/20 rounded-[2rem] border border-dashed border-border/40">
                      <FileText className="w-8 h-8 text-muted-foreground/20 mb-2" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">No docs found</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Security Notice */}
            <div className="p-6 rounded-[2rem] bg-orange-600/5 border border-orange-600/10 relative overflow-hidden group">
              <Shield className="absolute -right-4 -bottom-4 w-24 h-24 text-orange-600/5 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
              <div className="relative z-10 flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-orange-600 flex items-center justify-center shrink-0 shadow-lg shadow-orange-600/30">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <div className="space-y-1 pr-4">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-orange-600">Privacy Secure</h4>
                  <p className="text-[10px] font-medium leading-relaxed text-muted-foreground/90">
                    Advanced end-to-end encryption active for this channel.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pb-8">
            <Button variant="ghost" className="w-full h-12 rounded-2xl text-red-500 hover:bg-red-50 hover:text-red-600 font-black uppercase tracking-[0.2em] text-[10px]" onClick={() => { }}>
              Report Incident
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
