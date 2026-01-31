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
    return envURL.endsWith('/api') ? envURL : `${envURL.replace(/\/$/, '')}/api`
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
 * Optional: Google Maps API key (VITE_GOOGLE_MAPS_API_KEY)
 */
export function getGoogleMapsApiKey(): string | undefined {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  return typeof key === 'string' && key ? key : undefined
}
