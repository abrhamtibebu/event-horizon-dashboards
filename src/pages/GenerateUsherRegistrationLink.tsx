import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { getMyEvents, getEventById, createShortLink } from '@/lib/api'

interface EventSummary {
  id: number
  name: string
  start_date?: string
  end_date?: string
  location?: string
  uuid?: string
  status?: string
}

export default function GenerateUsherRegistrationLink() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const preselectedEventId = searchParams.get('eventId') || ''

  const [events, setEvents] = useState<EventSummary[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>(preselectedEventId)
  const [eventDetails, setEventDetails] = useState<EventSummary | null>(null)
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [loadingEventDetails, setLoadingEventDetails] = useState(false)

  // Form fields
  const [dailyRate, setDailyRate] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<string>('cash')
  const [paymentTerms, setPaymentTerms] = useState<string>('Pay at end of event day')
  const [requirements, setRequirements] = useState<string>('Professional conduct; Basic English/Amharic; Customer service skills')
  const [dressCode, setDressCode] = useState<string>('Black pants, white shirt, comfortable shoes')
  const [arrivalTime, setArrivalTime] = useState<string>('08:00')
  const [maxUshers, setMaxUshers] = useState<number>(10)
  const [validFrom, setValidFrom] = useState<string>('')
  const [validUntil, setValidUntil] = useState<string>('')
  const [customMessage, setCustomMessage] = useState<string>('We are excited to have you join our event team!')

  useEffect(() => {
    const loadEvents = async () => {
      setLoadingEvents(true)
      try {
        const res = await getMyEvents('active,draft')
        setEvents(res.data || [])
      } catch (err) {
        toast.error('Failed to load events')
      } finally {
        setLoadingEvents(false)
      }
    }
    loadEvents()
  }, [])

  useEffect(() => {
    if (!selectedEventId) {
      setEventDetails(null)
      return
    }
    const loadEventDetails = async () => {
      setLoadingEventDetails(true)
      try {
        const res = await getEventById(selectedEventId)
        setEventDetails(res.data)
      } catch (err) {
        setEventDetails(null)
        toast.error('Failed to load event details')
      } finally {
        setLoadingEventDetails(false)
      }
    }
    loadEventDetails()
  }, [selectedEventId])

  const isFormValid = useMemo(() => {
    return (
      !!selectedEventId &&
      (!!dailyRate || paymentMethod !== 'cash') &&
      maxUshers > 0 &&
      (!!validFrom && !!validUntil)
    )
  }, [selectedEventId, dailyRate, paymentMethod, maxUshers, validFrom, validUntil])

  const generateLink = async (): Promise<string | null> => {
    if (!eventDetails) return null
    try {
      // Create registration data payload
      const registrationData = {
        dailyRate,
        paymentMethod,
        paymentTerms,
        requirements,
        dressCode,
        arrivalTime,
        maxUshers,
        validFrom,
        validUntil,
        customMessage,
      }

      // Create short link via API
      console.log('Creating short link with data:', {
        eventId: eventDetails.id,
        registrationData,
        expiresAt: validUntil
      })
      
      const response = await createShortLink(eventDetails.id, registrationData, validUntil)
      
      console.log('Short link creation response:', response)
      
      if (response.status === 201) {
        const baseUrl = window.location.origin
        const shortUrl = `${baseUrl}/r/${response.data.short_code}`
        console.log('Generated short URL:', shortUrl)
        toast.success('Short link generated successfully!')
        return shortUrl
      } else {
        console.error('Failed to generate short link:', response)
        toast.error('Failed to generate short link')
        return null
      }
    } catch (e) {
      toast.error('Failed to generate link')
      return null
    }
  }

  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleGenerateLink = async () => {
    setIsGenerating(true)
    const link = await generateLink()
    setGeneratedLink(link)
    if (link) {
      setShowSuccess(true)
    }
    setIsGenerating(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Generate Usher Registration Link</h1>
        <p className="text-gray-600">Create a sharable registration link for ushers. Select an event to auto-populate details.</p>
      </div>

      {/* Success Banner */}
      {showSuccess && generatedLink && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-green-800">Link Generated Successfully!</h3>
                <p className="text-sm text-green-600">Your registration link is ready to share.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(generatedLink)
                  toast.success('Link copied to clipboard!')
                }}
                className="text-green-600 border-green-300 hover:bg-green-100"
              >
                Copy Link
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/dashboard/usher-management/links')}
                className="bg-green-600 hover:bg-green-700"
              >
                View All Links
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Form */}
        <Card className="col-span-2 p-6 bg-white shadow-sm border border-gray-100 rounded-2xl">
          <div className="space-y-6">
            {/* Event selection */}
            <div className="space-y-2">
              <Label>Event</Label>
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={loadingEvents ? 'Loading events...' : 'Select event'} />
                </SelectTrigger>
                <SelectContent>
                  {events.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Daily Rate (ETB)</Label>
                <Input inputMode="decimal" placeholder="e.g., 800" value={dailyRate} onChange={(e) => setDailyRate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Payment Terms</Label>
                <Input placeholder="e.g., Pay at end of event day" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} />
              </div>
            </div>

            {/* Requirements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Requirements</Label>
                <Textarea rows={3} placeholder="Skills, behavior, responsibilities" value={requirements} onChange={(e) => setRequirements(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Dress Code</Label>
                <Input placeholder="e.g., Black pants, white shirt" value={dressCode} onChange={(e) => setDressCode(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Arrival Time</Label>
                <Input type="time" value={arrivalTime} onChange={(e) => setArrivalTime(e.target.value)} />
              </div>
            </div>

            {/* Limits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Max Ushers</Label>
                <Input type="number" min={1} value={maxUshers} onChange={(e) => setMaxUshers(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Valid From</Label>
                <Input type="datetime-local" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Valid Until</Label>
                <Input type="datetime-local" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
              </div>
            </div>

            {/* Custom message */}
            <div className="space-y-2">
              <Label>Custom Message</Label>
              <Textarea rows={2} value={customMessage} onChange={(e) => setCustomMessage(e.target.value)} />
            </div>

            <div className="flex gap-3">
              <Button 
                disabled={!isFormValid || isGenerating} 
                onClick={handleGenerateLink}
                className="bg-gradient-to-r from-blue-600 to-purple-600"
              >
                {isGenerating ? 'Generating...' : 'Generate Short Link'}
              </Button>
              {generatedLink && (
                <>
                  <Button onClick={() => {
                    navigator.clipboard.writeText(generatedLink)
                    toast.success('Short registration link copied to clipboard!')
                  }}>
                    Copy Short Link
                  </Button>
                  <a href={generatedLink} target="_blank" rel="noreferrer">
                    <Button variant="outline">Open Link</Button>
                  </a>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/dashboard/usher-management/links')}
                    className="bg-blue-50 text-blue-600 hover:bg-blue-100"
                  >
                    View All Links
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Right: Event details & link preview */}
        <div className="space-y-6">
          <Card className="p-6 bg-white shadow-sm border border-gray-100 rounded-2xl">
            <h3 className="text-lg font-semibold mb-4">Event Details</h3>
            {loadingEventDetails ? (
              <div className="text-sm text-gray-600">Loading event details...</div>
            ) : eventDetails ? (
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Name:</span> {eventDetails.name}</div>
                <div><span className="font-medium">Date:</span> {eventDetails.start_date} {eventDetails.end_date ? `- ${eventDetails.end_date}` : ''}</div>
                {eventDetails.location && (<div><span className="font-medium">Location:</span> {eventDetails.location}</div>)}
                {eventDetails.uuid && (
                  <div className="mt-2">
                    <span className="font-medium">Public Registration:</span>
                    <div className="text-xs break-all bg-slate-50 border rounded p-2 mt-1">
                      {`${window.location.origin}/register/${eventDetails.uuid}`}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-600">Select an event to view details</div>
            )}
          </Card>

          <Card className="p-6 bg-white shadow-sm border border-gray-100 rounded-2xl">
            <h3 className="text-lg font-semibold mb-4">Short Link Preview</h3>
            {generatedLink ? (
              <div className="text-xs break-all bg-slate-50 border rounded p-2">{generatedLink}</div>
            ) : (
              <div className="text-sm text-gray-600">Click "Generate Short Link" to create a compact registration link</div>
            )}
            <div className="mt-4 space-y-2">
              <Link to="/dashboard/usher-management/links">
                <Button variant="outline" className="w-full">
                  View All Generated Links
                </Button>
              </Link>
              <Link to="/dashboard/usher-management">
                <Button variant="outline" className="w-full">
                  Back to Usher Management
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}


