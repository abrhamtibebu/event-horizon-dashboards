import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useRef,
} from 'react'
import api from '@/lib/api'
import { useNavigate } from 'react-router-dom'
import { isTokenExpiringSoon, isRefreshPeriodExpired, getTokenExpiration } from '@/utils/token'

export type Role = 'superadmin' | 'admin' | 'organizer_admin' | 'organizer' | 'usher' | 'attendee'

interface Organizer {
  id: number
  name: string
  status: string
  suspended_at?: string
  suspended_reason?: string
}

interface User {
  id: string
  email: string
  role: Role
  roles?: string[]
  organizer_id: number | null
  organizer: Organizer | null
}

interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  login: (
    credentials: { email: string; password: string },
    remember?: boolean
  ) => Promise<void>
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Proactive token refresh function
  const refreshTokenProactively = async () => {
    const token = localStorage.getItem('jwt') || sessionStorage.getItem('jwt')
    if (!token) return

    // Check if refresh period has expired (7 days)
    if (isRefreshPeriodExpired(token)) {
      console.log('[Auth] Refresh period expired, logging out')
      // Clear tokens and logout
      localStorage.removeItem('jwt')
      sessionStorage.removeItem('jwt')
      localStorage.removeItem('token_expires_at')
      sessionStorage.removeItem('token_expires_at')
      localStorage.removeItem('token_created_at')
      sessionStorage.removeItem('token_created_at')
      localStorage.removeItem('user_role')
      localStorage.removeItem('user_id')
      localStorage.removeItem('organizer_id')
      setUser(null)
      window.location.href = '/'
      return
    }

    // Check if token is expiring soon (within 5 minutes)
    if (isTokenExpiringSoon(token, 5)) {
      try {
        console.log('[Auth] Token expiring soon, refreshing proactively')
        const response = await api.post('/refresh', {}, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const { token: newToken, user: userData, expires_in } = response.data

        // Store new token
        const storage = localStorage.getItem('jwt') ? localStorage : sessionStorage
        storage.setItem('jwt', newToken)

        // Store token expiration timestamp
        if (expires_in) {
          const expiresAt = Date.now() + expires_in * 1000
          storage.setItem('token_expires_at', expiresAt.toString())
        }

        // Update user if provided
        if (userData) {
          setUser(userData)
        }

        console.log('[Auth] Token refreshed successfully')
      } catch (error) {
        console.error('[Auth] Proactive token refresh failed:', error)
        // Refresh failed - logout user
        localStorage.removeItem('jwt')
        sessionStorage.removeItem('jwt')
        localStorage.removeItem('token_expires_at')
        sessionStorage.removeItem('token_expires_at')
        localStorage.removeItem('token_created_at')
        sessionStorage.removeItem('token_created_at')
        localStorage.removeItem('user_role')
        localStorage.removeItem('user_id')
        localStorage.removeItem('organizer_id')
        setUser(null)
        window.location.href = '/'
      }
    }
  }

  useEffect(() => {
    const checkLoggedIn = async () => {
      console.log('[Auth] Checking authentication status...')
      let token = localStorage.getItem('jwt') || sessionStorage.getItem('jwt')
      console.log('[Auth] Token found:', !!token)

      if (token) {
        // Check if token is valid format (not a mock token)
        if (token === 'dev-token' || token.length < 20) {
          console.log('[Auth] Invalid/mock token found, clearing...')
          localStorage.removeItem('jwt')
          sessionStorage.removeItem('jwt')
          localStorage.removeItem('token_expires_at')
          sessionStorage.removeItem('token_expires_at')
          localStorage.removeItem('token_created_at')
          sessionStorage.removeItem('token_created_at')
          setUser(null)
          setIsLoading(false)
          return
        }

        // Check if refresh period has expired
        if (isRefreshPeriodExpired(token)) {
          console.log('[Auth] Refresh period expired on init')
          localStorage.removeItem('jwt')
          sessionStorage.removeItem('jwt')
          localStorage.removeItem('token_expires_at')
          sessionStorage.removeItem('token_expires_at')
          localStorage.removeItem('token_created_at')
          sessionStorage.removeItem('token_created_at')
          setUser(null)
          setIsLoading(false)
          return
        }

        try {
          console.log('[Auth] Making API call to /me...')
          const { data } = await api.get('/me')
          console.log('[Auth] User data received:', data)
          setUser(data)
          localStorage.removeItem('mock_auth')

          // Set up proactive token refresh
          // Check every minute if token needs refresh
          checkIntervalRef.current = setInterval(() => {
            refreshTokenProactively()
          }, 60 * 1000) // Check every minute
        } catch (error) {
          console.error('[Auth] Session expired or invalid:', error)
          // Clear invalid tokens - no mock mode
          localStorage.removeItem('jwt')
          sessionStorage.removeItem('jwt')
          localStorage.removeItem('token_expires_at')
          sessionStorage.removeItem('token_expires_at')
          localStorage.removeItem('token_created_at')
          sessionStorage.removeItem('token_created_at')
          setUser(null)
        }
      } else {
        // No token found, user is not authenticated
        console.log('[Auth] No token found, user not authenticated')
        setUser(null)
      }
      console.log('[Auth] Setting isLoading to false')
      setIsLoading(false)
    }
    checkLoggedIn()

    // Cleanup intervals on unmount
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [])

  const login = async (
    credentials: { email: string; password: string },
    remember = false
  ) => {
    try {
      // Login endpoint doesn't require API key, so we don't send it
      const res = await api.post('/login', credentials)
      const { token, user, expires_in } = res.data

      // Store token based on remember preference
      const storage = remember ? localStorage : sessionStorage
      storage.setItem('jwt', token)

      // Store token expiration timestamp
      if (expires_in) {
        const expiresAt = Date.now() + expires_in * 1000
        storage.setItem('token_expires_at', expiresAt.toString())
      }

      // Store token creation time for refresh period tracking
      storage.setItem('token_created_at', Date.now().toString())

      localStorage.removeItem('mock_auth')

      setUser(user)

      // Set up proactive token refresh after login
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
      checkIntervalRef.current = setInterval(() => {
        refreshTokenProactively()
      }, 60 * 1000) // Check every minute
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
      // Clear refresh intervals
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
        checkIntervalRef.current = null
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
        refreshIntervalRef.current = null
      }

      // Clear all authentication data
      localStorage.removeItem('jwt')
      sessionStorage.removeItem('jwt')
      localStorage.removeItem('token_expires_at')
      sessionStorage.removeItem('token_expires_at')
      localStorage.removeItem('token_created_at')
      sessionStorage.removeItem('token_created_at')
      localStorage.removeItem('user_role')
      localStorage.removeItem('user_id')
      localStorage.removeItem('organizer_id')
      localStorage.removeItem('mock_auth')
      setUser(null)
      window.location.href = '/'
    }
  }

  const value = { isAuthenticated: !!user, user, login, logout, isLoading }

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
