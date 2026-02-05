export interface User {
  id: number
  name: string
  email: string
  profile_image?: string
  role: string
  phone?: string
  bio?: string
  location?: string
  website?: string
  company?: string
  job_title?: string
  created_at: string
  updated_at: string
  // Online status fields
  is_online?: boolean
  last_seen_at?: string
  last_activity_at?: string
  last_seen_text?: string
  is_currently_online?: boolean
}

export interface Event {
  id: number
  title: string
  description: string
  image_url?: string
  start_date: string
  end_date: string
  location: string
  organizer_id: number
  created_at: string
  updated_at: string
}

export interface MessageReaction {
  id: number
  message_id: number
  user_id: number
  emoji: string
  created_at: string
  updated_at: string
  user: User
}

export interface Message {
  id: number
  event_id?: number
  sender_id: number
  recipient_id: number
  content: string
  file_path?: string
  file_disk?: string
  file_name?: string
  file_type?: string
  file_size?: number
  thumbnail_path?: string
  medium_path?: string
  thumbnail_width?: number
  thumbnail_height?: number
  medium_width?: number
  medium_height?: number
  original_width?: number
  original_height?: number
  file_url?: string
  thumbnail_url?: string
  medium_url?: string
  parent_message_id?: number
  read_at?: string
  delivered_at?: string
  seen_at?: string
  created_at: string
  updated_at: string
  sender: User
  recipient: User
  event?: Event
  parentMessage?: Message
  replies?: Message[]
  read_receipts?: ReadReceipt[]
  reactions?: MessageReaction[]
  reaction_counts?: { [emoji: string]: number }
  // Enhanced corporate messaging features
  is_pinned?: boolean
  mentions?: number[]  // Array of user IDs mentioned in message
  thread_reply_count?: number  // Number of replies in thread
  is_edited?: boolean  // Whether message has been edited
  edited_at?: string  // When message was last edited
  status?: 'sending' | 'sent' | 'failed' // Optimistic status
}

export interface ReadReceipt {
  id: number
  message_id: number
  user_id: number
  read_at: string
  user: User
}

export interface Conversation {
  id: string
  type: 'event' | 'direct'
  name: string
  avatar?: string
  lastMessage?: Message
  unreadCount: number
  participants: User[]
  event?: Event
  // Enhanced corporate messaging features
  is_pinned?: boolean  // Whether conversation is pinned to top
  is_starred?: boolean  // Whether conversation is starred
  is_muted?: boolean  // Whether notifications are muted
  is_archived?: boolean  // Whether conversation is archived
}

export interface ConversationPartner {
  id: number
  name: string
  email: string
  avatar_url?: string
  lastMessage?: Message
}

export interface MessageAttachment {
  file_path: string
  file_name: string
  file_type: string
  file_size: number
  file_url: string
}

export interface MessageSearchResult {
  messages: Message[]
  total: number
  current_page: number
  last_page: number
  per_page: number
}

export interface MessageFormData {
  recipient_id: number
  content: string
  parent_message_id?: number
  file?: File
}

export interface DirectMessageFormData {
  recipient_id: number
  content: string
  parent_message_id?: number
  file?: File
}

export interface MessageFilters {
  type?: 'all' | 'event' | 'direct'
  search?: string
  per_page?: number
  page?: number
}

export interface ConversationFilters {
  type?: 'all' | 'event' | 'direct'
  search?: string
}

export interface TypingIndicator {
  user_id: number
  conversation_id: string
  is_typing: boolean
  timestamp: string
}

export interface MessageNotification {
  id: number
  user_id: number
  type: 'message' | 'direct_message'
  data: {
    event_id?: number
    sender_id: number
    message_id: number
    content: string
    has_attachment?: boolean
  }
  read_at?: string
  created_at: string
  updated_at: string
}
