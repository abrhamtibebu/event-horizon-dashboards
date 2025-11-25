import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { getEventById, createUsherRegistration } from '@/lib/api'
import { CheckCircle, Calendar, MapPin, CreditCard, Phone, Mail, Building2, Smartphone } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

interface DecodedTokenPayload {
  // Ultra-compact format (new)
  e?: number // eventId
  r?: string // rate
  m?: string // method
  t?: string // terms
  n?: string // notes
  d?: string // dressCode
  a?: string // arrivalTime
  u?: number // maxUshers
  f?: string // validFrom
  v?: string // validUntil
  msg?: string // message
  // Legacy format support
  version?: number
  timestamp?: number
  eventId?: number
  eventUuid?: string
  eventName?: string
  eventStartDate?: string
  eventEndDate?: string
  payment?: {
    dailyRate?: string
    method?: string
    terms?: string
  }
  requirements?: {
    notes?: string
    dressCode?: string
    arrivalTime?: string
  }
  limits?: {
    maxUshers?: number
    validFrom?: string
    validUntil?: string
  }
  message?: string
}

export default function UsherRegister() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [payload, setPayload] = useState<DecodedTokenPayload | null>(null)
  const [eventDetails, setEventDetails] = useState<any>(null)
  const [loadingEvent, setLoadingEvent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [nationalId, setNationalId] = useState('')
  const [selectedBank, setSelectedBank] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [mobileWallet, setMobileWallet] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedDates, setSelectedDates] = useState<string[]>([])

  // Force light mode for this page
  useEffect(() => {
    const htmlElement = document.documentElement
    const originalTheme = htmlElement.classList.contains('dark') ? 'dark' : null
    
    // Force light mode
    htmlElement.classList.remove('dark')
    htmlElement.classList.add('light')
    
    // Restore original theme when component unmounts
    return () => {
      htmlElement.classList.remove('light')
      if (originalTheme) {
        htmlElement.classList.add(originalTheme)
      }
    }
  }, [])

  useEffect(() => {
    const token = searchParams.get('token') || searchParams.get('t')
    if (!token) {
      toast.error('Invalid registration link')
      return
    }
    try {
      // Handle URL-safe base64 decoding
      const urlSafeToken = token.replace(/-/g, '+').replace(/_/g, '/')
      const paddedToken = urlSafeToken + '='.repeat((4 - urlSafeToken.length % 4) % 4)
      const json = decodeURIComponent(escape(atob(paddedToken)))
      const data = JSON.parse(json)
      
      // Normalize various formats to legacy format for compatibility
      const normalizedData = {
        ...data,
        eventId: data.e || data.eventId,
        eventUuid: data.u || data.eventUuid,
        eventName: data.n || data.eventName,
        eventStartDate: data.s || data.eventStartDate,
        eventEndDate: data.f || data.eventEndDate,
        payment: {
          dailyRate: data.r || data.p?.r || data.payment?.dailyRate || data.dailyRate,
          method: data.m || data.p?.m || data.payment?.method || data.paymentMethod,
          terms: data.t || data.p?.t || data.payment?.terms || data.paymentTerms,
        },
        requirements: {
          notes: data.n || data.r?.n || data.requirements?.notes || data.requirements,
          dressCode: data.d || data.r?.d || data.requirements?.dressCode || data.dressCode,
          arrivalTime: data.a || data.r?.a || data.requirements?.arrivalTime || data.arrivalTime,
        },
        limits: {
          maxUshers: data.u || data.l?.m || data.limits?.maxUshers || data.maxUshers,
          validFrom: data.f || data.l?.f || data.limits?.validFrom || data.validFrom,
          validUntil: data.v || data.l?.u || data.limits?.validUntil || data.validUntil,
        },
        message: data.msg || data.message || data.customMessage,
      }
      
      setPayload(normalizedData)
    } catch (e) {
      toast.error('Invalid or corrupted registration token')
    }
  }, [searchParams])

  useEffect(() => {
    const loadEvent = async () => {
      if (!payload?.eventId) return
      setLoadingEvent(true)
      // Reset selected dates when loading a new event
      setSelectedDates([])
      try {
        const res = await getEventById(String(payload.eventId))
        setEventDetails(res.data)
      } catch (e) {
        // Fallback to token data
        setEventDetails({
          id: payload.eventId,
          name: payload.eventName,
          start_date: payload.eventStartDate,
          end_date: payload.eventEndDate,
          uuid: payload.eventUuid,
        })
      } finally {
        setLoadingEvent(false)
      }
    }
    loadEvent()
  }, [payload])

  const paymentMethod = payload?.payment?.method || 'cash'

  // Generate array of dates between start and end date (inclusive)
  const eventDates = useMemo(() => {
    if (!eventDetails?.start_date) return []
    
    // Parse dates and set to start of day to avoid timezone issues
    const startDate = new Date(eventDetails.start_date)
    startDate.setHours(0, 0, 0, 0)
    
    const endDate = eventDetails.end_date 
      ? new Date(eventDetails.end_date)
      : new Date(startDate)
    endDate.setHours(0, 0, 0, 0)
    
    const dates: string[] = []
    const currentDate = new Date(startDate)
    
    // Include both start and end dates (inclusive)
    while (currentDate <= endDate) {
      // Format as YYYY-MM-DD
      const year = currentDate.getFullYear()
      const month = String(currentDate.getMonth() + 1).padStart(2, '0')
      const day = String(currentDate.getDate()).padStart(2, '0')
      dates.push(`${year}-${month}-${day}`)
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return dates
  }, [eventDetails?.start_date, eventDetails?.end_date])

  // Format date for display
  const formatDateDisplay = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Handle date selection
  const handleDateToggle = (date: string, checked: boolean) => {
    setSelectedDates((prev) => {
      if (checked) {
        // Only add if not already in the array
        if (prev.includes(date)) return prev
        return [...prev, date]
      } else {
        // Remove the date
        return prev.filter(d => d !== date)
      }
    })
  }

  // Validation functions
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const isValidPhone = (phone: string) => {
    // Ethiopian phone number validation - accepts various formats:
    // +2519xxxxxxxx, 09xxxxxxxx, 9xxxxxxxx, +2517xxxxxxxx, 07xxxxxxxx, 7xxxxxxxx
    const cleanPhone = phone.replace(/\s+/g, '').replace(/\+/g, '')
    
    // Check for +2519xxxxxxxx (13 digits total)
    if (/^2519[0-9]{8}$/.test(cleanPhone)) return true
    
    // Check for 09xxxxxxxx (10 digits total)
    if (/^09[0-9]{8}$/.test(cleanPhone)) return true
    
    // Check for 9xxxxxxxx (9 digits total)
    if (/^9[0-9]{8}$/.test(cleanPhone)) return true
    
    // Check for +2517xxxxxxxx (13 digits total)
    if (/^2517[0-9]{8}$/.test(cleanPhone)) return true
    
    // Check for 07xxxxxxxx (10 digits total)
    if (/^07[0-9]{8}$/.test(cleanPhone)) return true
    
    // Check for 7xxxxxxxx (9 digits total)
    if (/^7[0-9]{8}$/.test(cleanPhone)) return true
    
    return false
  }

  const isFormValid = useMemo(() => {
    const basicValid = !!(firstName && lastName && email && phone && payload?.eventId)
    const emailValid = isValidEmail(email)
    const phoneValid = isValidPhone(phone)
    const datesValid = selectedDates.length > 0
    
    if (paymentMethod === 'bank_transfer') {
      return basicValid && emailValid && phoneValid && datesValid && !!(selectedBank && bankAccount)
    }
    if (paymentMethod === 'mobile_money') {
      return basicValid && emailValid && phoneValid && datesValid && !!mobileWallet
    }
    return basicValid && emailValid && phoneValid && datesValid
  }, [firstName, lastName, email, phone, payload, paymentMethod, selectedBank, bankAccount, mobileWallet, selectedDates])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payload?.eventId) return
    if (!isFormValid) {
      if (selectedDates.length === 0) {
        toast.error('Please select at least one date you are available to work')
      } else {
        toast.error('Please fill all required fields')
      }
      return
    }
    setSubmitting(true)
    try {
      const result = await createUsherRegistration(payload.eventId, {
        name: `${firstName} ${lastName}`.trim(),
        email,
        phone,
        national_id: nationalId || undefined,
        notes,
        payment_method: paymentMethod,
        bank_name: selectedBank || undefined,
        bank_account: bankAccount || undefined,
        mobile_wallet: mobileWallet || undefined,
        available_dates: selectedDates,
        token_meta: payload,
      })
      if (result.status === 201 || result.status === 200) {
        toast.success('Registration submitted successfully!')
        const query = new URLSearchParams({
          eventId: String(payload.eventId),
          name: `${firstName} ${lastName}`.trim(),
        }).toString()
        navigate(`/usher/register/success?${query}`)
      } else {
        toast.error('Failed to submit registration')
      }
    } catch (err: any) {
      if (err?.response?.status === 409) {
        if (err?.response?.data?.duplicate) {
          toast.error('You have already registered for this event with this email or phone.')
        } else if (err?.response?.data?.limit_reached) {
          toast.error(err?.response?.data?.message || 'Registration limit reached for this event.')
        } else {
          toast.error(err?.response?.data?.message || 'Registration failed')
        }
      } else {
        const msg = err?.response?.data?.message || err?.message || 'Submission failed'
        toast.error(msg)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 sm:pb-0">
      {/* Header matching system theme */}
      <div className="w-full bg-card/95 backdrop-blur-md border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="flex flex-col gap-4 sm:gap-5 lg:gap-6">
            {/* Logo and Title Section */}
            <div className="flex items-center justify-between gap-3 sm:gap-4 min-w-0">
              <img
                src="/Validity-Event & Marketing.png"
                alt="Validity"
                className="h-8 sm:h-10 lg:h-12 w-auto flex-shrink-0"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              />
              <div className="min-w-0 flex-1 text-right">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">Usher Registration</div>
                <div className="text-xs sm:text-sm lg:text-base text-muted-foreground">Join our event team</div>
              </div>
            </div>
            {/* Event Details - Stack on mobile, side-by-side on larger screens */}
            {eventDetails?.name && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 lg:gap-4">
                <div className="flex items-center gap-2 sm:gap-2.5 flex-1 sm:flex-initial bg-muted px-3 sm:px-4 py-2.5 sm:py-2.5 rounded-lg lg:rounded-xl min-w-0">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-[hsl(var(--color-primary))]" /> 
                  <span className="font-medium text-sm sm:text-base truncate">{new Date(eventDetails.start_date).toLocaleDateString()}</span>
                </div>
                {eventDetails.location && (
                  <div className="flex items-center gap-2 sm:gap-2.5 flex-1 sm:flex-initial bg-muted px-3 sm:px-4 py-2.5 sm:py-2.5 rounded-lg lg:rounded-xl min-w-0">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-[hsl(var(--color-primary))]" /> 
                    <span className="font-medium text-sm sm:text-base truncate">{eventDetails.location}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
          {/* Form Section */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8 lg:space-y-10 order-2 lg:order-1">
            <Card className="relative overflow-hidden bg-card border border-border shadow-lg sm:shadow-xl rounded-2xl lg:rounded-3xl">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-[hsl(var(--color-primary))]"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-[hsl(var(--color-primary))]/10 rounded-full -translate-y-16 translate-x-16 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-[hsl(var(--color-success))]/10 rounded-full translate-y-12 -translate-x-12 blur-xl"></div>
              <div className="relative p-6 sm:p-8 lg:p-10">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 mb-6 sm:mb-8 lg:mb-10">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-[hsl(var(--color-primary))] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-[hsl(var(--color-primary))]/30">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-card-foreground">Personal Information</h3>
                    <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mt-1 sm:mt-2">Complete your registration details</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
              <div className="space-y-2 sm:space-y-3">
                <Label className="text-sm sm:text-base font-semibold text-card-foreground flex items-center gap-2">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[hsl(var(--color-primary))] rounded-full flex-shrink-0"></div>
                  First Name
                </Label>
                <div className="relative">
                  <Input 
                    value={firstName} 
                    onChange={(e) => setFirstName(e.target.value)} 
                    placeholder="e.g., Jane" 
                    required 
                    className="h-11 sm:h-12 lg:h-13 text-sm sm:text-base pl-4 sm:pl-5 pr-4 sm:pr-5 border-input rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-ring transition-all duration-200 bg-background hover:bg-accent/50 touch-manipulation"
                    autoComplete="given-name"
                  />
                </div>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <Label className="text-sm sm:text-base font-semibold text-card-foreground flex items-center gap-2">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[hsl(var(--color-primary))] rounded-full flex-shrink-0"></div>
                  Last Name
                </Label>
                <div className="relative">
                  <Input 
                    value={lastName} 
                    onChange={(e) => setLastName(e.target.value)} 
                    placeholder="e.g., Doe" 
                    required 
                    className="h-11 sm:h-12 lg:h-13 text-sm sm:text-base pl-4 sm:pl-5 pr-4 sm:pr-5 border-input rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-ring transition-all duration-200 bg-background hover:bg-accent/50 touch-manipulation"
                    autoComplete="family-name"
                  />
                </div>
              </div>
              <div className="space-y-2 sm:space-y-3 sm:col-span-2">
                <Label className="text-sm sm:text-base font-semibold text-card-foreground flex items-center gap-2">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[hsl(var(--color-info))] rounded-full flex-shrink-0"></div>
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    className={`h-11 sm:h-12 lg:h-13 pl-11 sm:pl-14 lg:pl-16 pr-4 sm:pr-5 text-sm sm:text-base border rounded-xl lg:rounded-2xl focus:ring-2 transition-all duration-200 bg-background hover:bg-accent/50 touch-manipulation ${
                      email && !isValidEmail(email) 
                        ? 'border-destructive focus:border-destructive focus:ring-destructive/20' 
                        : 'border-input focus:ring-ring'
                    }`} 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="name@example.com" 
                    required 
                    autoComplete="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                  />
                </div>
                {email && !isValidEmail(email) && (
                  <p className="text-xs sm:text-sm text-destructive mt-1.5 sm:mt-2 flex items-start gap-1.5">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="flex-1">Please enter a valid email address</span>
                  </p>
                )}
              </div>
              <div className="space-y-2 sm:space-y-3 sm:col-span-2">
                <Label className="text-sm sm:text-base font-semibold text-card-foreground flex items-center gap-2">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[hsl(var(--color-info))] rounded-full flex-shrink-0"></div>
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5 absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    className={`h-11 sm:h-12 lg:h-13 pl-11 sm:pl-14 lg:pl-16 pr-4 sm:pr-5 text-sm sm:text-base border rounded-xl lg:rounded-2xl focus:ring-2 transition-all duration-200 bg-background hover:bg-accent/50 touch-manipulation ${
                      phone && !isValidPhone(phone) 
                        ? 'border-destructive focus:border-destructive focus:ring-destructive/20' 
                        : 'border-input focus:ring-ring'
                    }`} 
                    type="tel" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    placeholder="e.g., 0912345678" 
                    required 
                    autoComplete="tel"
                    inputMode="numeric"
                  />
                </div>
                {phone && !isValidPhone(phone) && (
                  <p className="text-xs sm:text-sm text-destructive mt-1.5 sm:mt-2 flex items-start gap-1.5">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="flex-1">Please enter a valid phone number (09xxxxxxxx, +2519xxxxxxxx)</span>
                  </p>
                )}
              </div>
              <div className="space-y-2 sm:space-y-3 sm:col-span-2">
                <Label className="text-sm sm:text-base font-semibold text-card-foreground flex items-center gap-2">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[hsl(var(--color-warning))] rounded-full flex-shrink-0"></div>
                  National ID (Optional)
                </Label>
                <div className="relative">
                  <Input 
                    value={nationalId} 
                    onChange={(e) => setNationalId(e.target.value)} 
                    placeholder="e.g., 1234567890" 
                    className="h-11 sm:h-12 lg:h-13 text-sm sm:text-base pl-4 sm:pl-5 pr-4 sm:pr-5 border-input rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-ring transition-all duration-200 bg-background hover:bg-accent/50 touch-manipulation"
                    autoComplete="off"
                    maxLength={64}
                    inputMode="numeric"
                  />
                </div>
              </div>
              
              {/* Availability Dates Selection */}
              {eventDates.length > 0 && (
                <div className="space-y-2 sm:space-y-3 sm:col-span-2">
                  <Label className="text-sm sm:text-base font-semibold text-card-foreground flex items-center gap-2">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[hsl(var(--color-primary))] rounded-full flex-shrink-0"></div>
                    Available Dates <span className="text-destructive">*</span>
                  </Label>
                  <div className="bg-muted/30 rounded-xl lg:rounded-2xl border border-border p-4 sm:p-5 lg:p-6 space-y-3 sm:space-y-4">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Select all dates you are available to work. You must select at least one date.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {eventDates.map((date) => {
                        const isSelected = selectedDates.includes(date)
                        return (
                          <div
                            key={date}
                            role="button"
                            tabIndex={0}
                            className={`flex items-center space-x-3 p-3 sm:p-4 rounded-lg border transition-all cursor-pointer select-none ${
                              isSelected
                                ? 'bg-[hsl(var(--color-primary))]/10 border-[hsl(var(--color-primary))]/30 shadow-sm'
                                : 'bg-background border-border hover:bg-accent/50'
                            }`}
                            onClick={() => handleDateToggle(date, !isSelected)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                handleDateToggle(date, !isSelected)
                              }
                            }}
                          >
                            <Checkbox
                              id={`date-${date}`}
                              checked={isSelected}
                              onCheckedChange={(checked) => handleDateToggle(date, checked as boolean)}
                              onClick={(e) => e.stopPropagation()}
                              className="flex-shrink-0 pointer-events-auto"
                            />
                            <Label
                              htmlFor={`date-${date}`}
                              className="text-sm sm:text-base font-medium text-card-foreground cursor-pointer flex-1 pointer-events-none"
                            >
                              {formatDateDisplay(date)}
                            </Label>
                          </div>
                        )
                      })}
                    </div>
                    {selectedDates.length === 0 && (
                      <p className="text-xs sm:text-sm text-destructive flex items-start gap-1.5 mt-2">
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="flex-1">Please select at least one date you are available to work</span>
                      </p>
                    )}
                    {selectedDates.length > 0 ? (
                      <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                        Selected {selectedDates.length} {selectedDates.length === 1 ? 'date' : 'dates'}
                      </p>
                    ) : null}
                  </div>
                </div>
              )}
            </div>

            {paymentMethod !== 'cash' && (
              <div className="mt-6 sm:mt-8 lg:mt-10 p-5 sm:p-6 lg:p-8 bg-[hsl(var(--color-success))]/10 rounded-xl lg:rounded-2xl border border-[hsl(var(--color-success))]/30 shadow-sm">
                <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-6 lg:mb-8">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-[hsl(var(--color-success))] rounded-lg sm:rounded-xl lg:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md shadow-[hsl(var(--color-success))]/30">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <h4 className="text-lg sm:text-xl lg:text-2xl font-bold text-card-foreground">Payment Information</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
                  {paymentMethod === 'bank_transfer' && (
                    <>
                      <div className="space-y-2 sm:space-y-3">
                        <Label className="text-sm sm:text-base font-semibold text-card-foreground flex items-center gap-2">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[hsl(var(--color-success))] rounded-full flex-shrink-0"></div>
                          Bank <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <Building2 className="w-4 h-4 sm:w-5 sm:h-5 absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <Select value={selectedBank} onValueChange={setSelectedBank}>
                            <SelectTrigger className="h-11 sm:h-12 lg:h-13 pl-11 sm:pl-14 lg:pl-16 text-sm sm:text-base border-input rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-ring transition-all duration-200 bg-background touch-manipulation">
                              <SelectValue placeholder="Select bank" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CBE">Commercial Bank of Ethiopia (CBE)</SelectItem>
                              <SelectItem value="TeleBirr">TeleBirr</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2 sm:space-y-3">
                        <Label className="text-sm sm:text-base font-semibold text-card-foreground flex items-center gap-2">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[hsl(var(--color-success))] rounded-full flex-shrink-0"></div>
                          Account Number <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <Input 
                            className="h-11 sm:h-12 lg:h-13 pl-11 sm:pl-14 lg:pl-16 pr-4 sm:pr-5 text-sm sm:text-base border-input rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-ring transition-all duration-200 bg-background hover:bg-accent/50 touch-manipulation" 
                            value={bankAccount} 
                            onChange={(e) => setBankAccount(e.target.value)} 
                            placeholder="Account number" 
                            autoComplete="off"
                            inputMode="numeric"
                          />
                        </div>
                      </div>
                    </>
                  )}
                  {paymentMethod === 'mobile_money' && (
                    <div className="space-y-2 sm:space-y-3 sm:col-span-2">
                      <Label className="text-sm sm:text-base font-semibold text-card-foreground flex items-center gap-2">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[hsl(var(--color-success))] rounded-full flex-shrink-0"></div>
                        Mobile Wallet <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input 
                          className="h-11 sm:h-12 lg:h-13 pl-11 sm:pl-14 lg:pl-16 pr-4 sm:pr-5 text-sm sm:text-base border-input rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-ring transition-all duration-200 bg-background hover:bg-accent/50 touch-manipulation" 
                          type="tel"
                          value={mobileWallet} 
                          onChange={(e) => setMobileWallet(e.target.value)} 
                          placeholder="Wallet number" 
                          autoComplete="off"
                          inputMode="numeric"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 sm:mt-8 lg:mt-10 p-5 sm:p-6 lg:p-8 bg-muted/50 rounded-xl lg:rounded-2xl border border-border shadow-sm">
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5 lg:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-muted rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <Label className="text-sm sm:text-base lg:text-lg font-semibold text-card-foreground">Additional Notes (Optional)</Label>
              </div>
              <Textarea 
                rows={4} 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                placeholder="Anything we should know (availability, experience, etc.)" 
                className="text-sm sm:text-base resize-none border-input rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-ring transition-all duration-200 bg-background hover:bg-accent/50 touch-manipulation"
                autoComplete="off"
              />
            </div>

            {/* Desktop submit button - hidden on mobile */}
            <div className="pt-6 sm:pt-8 lg:pt-10 hidden sm:flex flex-col sm:flex-row gap-4 sm:gap-6">
              <Button 
                type="submit" 
                onClick={handleSubmit} 
                disabled={!isFormValid || submitting} 
                className="h-11 sm:h-12 lg:h-14 text-sm sm:text-base lg:text-lg w-full sm:w-auto bg-primary hover:bg-[hsl(var(--color-primary-hover))] text-primary-foreground font-semibold rounded-xl lg:rounded-2xl shadow-lg shadow-[hsl(var(--color-primary))]/30 hover:shadow-xl hover:shadow-[hsl(var(--color-primary))]/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              >
                {submitting ? (
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                    <span>Submitting...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 sm:gap-3">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                    <span>Submit Registration</span>
                  </div>
                )}
              </Button>
            </div>
              </div>
            </Card>
        </div>

        {/* Sidebar - Event Details & Instructions */}
        <div className="space-y-6 sm:space-y-8 lg:space-y-10 order-1 lg:order-2">
          <Card className="relative overflow-hidden bg-card border border-border shadow-lg sm:shadow-xl rounded-2xl lg:rounded-3xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[hsl(var(--color-info))]/10 rounded-full -translate-y-16 translate-x-16 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-[hsl(var(--color-primary))]/10 rounded-full translate-y-12 -translate-x-12 blur-xl"></div>
            <div className="relative p-6 sm:p-8 lg:p-10">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 mb-5 sm:mb-6 lg:mb-8">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-[hsl(var(--color-info))] rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-[hsl(var(--color-info))]/30">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-card-foreground">Event Details</h3>
              </div>
              {loadingEvent ? (
                <div className="bg-muted/50 rounded-xl lg:rounded-2xl p-5 sm:p-6 lg:p-8 border border-border text-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3 sm:mb-4"></div>
                  <p className="text-sm sm:text-base text-muted-foreground font-medium">Loading event details...</p>
                </div>
              ) : eventDetails ? (
                <div className="space-y-4 sm:space-y-5 lg:space-y-6">
                  <div className="bg-muted/30 rounded-xl lg:rounded-2xl p-4 sm:p-5 lg:p-6 border border-border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[hsl(var(--color-info))] rounded-full flex-shrink-0"></div>
                      <span className="text-sm sm:text-base font-semibold text-card-foreground">Event Name</span>
                    </div>
                    <p className="text-base sm:text-lg text-card-foreground font-semibold break-words">{eventDetails.name}</p>
                  </div>
                  <div className="bg-muted/30 rounded-xl lg:rounded-2xl p-4 sm:p-5 lg:p-6 border border-border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[hsl(var(--color-primary))] rounded-full flex-shrink-0"></div>
                      <span className="text-sm sm:text-base font-semibold text-card-foreground">Date</span>
                    </div>
                    <p className="text-base sm:text-lg text-card-foreground font-semibold">
                      {new Date(eventDetails.start_date).toLocaleDateString()} 
                      {eventDetails.end_date ? ` - ${new Date(eventDetails.end_date).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                  {eventDetails.location && (
                    <div className="bg-muted/30 rounded-xl lg:rounded-2xl p-4 sm:p-5 lg:p-6 border border-border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[hsl(var(--color-success))] rounded-full flex-shrink-0"></div>
                        <span className="text-sm sm:text-base font-semibold text-card-foreground">Location</span>
                      </div>
                      <p className="text-base sm:text-lg text-card-foreground font-semibold break-words">{eventDetails.location}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-muted/50 rounded-xl lg:rounded-2xl p-5 sm:p-6 lg:p-8 border border-border text-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground font-medium">Invalid or missing event information</p>
                </div>
              )}
            </div>
          </Card>

          {/* Organizer Instructions */}
          {payload && (
            <Card className="relative overflow-hidden bg-card border border-border shadow-lg sm:shadow-xl rounded-2xl lg:rounded-3xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[hsl(var(--color-primary))]/10 rounded-full -translate-y-16 translate-x-16 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-[hsl(var(--color-success))]/10 rounded-full translate-y-12 -translate-x-12 blur-xl"></div>
              <div className="relative p-6 sm:p-8 lg:p-10">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 mb-5 sm:mb-6 lg:mb-8">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-[hsl(var(--color-primary))] rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-[hsl(var(--color-primary))]/30">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-card-foreground">Job Details</h3>
                </div>
                <div className="space-y-4 sm:space-y-5 lg:space-y-6 text-sm sm:text-base">
                  {payload.payment?.dailyRate && (
                    <div className="bg-[hsl(var(--color-success))]/10 rounded-xl lg:rounded-2xl p-4 sm:p-5 lg:p-6 border border-[hsl(var(--color-success))]/30 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[hsl(var(--color-success))] rounded-full flex-shrink-0"></div>
                        <span className="text-sm sm:text-base font-semibold text-card-foreground">Daily Rate</span>
                      </div>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-[hsl(var(--color-success))]">ETB {payload.payment.dailyRate}</p>
                    </div>
                  )}
                  {payload.payment?.method && (
                    <div className="bg-muted/30 rounded-xl lg:rounded-2xl p-4 sm:p-5 lg:p-6 border border-border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[hsl(var(--color-info))] rounded-full flex-shrink-0"></div>
                        <span className="text-sm sm:text-base font-semibold text-card-foreground">Payment Method</span>
                      </div>
                      <p className="text-base sm:text-lg text-card-foreground capitalize font-medium">{payload.payment.method.replace('_', ' ')}</p>
                    </div>
                  )}
                  {payload.payment?.terms && (
                    <div className="bg-muted/30 rounded-xl lg:rounded-2xl p-4 sm:p-5 lg:p-6 border border-border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[hsl(var(--color-info))] rounded-full flex-shrink-0"></div>
                        <span className="text-sm sm:text-base font-semibold text-card-foreground">Payment Terms</span>
                      </div>
                      <p className="text-base sm:text-lg text-card-foreground break-words">{payload.payment.terms}</p>
                    </div>
                  )}
                  {payload.requirements?.dressCode && (
                    <div className="bg-muted/30 rounded-xl lg:rounded-2xl p-4 sm:p-5 lg:p-6 border border-border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[hsl(var(--color-warning))] rounded-full flex-shrink-0"></div>
                        <span className="text-sm sm:text-base font-semibold text-card-foreground">Dress Code</span>
                      </div>
                      <p className="text-base sm:text-lg text-card-foreground break-words">{payload.requirements.dressCode}</p>
                    </div>
                  )}
                  {payload.requirements?.arrivalTime && (
                    <div className="bg-muted/30 rounded-xl lg:rounded-2xl p-4 sm:p-5 lg:p-6 border border-border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[hsl(var(--color-primary))] rounded-full flex-shrink-0"></div>
                        <span className="text-sm sm:text-base font-semibold text-card-foreground">Arrival Time</span>
                      </div>
                      <p className="text-base sm:text-lg text-card-foreground font-semibold">{payload.requirements.arrivalTime}</p>
                    </div>
                  )}
                  {payload.requirements?.notes && (
                    <div className="bg-muted/30 rounded-xl lg:rounded-2xl p-4 sm:p-5 lg:p-6 border border-border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-muted-foreground rounded-full flex-shrink-0"></div>
                        <span className="text-sm sm:text-base font-semibold text-card-foreground">Additional Notes</span>
                      </div>
                      <p className="text-base sm:text-lg text-card-foreground break-words">{payload.requirements.notes}</p>
                    </div>
                  )}
                  {payload.message && (
                    <div className="bg-[hsl(var(--color-primary))]/10 rounded-xl lg:rounded-2xl p-4 sm:p-5 lg:p-6 border border-[hsl(var(--color-primary))]/30 shadow-sm">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[hsl(var(--color-primary))] rounded-full flex-shrink-0"></div>
                        <span className="text-sm sm:text-base font-semibold text-card-foreground">Message from Organizer</span>
                      </div>
                      <p className="text-base sm:text-lg text-card-foreground/90 italic break-words">"{payload.message}"</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
        </div>
      </div>

      {/* Mobile sticky submit button */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border p-4 shadow-2xl z-50 safe-area-inset-bottom">
        <Button 
          onClick={handleSubmit} 
          disabled={!isFormValid || submitting} 
          className="w-full h-12 text-base bg-primary hover:bg-[hsl(var(--color-primary-hover))] text-primary-foreground font-semibold rounded-xl shadow-lg shadow-[hsl(var(--color-primary))]/30 hover:shadow-xl hover:shadow-[hsl(var(--color-primary))]/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
        >
          {submitting ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
              <span>Submitting...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>Submit Registration</span>
            </div>
          )}
        </Button>
      </div>
    </div>
  )
}
