import React, { useState } from 'react'
import { Pin, X, ChevronDown, ChevronUp, MapPin } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { ScrollArea } from '../ui/scroll-area'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import type { Message } from '../../types/message'

interface PinnedMessagesBannerProps {
  pinnedMessages: Message[]
  onUnpin: (messageId: number) => void
  onJumpToMessage?: (messageId: number) => void
  conversationId: string
}

export const PinnedMessagesBanner: React.FC<PinnedMessagesBannerProps> = ({
  pinnedMessages,
  onUnpin,
  onJumpToMessage,
  conversationId,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  if (pinnedMessages.length === 0) return null

  const getInitials = (name: string) => name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="bg-orange-600 border-b border-orange-700 shadow-xl overflow-hidden relative group">
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_5s_infinite]" />

      {/* Header Container */}
      <div className="px-8 py-3 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
            <Pin className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90 leading-tight">
              Essential Intel
            </h3>
            <p className="text-[11px] font-bold text-white/60">
              {pinnedMessages.length} message{pinnedMessages.length !== 1 ? 's' : ''} pinned to top
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isExpanded && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-black/10 rounded-xl border border-white/10 max-w-sm">
              <span className="text-[10px] font-black text-white/90 truncate max-w-[200px]">
                {pinnedMessages[0].content || "📎 Shared Asset"}
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-9 px-3 rounded-xl text-white hover:bg-white/10 transition-colors font-black text-[10px] uppercase tracking-widest gap-2"
          >
            {isExpanded ? 'Collapse' : 'View All'}
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* Expanded Region */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10 bg-black/10 relative z-10 overflow-hidden"
          >
            <ScrollArea className="max-h-80">
              <div className="divide-y divide-white/5">
                {pinnedMessages.map((message) => (
                  <div key={message.id} className="p-6 transition-all hover:bg-white/5 group/msg">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10 border-2 border-white/10 shadow-lg shrink-0">
                        <AvatarImage src={message.sender.profile_image} />
                        <AvatarFallback className="bg-white/10 text-white text-xs font-black">
                          {getInitials(message.sender.name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black uppercase tracking-widest text-white">{message.sender.name}</span>
                          <span className="text-[9px] font-black uppercase text-white/40 tracking-tighter">
                            {new Date(message.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>

                        <p className="text-sm text-white/80 leading-relaxed font-medium mb-4 line-clamp-3 italic">
                          "{message.content || "Shared Asset"}"
                        </p>

                        <div className="flex items-center gap-2 opacity-0 group-hover/msg:opacity-100 transition-all transform translate-y-2 group-hover/msg:translate-y-0">
                          {onJumpToMessage && (
                            <Button
                              variant="ghost"
                              onClick={() => onJumpToMessage(message.id)}
                              className="h-8 px-4 rounded-xl bg-white text-orange-600 hover:bg-orange-50 font-black text-[9px] uppercase tracking-widest"
                            >
                              Jump to Context
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            onClick={() => onUnpin(message.id)}
                            className="h-8 px-4 rounded-xl border border-white/20 text-white hover:bg-white/10 font-black text-[9px] uppercase tracking-widest"
                          >
                            Unpin
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
