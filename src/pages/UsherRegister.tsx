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
  const [selectedBank, setSelectedBank] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [mobileWallet, setMobileWallet] = useState('')
  const [notes, setNotes] = useState('')

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
    
    if (paymentMethod === 'bank_transfer') {
      return basicValid && emailValid && phoneValid && !!(selectedBank && bankAccount)
    }
    if (paymentMethod === 'mobile_money') {
      return basicValid && emailValid && phoneValid && !!mobileWallet
    }
    return basicValid && emailValid && phoneValid
  }, [firstName, lastName, email, phone, payload, paymentMethod, selectedBank, bankAccount, mobileWallet])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payload?.eventId) return
    if (!isFormValid) {
      toast.error('Please fill all required fields')
      return
    }
    setSubmitting(true)
    try {
      const result = await createUsherRegistration(payload.eventId, {
        name: `${firstName} ${lastName}`.trim(),
        email,
        phone,
        notes,
        payment_method: paymentMethod,
        bank_name: selectedBank || undefined,
        bank_account: bankAccount || undefined,
        mobile_wallet: mobileWallet || undefined,
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
      if (err?.response?.status === 409 && err?.response?.data?.duplicate) {
        toast.error('You have already registered for this event with this email or phone.')
      } else {
        const msg = err?.response?.data?.message || err?.message || 'Submission failed'
        toast.error(msg)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0E1B2B] via-[#14243A] to-[#1C2E4A]">
      <div className="w-full bg-white/60 backdrop-blur border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src="/Validity-Event & Marketing.png"
                alt="Validity"
                className="h-8 sm:h-10 w-auto"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              />
              <div>
                <div className="text-lg sm:text-xl font-bold text-gray-900">Usher Registration</div>
                <div className="text-xs sm:text-sm text-gray-600">Apply to join this event's usher team</div>
              </div>
            </div>
            {eventDetails?.name && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 flex-shrink-0" /> 
                  <span className="truncate">{new Date(eventDetails.start_date).toLocaleDateString()}</span>
                </div>
                {eventDetails.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 flex-shrink-0" /> 
                    <span className="truncate">{eventDetails.location}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 w-full max-w-6xl mx-auto px-4 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <Card className="relative overflow-hidden bg-white border-0 shadow-2xl rounded-3xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
              <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-blue-100/30 to-purple-100/30 rounded-full"></div>
              <div className="relative p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Personal Information</h3>
                    <p className="text-sm text-gray-500">Fill in your details to register</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  First Name
                </Label>
                <div className="relative">
                  <Input 
                    value={firstName} 
                    onChange={(e) => setFirstName(e.target.value)} 
                    placeholder="e.g., Jane" 
                    required 
                    className="h-14 text-base pl-4 pr-4 border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 bg-gray-50/50"
                    autoComplete="given-name"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  Last Name
                </Label>
                <div className="relative">
                  <Input 
                    value={lastName} 
                    onChange={(e) => setLastName(e.target.value)} 
                    placeholder="e.g., Doe" 
                    required 
                    className="h-14 text-base pl-4 pr-4 border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 bg-gray-50/50"
                    autoComplete="family-name"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-4 top-4 text-gray-400" />
                  <Input 
                    className={`h-14 pl-12 pr-4 text-base border-2 rounded-2xl focus:ring-4 transition-all duration-200 bg-gray-50/50 ${
                      email && !isValidEmail(email) 
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-100' 
                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
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
                  <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Please enter a valid email address
                  </p>
                )}
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="w-5 h-5 absolute left-4 top-4 text-gray-400" />
                  <Input 
                    className={`h-14 pl-12 pr-4 text-base border-2 rounded-2xl focus:ring-4 transition-all duration-200 bg-gray-50/50 ${
                      phone && !isValidPhone(phone) 
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-100' 
                        : 'border-gray-200 focus:border-green-500 focus:ring-green-100'
                    }`} 
                    type="tel" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    // placeholder="e.g., 0912345678, +251912345678, 912345678" 
                    required 
                    autoComplete="tel"
                    inputMode="numeric"
                  />
                </div>
                {phone && !isValidPhone(phone) && (
                  <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Please enter a valid Phone Number (09xxxxxxxx, +2519xxxxxxxx, 9xxxxxxxx, etc.)
                  </p>
                )}
              </div>
            </div>

            {paymentMethod !== 'cash' && (
              <div className="mt-8 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200/50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-bold text-green-800">Payment Information</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {paymentMethod === 'bank_transfer' && (
                    <>
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold text-green-800 flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Bank <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Building2 className="w-5 h-5 absolute left-4 top-4 text-gray-400" />
                          <Select value={selectedBank} onValueChange={setSelectedBank}>
                            <SelectTrigger className="h-14 pl-12 text-base border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 bg-white">
                              <SelectValue placeholder="Select bank" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CBE">Commercial Bank of Ethiopia (CBE)</SelectItem>
                              <SelectItem value="TeleBirr">TeleBirr</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold text-green-800 flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Account Number <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <CreditCard className="w-5 h-5 absolute left-4 top-4 text-gray-400" />
                          <Input 
                            className="h-14 pl-12 pr-4 text-base border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 bg-white" 
                            value={bankAccount} 
                            onChange={(e) => setBankAccount(e.target.value)} 
                            placeholder="Account number" 
                            autoComplete="off"
                          />
                        </div>
                      </div>
                    </>
                  )}
                  {paymentMethod === 'mobile_money' && (
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-green-800 flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Mobile Wallet <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Smartphone className="w-5 h-5 absolute left-4 top-4 text-gray-400" />
                        <Input 
                          className="h-14 pl-12 pr-4 text-base border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 bg-white" 
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

            <div className="mt-8 p-6 bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl border border-gray-200/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-slate-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <Label className="text-sm font-semibold text-gray-800">Additional Notes (Optional)</Label>
              </div>
              <Textarea 
                rows={4} 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                placeholder="Anything we should know (availability, experience, etc.)" 
                className="text-base resize-none border-2 border-gray-200 rounded-2xl focus:border-gray-400 focus:ring-4 focus:ring-gray-100 transition-all duration-200 bg-white"
                autoComplete="off"
              />
            </div>

            <div className="pt-6 flex flex-col sm:flex-row gap-4">
              <Button 
                type="submit" 
                onClick={handleSubmit} 
                disabled={!isFormValid || submitting} 
                className="h-14 text-base w-full sm:w-auto order-2 sm:order-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Submit Registration
                  </div>
                )}
              </Button>
              {/* <Button 
                type="button" 
                variant="outline" 
                className="h-14 text-base w-full sm:w-auto order-1 sm:order-2 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 font-semibold rounded-2xl transition-all duration-200" 
                onClick={() => window.history.back()}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back
                </div>
              </Button> */}
            </div>
              </div>
            </Card>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <Card className="relative overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-50 border-0 shadow-xl rounded-3xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-100/30 to-purple-100/30 rounded-full -translate-y-12 translate-x-12"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-purple-100/20 to-indigo-100/20 rounded-full translate-y-8 -translate-x-8"></div>
            <div className="relative p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Event Details</h3>
              </div>
              {loadingEvent ? (
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/50 text-center">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-gray-600 font-medium">Loading event details...</p>
                </div>
              ) : eventDetails ? (
                <div className="space-y-4">
                  <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                      <span className="font-semibold text-gray-700">Event Name</span>
                    </div>
                    <p className="text-gray-800 font-medium break-words">{eventDetails.name}</p>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="font-semibold text-gray-700">Date</span>
                    </div>
                    <p className="text-gray-800 font-medium">
                      {new Date(eventDetails.start_date).toLocaleDateString()} 
                      {eventDetails.end_date ? ` - ${new Date(eventDetails.end_date).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                  {eventDetails.location && (
                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                        <span className="font-semibold text-gray-700">Location</span>
                      </div>
                      <p className="text-gray-800 font-medium break-words">{eventDetails.location}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/50 text-center">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium">Invalid or missing event information</p>
                </div>
              )}
            </div>
          </Card>

          {/* Organizer Instructions - Moved to sidebar */}
          {payload && (
            <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-xl rounded-3xl">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100/30 to-indigo-100/30 rounded-full -translate-y-12 translate-x-12"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-indigo-100/20 to-blue-100/20 rounded-full translate-y-8 -translate-x-8"></div>
              <div className="relative p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Organizer Instructions</h3>
                </div>
                <div className="space-y-4 text-sm">
                  {payload.payment?.dailyRate && (
                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-semibold text-gray-700">Daily Rate</span>
                      </div>
                      <p className="text-lg font-bold text-green-600">ETB {payload.payment.dailyRate}</p>
                    </div>
                  )}
                  {payload.payment?.method && (
                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="font-semibold text-gray-700">Payment Method</span>
                      </div>
                      <p className="text-gray-800 capitalize">{payload.payment.method.replace('_', ' ')}</p>
                    </div>
                  )}
                  {payload.payment?.terms && (
                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="font-semibold text-gray-700">Payment Terms</span>
                      </div>
                      <p className="text-gray-800">{payload.payment.terms}</p>
                    </div>
                  )}
                  {payload.requirements?.dressCode && (
                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span className="font-semibold text-gray-700">Dress Code</span>
                      </div>
                      <p className="text-gray-800">{payload.requirements.dressCode}</p>
                    </div>
                  )}
                  {payload.requirements?.arrivalTime && (
                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="font-semibold text-gray-700">Arrival Time</span>
                      </div>
                      <p className="text-gray-800 font-medium">{payload.requirements.arrivalTime}</p>
                    </div>
                  )}
                  {payload.requirements?.notes && (
                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                        <span className="font-semibold text-gray-700">Additional Notes</span>
                      </div>
                      <p className="text-gray-800">{payload.requirements.notes}</p>
                    </div>
                  )}
                  {payload.message && (
                    <div className="bg-gradient-to-r from-blue-100/80 to-indigo-100/80 backdrop-blur-sm rounded-2xl p-4 border border-blue-200/50">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span className="font-semibold text-blue-800">Message from Organizer</span>
                      </div>
                      <p className="text-blue-700 italic">"{payload.message}"</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
        </div>
      </div>

      <div className="sm:hidden sticky bottom-0 bg-white/95 backdrop-blur border-t border-gray-200/50 p-4 shadow-xl">
        <Button 
          onClick={handleSubmit} 
          disabled={!isFormValid || submitting} 
          className="w-full h-14 text-base bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Submitting...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Submit Registration
            </div>
          )}
        </Button>
      </div>
    </div>
  )
}
