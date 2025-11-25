const normalizeTransport = (value?: string) => (value || 'websocket').trim().toLowerCase()

const TRANSPORT = normalizeTransport(import.meta.env.VITE_MESSAGING_TRANSPORT as string | undefined)

const DEFAULT_FAST_POLL_MS = Number(import.meta.env.VITE_MESSAGING_POLL_INTERVAL_MS ?? 3000)
const DEFAULT_RESYNC_MS = Number(import.meta.env.VITE_MESSAGING_RESYNC_INTERVAL_MS ?? 60000)

export const messagingConfig = {
  transport: TRANSPORT === 'polling' ? 'polling' : 'websocket',
  fastPollMs: DEFAULT_FAST_POLL_MS > 0 ? DEFAULT_FAST_POLL_MS : 3000,
  resyncMs: DEFAULT_RESYNC_MS > 0 ? DEFAULT_RESYNC_MS : 60000,
}

export const shouldUseWebsocket = messagingConfig.transport === 'websocket'

export const getPollingInterval = (preferredMs?: number) => {
  const target = preferredMs ?? messagingConfig.fastPollMs
  return shouldUseWebsocket ? messagingConfig.resyncMs : target
}

