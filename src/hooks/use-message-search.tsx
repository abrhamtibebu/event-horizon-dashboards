import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

interface SearchMessagesParams {
  query: string
  type?: 'all' | 'event' | 'direct'
  conversationId?: string
  perPage?: number
  page?: number
}

interface SearchMessagesResponse {
  messages: any[]
  total: number
  current_page: number
  last_page: number
  per_page: number
  query: string
  has_more: boolean
}

export const useSearchMessages = (params: SearchMessagesParams) => {
  const { query, type = 'all', conversationId, perPage = 20, page = 1 } = params

  return useQuery({
    queryKey: ['searchMessages', query, type, conversationId, perPage, page],
    queryFn: async (): Promise<SearchMessagesResponse> => {
      const searchParams = new URLSearchParams({
        q: query,
        type,
        per_page: perPage.toString(),
        page: page.toString(),
      })

      if (conversationId) {
        searchParams.append('conversation_id', conversationId)
      }

      const response = await api.get(`/messages/search?${searchParams}`)
      return response.data
    },
    enabled: query.length >= 2, // Only search if query is at least 2 characters
    staleTime: 30000, // 30 seconds
    retry: 2,
  })
}

// Hook for global search (across all conversations)
export const useGlobalSearch = (query: string, type: 'all' | 'event' | 'direct' = 'all') => {
  return useSearchMessages({ query, type })
}

// Hook for conversation-specific search
export const useConversationSearch = (query: string, conversationId: string) => {
  return useSearchMessages({ query, conversationId })
}

// Hook for recent searches (could be stored in localStorage)
export const useRecentSearches = () => {
  const getRecentSearches = (): string[] => {
    try {
      const stored = localStorage.getItem('recentMessageSearches')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  const addRecentSearch = (query: string) => {
    if (!query.trim()) return

    try {
      const recent = getRecentSearches()
      const filtered = recent.filter(q => q.toLowerCase() !== query.toLowerCase())
      const updated = [query, ...filtered].slice(0, 10) // Keep only 10 recent searches
      localStorage.setItem('recentMessageSearches', JSON.stringify(updated))
    } catch {
      // Ignore localStorage errors
    }
  }

  const clearRecentSearches = () => {
    try {
      localStorage.removeItem('recentMessageSearches')
    } catch {
      // Ignore localStorage errors
    }
  }

  return {
    recentSearches: getRecentSearches(),
    addRecentSearch,
    clearRecentSearches,
  }
}



