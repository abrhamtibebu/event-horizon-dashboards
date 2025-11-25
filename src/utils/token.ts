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
 * Check if refresh period (7 days) has expired
 * Token creation time is stored in 'iat' (issued at) claim or token_created_at in storage
 */
export function isRefreshPeriodExpired(token: string | null): boolean {
  if (!token) return true

  // Check if token is a mock/invalid token
  if (token === 'dev-token' || token.length < 20) {
    return true
  }

  const payload = parseJWT(token)
  if (!payload) {
    // If we can't parse the token, check if we have token_created_at in storage
    const storage = localStorage.getItem('jwt') ? localStorage : sessionStorage
    const tokenCreatedAt = storage.getItem('token_created_at')
    if (tokenCreatedAt) {
      const createdTime = parseInt(tokenCreatedAt, 10)
      const now = Date.now()
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000 // 7 days
      return now - createdTime >= sevenDaysInMs
    }
    return true
  }

  if (!payload.iat) {
    // Fallback to token_created_at from storage
    const storage = localStorage.getItem('jwt') ? localStorage : sessionStorage
    const tokenCreatedAt = storage.getItem('token_created_at')
    if (tokenCreatedAt) {
      const createdTime = parseInt(tokenCreatedAt, 10)
      const now = Date.now()
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000 // 7 days
      return now - createdTime >= sevenDaysInMs
    }
    return true
  }

  // iat is in seconds, convert to milliseconds
  const tokenCreatedAt = payload.iat * 1000
  const now = Date.now()
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000 // 7 days

  return now - tokenCreatedAt >= sevenDaysInMs
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

