/**
 * Tokens currently live in web storage because the dashboard SPA calls the
 * Validity API cross-origin. Planned follow-up: HttpOnly cookies via a BFF
 * or same-site cookie domain. Do not put JWTs in query strings.
 */
import axios from 'axios'
import { getApiBaseURL } from '@/config/env'
import { isTokenExpired, isTokenExpiringSoon } from '@/utils/token'

const REMEMBER_ME_KEY = 'auth_remember_me'
const SESSION_STARTED_KEY = 'auth_session_started_at'
const JWT_KEY = 'jwt'
const TOKEN_EXPIRES_KEY = 'token_expires_at'
const TOKEN_CREATED_KEY = 'token_created_at'

/** Absolute session when Remember me is off. Shared across tabs on this device. */
export const SESSION_DURATION_MS = 6 * 60 * 60 * 1000

/** Absolute session when Remember me is on. */
export const REMEMBER_ME_DURATION_MS = 7 * 24 * 60 * 60 * 1000

const SESSION_EXPIRES_KEY = 'auth_session_expires_at'
const REFRESH_LOCK_KEY = 'auth_refresh_lock'

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
  return localStorage.getItem(REMEMBER_ME_KEY) === 'true'
}

export function setRememberMePreference(enabled: boolean): void {
  const startedAt = Date.now().toString()
  const expiresAt = (
    Date.now() + (enabled ? REMEMBER_ME_DURATION_MS : SESSION_DURATION_MS)
  ).toString()

  localStorage.setItem(SESSION_STARTED_KEY, startedAt)
  localStorage.setItem(SESSION_EXPIRES_KEY, expiresAt)
  sessionStorage.removeItem(SESSION_STARTED_KEY)

  if (enabled) {
    localStorage.setItem(REMEMBER_ME_KEY, 'true')
    return
  }

  localStorage.removeItem(REMEMBER_ME_KEY)
}

export function getAuthStorage(): Storage {
  return localStorage
}

/**
 * Older sign-ins kept the token in sessionStorage, which is not shared
 * with other tabs. Move that session into localStorage once so a second
 * tab on this device stays signed in.
 */
function promoteTabSessionToDevice(): void {
  if (localStorage.getItem(JWT_KEY) || !sessionStorage.getItem(JWT_KEY)) {
    return
  }

  for (const key of AUTH_KEYS) {
    const value = sessionStorage.getItem(key)
    if (value) localStorage.setItem(key, value)
    sessionStorage.removeItem(key)
  }

  const started = sessionStorage.getItem(SESSION_STARTED_KEY)
  if (started) {
    localStorage.setItem(SESSION_STARTED_KEY, started)
    sessionStorage.removeItem(SESSION_STARTED_KEY)
  }

  if (!localStorage.getItem(SESSION_EXPIRES_KEY)) {
    const start = started ? parseInt(started, 10) : Date.now()
    const base = Number.isNaN(start) ? Date.now() : start
    localStorage.setItem(SESSION_EXPIRES_KEY, String(base + SESSION_DURATION_MS))
  }
}

export function getStoredToken(): string | null {
  promoteTabSessionToDevice()
  return localStorage.getItem(JWT_KEY)
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
  localStorage.removeItem(SESSION_EXPIRES_KEY)
  sessionStorage.removeItem(SESSION_STARTED_KEY)
  sessionStorage.removeItem(SESSION_EXPIRES_KEY)
  localStorage.removeItem(REFRESH_LOCK_KEY)
  sessionStorage.removeItem('auth_2fa_pending')
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
 * Absolute session expiry: 7 days when remembered, otherwise 6 hours.
 */
export function isSessionExpired(): boolean {
  const raw = localStorage.getItem(SESSION_EXPIRES_KEY)
  if (raw) {
    const expiresAt = parseInt(raw, 10)
    if (!Number.isNaN(expiresAt)) {
      return Date.now() >= expiresAt
    }
  }

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
  sessionExpiresAtSeconds?: number,
): Storage {
  clearAuthTokens()
  setRememberMePreference(remember)

  if (sessionExpiresAtSeconds) {
    localStorage.setItem(
      SESSION_EXPIRES_KEY,
      String(sessionExpiresAtSeconds * 1000),
    )
  }

  localStorage.setItem(JWT_KEY, token)
  localStorage.setItem(TOKEN_CREATED_KEY, Date.now().toString())

  if (expiresInSeconds) {
    localStorage.setItem(
      TOKEN_EXPIRES_KEY,
      (Date.now() + expiresInSeconds * 1000).toString(),
    )
  }

  return localStorage
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Wait until another tab finishes refreshing and writes a new token. */
async function waitForRefreshedToken(previous: string, timeoutMs: number): Promise<string | null> {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    await sleep(150)
    const current = localStorage.getItem(JWT_KEY)
    if (current && current !== previous) return current
  }
  const current = localStorage.getItem(JWT_KEY)
  return current && current !== previous ? current : null
}

/**
 * Refresh the JWT using the current stored token.
 * Uses the API base URL directly to avoid interceptor recursion.
 * One tab refreshes at a time so the others keep the new token.
 */
export async function refreshAccessToken(): Promise<string | null> {
  const token = getStoredToken()
  if (!token) {
    throw new Error('No token available')
  }

  if (isSessionExpired()) {
    throw new Error('Session expired')
  }

  const lockId = `${Date.now()}:${Math.random().toString(36).slice(2)}`
  const existing = localStorage.getItem(REFRESH_LOCK_KEY)
  const existingAt = existing ? parseInt(existing.split(':')[0], 10) : NaN
  const lockIsFresh = !Number.isNaN(existingAt) && Date.now() - existingAt < 15000

  if (lockIsFresh) {
    const waited = await waitForRefreshedToken(token, 15000)
    if (waited) return waited
  }

  localStorage.setItem(REFRESH_LOCK_KEY, lockId)
  await sleep(40)
  if (localStorage.getItem(REFRESH_LOCK_KEY) !== lockId) {
    const waited = await waitForRefreshedToken(token, 15000)
    if (waited) return waited
    throw new Error('Token refresh failed')
  }

  try {
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
  } finally {
    if (localStorage.getItem(REFRESH_LOCK_KEY) === lockId) {
      localStorage.removeItem(REFRESH_LOCK_KEY)
    }
  }
}
