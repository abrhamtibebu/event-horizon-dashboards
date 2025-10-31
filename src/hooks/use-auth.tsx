import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react'
import api from '@/lib/api'
import { useNavigate } from 'react-router-dom'

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

  useEffect(() => {
    const checkLoggedIn = async () => {
      console.log('[Auth] Checking authentication status...')
      let token = localStorage.getItem('jwt') || sessionStorage.getItem('jwt')
      console.log('[Auth] Token found:', !!token)
      
      // For development, if no token exists, go directly to mock mode
      // But only if we haven't just logged out (check for a logout flag)
      // DISABLED: Don't automatically enter mock mode to allow real API calls
      // if (!token && import.meta.env.DEV && !sessionStorage.getItem('just_logged_out')) {
      //   console.log('[Auth] No token found, entering mock authentication mode for development')
      //   localStorage.setItem('mock_auth', 'true')
      //   setUser({
      //     id: '6',
      //     email: 'test@organizer.com',
      //     role: 'organizer',
      //     organizer_id: 1,
      //     organizer: {
      //       id: 1,
      //       name: 'Test Organizer',
      //       status: 'active'
      //     }
      //   })
      //   setIsLoading(false)
      //   return
      // }
      
      if (token) {
        try {
          console.log('[Auth] Making API call to /me...')
          const { data } = await api.get('/me')
          console.log('[Auth] User data received:', data)
          setUser(data)
      // Clear mock auth flag if we successfully authenticated
      localStorage.removeItem('mock_auth')
      // Also clear it on initialization to ensure we're not in mock mode
      localStorage.removeItem('mock_auth')
        } catch (error) {
          console.error('[Auth] Session expired or invalid:', error)
          // For development, create a mock user if API fails
          if (import.meta.env.DEV) {
            console.log('[Auth] API failed, creating mock user for development')
            setUser({
              id: '6',
              email: 'test@organizer.com',
              role: 'organizer',
              organizer_id: 1,
              organizer: {
                id: 1,
                name: 'Test Organizer',
                status: 'active'
              }
            })
            // Clear the invalid token and set a flag to indicate we're in mock mode
            localStorage.removeItem('jwt')
            localStorage.setItem('mock_auth', 'true')
          } else {
            // Clear invalid tokens
            localStorage.removeItem('jwt')
            sessionStorage.removeItem('jwt')
            setUser(null)
          }
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
  }, [])

  const login = async (
    credentials: { email: string; password: string },
    remember = false
  ) => {
    try {
      // Login endpoint doesn't require API key, so we don't send it
      const res = await api.post('/login', credentials)
      const { token, user } = res.data
      
      // Store token based on remember preference
      if (remember) {
        localStorage.setItem('jwt', token)
      } else {
        sessionStorage.setItem('jwt', token)
      }
      
      // Clear logout flag on successful login
      sessionStorage.removeItem('just_logged_out')
      localStorage.removeItem('mock_auth')
      
      setUser(user)
    } catch (error) {
      console.error('[Auth] Login failed:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      // Only attempt API logout if not in mock mode
      const isMockAuth = localStorage.getItem('mock_auth') === 'true'
      if (!isMockAuth) {
        await api.post('/logout')
      }
    } catch (error) {
      console.error('Logout failed', error)
    } finally {
      // Set logout flag to prevent immediate re-authentication
      sessionStorage.setItem('just_logged_out', 'true')
      
      // Clear all authentication data
      localStorage.removeItem('jwt')
      sessionStorage.removeItem('jwt')
      localStorage.removeItem('user_role')
      localStorage.removeItem('user_id')
      localStorage.removeItem('organizer_id')
      localStorage.removeItem('mock_auth') // Clear mock auth flag
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
