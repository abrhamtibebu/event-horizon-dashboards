/**
 * Token utility functions for JWT token management
 */

/**
 * Parse JWT token and extract payload
 */
export function parseJWT(token: string | null): any {
  if (!token || typeof token !== 'string') {
    return null
  }
  
  // Check if token is a valid JWT format (has 3 parts separated by dots)
  const parts = token.split('.')
  if (parts.length !== 3) {
    console.warn('Invalid JWT format: token does not have 3 parts')
    return null
  }
  
  try {
    const base64Url = parts[1]
    if (!base64Url) {
      console.warn('Invalid JWT: missing payload')
      return null
    }
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Failed to parse JWT:', error, 'Token:', token.substring(0, 50) + '...')
    return null
  }
}

/**
 * Get token expiration timestamp from JWT
 */
export function getTokenExpiration(token: string): number | null {
  const payload = parseJWT(token)
  if (!payload || !payload.exp) {
    return null
  }
  // exp is in seconds, convert to milliseconds
  return payload.exp * 1000
}

/**
 * Check if token is expired or will expire soon
 */
export function isTokenExpiringSoon(
  token: string | null,
  bufferMinutes: number = 5
): boolean {
  if (!token) return true

  const expiration = getTokenExpiration(token)
  if (!expiration) return true

  const now = Date.now()
  const bufferMs = bufferMinutes * 60 * 1000
  return expiration - now <= bufferMs
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true

  const expiration = getTokenExpiration(token)
  if (!expiration) return true

  return Date.now() >= expiration
}

/**
 * @deprecated Use isSessionExpired from @/lib/authSession instead.
 */
export function isRefreshPeriodExpired(_token: string | null): boolean {
  return false
}

/**
 * Calculate time until token expiration (in seconds)
 */
export function getTimeUntilExpiration(token: string | null): number | null {
  if (!token) return null

  const expiration = getTokenExpiration(token)
  if (!expiration) return null

  const now = Date.now()
  const diff = Math.floor((expiration - now) / 1000) // Convert to seconds
  return diff > 0 ? diff : 0
}

