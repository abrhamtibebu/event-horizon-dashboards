import axios from 'axios'
import { getApiBaseURL } from '@/config/env'
import { isTokenExpired, isTokenExpiringSoon } from '@/utils/token'

const REMEMBER_ME_KEY = 'auth_remember_me'
const SESSION_STARTED_KEY = 'auth_session_started_at'
const JWT_KEY = 'jwt'
const TOKEN_EXPIRES_KEY = 'token_expires_at'
const TOKEN_CREATED_KEY = 'token_created_at'

/** Absolute session when Remember me is off. */
export const SESSION_DURATION_MS = 6 * 60 * 60 * 1000

/** Absolute session when Remember me is on (standard ~30 days). */
export const REMEMBER_ME_DURATION_MS = 30 * 24 * 60 * 60 * 1000

const AUTH_KEYS = [
  JWT_KEY,
  TOKEN_EXPIRES_KEY,
  TOKEN_CREATED_KEY,
  'user_role',
  'user_id',
  'organizer_id',
  'mock_auth',
] as const

export function isRememberMeEnabled(): boolean {
  if (localStorage.getItem(REMEMBER_ME_KEY) === 'true') {
    return true
  }

  // Legacy sessions: token was stored in localStorage before the remember flag existed.
  if (localStorage.getItem(JWT_KEY) && !sessionStorage.getItem(JWT_KEY)) {
    return true
  }

  return false
}

export function setRememberMePreference(enabled: boolean): void {
  const storage = enabled ? localStorage : sessionStorage
  const startedAt = Date.now().toString()

  if (enabled) {
    localStorage.setItem(REMEMBER_ME_KEY, 'true')
    localStorage.setItem(SESSION_STARTED_KEY, startedAt)
    sessionStorage.removeItem(SESSION_STARTED_KEY)
    return
  }

  localStorage.removeItem(REMEMBER_ME_KEY)
  localStorage.removeItem(SESSION_STARTED_KEY)
  storage.setItem(SESSION_STARTED_KEY, startedAt)
}

export function getAuthStorage(): Storage {
  return isRememberMeEnabled() ? localStorage : sessionStorage
}

export function getStoredToken(): string | null {
  return localStorage.getItem(JWT_KEY) || sessionStorage.getItem(JWT_KEY)
}

export function clearAuthTokens(): void {
  for (const key of AUTH_KEYS) {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  }
}

export function clearAuthSession(): void {
  clearAuthTokens()
  localStorage.removeItem(REMEMBER_ME_KEY)
  localStorage.removeItem(SESSION_STARTED_KEY)
  sessionStorage.removeItem(SESSION_STARTED_KEY)
}

function getSessionStartedAt(): number | null {
  const raw =
    localStorage.getItem(SESSION_STARTED_KEY) ??
    sessionStorage.getItem(SESSION_STARTED_KEY)
  if (raw) {
    const started = parseInt(raw, 10)
    if (!Number.isNaN(started)) return started
  }

  const createdAt =
    localStorage.getItem(TOKEN_CREATED_KEY) ??
    sessionStorage.getItem(TOKEN_CREATED_KEY)
  if (createdAt) {
    const created = parseInt(createdAt, 10)
    if (!Number.isNaN(created)) return created
  }

  return null
}

/**
 * Absolute session expiry: 30 days when remembered, otherwise 6 hours.
 */
export function isSessionExpired(): boolean {
  const started = getSessionStartedAt()
  if (started === null) {
    return false
  }

  const maxAge = isRememberMeEnabled()
    ? REMEMBER_ME_DURATION_MS
    : SESSION_DURATION_MS

  return Date.now() - started >= maxAge
}

/** @deprecated Use isSessionExpired() — kept for any lingering imports. */
export function isRememberMeSessionExpired(): boolean {
  return isSessionExpired()
}

export function persistAuthToken(
  token: string,
  remember: boolean,
  expiresInSeconds?: number,
): Storage {
  clearAuthTokens()
  setRememberMePreference(remember)

  const storage = getAuthStorage()
  storage.setItem(JWT_KEY, token)
  storage.setItem(TOKEN_CREATED_KEY, Date.now().toString())

  if (expiresInSeconds) {
    storage.setItem(
      TOKEN_EXPIRES_KEY,
      (Date.now() + expiresInSeconds * 1000).toString(),
    )
  }

  return storage
}

export function storeRefreshedToken(
  token: string,
  expiresInSeconds?: number,
): void {
  const storage = getAuthStorage()
  storage.setItem(JWT_KEY, token)

  if (expiresInSeconds) {
    storage.setItem(
      TOKEN_EXPIRES_KEY,
      (Date.now() + expiresInSeconds * 1000).toString(),
    )
  }
}

export function shouldRefreshToken(token: string | null): boolean {
  if (!token) return false
  return isTokenExpired(token) || isTokenExpiringSoon(token, 5)
}

/**
 * Refresh the JWT using the current stored token.
 * Uses the API base URL directly to avoid interceptor recursion.
 */
export async function refreshAccessToken(): Promise<string | null> {
  const token = getStoredToken()
  if (!token) {
    throw new Error('No token available')
  }

  if (isSessionExpired()) {
    throw new Error('Session expired')
  }

  const response = await axios.post(
    `${getApiBaseURL()}/refresh`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  const { token: newToken, expires_in: expiresIn } = response.data
  if (!newToken) {
    throw new Error('Refresh response missing token')
  }

  storeRefreshedToken(newToken, expiresIn)
  return newToken
}
