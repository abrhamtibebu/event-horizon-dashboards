import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { User } from '../types/message'

export const useUserSearch = (query: string, conversationId?: string) => {
  return useQuery({
    queryKey: ['userSearch', query, conversationId],
    queryFn: async () => {
      if (!query || query.length < 2) return []
      
      try {
        // If it's an event conversation, search event participants
        if (conversationId?.startsWith('event_')) {
          const eventId = conversationId.replace('event_', '')
          const response = await api.get(`/events/${eventId}/participants/search`, {
            params: { query }
          })
          return response.data as User[]
        }
        
        // For direct messages or general search, use contacts endpoint
        const response = await api.get('/users/messaging-contacts', {
          params: { search: query }
        })
        
        // Filter based on query
        const users = response.data as User[]
        return users.filter((user: User) => 
          user.name.toLowerCase().includes(query.toLowerCase()) ||
          user.email.toLowerCase().includes(query.toLowerCase())
        )
      } catch (error) {
        console.error('Failed to search users:', error)
        return []
      }
    },
    enabled: query.length >= 2,
    staleTime: 60000, // Cache for 1 minute
  })
}

