import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AlertCircle, CheckCircle, Download, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DEFAULT_TELEBIRR_EVENT_ID } from '@/pages/telebirr-reg/constants'
import { telebirrRegisterPath } from '@/pages/telebirr-reg/routes'

export default function PublicBadgeDownload() {
  const { attendeeId, guestUuidShort } = useParams<{
    attendeeId: string
    guestUuidShort: string
  }>()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!attendeeId || !guestUuidShort) {
      setStatus('error')
      setErrorMessage('Invalid badge download link.')
      return
    }

    let cancelled = false

    const download = async () => {
      try {
        const response = await api.get(`/public/badge/${attendeeId}/${guestUuidShort}`, {
          responseType: 'blob',
        })

        if (cancelled) return

        const blob = new Blob([response.data], { type: 'application/pdf' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `telebirr-e-badge-${guestUuidShort}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        setStatus('success')
      } catch (err: unknown) {
        if (cancelled) return

        const axiosErr = err as { response?: { data?: Blob | { error?: string } } }
        let message = 'Could not download your e-badge. Please try again from the registration success page.'

        const data = axiosErr.response?.data
        if (data instanceof Blob) {
          try {
            const text = await data.text()
            const parsed = JSON.parse(text) as { error?: string }
            if (parsed.error) message = parsed.error
          } catch {
            // keep default
          }
        } else if (data && typeof data === 'object' && 'error' in data && data.error) {
          message = data.error
        }

        setErrorMessage(message)
        setStatus('error')
      }
    }

    void download()

    return () => {
      cancelled = true
    }
  }, [attendeeId, guestUuidShort])

  const registerPath = telebirrRegisterPath(DEFAULT_TELEBIRR_EVENT_ID)

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md rounded-3xl border-none shadow-xl">
        <CardContent className="p-8 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-gray-900 mb-2">Preparing your e-badge</h1>
              <p className="text-sm text-gray-500">Your download should start automatically.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-gray-900 mb-2">E-badge downloaded</h1>
              <p className="text-sm text-gray-500">
                If the file did not save, check your downloads folder or tap download again.
              </p>
              <Button
                className="mt-6 w-full"
                onClick={() => window.location.reload()}
              >
                <Download className="w-4 h-4 mr-2" />
                Download again
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-gray-900 mb-2">E-badge unavailable</h1>
              <p className="text-sm text-gray-500">{errorMessage}</p>
              <Button
                className="mt-6 w-full"
                variant="outline"
                onClick={() => {
                  window.location.href = registerPath
                }}
              >
                Register again
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
