import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useRef,
} from 'react'
import api from '@/lib/api'
import {
  clearAuthSession,
  getStoredToken,
  isSessionExpired,
  persistAuthToken,
  refreshAccessToken,
  shouldRefreshToken,
} from '@/lib/authSession'

export type Role = 'superadmin' | 'admin' | 'organizer_admin' | 'organizer' | 'usher' | 'attendee' | 'venue_admin' | 'venue_staff'

interface Organizer {
  id: number
  name: string
  status: string
  suspended_at?: string
  suspended_reason?: string
}

interface Venue {
  id: number
  name: string
  status: string
}

interface User {
  id: number | string
  email: string
  role: Role
  roles?: string[]
  organizer_id: number | null
  organizer: Organizer | null
  venue_id: number | null
  venue: Venue | null
}

interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  setUser: React.Dispatch<React.SetStateAction<User | null>>
  login: (
    credentials: { email: string; password: string; cf_turnstile_response?: string },
    remember?: boolean
  ) => Promise<void>
  logout: () => Promise<void>
  isLoading: boolean
  loginWithGoogle: (source?: 'dashboard' | 'venue') => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const isDev = import.meta.env.DEV

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const forceLogout = () => {
    clearAuthSession()
    setUser(null)
    window.location.href = '/'
  }

  const refreshTokenProactively = async () => {
    const token = getStoredToken()
    if (!token) return

    if (isSessionExpired()) {
      if (isDev) console.log('[Auth] Session period expired, logging out')
      forceLogout()
      return
    }

    if (!shouldRefreshToken(token)) {
      return
    }

    try {
      if (isDev) console.log('[Auth] Token expiring or expired, refreshing proactively')
      await refreshAccessToken()
      if (isDev) console.log('[Auth] Token refreshed successfully')
    } catch (error) {
      console.error('[Auth] Proactive token refresh failed:', error)
      forceLogout()
    }
  }

  useEffect(() => {
    const checkLoggedIn = async () => {
      console.log('[Auth] Checking authentication status...')
      let token = getStoredToken()
      console.log('[Auth] Token found:', !!token)

      if (token) {
        if (token === 'dev-token' || token.length < 20) {
          if (isDev) console.log('[Auth] Invalid/mock token found, clearing...')
          clearAuthSession()
          setUser(null)
          setIsLoading(false)
          return
        }

        if (isSessionExpired()) {
          if (isDev) console.log('[Auth] Session period expired on init')
          clearAuthSession()
          setUser(null)
          setIsLoading(false)
          return
        }

        if (shouldRefreshToken(token)) {
          try {
            await refreshAccessToken()
            token = getStoredToken()
          } catch (error) {
            console.error('[Auth] Token refresh on init failed:', error)
            clearAuthSession()
            setUser(null)
            setIsLoading(false)
            return
          }
        }

        try {
          console.log('[Auth] Making API call to /me...')
          const { data } = await api.get('/me')
          console.log('[Auth] User data received:', data)
          setUser(data)
          localStorage.removeItem('mock_auth')

          checkIntervalRef.current = setInterval(() => {
            refreshTokenProactively()
          }, 60 * 1000)
        } catch (error) {
          console.error('[Auth] Session expired or invalid:', error)
          clearAuthSession()
          setUser(null)
        }
      } else {
        if (isDev) console.log('[Auth] No token found, user not authenticated')
        setUser(null)
      }

      if (isDev) console.log('[Auth] Setting isLoading to false')
      setIsLoading(false)
    }

    checkLoggedIn()

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
    }
  }, [])

  const login = async (
    credentials: { email: string; password: string; cf_turnstile_response?: string },
    remember = false
  ) => {
    try {
      const res = await api.post('/login', { ...credentials, remember })
      const { token, user, expires_in } = res.data

      if (res.data.requires_2fa) {
        const error = Object.assign(new Error('2FA_REQUIRED'), {
          requires_2fa: true,
          two_factor_challenge: res.data.two_factor_challenge,
          user: res.data.user,
        })
        throw error
      }

      persistAuthToken(token, remember, expires_in)
      localStorage.removeItem('mock_auth')
      setUser(user)

      if (res.data.requires_2fa_setup) {
        const error = Object.assign(new Error('2FA_SETUP_REQUIRED'), {
          requires_2fa_setup: true,
        })
        throw error
      }

      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
      checkIntervalRef.current = setInterval(() => {
        refreshTokenProactively()
      }, 60 * 1000)
    } catch (error) {
      console.error('[Auth] Login failed:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await api.post('/logout')
    } catch (error) {
      console.error('Logout failed', error)
    } finally {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
        checkIntervalRef.current = null
      }

      clearAuthSession()
      setUser(null)
      window.location.href = '/'
    }
  }

  const loginWithGoogle = async (source: 'dashboard' | 'venue' = 'dashboard') => {
    try {
      sessionStorage.setItem('google_auth_source', source)
      const res = await api.get(`/auth/google/redirect?source=${source}`)
      window.location.href = res.data.auth_url
    } catch (error) {
      console.error('[Auth] Failed to start Google sign-in:', error)
      throw error
    }
  }

  const value = { isAuthenticated: !!user, user, setUser, login, logout, isLoading, loginWithGoogle }

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
