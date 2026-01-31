/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend API base URL (with /api). All API requests use this. Set in .env. */
  readonly VITE_API_URL?: string
  readonly VITE_API_KEY?: string
  readonly VITE_EVELLA_URL?: string
  readonly VITE_PLATFORM_URL?: string
  readonly VITE_GOOGLE_MAPS_API_KEY?: string
  readonly VITE_MESSAGING_TRANSPORT?: string
  readonly VITE_MESSAGING_POLL_INTERVAL_MS?: string
  readonly VITE_MESSAGING_RESYNC_INTERVAL_MS?: string
  readonly VITE_PUSHER_APP_KEY?: string
  readonly VITE_PUSHER_APP_CLUSTER?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
