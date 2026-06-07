import React, { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useSearchParams, useParams, useNavigate } from 'react-router-dom'
import {
  Calendar,
  MapPin,
  AlertCircle,
  User,
  CheckCircle,
  Loader2,
  Mail,
  Phone,
  Building,
  Globe,
  Camera,
  Upload,
  X,
} from 'lucide-react'
import { validateOptionalText, validatePersonName, validatePublicEmail } from '@/lib/inputQuality'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import api from '@/lib/api'
import { PROFILE_PICTURE_ACCEPT, validateProfilePictureFile } from '@/lib/fileValidation'
import { useRegistrationShareMeta } from '@/lib/registrationShareMeta'
import { useTheme } from 'next-themes'
import { TELEBIRR_ASSETS, TELEBIRR_COLORS, DEFAULT_TELEBIRR_EVENT_ID } from './constants'
import { TelebirrRegLayout, TelebirrRegFooter } from './TelebirrRegLayout'
import { telebirrSuccessPath } from './routes'
import { saveRegistrationSuccess } from './sessionStorage'
import type { TelebirrEventData, TelebirrFormData } from './types'
import { RegistrationUnavailable, type RegistrationUnavailableVariant } from '@/components/public/RegistrationUnavailable'

const TelebirrRegistrationPage: React.FC = () => {
  const { eventId = DEFAULT_TELEBIRR_EVENT_ID } = useParams<{ eventId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setTheme } = useTheme()

  const isOnsite =
    searchParams.get('reg_type') === 'onsite' || searchParams.get('type') === 'onsite'

  useEffect(() => {
    setTheme('light')
  }, [setTheme])

  const [eventData, setEventData] = useState<TelebirrEventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<TelebirrFormData>({
    fullName: '',
    email: '',
    phoneNumber: '',
    organization: '',
    jobTitle: '',
    joiningAs: 'Visitor',
    guest_type_id: '',
    profilePicture: null,
    country: '',
    otherCountry: '',
    city: '',
    otherCity: '',
  })

  useEffect(() => {
    window.scrollTo(0, 0)
    const fetchEventData = async () => {
      try {
        const response = await api.get(`/public/events/id/${eventId}`)
        const data = response.data as TelebirrEventData
        setEventData(data)

        if (data.guestTypes) {
          const invType = searchParams.get('type')?.toLowerCase()
          const invGuestTypeId = searchParams.get('guest_type_id')

          let selectedType = data.guestTypes.find((gt) =>
            invGuestTypeId
              ? gt.id.toString() === invGuestTypeId
              : invType
                ? gt.name.toLowerCase() === invType
                : gt.name.toLowerCase() === 'visitor',
          )

          if (!selectedType && !invGuestTypeId && !invType) {
            selectedType = data.guestTypes[0]
          }

          if (selectedType) {
            setFormData((prev) => ({
              ...prev,
              joiningAs: selectedType.name,
              guest_type_id: selectedType.id.toString(),
            }))
          }
        }
      } catch (error) {
        console.error('Failed to fetch event data:', error)
        setErrors({ submit: 'Event not found. Please check the event ID.' })
      } finally {
        setLoading(false)
      }
    }

    if (eventId) {
      fetchEventData()
    }
  }, [eventId, searchParams])

  useRegistrationShareMeta({
    enabled: Boolean(eventData && !loading && eventData.name),
    title: eventData?.name,
    description: eventData?.description,
    imageRaw: eventData?.image,
    eventId: eventData?.id || eventId,
  })

  const registerMutation = useMutation({
    mutationFn: async (data: TelebirrFormData) => {
      const payload = new FormData()
      payload.append('name', data.fullName)
      payload.append('email', data.email)
      payload.append('phone', data.phoneNumber)
      payload.append('company', data.organization)
      payload.append('job_title', data.jobTitle)
      payload.append(
        'country',
        data.country === 'Other' ? data.otherCountry || 'Other' : data.country,
      )
      payload.append('city', data.city === 'Other' ? data.otherCity || 'Other' : data.city)
      payload.append('guest_type_id', data.guest_type_id || '')
      payload.append(
        'registration_type',
        searchParams.get('reg_type') || searchParams.get('type') || 'prereg',
      )

      if (data.profilePicture) {
        payload.append('profile_picture', data.profilePicture)
      }

      return api.post(`/public/events/${eventData?.uuid}/register`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: (response) => {
      const successState = {
        registrationData: response.data?.attendee || response.data,
        eventData: eventData!,
      }
      saveRegistrationSuccess(successState)
      navigate(telebirrSuccessPath(eventId), { state: successState })
    },
    onError: (error: { response?: { data?: { error?: string; message?: string } } }) => {
      setErrors({
        submit:
          error.response?.data?.error ||
          error.response?.data?.message ||
          'Registration failed. Please try again.',
      })
    },
  })

  const handleInputChange = (field: keyof TelebirrFormData, value: string | File | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      const newErrors = { ...errors }
      delete newErrors[field]
      setErrors(newErrors)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validation = validateProfilePictureFile(file)
    if (!validation.valid) {
      setErrors((prev) => ({ ...prev, profilePicture: validation.message }))
      e.target.value = ''
      return
    }

    setErrors((prev) => {
      const next = { ...prev }
      delete next.profilePicture
      return next
    })
    handleInputChange('profilePicture', file)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    const nameResult = validatePersonName(formData.fullName)
    if (!nameResult.valid) newErrors.fullName = nameResult.message

    if (formData.email.trim()) {
      const emailResult = validatePublicEmail(formData.email)
      if (!emailResult.valid) newErrors.email = emailResult.message
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required'
    } else if (!/^[+]?[\d\s\-()]{10,}$/.test(formData.phoneNumber.trim())) {
      newErrors.phoneNumber = 'Please enter a valid phone number'
    }

    if (!formData.country.trim()) {
      newErrors.country = 'Country is required'
    } else if (formData.country === 'Other') {
      if (!formData.otherCountry?.trim()) {
        newErrors.country = 'Please specify your country'
      } else {
        const otherCountryResult = validateOptionalText(formData.otherCountry)
        if (!otherCountryResult.valid) newErrors.country = otherCountryResult.message
      }
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required'
    } else if (formData.city === 'Other') {
      if (!formData.otherCity?.trim()) {
        newErrors.city = 'Please specify your city'
      } else {
        const otherCityResult = validateOptionalText(formData.otherCity)
        if (!otherCityResult.valid) newErrors.city = otherCityResult.message
      }
    } else {
      const cityResult = validateOptionalText(formData.city)
      if (!cityResult.valid) newErrors.city = cityResult.message
    }

    if (formData.organization?.trim()) {
      const orgResult = validateOptionalText(formData.organization)
      if (!orgResult.valid) newErrors.organization = orgResult.message
    }

    if (formData.jobTitle?.trim()) {
      const jobResult = validateOptionalText(formData.jobTitle)
      if (!jobResult.valid) newErrors.jobTitle = jobResult.message
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setSubmitting(true)
    try {
      await registerMutation.mutateAsync(formData)
    } catch {
      // Handled in onError
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2
            className="mx-auto h-12 w-12 animate-spin"
            style={{ color: TELEBIRR_COLORS.deepGreen }}
          />
          <p className="mt-4 font-medium text-gray-600">Loading anniversary registration...</p>
        </div>
      </div>
    )
  }

  if (errors.submit && !eventData) {
    return <RegistrationUnavailable variant="not-found" />
  }

  // Registration window / lifecycle gating
  if (eventData) {
    const now = new Date()
    const regEnd = eventData.registration_end_date ? new Date(eventData.registration_end_date) : null
    const regStart = eventData.registration_start_date ? new Date(eventData.registration_start_date) : null
    const eventEnd = eventData.end_date ? new Date(eventData.end_date) : null

    let gateVariant: RegistrationUnavailableVariant | null = null
    if (eventEnd && !Number.isNaN(eventEnd.getTime()) && eventEnd < now) {
      gateVariant = 'event-passed'
    } else if (regEnd && !Number.isNaN(regEnd.getTime()) && regEnd < now) {
      gateVariant = 'registration-ended'
    } else if (regStart && !Number.isNaN(regStart.getTime()) && regStart > now) {
      gateVariant = 'registration-not-started'
    } else if (eventData.status && eventData.status !== 'active') {
      gateVariant = 'inactive'
    } else if (eventData.is_registration_open === false) {
      gateVariant = 'registration-ended'
    }

    if (gateVariant) {
      return (
        <RegistrationUnavailable
          variant={gateVariant}
          eventName={eventData.name}
          registrationEndDate={eventData.registration_end_date}
          registrationStartDate={eventData.registration_start_date}
          eventStartDate={eventData.start_date}
        />
      )
    }
  }

  const heroBackground =
    eventId === DEFAULT_TELEBIRR_EVENT_ID
      ? `url('${TELEBIRR_ASSETS.eventBanner}')`
      : eventData?.image
        ? `url(${eventData.image})`
        : `linear-gradient(135deg, ${TELEBIRR_COLORS.deepGreen} 0%, ${TELEBIRR_COLORS.lightGreen} 100%)`

  return (
    <TelebirrRegLayout variant="register" isOnsite={isOnsite}>
      <section
        className="relative py-20 overflow-hidden text-white"
        style={{
          background: heroBackground,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex justify-center mb-8">
            <img
              src={TELEBIRR_ASSETS.telebirrLogo}
              alt="Telebirr 5th Year Anniversary"
              className="h-16 md:h-24 w-auto object-contain drop-shadow-md"
            />
          </div>

          <h2 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight drop-shadow-lg">
            {eventData?.title || eventData?.name || 'Loading...'}
          </h2>

          <div className="flex flex-wrap justify-center gap-6 text-lg font-medium">
            <div className="flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              <span>
                {eventData?.start_date && eventData?.end_date
                  ? `${new Date(eventData.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(eventData.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                  : eventData?.start_date
                    ? new Date(eventData.start_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Loading...'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-6 h-6" />
              <span>{eventData?.venue_name || eventData?.location || 'Loading...'}</span>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 py-16 -mt-10 relative z-20 space-y-8">
        {eventData?.description && (
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden p-8 md:p-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-2">About the Event</h3>
            <div
              className="h-1 w-20 mt-4 mb-6 rounded-full"
              style={{ backgroundColor: TELEBIRR_COLORS.deepGreen }}
            />
            <div
              className="prose max-w-none text-gray-600 prose-a:text-[#8DC63F] prose-headings:text-gray-800"
              dangerouslySetInnerHTML={{ __html: eventData.description }}
            />
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="p-8 md:p-12">
            <div className="mb-12">
              <h3 className="text-3xl font-bold text-gray-900 mb-2">Visitor Registration</h3>
              <p className="text-gray-500">
                Please fill out the form below to secure your spot at the exhibition.
              </p>
              <div
                className="h-1 w-20 mt-4 rounded-full"
                style={{ backgroundColor: TELEBIRR_COLORS.deepGreen }}
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {errors.submit && (
                <Alert variant="destructive" className="rounded-xl border-2">
                  <AlertCircle className="h-5 w-5" />
                  <AlertDescription className="font-medium">{errors.submit}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label htmlFor="fullName" className="text-base font-bold text-gray-700 flex items-center gap-2">
                    <User className="w-4 h-4" style={{ color: TELEBIRR_COLORS.deepGreen }} />
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className={`h-14 rounded-xl border-2 transition-all focus:ring-4 ${errors.fullName ? 'border-red-300 focus:border-red-500 focus:ring-red-50' : 'border-gray-200 focus:border-[#8DC63F] focus:ring-[#8DC63F]/10'}`}
                    placeholder="Enter your full name"
                  />
                  {errors.fullName && (
                    <p className="text-sm text-red-500 font-medium pl-1">{errors.fullName}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="email" className="text-base font-bold text-gray-700 flex items-center gap-2">
                    <Mail className="w-4 h-4" style={{ color: TELEBIRR_COLORS.deepGreen }} />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`h-14 rounded-xl border-2 transition-all focus:ring-4 ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-50' : 'border-gray-200 focus:border-[#8DC63F] focus:ring-[#8DC63F]/10'}`}
                    placeholder="example@telebirr.et"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 font-medium pl-1">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="phoneNumber" className="text-base font-bold text-gray-700 flex items-center gap-2">
                    <Phone className="w-4 h-4" style={{ color: TELEBIRR_COLORS.deepGreen }} />
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    className={`h-14 rounded-xl border-2 transition-all focus:ring-4 ${errors.phoneNumber ? 'border-red-300 focus:border-red-500 focus:ring-red-50' : 'border-gray-200 focus:border-[#8DC63F] focus:ring-[#8DC63F]/10'}`}
                    placeholder="+251 911 123 456"
                  />
                  {errors.phoneNumber && (
                    <p className="text-sm text-red-500 font-medium pl-1">{errors.phoneNumber}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="organization" className="text-base font-bold text-gray-700 flex items-center gap-2">
                    <Building className="w-4 h-4" style={{ color: TELEBIRR_COLORS.deepGreen }} />
                    Organization
                  </Label>
                  <Input
                    id="organization"
                    value={formData.organization}
                    onChange={(e) => handleInputChange('organization', e.target.value)}
                    className="h-14 rounded-xl border-2 border-gray-200 transition-all focus:border-[#8DC63F] focus:ring-4 focus:ring-[#8DC63F]/10"
                    placeholder="Your company or entity"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="jobTitle" className="text-base font-bold text-gray-700 flex items-center gap-2">
                    <Globe className="w-4 h-4" style={{ color: TELEBIRR_COLORS.deepGreen }} />
                    Job Title
                  </Label>
                  <Input
                    id="jobTitle"
                    value={formData.jobTitle}
                    onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                    className="h-14 rounded-xl border-2 border-gray-200 transition-all focus:border-[#8DC63F] focus:ring-4 focus:ring-[#8DC63F]/10"
                    placeholder="e.g. Director, Manager"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="country" className="text-base font-bold text-gray-700 flex items-center gap-2">
                    <Globe className="w-4 h-4" style={{ color: TELEBIRR_COLORS.deepGreen }} />
                    Country <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                    <SelectTrigger
                      className={`h-14 w-full px-3 rounded-xl border-2 transition-all bg-transparent outline-none ${errors.country ? 'border-red-300 focus:border-red-500 focus:ring-red-50' : 'border-gray-200 focus:border-[#8DC63F] focus:ring-[#8DC63F]/10'}`}
                    >
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ethiopia">Ethiopia</SelectItem>
                      <SelectItem value="United States">United States</SelectItem>
                      <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                      <SelectItem value="Kenya">Kenya</SelectItem>
                      <SelectItem value="Djibouti">Djibouti</SelectItem>
                      <SelectItem value="Somalia">Somalia</SelectItem>
                      <SelectItem value="Sudan">Sudan</SelectItem>
                      <SelectItem value="South Sudan">South Sudan</SelectItem>
                      <SelectItem value="Eritrea">Eritrea</SelectItem>
                      <SelectItem value="China">China</SelectItem>
                      <SelectItem value="India">India</SelectItem>
                      <SelectItem value="United Arab Emirates">United Arab Emirates</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.country === 'Other' && (
                    <Input
                      value={formData.otherCountry || ''}
                      onChange={(e) => handleInputChange('otherCountry', e.target.value)}
                      className="h-14 mt-2 rounded-xl border-2 border-gray-200 transition-all focus:border-[#8DC63F] focus:ring-4 focus:ring-[#8DC63F]/10"
                      placeholder="Please specify your country"
                    />
                  )}
                  {errors.country && (
                    <p className="text-sm text-red-500 font-medium pl-1">{errors.country}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="city" className="text-base font-bold text-gray-700 flex items-center gap-2">
                    <MapPin className="w-4 h-4" style={{ color: TELEBIRR_COLORS.deepGreen }} />
                    City <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.city} onValueChange={(value) => handleInputChange('city', value)}>
                    <SelectTrigger
                      className={`h-14 w-full px-3 rounded-xl border-2 transition-all bg-transparent outline-none ${errors.city ? 'border-red-300 focus:border-red-500 focus:ring-red-50' : 'border-gray-200 focus:border-[#8DC63F] focus:ring-[#8DC63F]/10'}`}
                    >
                      <SelectValue placeholder="Select your city" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.country === 'Ethiopia' || !formData.country ? (
                        <>
                          <SelectItem value="Addis Ababa">Addis Ababa</SelectItem>
                          <SelectItem value="Dire Dawa">Dire Dawa</SelectItem>
                          <SelectItem value="Adama">Adama</SelectItem>
                          <SelectItem value="Hawassa">Hawassa</SelectItem>
                          <SelectItem value="Bahir Dar">Bahir Dar</SelectItem>
                          <SelectItem value="Mekelle">Mekelle</SelectItem>
                          <SelectItem value="Gondar">Gondar</SelectItem>
                          <SelectItem value="Jimma">Jimma</SelectItem>
                          <SelectItem value="Dessie">Dessie</SelectItem>
                          <SelectItem value="Jijiga">Jijiga</SelectItem>
                          <SelectItem value="Shashamane">Shashamane</SelectItem>
                          <SelectItem value="Bishoftu">Bishoftu</SelectItem>
                          <SelectItem value="Arba Minch">Arba Minch</SelectItem>
                          <SelectItem value="Harar">Harar</SelectItem>
                        </>
                      ) : null}
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.city === 'Other' && (
                    <Input
                      value={formData.otherCity || ''}
                      onChange={(e) => handleInputChange('otherCity', e.target.value)}
                      className="h-14 mt-2 rounded-xl border-2 border-gray-200 transition-all focus:border-[#8DC63F] focus:ring-4 focus:ring-[#8DC63F]/10"
                      placeholder="Please specify your city"
                    />
                  )}
                  {errors.city && (
                    <p className="text-sm text-red-500 font-medium pl-1">{errors.city}</p>
                  )}
                </div>

                <div className="space-y-3 md:col-span-2">
                  <Label className="text-base font-bold text-gray-700 flex items-center gap-2">
                    <Camera className="w-4 h-4" style={{ color: TELEBIRR_COLORS.deepGreen }} />
                    Profile Picture (Optional)
                  </Label>
                  <div className="flex flex-col sm:flex-row items-center gap-6 p-6 border-2 border-dashed border-gray-200 rounded-2xl bg-slate-50 transition-all hover:border-[#8DC63F]/50 group">
                    {formData.profilePicture ? (
                      <div className="relative">
                        <img
                          src={URL.createObjectURL(formData.profilePicture)}
                          alt="Preview"
                          className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg"
                        />
                        <button
                          type="button"
                          onClick={() => handleInputChange('profilePicture', null)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-2xl bg-gray-200 flex items-center justify-center border-4 border-white shadow-inner group-hover:bg-[#8DC63F]/10 transition-colors">
                        <User className="w-10 h-10 text-gray-400 group-hover:text-[#8DC63F]" />
                      </div>
                    )}
                    <div className="flex-1 text-center sm:text-left">
                      <p className="text-sm font-bold text-gray-700 mb-1">
                        {formData.profilePicture ? 'Change your photo' : 'Upload your profile photo'}
                      </p>
                      <p className="text-xs text-gray-500 mb-4">PNG or JPEG only. Max 4MB.</p>
                      <Label
                        htmlFor="profilePicture"
                        className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-white border-2 border-gray-200 text-sm font-bold text-gray-700 cursor-pointer hover:border-[#8DC63F] hover:text-[#8DC63F] transition-all shadow-sm active:scale-95"
                      >
                        <Upload className="w-4 h-4" />
                        Select Image
                      </Label>
                      <input
                        id="profilePicture"
                        type="file"
                        accept={PROFILE_PICTURE_ACCEPT}
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
                {errors.profilePicture && (
                  <p className="text-sm text-red-500 font-medium pl-1">{errors.profilePicture}</p>
                )}
              </div>

              <div className="pt-10">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-16 rounded-2xl text-xl font-bold transition-all shadow-xl hover:shadow-2xl active:scale-[0.98] disabled:opacity-70 text-white"
                  style={{ backgroundColor: TELEBIRR_COLORS.deepGreen }}
                >
                  {submitting ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Securing your spot...
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6" />
                      Register Now
                    </div>
                  )}
                </Button>
                <p className="text-center text-gray-500 text-sm mt-6">
                  By registering, you agree to receive communications regarding the event.
                </p>
              </div>
            </form>
          </div>
        </div>

        <TelebirrRegFooter />
      </main>
    </TelebirrRegLayout>
  )
}

export default TelebirrRegistrationPage
