import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Spinner } from '@/components/ui/spinner'
import { AlertCircle } from 'lucide-react'
import api from '@/lib/api'
import { persistAuthToken } from '@/lib/authSession'

/**
 * Cross-app OAuth handoff. The URL may only contain a one-time code.
 */
export default function TokenTransferPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (searchParams.get('token')) {
      setError('This sign-in link is no longer valid. Please sign in again.')
      return
    }

    const code = searchParams.get('code')
    if (!code) {
      setError('No transfer code received.')
      return
    }

    let cancelled = false

    ;(async () => {
      try {
        const { data } = await api.post('/auth/handoff/consume', { code })
        if (cancelled) return

        persistAuthToken(data.token, true, data.expires_in)
        window.history.replaceState({}, document.title, window.location.pathname)
        setUser(data.user)
        navigate('/dashboard', { replace: true })
      } catch (err: any) {
        if (cancelled) return
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
