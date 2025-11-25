import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import Breadcrumbs from '@/components/Breadcrumbs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { getMyEvents, getEventById, createShortLink } from '@/lib/api'
import {
  Calendar,
  Clock,
  DollarSign,
  Users,
  FileText,
  Link2,
  Copy,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Zap,
  Settings,
  MessageSquare,
  CalendarDays,
  MapPin,
  CreditCard,
  Building2,
  Smartphone,
  Shirt,
  AlertCircle,
  Info,
  QrCode,
  Share2,
  ChevronRight,
  ChevronLeft,
  Loader2,
} from 'lucide-react'
import { format, parseISO, addDays, startOfDay } from 'date-fns'

interface EventSummary {
  id: number
  name: string
  start_date?: string
  end_date?: string
  location?: string
  uuid?: string
  status?: string
}

interface FormTemplate {
  name: string
  description: string
  dailyRate: string
  paymentMethod: string
  paymentTerms: string
  requirements: string
  dressCode: string
  arrivalTime: string
  customMessage: string
}

const FORM_TEMPLATES: FormTemplate[] = [
  {
    name: 'Standard Event',
    description: 'General event usher requirements',
    dailyRate: '800',
    paymentMethod: 'cash',
    paymentTerms: 'Pay at end of event day',
    requirements: 'Professional conduct; Basic English/Amharic; Customer service skills',
    dressCode: 'Black pants, white shirt, comfortable shoes',
    arrivalTime: '08:00',
    customMessage: 'We are excited to have you join our event team!',
  },
  {
    name: 'Premium Event',
    description: 'High-end event with strict requirements',
    dailyRate: '1200',
    paymentMethod: 'bank_transfer',
    paymentTerms: 'Payment within 3 business days after event',
    requirements: 'Excellent communication skills; Professional appearance; Previous event experience preferred',
    dressCode: 'Formal black attire, polished shoes',
    arrivalTime: '07:00',
    customMessage: 'Join us for an exclusive premium event experience!',
  },
  {
    name: 'Quick Setup',
    description: 'Minimal requirements for fast setup',
    dailyRate: '600',
    paymentMethod: 'mobile_money',
    paymentTerms: 'Payment within 24 hours',
    requirements: 'Basic customer service skills',
    dressCode: 'Neat casual attire',
    arrivalTime: '09:00',
    customMessage: 'Quick and easy registration for event ushers.',
  },
]

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

  // UI State
  const [activeStep, setActiveStep] = useState<number>(1)
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [copied, setCopied] = useState(false)

  // Set default dates
  useEffect(() => {
    if (!validFrom) {
      const now = new Date()
      setValidFrom(format(now, "yyyy-MM-dd'T'HH:mm"))
    }
    if (!validUntil) {
      const tomorrow = addDays(new Date(), 7)
      setValidUntil(format(tomorrow, "yyyy-MM-dd'T'HH:mm"))
    }
  }, [])

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
        const res = await getEventById(String(selectedEventId))
        setEventDetails(res.data)
        // Auto-set valid until to event end date if available
        if (res.data.end_date && !validUntil) {
          const eventEnd = parseISO(res.data.end_date)
          setValidUntil(format(eventEnd, "yyyy-MM-dd'T'HH:mm"))
        }
      } catch (err: any) {
        console.error('Error loading event details:', err)
        setEventDetails(null)
        const errorMessage = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Failed to load event details'
        toast.error(errorMessage)
      } finally {
        setLoadingEventDetails(false)
      }
    }
    loadEventDetails()
  }, [selectedEventId])

  const applyTemplate = (template: FormTemplate) => {
    setDailyRate(template.dailyRate)
    setPaymentMethod(template.paymentMethod)
    setPaymentTerms(template.paymentTerms)
    setRequirements(template.requirements)
    setDressCode(template.dressCode)
    setArrivalTime(template.arrivalTime)
    setCustomMessage(template.customMessage)
    toast.success(`Applied "${template.name}" template`)
  }

  const isFormValid = useMemo(() => {
    return (
      !!selectedEventId &&
      (!!dailyRate || paymentMethod !== 'cash') &&
      maxUshers > 0 &&
      (!!validFrom && !!validUntil) &&
      new Date(validUntil) > new Date(validFrom)
    )
  }, [selectedEventId, dailyRate, paymentMethod, maxUshers, validFrom, validUntil])

  const generateLink = async (): Promise<string | null> => {
    // Use selectedEventId if eventDetails is not loaded yet
    const eventId = eventDetails?.id || selectedEventId
    
    if (!eventId) {
      toast.error('Please select an event first')
      return null
    }
    
    // Validate required fields
    if (!validFrom || !validUntil) {
      toast.error('Please set validity dates')
      return null
    }
    
    if (new Date(validUntil) <= new Date(validFrom)) {
      toast.error('Valid until date must be after valid from date')
      return null
    }
    
    try {
      const registrationData = {
        dailyRate: dailyRate || undefined,
        paymentMethod: paymentMethod || 'cash',
        paymentTerms: paymentTerms || '',
        requirements: requirements || '',
        dressCode: dressCode || '',
        arrivalTime: arrivalTime || '08:00',
        maxUshers: maxUshers || 10,
        validFrom: validFrom,
        validUntil: validUntil,
        customMessage: customMessage || '',
      }

      const response = await createShortLink(Number(eventId), registrationData, validUntil)

      if (response.status === 201 || response.status === 200) {
        // Backend returns: { short_code, short_url, id }
        // Match the public registration link format: use window.location.origin
        const shortUrl = `${window.location.origin}/r/${response.data.short_code}`
        toast.success('Registration link generated successfully!')
        return shortUrl
      } else {
        toast.error('Failed to generate short link')
        return null
      }
    } catch (e: any) {
      console.error('Link generation error:', e)
      const errorMessage = e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Failed to generate link'
      toast.error(errorMessage)
      return null
    }
  }

  const handleGenerateLink = async () => {
    if (!isFormValid) {
      toast.error('Please complete all required fields')
      return
    }
    
    if (!selectedEventId) {
      toast.error('Please select an event first')
      return
    }
    
    // If eventDetails is not loaded, try to load it first
    if (!eventDetails && selectedEventId) {
      setLoadingEventDetails(true)
      try {
        const res = await getEventById(String(selectedEventId))
        setEventDetails(res.data)
      } catch (err: any) {
        console.error('Error loading event details:', err)
        const errorMessage = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Failed to load event details. Please try again.'
        toast.error(errorMessage)
        setLoadingEventDetails(false)
        return
      } finally {
        setLoadingEventDetails(false)
      }
    }
    
    setIsGenerating(true)
    try {
      const link = await generateLink()
      if (link) {
        setGeneratedLink(link)
        setShowSuccess(true)
        setActiveStep(4) // Move to success step
        // Scroll to success banner
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }, 100)
      }
    } catch (error) {
      console.error('Error generating link:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyLink = async () => {
    if (generatedLink) {
      await navigator.clipboard.writeText(generatedLink)
      setCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const steps = [
    { id: 1, name: 'Event Selection', icon: Calendar },
    { id: 2, name: 'Payment Details', icon: DollarSign },
    { id: 3, name: 'Requirements', icon: FileText },
    { id: 4, name: 'Review & Generate', icon: Sparkles },
  ]

  const nextStep = () => {
    if (activeStep < 4) {
      if (activeStep === 1 && !selectedEventId) {
        toast.error('Please select an event first')
        return
      }
      setActiveStep(activeStep + 1)
    }
  }

  const prevStep = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Usher Management', href: '/dashboard/usher-management' },
            { label: 'Generate Registration Link', href: '/dashboard/usher-management/register' },
          ]}
          className="mb-6"
        />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-brand-gradient rounded-2xl flex items-center justify-center shadow-lg">
              <Link2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                Generate Usher Registration Link
              </h1>
              <p className="text-muted-foreground mt-1">
                Create a shareable registration link for ushers to apply for your event
              </p>
            </div>
          </div>

          {/* Quick Templates */}
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Quick Templates:
            </span>
            {FORM_TEMPLATES.map((template) => (
              <Button
                key={template.name}
                variant="outline"
                size="sm"
                onClick={() => applyTemplate(template)}
                className="h-8 text-xs"
              >
                {template.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Success Banner */}
        {showSuccess && generatedLink && (
          <Card className="mb-6 border-2 border-success/30 bg-success/10 dark:bg-success/20 shadow-lg">
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 bg-success rounded-xl flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-success dark:text-success mb-1">Link Generated Successfully!</h3>
                    <p className="text-success/80 dark:text-success/70 text-sm mb-4">
                      Your registration link is ready to share with potential ushers.
                    </p>
                    <div className="bg-card rounded-lg p-3 border border-border mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Link2 className="w-4 h-4 text-success" />
                        <span className="text-xs font-medium text-foreground">Registration Link</span>
                      </div>
                      <div className="text-sm font-mono text-foreground break-all">{generatedLink}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={handleCopyLink}
                        className="bg-success hover:bg-success/90 text-white"
                        size="sm"
                      >
                        {copied ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Link
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const shareText = `Join us as an usher for ${eventDetails?.name}! Register here: ${generatedLink}`
                          if (navigator.share) {
                            navigator.share({ title: 'Usher Registration', text: shareText, url: generatedLink })
                          } else {
                            handleCopyLink()
                          }
                        }}
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                      <a href={generatedLink} target="_blank" rel="noreferrer">
                        <Button variant="outline" size="sm">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                      </a>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/dashboard/usher-management/links')}
                      >
                        View All Links
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Steps */}
            <Card className="p-4 bg-card border border-border shadow-sm">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => {
                  const Icon = step.icon
                  const isActive = activeStep === step.id
                  const isCompleted = activeStep > step.id
                  return (
                    <React.Fragment key={step.id}>
                      <div className="flex items-center gap-2 flex-1">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                            isActive
                              ? 'bg-brand-gradient text-white shadow-lg scale-110'
                              : isCompleted
                              ? 'bg-success text-white'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <Icon className="w-5 h-5" />
                          )}
                        </div>
                        <div className="hidden sm:block">
                          <div
                            className={`text-xs font-medium ${
                              isActive ? 'text-foreground' : isCompleted ? 'text-success' : 'text-muted-foreground'
                            }`}
                          >
                            {step.name}
                          </div>
                        </div>
                      </div>
                      {index < steps.length - 1 && (
                        <div
                          className={`h-0.5 flex-1 mx-2 transition-all ${
                            isCompleted ? 'bg-success' : 'bg-border'
                          }`}
                        />
                      )}
                    </React.Fragment>
                  )
                })}
              </div>
            </Card>

            {/* Step 1: Event Selection */}
            {activeStep === 1 && (
              <Card className="relative overflow-hidden bg-card border border-border shadow-xl rounded-3xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-brand-gradient"></div>
                <div className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-info rounded-2xl flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">Select Event</h3>
                      <p className="text-sm text-muted-foreground">Choose the event for usher registration</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-info" />
                        Event
                      </Label>
                      <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                        <SelectTrigger className="h-12 text-base border-2 border-border rounded-xl bg-background">
                          <SelectValue placeholder={loadingEvents ? 'Loading events...' : 'Select an event'} />
                        </SelectTrigger>
                        <SelectContent>
                          {events.map((e) => (
                            <SelectItem key={e.id} value={String(e.id)}>
                              <div className="flex flex-col">
                                <span className="font-medium">{e.name}</span>
                                {e.start_date && (
                                  <span className="text-xs text-muted-foreground">
                                    {format(parseISO(e.start_date), 'MMM dd, yyyy')}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {eventDetails && (
                      <div className="p-4 bg-info/10 dark:bg-info/20 rounded-xl border border-info/30">
                        <div className="flex items-center gap-2 mb-3">
                          <Info className="w-4 h-4 text-info" />
                          <span className="font-semibold text-foreground">Event Details</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="w-4 h-4 text-info" />
                            <span className="text-foreground">
                              {eventDetails.start_date &&
                                format(parseISO(eventDetails.start_date), 'MMMM dd, yyyy')}
                              {eventDetails.end_date &&
                                ` - ${format(parseISO(eventDetails.end_date), 'MMMM dd, yyyy')}`}
                            </span>
                          </div>
                          {eventDetails.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-info" />
                              <span className="text-foreground">{eventDetails.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Step 2: Payment Details */}
            {activeStep === 2 && (
              <Card className="relative overflow-hidden bg-card border border-border shadow-xl rounded-3xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"></div>
                <div className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">Payment Information</h3>
                      <p className="text-sm text-muted-foreground">Configure payment details for ushers</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-success" />
                          Daily Rate (ETB)
                        </Label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="e.g., 800"
                          value={dailyRate}
                          onChange={(e) => setDailyRate(e.target.value)}
                          className="h-12 text-base border-2 border-border rounded-xl bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-success" />
                          Payment Method
                        </Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                          <SelectTrigger className="h-12 text-base border-2 border-border rounded-xl bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4" />
                                Cash
                              </div>
                            </SelectItem>
                            <SelectItem value="bank_transfer">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                Bank Transfer
                              </div>
                            </SelectItem>
                            <SelectItem value="mobile_money">
                              <div className="flex items-center gap-2">
                                <Smartphone className="w-4 h-4" />
                                Mobile Money
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <FileText className="w-4 h-4 text-success" />
                        Payment Terms
                      </Label>
                      <Input
                        placeholder="e.g., Pay at end of event day"
                        value={paymentTerms}
                        onChange={(e) => setPaymentTerms(e.target.value)}
                        className="h-12 text-base border-2 border-border rounded-xl bg-background"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Step 3: Requirements */}
            {activeStep === 3 && (
              <Card className="relative overflow-hidden bg-card border border-border shadow-xl rounded-3xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-warning to-primary"></div>
                <div className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">Requirements & Details</h3>
                      <p className="text-sm text-muted-foreground">Set expectations and requirements for ushers</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        Requirements
                      </Label>
                      <Textarea
                        rows={4}
                        placeholder="Skills, behavior, responsibilities (e.g., Professional conduct; Basic English/Amharic; Customer service skills)"
                        value={requirements}
                        onChange={(e) => setRequirements(e.target.value)}
                        className="text-base border-2 border-border rounded-xl resize-none bg-background"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <Shirt className="w-4 h-4 text-primary" />
                          Dress Code
                        </Label>
                        <Input
                          placeholder="e.g., Black pants, white shirt, comfortable shoes"
                          value={dressCode}
                          onChange={(e) => setDressCode(e.target.value)}
                          className="h-12 text-base border-2 border-border rounded-xl bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" />
                          Arrival Time
                        </Label>
                        <Input
                          type="time"
                          value={arrivalTime}
                          onChange={(e) => setArrivalTime(e.target.value)}
                          className="h-12 text-base border-2 border-border rounded-xl bg-background"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-primary" />
                        Custom Message
                      </Label>
                      <Textarea
                        rows={3}
                        placeholder="A welcoming message for potential ushers..."
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        className="text-base border-2 border-border rounded-xl resize-none bg-background"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" />
                          Max Ushers
                        </Label>
                        <Input
                          type="number"
                          min={1}
                          value={maxUshers}
                          onChange={(e) => setMaxUshers(Number(e.target.value))}
                          className="h-12 text-base border-2 border-border rounded-xl bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary" />
                          Valid From
                        </Label>
                        <Input
                          type="datetime-local"
                          value={validFrom}
                          onChange={(e) => setValidFrom(e.target.value)}
                          className="h-12 text-base border-2 border-border rounded-xl bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary" />
                          Valid Until
                        </Label>
                        <Input
                          type="datetime-local"
                          value={validUntil}
                          onChange={(e) => setValidUntil(e.target.value)}
                          className="h-12 text-base border-2 border-border rounded-xl bg-background"
                        />
                      </div>
                    </div>

                    {validFrom && validUntil && new Date(validUntil) <= new Date(validFrom) && (
                      <div className="p-3 bg-error/10 dark:bg-error/20 border border-error/30 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-error">
                          <strong>Invalid date range:</strong> Valid until must be after valid from.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Step 4: Review & Generate */}
            {activeStep === 4 && (
              <Card className="relative overflow-hidden bg-card border border-border shadow-xl rounded-3xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500"></div>
                <div className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">Review & Generate</h3>
                      <p className="text-sm text-muted-foreground">Review your settings and generate the link</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {eventDetails && (
                      <div className="p-4 bg-info/10 dark:bg-info/20 rounded-xl border border-info/30">
                        <div className="font-semibold text-foreground mb-2">Event</div>
                        <div className="text-foreground">{eventDetails.name}</div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-success/10 dark:bg-success/20 rounded-xl border border-success/30">
                        <div className="font-semibold text-foreground mb-2">Daily Rate</div>
                        <div className="text-foreground">ETB {dailyRate || 'Not set'}</div>
                      </div>
                      <div className="p-4 bg-success/10 dark:bg-success/20 rounded-xl border border-success/30">
                        <div className="font-semibold text-foreground mb-2">Payment Method</div>
                        <div className="text-foreground capitalize">{paymentMethod.replace('_', ' ')}</div>
                      </div>
                    </div>

                    <div className="p-4 bg-primary/10 dark:bg-primary/20 rounded-xl border border-primary/30">
                      <div className="font-semibold text-foreground mb-2">Max Ushers</div>
                      <div className="text-foreground">{maxUshers}</div>
                    </div>

                    <div className="p-4 bg-muted rounded-xl border border-border">
                      <div className="font-semibold text-foreground mb-2">Validity Period</div>
                      <div className="text-foreground text-sm">
                        {validFrom && format(parseISO(validFrom), 'MMM dd, yyyy HH:mm')} -{' '}
                        {validUntil && format(parseISO(validUntil), 'MMM dd, yyyy HH:mm')}
                      </div>
                    </div>
                  </div>

                  {!generatedLink && (
                    <div className="mt-6">
                      <Button
                        disabled={!isFormValid || isGenerating}
                        onClick={handleGenerateLink}
                        className="w-full h-14 text-base bg-brand-gradient bg-brand-gradient-hover text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Generating Link...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5 mr-2" />
                            Generate Registration Link
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Navigation Buttons */}
            {!showSuccess && (
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={activeStep === 1}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <Button
                  onClick={nextStep}
                  disabled={activeStep === 4}
                  className="flex items-center gap-2 bg-brand-gradient bg-brand-gradient-hover text-white"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Event Preview Card */}
            <Card className="p-6 bg-card border border-border shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-info rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Event Preview</h3>
              </div>
              {loadingEventDetails ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : eventDetails ? (
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="font-semibold text-muted-foreground mb-1">Name</div>
                    <div className="text-foreground">{eventDetails.name}</div>
                  </div>
                  {eventDetails.start_date && (
                    <div>
                      <div className="font-semibold text-muted-foreground mb-1">Date</div>
                      <div className="text-foreground">
                        {format(parseISO(eventDetails.start_date), 'MMM dd, yyyy')}
                        {eventDetails.end_date &&
                          ` - ${format(parseISO(eventDetails.end_date), 'MMM dd, yyyy')}`}
                      </div>
                    </div>
                  )}
                  {eventDetails.location && (
                    <div>
                      <div className="font-semibold text-muted-foreground mb-1">Location</div>
                      <div className="text-foreground">{eventDetails.location}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Select an event to view details</div>
              )}
            </Card>

            {/* Quick Actions */}
            <Card className="p-6 bg-card border border-border shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Quick Actions</h3>
              <div className="space-y-2">
                <Link to="/dashboard/usher-management/links">
                  <Button variant="outline" className="w-full justify-start">
                    <Link2 className="w-4 h-4 mr-2" />
                    View All Links
                  </Button>
                </Link>
                <Link to="/dashboard/usher-management">
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="w-4 h-4 mr-2" />
                    Usher Management
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Form Status */}
            <Card className="p-6 bg-card border border-border shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Form Status</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Event Selected</span>
                  {selectedEventId ? (
                    <Badge className="bg-success/10 text-success border-success/30">Yes</Badge>
                  ) : (
                    <Badge variant="outline">No</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Payment Details</span>
                  {dailyRate || paymentMethod !== 'cash' ? (
                    <Badge className="bg-success/10 text-success border-success/30">Complete</Badge>
                  ) : (
                    <Badge variant="outline">Incomplete</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Requirements</span>
                  {requirements && dressCode ? (
                    <Badge className="bg-success/10 text-success border-success/30">Complete</Badge>
                  ) : (
                    <Badge variant="outline">Incomplete</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Validity Dates</span>
                  {validFrom && validUntil ? (
                    <Badge className="bg-success/10 text-success border-success/30">Set</Badge>
                  ) : (
                    <Badge variant="outline">Not Set</Badge>
                  )}
                </div>
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span className="text-foreground">Overall Status</span>
                    {isFormValid ? (
                      <Badge className="bg-success text-white">Ready</Badge>
                    ) : (
                      <Badge variant="outline" className="border-warning/30 text-warning">
                        Incomplete
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
