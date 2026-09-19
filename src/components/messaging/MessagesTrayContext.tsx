import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

type TrayView = 'collapsed' | 'inbox' | 'chat' | 'compose'

interface TrayState {
  view: TrayView
  conversationId: string | null
}

interface MessagesTrayContextValue {
  view: TrayView
  conversationId: string | null
  openInbox: () => void
  openChat: (conversationId: string) => void
  openCompose: () => void
  backToInbox: () => void
  collapse: () => void
  expand: () => void
}

const STORAGE_KEY = 'evella.messagesTray'

const MessagesTrayContext = createContext<MessagesTrayContextValue | null>(null)

function readStoredState(): TrayState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return { view: 'collapsed', conversationId: null }
    const parsed = JSON.parse(raw) as TrayState
    if (parsed.view === 'chat' && parsed.conversationId) return parsed
    if (parsed.view === 'inbox' || parsed.view === 'compose') {
      return { view: parsed.view === 'compose' ? 'compose' : 'inbox', conversationId: null }
    }
    return { view: 'collapsed', conversationId: null }
  } catch {
    return { view: 'collapsed', conversationId: null }
  }
}

export function MessagesTrayProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TrayState>(() =>
    typeof window !== 'undefined' ? readStoredState() : { view: 'collapsed', conversationId: null }
  )

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const openInbox = useCallback(() => {
    setState({ view: 'inbox', conversationId: null })
  }, [])

  const openChat = useCallback((conversationId: string) => {
    setState({ view: 'chat', conversationId })
  }, [])

  const openCompose = useCallback(() => {
    setState({ view: 'compose', conversationId: null })
  }, [])

  const backToInbox = useCallback(() => {
    setState({ view: 'inbox', conversationId: null })
  }, [])

  const collapse = useCallback(() => {
    setState(prev => ({ view: 'collapsed', conversationId: prev.conversationId }))
  }, [])

  const expand = useCallback(() => {
    setState(prev => {
      if (prev.conversationId) return { view: 'chat', conversationId: prev.conversationId }
      return { view: 'inbox', conversationId: null }
    })
  }, [])

  const value = useMemo(
    () => ({
      view: state.view,
      conversationId: state.conversationId,
      openInbox,
      openChat,
      openCompose,
      backToInbox,
      collapse,
      expand,
    }),
    [state, openInbox, openChat, openCompose, backToInbox, collapse, expand]
  )

  return (
    <MessagesTrayContext.Provider value={value}>
      {children}
    </MessagesTrayContext.Provider>
  )
}

export function useMessagesTray() {
  const ctx = useContext(MessagesTrayContext)
  if (!ctx) {
    throw new Error('useMessagesTray must be used within MessagesTrayProvider')
  }
  return ctx
}
