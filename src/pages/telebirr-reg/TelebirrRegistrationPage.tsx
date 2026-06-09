import React, { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useSearchParams, useParams, useNavigate } from 'react-router-dom'
import {
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import api, { lookupPublicBadge } from '@/lib/api'
import { toast } from 'sonner'
import { getImageUrl } from '@/lib/utils'
import { PROFILE_PICTURE_ACCEPT, validateProfilePictureFile } from '@/lib/fileValidation'
import { useRegistrationShareMeta } from '@/lib/registrationShareMeta'
import { useTheme } from 'next-themes'
import { TELEBIRR_COLORS, DEFAULT_TELEBIRR_EVENT_ID } from './constants'
import { TelebirrRegLayout, TelebirrRegFooter } from './TelebirrRegLayout'
import { telebirrSuccessPath } from './routes'
import { saveRegistrationSuccess } from './sessionStorage'
import {
  buildSuccessState,
  extractRegistrationApiPayload,
  normalizeRegistrationData,
} from './successState'
import type { TelebirrEventData, TelebirrFormData, TelebirrRegistrationData } from './types'
import { getEthioTelecomPhoneError, validateEthioTelecomPhone } from './phoneValidation'
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
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    organization: '',
    jobTitle: '',
    joiningAs: 'Visitor',
    guest_type_id: '',
    profilePicture: null,
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
    imageRaw: eventData?.image ?? eventData?.image_url ?? eventData?.event_image,
    eventId: eventData?.id || eventId,
  })

  const registerMutation = useMutation({
    mutationFn: async (data: TelebirrFormData) => {
      const payload = new FormData()
      payload.append('first_name', data.firstName)
      payload.append('last_name', data.lastName)
      payload.append('email', data.email)
      payload.append('phone', data.phoneNumber)
      payload.append('company', data.organization)
      payload.append('job_title', data.jobTitle)
      if (data.guest_type_id) {
        payload.append('guest_type_id', data.guest_type_id)
      }
      const regTypeParam = searchParams.get('reg_type')
      const registrationType =
        regTypeParam === 'onsite' || regTypeParam === 'prereg' || regTypeParam === 'evella'
          ? regTypeParam
          : searchParams.get('type') === 'onsite'
            ? 'onsite'
            : 'prereg'
      payload.append('registration_type', registrationType)
      payload.append('registration_source', 'telebirr')

      if (data.profilePicture) {
        payload.append('profile_picture', data.profilePicture)
      }

      return api.post(`/public/events/${eventData?.uuid}/register`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
  })

  type RegistrationApiError = {
    response?: {
      status?: number
      data?: {
        error?: string
        message?: string
        duplicate_type?: string
        attendee?: TelebirrRegistrationData
        event?: Partial<TelebirrEventData>
        errors?: Record<string, string[]>
      }
    }
  }

  const goToSuccessPage = (registrationData: TelebirrRegistrationData, apiEvent?: Partial<TelebirrEventData> | null) => {
    if (!eventData) {
      return
    }
    const successState = buildSuccessState(registrationData, eventData, apiEvent)
    saveRegistrationSuccess(successState)
    navigate(telebirrSuccessPath(eventId), { state: successState })
  }

  const resolveRegistrationDataAfterSuccess = async (
    response: unknown,
  ): Promise<TelebirrRegistrationData | null> => {
    const { attendee } = extractRegistrationApiPayload(response)
    const normalized = normalizeRegistrationData(attendee)
    if (normalized?.id) {
      return normalized
    }

    const identifier = formData.phoneNumber.trim() || formData.email.trim()
    if (identifier && eventData?.uuid) {
      try {
        const lookup = await lookupPublicBadge(eventData.uuid, identifier)
        return {
          id: lookup.data.attendeeId,
          guest_uuid: lookup.data.guestUuid,
          guest_name:
            lookup.data.guestName ||
            normalized?.guest_name ||
            `${formData.firstName} ${formData.lastName}`.trim(),
          guest_email: formData.email || normalized?.guest_email,
          guest_phone: formData.phoneNumber || normalized?.guest_phone,
          guest_company: formData.organization || normalized?.guest_company,
          guest_job_title: formData.jobTitle || normalized?.guest_job_title,
        }
      } catch {
        // fall through
      }
    }

    if (normalized?.guest_uuid) {
      return normalized
    }

    return null
  }

  const handleRegistrationSuccess = async (response: unknown) => {
    if (!eventData) {
      return
    }

    const { event: apiEvent } = extractRegistrationApiPayload(response)
    const registrationData = await resolveRegistrationDataAfterSuccess(response)

    if (!registrationData) {
      toast.error('Registration succeeded but confirmation data is incomplete. Please check your SMS for your e-badge.')
      return
    }

    goToSuccessPage(registrationData, apiEvent)
  }

  const handleRegistrationError = async (error: RegistrationApiError) => {
    const isAlreadyRegistered =
      error.response?.status === 409 &&
      error.response?.data?.duplicate_type === 'event_registration'

    if (isAlreadyRegistered && eventData) {
      const attendeeFromApi = error.response?.data?.attendee
      const identifier = formData.phoneNumber.trim() || formData.email.trim()

      if (attendeeFromApi?.id) {
        const registrationData = normalizeRegistrationData(attendeeFromApi)
        if (registrationData) {
          goToSuccessPage(registrationData, error.response?.data?.event)
          toast.info("You're already registered. Here's your e-badge.")
          return
        }
      }

      if (identifier && eventData.uuid) {
        try {
          const lookup = await lookupPublicBadge(eventData.uuid, identifier)
          goToSuccessPage(
            {
              id: lookup.data.attendeeId,
              guest_uuid: lookup.data.guestUuid,
              guest_name: lookup.data.guestName,
              guest_email: formData.email || undefined,
              guest_phone: formData.phoneNumber,
              guest_company: formData.organization,
              guest_job_title: formData.jobTitle,
            },
            error.response?.data?.event,
          )
          toast.info("You're already registered. Here's your e-badge.")
          return
        } catch {
          const params = new URLSearchParams()
          params.set('identifier', identifier)
          toast.info("You're already registered. Retrieve your e-badge here.")
          navigate(`/event/${eventData.uuid}/badge-retrieve?${params.toString()}`)
          return
        }
      }

      setErrors({
        submit: error.response?.data?.error || 'You are already registered for this event.',
      })
      return
    }

    const apiErrors = error.response?.data?.errors
    if (apiErrors) {
      const fieldErrors: Record<string, string> = {}
      if (apiErrors.first_name?.[0]) fieldErrors.firstName = apiErrors.first_name[0]
      if (apiErrors.last_name?.[0]) fieldErrors.lastName = apiErrors.last_name[0]
      if (apiErrors.name?.[0] && !fieldErrors.firstName) fieldErrors.firstName = apiErrors.name[0]
      if (apiErrors.email?.[0]) fieldErrors.email = apiErrors.email[0]
      if (apiErrors.phone?.[0]) fieldErrors.phoneNumber = apiErrors.phone[0]
      if (apiErrors.company?.[0]) fieldErrors.organization = apiErrors.company[0]
      if (apiErrors.job_title?.[0]) fieldErrors.jobTitle = apiErrors.job_title[0]

      setErrors({
        ...fieldErrors,
        submit:
          error.response?.data?.error ||
          error.response?.data?.message ||
          'Registration failed. Please check the highlighted fields.',
      })
      return
    }

    setErrors({
      submit:
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Registration failed. Please try again.',
    })
  }

  const handleInputChange = (field: keyof TelebirrFormData, value: string | File | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    if (field === 'phoneNumber' && typeof value === 'string') {
      const phoneError = getEthioTelecomPhoneError(value)
      setErrors((prev) => {
        const next = { ...prev }
        if (phoneError) {
          next.phoneNumber = phoneError
        } else {
          delete next.phoneNumber
        }
        return next
      })
      return
    }

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

    const firstNameResult = validatePersonName(formData.firstName)
    if (!firstNameResult.valid) newErrors.firstName = firstNameResult.message

    const lastNameResult = validatePersonName(formData.lastName)
    if (!lastNameResult.valid) newErrors.lastName = lastNameResult.message

    if (formData.email.trim()) {
      const emailResult = validatePublicEmail(formData.email)
      if (!emailResult.valid) newErrors.email = emailResult.message
    }

    const phoneResult = validateEthioTelecomPhone(formData.phoneNumber)
    if (!phoneResult.valid) {
      newErrors.phoneNumber = phoneResult.message!
    }

    if (!formData.organization?.trim()) {
      newErrors.organization = 'Organization is required'
    } else {
      const orgResult = validateOptionalText(formData.organization)
      if (!orgResult.valid) newErrors.organization = orgResult.message
    }

    if (!formData.jobTitle?.trim()) {
      newErrors.jobTitle = 'Job title is required'
    } else {
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
      const response = await registerMutation.mutateAsync(formData)
      await handleRegistrationSuccess(response)
    } catch (error) {
      await handleRegistrationError(error as RegistrationApiError)
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

  const eventBannerUrl = eventData
    ? getImageUrl(
        eventData.image ?? eventData.image_url ?? eventData.event_image,
        eventData.id,
      )
    : null

  return (
    <TelebirrRegLayout variant="register" isOnsite={isOnsite}>
      <section className="relative w-full h-80 sm:h-[22rem] md:h-[28rem] overflow-hidden">
        {eventBannerUrl ? (
          <img
            src={eventBannerUrl}
            alt={eventData?.title || eventData?.name || 'Event banner'}
            className="w-full h-full object-cover object-center"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: `linear-gradient(135deg, ${TELEBIRR_COLORS.deepGreen} 0%, ${TELEBIRR_COLORS.lightGreen} 100%)`,
            }}
          />
        )}
      </section>

      <main className="max-w-4xl mx-auto px-4 py-16 relative z-20 space-y-8">
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
                  <Label htmlFor="firstName" className="text-base font-bold text-gray-700 flex items-center gap-2">
                    <User className="w-4 h-4" style={{ color: TELEBIRR_COLORS.deepGreen }} />
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={`h-14 rounded-xl border-2 transition-all focus:ring-4 ${errors.firstName ? 'border-red-300 focus:border-red-500 focus:ring-red-50' : 'border-gray-200 focus:border-[#8DC63F] focus:ring-[#8DC63F]/10'}`}
                    placeholder="Enter your first name"
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-500 font-medium pl-1">{errors.firstName}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="lastName" className="text-base font-bold text-gray-700 flex items-center gap-2">
                    <User className="w-4 h-4" style={{ color: TELEBIRR_COLORS.deepGreen }} />
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={`h-14 rounded-xl border-2 transition-all focus:ring-4 ${errors.lastName ? 'border-red-300 focus:border-red-500 focus:ring-red-50' : 'border-gray-200 focus:border-[#8DC63F] focus:ring-[#8DC63F]/10'}`}
                    placeholder="Enter your last name"
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-500 font-medium pl-1">{errors.lastName}</p>
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
                    placeholder="09xx xxx xxx or +251 9xx xxx xxx"
                  />
                  {errors.phoneNumber && (
                    <p className="text-sm text-red-500 font-medium pl-1">{errors.phoneNumber}</p>
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
                    placeholder="example@telebirr.et (optional)"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 font-medium pl-1">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="organization" className="text-base font-bold text-gray-700 flex items-center gap-2">
                    <Building className="w-4 h-4" style={{ color: TELEBIRR_COLORS.deepGreen }} />
                    Organization <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="organization"
                    value={formData.organization}
                    onChange={(e) => handleInputChange('organization', e.target.value)}
                    className={`h-14 rounded-xl border-2 transition-all focus:ring-4 ${errors.organization ? 'border-red-300 focus:border-red-500 focus:ring-red-50' : 'border-gray-200 focus:border-[#8DC63F] focus:ring-[#8DC63F]/10'}`}
                    placeholder="Your company or university"
                  />
                  {errors.organization && (
                    <p className="text-sm text-red-500 font-medium pl-1">{errors.organization}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="jobTitle" className="text-base font-bold text-gray-700 flex items-center gap-2">
                    <Globe className="w-4 h-4" style={{ color: TELEBIRR_COLORS.deepGreen }} />
                    Job Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="jobTitle"
                    value={formData.jobTitle}
                    onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                    className={`h-14 rounded-xl border-2 transition-all focus:ring-4 ${errors.jobTitle ? 'border-red-300 focus:border-red-500 focus:ring-red-50' : 'border-gray-200 focus:border-[#8DC63F] focus:ring-[#8DC63F]/10'}`}
                    placeholder="Director, Manager, student"
                  />
                  {errors.jobTitle && (
                    <p className="text-sm text-red-500 font-medium pl-1">{errors.jobTitle}</p>
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
