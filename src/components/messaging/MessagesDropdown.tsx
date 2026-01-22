import React from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle, Check, externalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useConversations, useMarkConversationRead } from '@/hooks/use-messages'
import { cn } from '@/lib/utils'
import type { Conversation } from '@/types/message'

export function MessagesDropdown() {
    const navigate = useNavigate()
    const { data: conversationsData, isLoading } = useConversations()
    const markReadMutation = useMarkConversationRead()

    // Handle different data structures from API
    const conversations = Array.isArray(conversationsData)
        ? conversationsData
        : Array.isArray(conversationsData?.data)
            ? conversationsData.data
            : []

    const unreadCount = conversations.reduce((acc: number, conv: Conversation) => acc + (conv.unreadCount || 0), 0)

    const handleConversationClick = (conv: Conversation) => {
        navigate(`/dashboard/messages?conversationId=${conv.id}`)
    }

    const markAllAsRead = (e: React.MouseEvent) => {
        e.stopPropagation()
        // Find all conversations with unread messages and mark them as read
        conversations.forEach((conv: Conversation) => {
            if (conv.unreadCount > 0) {
                const readData: any = {}
                if (conv.type === 'direct' && conv.participants?.[0]) {
                    readData.other_user_id = conv.participants[0].id
                } else if (conv.type === 'event' && conv.event) {
                    readData.event_id = conv.event.id
                }
                if (Object.keys(readData).length > 0) {
                    markReadMutation.mutate(readData)
                }
            }
        })
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative group hover:bg-primary/5 transition-colors duration-200">
                    <MessageCircle className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-primary transition-colors" />
                    {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-primary text-white text-[10px] animate-in zoom-in-50 duration-200 shadow-sm border-2 border-white dark:border-gray-950">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[380px] p-0 overflow-hidden rounded-xl border-gray-200 dark:border-gray-800 shadow-2xl bg-white dark:bg-gray-950 animate-in slide-in-from-top-2 duration-200">
                <DropdownMenuLabel className="p-4 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-gray-900 dark:text-gray-100">Messages</span>
                        {unreadCount > 0 && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors py-0 px-2 font-medium">
                                {unreadCount} New
                            </Badge>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={markAllAsRead}
                            className="h-8 text-xs text-primary hover:text-primary/80 hover:bg-primary/5 font-medium flex items-center gap-1.5"
                        >
                            <Check className="w-3.5 h-3.5" />
                            Mark all as read
                        </Button>
                    )}
                </DropdownMenuLabel>

                <div className="max-h-[420px] overflow-y-auto scrollbar-thin">
                    {isLoading ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-3 text-gray-400">
                            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                            <p className="text-sm font-medium">Loading messages...</p>
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="py-12 px-6 flex flex-col items-center justify-center text-center gap-3">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center">
                                <MessageCircle className="w-8 h-8 text-gray-400" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-gray-900 dark:text-gray-100 font-semibold">No messages yet</p>
                                <p className="text-sm text-gray-500 max-w-[220px]">When you start a conversation, it will appear here.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-1">
                            {conversations.slice(0, 5).map((conv: Conversation) => (
                                <DropdownMenuItem
                                    key={conv.id}
                                    onClick={() => handleConversationClick(conv)}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 mb-1 last:mb-0",
                                        "hover:bg-gray-50 dark:hover:bg-gray-900 focus:bg-gray-50 dark:focus:bg-gray-900",
                                        conv.unreadCount > 0 && "bg-primary/5 dark:bg-primary/5"
                                    )}
                                >
                                    <div className="relative">
                                        <Avatar className="h-11 w-11 shadow-sm border border-gray-100 dark:border-gray-800">
                                            <AvatarImage src={conv.avatar} />
                                            <AvatarFallback className="bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 text-gray-600 dark:text-gray-300 font-bold text-xs">
                                                {getInitials(conv.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        {conv.unreadCount > 0 && (
                                            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-primary border-2 border-white dark:border-gray-950 rounded-full shadow-sm"></span>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0 space-y-0.5">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className={cn(
                                                "text-sm font-bold truncate transition-colors",
                                                conv.unreadCount > 0 ? "text-gray-900 dark:text-gray-100" : "text-gray-700 dark:text-gray-300"
                                            )}>
                                                {conv.name}
                                            </span>
                                            {conv.lastMessage?.created_at && (
                                                <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap font-medium">
                                                    {formatDistanceToNow(new Date(conv.lastMessage.created_at), { addSuffix: true })}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between gap-2">
                                            <p className={cn(
                                                "text-xs truncate",
                                                conv.unreadCount > 0 ? "text-gray-700 dark:text-gray-300 font-medium" : "text-gray-500 dark:text-gray-400"
                                            )}>
                                                {conv.lastMessage?.content || 'No messages yet'}
                                            </p>
                                            {conv.unreadCount > 0 && (
                                                <Badge className="h-4.5 min-w-[18px] px-1 text-[9px] bg-primary text-white flex items-center justify-center font-bold">
                                                    {conv.unreadCount}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </DropdownMenuItem>
                            ))}
                        </div>
                    )}
                </div>

                <DropdownMenuSeparator className="m-0 border-gray-100 dark:border-gray-800" />
                <div className="p-3 bg-gray-50/50 dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                    <Button
                        variant="ghost"
                        className="w-full h-10 text-sm font-bold text-primary hover:text-primary/80 hover:bg-transparent flex items-center justify-center gap-2 group"
                        onClick={() => navigate('/dashboard/messages')}
                    >
                        See all messages
                        <externalLink className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
