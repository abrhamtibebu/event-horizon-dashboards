import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Spinner } from '@/components/ui/spinner'
import { AlertCircle } from 'lucide-react'
import api from '@/lib/api'

/**
 * TokenTransferPage — handles cross-app redirect when an organizer-type user
 * signs in via evella.et and gets redirected here with their JWT token.
 * URL: /auth/google/transfer?token=<JWT>
 */
export default function TokenTransferPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      setError('No token received.')
      return
    }

    let cancelled = false

    ;(async () => {
      try {
        // Store the token
        localStorage.setItem('jwt', token)
        localStorage.setItem('token_created_at', Date.now().toString())
        localStorage.removeItem('mock_auth')

        // Fetch user data to validate token and populate context
        const { data } = await api.get('/me', {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (cancelled) return

        setUser(data)
        navigate('/dashboard', { replace: true })
      } catch (err: any) {
        if (cancelled) return
        localStorage.removeItem('jwt')
        setError(
          err?.response?.data?.error ??
          err?.message ??
          'Authentication transfer failed. Please sign in again.'
        )
      }
    })()

    return () => { cancelled = true }
  }, [searchParams, navigate, setUser])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-semibold text-foreground">Authentication failed</h1>
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
        <p className="text-sm text-muted-foreground">Setting up your dashboard…</p>
      </div>
    </div>
  )
}
