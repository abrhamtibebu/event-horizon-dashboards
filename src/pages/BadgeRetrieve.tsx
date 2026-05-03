import { FormEvent, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { AlertCircle, CheckCircle, Download, Mail, Search, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

import api, { lookupPublicBadge, type PublicBadgeLookupResponse } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SpinnerInline } from '@/components/ui/spinner'

export default function BadgeRetrieve() {
  const { eventUuid } = useParams()
  const [searchParams] = useSearchParams()
  const [identifier, setIdentifier] = useState(searchParams.get('identifier') || '')
  const [lookupResult, setLookupResult] = useState<PublicBadgeLookupResponse | null>(null)
  const [lookingUp, setLookingUp] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLookup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!eventUuid) {
      setError('Badge retrieval link is missing event information.')
      return
    }

    const trimmedIdentifier = identifier.trim()
    if (!trimmedIdentifier) {
      setError('Enter the email address or phone number used during registration.')
      return
    }

    setLookingUp(true)
    setError(null)
    setLookupResult(null)

    try {
      const response = await lookupPublicBadge(eventUuid, trimmedIdentifier)
      setLookupResult(response.data)
      toast.success('Registration found.')
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        'No registration was found for this event and contact information.'
      setError(message)
      toast.error(message)
    } finally {
      setLookingUp(false)
    }
  }

  const handleDownloadBadge = async () => {
    if (!lookupResult) return

    setDownloading(true)

    try {
      const response = await api.get(
        `/public/events/${lookupResult.eventId}/attendees/${lookupResult.attendeeId}/badge`,
        {
          params: { guestUuid: lookupResult.guestUuid },
          responseType: 'blob',
        },
      )

      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${lookupResult.guestName?.replace(/\s+/g, '-') || 'badge'}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('E-badge downloaded successfully.')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to download badge. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 font-['Outfit']">
      <Card className="w-full max-w-lg bg-white dark:bg-slate-900 border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2rem] sm:rounded-[3rem] overflow-hidden">
        <div className="h-2 bg-[#f97316]" />
        <CardContent className="p-8 sm:p-12">
          <div className="w-20 h-20 bg-orange-50 dark:bg-orange-900/20 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-orange-100 dark:border-orange-800">
            <ShieldCheck className="w-10 h-10 text-[#f97316]" />
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-3">
              Retrieve Your E-Badge
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Enter the email address or phone number you used to register for this event.
            </p>
          </div>

          <form onSubmit={handleLookup} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Email or Phone
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="identifier"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder="name@example.com or 0911..."
                  className="h-14 rounded-2xl pl-11 bg-slate-50 dark:bg-slate-800 border-none font-semibold"
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="rounded-2xl">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={lookingUp}
              className="w-full h-14 bg-[#f97316] hover:bg-[#ea580c] text-white font-black text-base rounded-2xl shadow-[0_10px_20px_rgba(249,115,22,0.25)]"
            >
              {lookingUp ? (
                <SpinnerInline size="sm" />
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Search className="w-5 h-5" />
                  Find My Badge
                </span>
              )}
            </Button>
          </form>

          {lookupResult && (
            <div className="mt-8 space-y-6">
              <div className="rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-6 text-center">
                <CheckCircle className="w-8 h-8 text-[#f97316] mx-auto mb-3" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Registration Found
                </p>
                <p className="text-lg font-black text-slate-900 dark:text-white">
                  {lookupResult.guestName}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {lookupResult.eventName}
                </p>
              </div>

              <div className="flex justify-center">
                <div className="bg-white rounded-3xl p-5 shadow-inner border border-slate-100">
                  <QRCodeSVG value={lookupResult.qrCode} size={180} />
                </div>
              </div>

              <Button
                type="button"
                onClick={handleDownloadBadge}
                disabled={downloading}
                className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-black text-base rounded-2xl"
              >
                {downloading ? (
                  <SpinnerInline size="sm" />
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Download className="w-5 h-5" />
                    Download E-Badge
                  </span>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
