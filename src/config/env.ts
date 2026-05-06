/**
 * Central environment configuration.
 * All API base URLs and env-derived config must go through this file
 * so that every request uses values from .env (VITE_* variables).
 */

const DEFAULT_API_BASE_URL = 'http://localhost:8000/api'

/**
 * Get the API base URL (with /api suffix). Use this for all API requests.
 * Set VITE_API_URL in .env (e.g. VITE_API_URL=http://localhost:8000/api).
 */
export function getApiBaseURL(): string {
  const envURL = import.meta.env.VITE_API_URL
  if (envURL && typeof envURL === 'string') {
    const trimmed = envURL.trim()
    if (!trimmed) return DEFAULT_API_BASE_URL
    return trimmed.endsWith('/api') ? trimmed : `${trimmed.replace(/\/$/, '')}/api`
  }
  return DEFAULT_API_BASE_URL
}

/**
 * Get the base URL for storage/file URLs (origin without /api).
 * Use for building links like /storage/... (e.g. images, documents).
 */
export function getApiBaseURLForStorage(): string {
  const base = getApiBaseURL()
  return base.replace(/\/api\/?$/, '').replace(/\/$/, '') || base
}

/**
 * Base URL for social share OG preview pages (Laravel /share/... routes), no trailing slash.
 * Prefer VITE_SHARE_PREVIEW_URL when the API/storage host differs from the share host; otherwise mirrors API origin without /api.
 */
export function getSharePreviewBaseURL(): string {
  const explicit = import.meta.env.VITE_SHARE_PREVIEW_URL
  if (explicit && typeof explicit === 'string') {
    const t = explicit.trim().replace(/\/$/, '')
    if (t) return t
  }
  return getApiBaseURLForStorage()
}

/**
 * Optional: Google Maps API key (VITE_GOOGLE_MAPS_API_KEY)
 */
export function getGoogleMapsApiKey(): string | undefined {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  return typeof key === 'string' && key ? key : undefined
}

/**
 * Optional: Cloudflare Turnstile site key (VITE_TURNSTILE_SITE_KEY)
 */
export function getTurnstileSiteKey(): string | undefined {
  const key = import.meta.env.VITE_TURNSTILE_SITE_KEY
  return typeof key === 'string' && key ? key : undefined
}

/**
 * Public frontend origin for share/register links (no trailing slash).
 * Prefer VITE_PUBLIC_URL in deploy env; fallback to browser origin.
 */
export function getPublicSiteURL(): string {
  const fromEnv = import.meta.env.VITE_PUBLIC_URL
  if (fromEnv && typeof fromEnv === 'string') {
    return fromEnv.replace(/\/$/, '').trim() || window.location.origin
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return ''
}

/**
 * Optional backend origin serving OG/share bridge routes (trimmed, no trailing slash).
 * Set VITE_REGISTRATION_SHARE_BRIDGE_ORIGIN when previews should use a dedicated host.
 */
export function getRegistrationShareBridgeOrigin(): string | null {
  const raw = import.meta.env.VITE_REGISTRATION_SHARE_BRIDGE_ORIGIN
  if (raw === undefined || raw === null || typeof raw !== 'string') return null
  const t = raw.trim().replace(/\/$/, '')
  return t || null
}
