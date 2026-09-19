import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import { AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { persistAuthToken } from '@/lib/authSession'

export default function GoogleCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const hasCalled = useRef(false)

  useEffect(() => {
    const code = searchParams.get('code')
    
    // If we somehow already have a token, just go to dashboard
    if (localStorage.getItem('jwt') && !code) {
      navigate('/dashboard', { replace: true })
      return
    }

    if (!code) {
      setError('No authorisation code received from Google.')
      return
    }

    if (hasCalled.current) return
    hasCalled.current = true

    ;(async () => {
      try {
        const res = await api.post('/auth/google/callback', {
          code,
          source: sessionStorage.getItem('google_auth_source') || 'dashboard',
        })
        sessionStorage.removeItem('google_auth_source')

        const { token, user, expires_in } = res.data

        persistAuthToken(token, true, expires_in)
        localStorage.removeItem('mock_auth')

        setUser(user)

        navigate('/dashboard', { replace: true })
      } catch (err: any) {
        // Handle double-call in dev mode
        if (err?.response?.status === 400 && localStorage.getItem('jwt')) {
          navigate('/dashboard', { replace: true })
          return
        }

        setError(
          err.response?.data?.error ||
            err.message ||
            'Google sign-in failed. Please try again.',
        )
      }
    })()
  }, [searchParams, navigate, setUser])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-semibold text-foreground">Sign-in failed</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => navigate('/signin', { replace: true })}
            className="text-sm font-medium text-primary hover:underline"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" variant="primary" />
        <p className="text-sm text-muted-foreground">Completing Google sign-in...</p>
      </div>
    </div>
  )
}
