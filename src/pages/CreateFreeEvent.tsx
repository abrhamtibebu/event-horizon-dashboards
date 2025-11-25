import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Breadcrumbs from '@/components/Breadcrumbs'
import {
  Calendar,
  MapPin,
  Users,
  Upload,
  X,
  Tag,
  FileText,
  Image,
  Gift,
  Plus,
  Trash2,
  UserCheck,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Info,
} from 'lucide-react'
import { CustomFieldsManager } from '@/components/event-creation/CustomFieldsManager'
import type { CustomField } from '@/types/customFields'
import { createCustomField } from '@/lib/customFieldsApi'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { showSuccessToast, showErrorToast } from '@/components/ui/ModernToast'
import api from '@/lib/api'
import { DateRange } from 'react-date-range'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import { useAuth } from '@/hooks/use-auth'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'

// Ethiopian major cities
const ETHIOPIAN_CITIES = [
  'Addis Ababa', 'Dire Dawa', 'Mekelle', 'Gondar', 'Adama',
  'Hawassa', 'Bahir Dar', 'Jimma', 'Dessie', 'Jijiga'
]

// Predefined guest types with descriptions and default prices
const PREDEFINED_GUEST_TYPES = [
  { name: 'VIP', description: 'Very Important Person with premium access', price: 0 },
  { name: 'Speaker', description: 'Event speakers and presenters', price: 0 },
  { name: 'Staff', description: 'Event staff and organizers', price: 0 },
  { name: 'Exhibitor', description: 'Trade show exhibitors and vendors', price: 0 },
  { name: 'Media', description: 'Press and media representatives', price: 0 },
  { name: 'Regular', description: 'Standard event attendees', price: 0 },
  { name: 'Visitor', description: 'General visitors and guests', price: 0 },
  { name: 'Sponsor', description: 'Event sponsors and partners', price: 0 },
  { name: 'Organizer', description: 'Event organizers and coordinators', price: 0 },
  { name: 'Volunteer', description: 'Event volunteers and helpers', price: 0 },
  { name: 'Partner', description: 'Business partners and collaborators', price: 0 },
  { name: 'Vendor', description: 'Service providers and vendors', price: 0 },
  { name: 'Press', description: 'Journalists and press members', price: 0 },
  { name: 'Student', description: 'Student attendees with special access', price: 0 },
  { name: 'Other', description: 'Other guest categories', price: 0 }
]

interface GuestType {
  name: string
  description: string
  price: number
}

export default function CreateFreeEvent() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const imageInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    city: '',
    venue: '',
    max_guests: '',
    event_type_id: '',
    event_category_id: '',
    organizer_id: '',
    requirements: '',
    agenda: '',
    event_image: null as File | null,
    event_type: 'free',
  })

  const [eventRange, setEventRange] = useState([{
    startDate: new Date(),
    endDate: new Date(),
    key: 'selection',
  }])

  const [regRange, setRegRange] = useState([{
    startDate: new Date(),
    endDate: new Date(),
    key: 'selection',
  }])

  const [selectedGuestTypes, setSelectedGuestTypes] = useState<string[]>([])
  const [customGuestTypes, setCustomGuestTypes] = useState<GuestType[]>([])
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [loading, setLoading] = useState({
    eventTypes: true,
    eventCategories: true,
    organizers: true,
  })
  const [eventTypes, setEventTypes] = useState([])
  const [eventCategories, setEventCategories] = useState([])
  const [organizers, setOrganizers] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeStep, setActiveStep] = useState(1)

  useEffect(() => {
    const fetchData = async (endpoint: string, setData: Function, loaderKey: string) => {
      try {
        setLoading(prev => ({ ...prev, [loaderKey]: true }))
        const response = await api.get(endpoint)
        const data = Array.isArray(response.data) ? response.data : (response.data?.data || [])
        setData(data)
      } catch (err: any) {
        console.error(`Error fetching ${endpoint}:`, err)
        setData([])
      } finally {
        setLoading(prev => ({ ...prev, [loaderKey]: false }))
      }
    }

    fetchData('/event-types', setEventTypes, 'eventTypes')
    fetchData('/event-categories', setEventCategories, 'eventCategories')
    
    if (user?.role !== 'organizer') {
      fetchData('/organizers', setOrganizers, 'organizers')
    }
  }, [user?.role])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showErrorToast('Image size must be less than 2MB')
        return
      }
      setFormData(prev => ({ ...prev, event_image: file }))
    }
  }

  const toggleGuestType = (guestTypeName: string) => {
    setSelectedGuestTypes(prev => 
      prev.includes(guestTypeName)
        ? prev.filter(name => name !== guestTypeName)
        : [...prev, guestTypeName]
    )
  }

  const addCustomGuestType = () => {
    const newGuestType: GuestType = {
      name: '',
      description: '',
      price: 0,
    }
    setCustomGuestTypes(prev => [...prev, newGuestType])
  }

  const updateCustomGuestType = (index: number, field: string, value: any) => {
    setCustomGuestTypes(prev => prev.map((type, i) => 
      i === index ? { ...type, [field]: value } : type
    ))
  }

  const removeCustomGuestType = (index: number) => {
    setCustomGuestTypes(prev => prev.filter((_, i) => i !== index))
  }

  // Calculate form completion progress
  const calculateProgress = () => {
    let completed = 0
    const total = 7
    
    if (formData.name) completed++
    if (formData.event_type_id) completed++
    if (formData.event_category_id) completed++
    if (formData.city && formData.venue) completed++
    if (formData.max_guests) completed++
    if (selectedGuestTypes.length > 0 || customGuestTypes.filter(gt => gt.name.trim()).length > 0) completed++
    if (eventRange[0].startDate && regRange[0].startDate) completed++
    
    return Math.round((completed / total) * 100)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validCustomGuestTypes = customGuestTypes.filter(gt => gt.name.trim())
    const allGuestTypes = [
      ...selectedGuestTypes.map(name => {
        const predefined = PREDEFINED_GUEST_TYPES.find(gt => gt.name === name)
        return {
          name: predefined?.name || name,
          description: predefined?.description || '',
          price: predefined?.price || 0
        }
      }),
      ...validCustomGuestTypes
    ]
    
    if (allGuestTypes.length === 0) {
      showErrorToast('Please select at least one guest type.')
      return
    }

    if (!formData.name || !formData.event_type_id || !formData.event_category_id || !formData.max_guests) {
      showErrorToast('Please fill in all required fields.')
      return
    }

    if (!formData.city || !formData.venue) {
      showErrorToast('Please fill in both city and venue.')
      return
    }

    if (!eventTypes.some(et => String(et.id) === formData.event_type_id)) {
      showErrorToast('Please select a valid event type.')
      return
    }

    if (!eventCategories.some(ec => String(ec.id) === formData.event_category_id)) {
      showErrorToast('Please select a valid event category.')
      return
    }

    const maxGuests = parseInt(formData.max_guests, 10)
    if (isNaN(maxGuests) || maxGuests <= 0) {
      showErrorToast('Please enter a valid number of maximum guests.')
      return
    }

    if (user?.role !== 'organizer' && !formData.organizer_id) {
      showErrorToast('Please select an organizer.')
      return
    }

    if (eventRange[0].startDate >= eventRange[0].endDate) {
      showErrorToast('Event end date must be after start date.')
      return
    }

    if (regRange[0].startDate >= regRange[0].endDate) {
      showErrorToast('Registration end date must be after start date.')
      return
    }

    if (regRange[0].endDate > eventRange[0].endDate) {
      showErrorToast('Registration must end before or on the event end date.')
      return
    }

    setIsSubmitting(true)
    
    try {
      const processedFormData = {
        ...formData,
        start_date: eventRange[0].startDate.toISOString(),
        end_date: eventRange[0].endDate.toISOString(),
        registration_start_date: regRange[0].startDate.toISOString(),
        registration_end_date: regRange[0].endDate.toISOString(),
        location: formData.city && formData.venue ? `${formData.city}, ${formData.venue}` : formData.venue || formData.city || '',
        max_guests: maxGuests,
        ...(user?.role !== 'organizer' && { organizer_id: formData.organizer_id }),
        guest_types: allGuestTypes,
      }

      let payload = processedFormData
      let headers = {}

      if (formData.event_image) {
        payload = new FormData()
        Object.entries(processedFormData).forEach(([key, value]) => {
          if (key === 'event_image' && value) {
            payload.append('event_image', value)
          } else if (key === 'event_image' && !value) {
          } else if (key === 'guest_types') {
            if (Array.isArray(value)) {
              payload.append('guest_types', JSON.stringify(value))
            }
          } else if (value !== null && value !== undefined && value !== '') {
            if (key === 'organizer_id' && user?.role === 'organizer') {
            } else if (key === 'event_image' && !value) {
            } else {
              payload.append(key, value as any)
            }
          }
        })
        headers = { 'Content-Type': 'multipart/form-data' }
      } else {
        payload = Object.fromEntries(
          Object.entries(processedFormData).filter(([key, value]) => {
            if (key === 'organizer_id' && user?.role === 'organizer') {
              return false
            }
            if (key === 'event_image' && !value) {
              return false
            }
            return value !== null && value !== undefined && value !== ''
          })
        )
      }

      const response = await api.post('/events/free/add', payload, { headers })
      const eventId = response.data?.id || response.data?.data?.id
      
      if (eventId && customFields.length > 0) {
        try {
          for (const field of customFields) {
            await createCustomField(eventId, {
              ...field,
              event_id: eventId,
            })
          }
        } catch (error: any) {
          console.error('Error saving custom fields:', error)
          showErrorToast('Event created but some custom fields could not be saved.')
        }
      }
      
      showSuccessToast('Free event created successfully!')
      navigate('/dashboard/events')
    } catch (error: any) {
      console.error('Error creating event:', error)
      showErrorToast(error.response?.data?.message || error.response?.data?.error || 'Failed to create free event.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const progress = calculateProgress()
  const totalSelectedGuestTypes = selectedGuestTypes.length + customGuestTypes.filter(gt => gt.name.trim()).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header Section */}
        <div className="mb-8">
          <Breadcrumbs 
            items={[
              { label: 'Events', href: '/dashboard/events' },
              { label: 'Create Free Event' }
            ]}
            className="mb-6"
          />
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Create Free Event
                  </h1>
                  <p className="text-muted-foreground text-sm sm:text-base mt-1">
                    Set up your event and start welcoming guests
                  </p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => navigate('/dashboard/events')}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>

          {/* Progress Indicator */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Form Completion</span>
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                Complete all required fields to create your event
              </p>
            </CardContent>
          </Card>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Card */}
          <Card className="border-border/50 shadow-lg shadow-black/5 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Basic Information</CardTitle>
                  <CardDescription>Tell us about your event</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold">
                    Event Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Annual Tech Conference 2024"
                    required
                    className="h-11 border-border focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="organizer_id" className="text-sm font-semibold">
                    Organizer <span className="text-destructive">*</span>
                  </Label>
                  {user?.role === 'organizer' ? (
                    <Input
                      value={user.organizer?.name || ''}
                      disabled
                      className="h-11 bg-muted/50"
                    />
                  ) : (
                    <Select
                      value={formData.organizer_id}
                      onValueChange={(value) => handleInputChange('organizer_id', value)}
                      disabled={loading.organizers}
                      required
                    >
                      <SelectTrigger className="h-11 border-border focus:border-blue-500 focus:ring-blue-500/20">
                        <SelectValue placeholder="Select organizer" />
                      </SelectTrigger>
                      <SelectContent>
                        {organizers.map((org: any) => (
                          <SelectItem key={org.id} value={String(org.id)}>
                            {org.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your event, what attendees can expect, and any important details..."
                  rows={4}
                  className="border-border focus:border-blue-500 focus:ring-blue-500/20 resize-none"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="event_type_id" className="text-sm font-semibold">
                    Event Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.event_type_id}
                    onValueChange={(value) => handleInputChange('event_type_id', value)}
                    disabled={loading.eventTypes}
                    required
                  >
                    <SelectTrigger className="h-11 border-border focus:border-blue-500 focus:ring-blue-500/20">
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((type: any) => (
                        <SelectItem key={type.id} value={String(type.id)}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="event_category_id" className="text-sm font-semibold">
                    Event Category <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.event_category_id}
                    onValueChange={(value) => handleInputChange('event_category_id', value)}
                    disabled={loading.eventCategories}
                    required
                  >
                    <SelectTrigger className="h-11 border-border focus:border-blue-500 focus:ring-blue-500/20">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventCategories.map((cat: any) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location & Capacity Card */}
          <Card className="border-border/50 shadow-lg shadow-black/5 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Location & Capacity</CardTitle>
                  <CardDescription>Where and how many guests</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-semibold">
                    City <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.city}
                    onValueChange={(value) => handleInputChange('city', value)}
                    required
                  >
                    <SelectTrigger className="h-11 border-border focus:border-purple-500 focus:ring-purple-500/20">
                      <SelectValue placeholder="Select a city" />
                    </SelectTrigger>
                    <SelectContent>
                      {ETHIOPIAN_CITIES.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="venue" className="text-sm font-semibold">
                    Venue <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="venue"
                    value={formData.venue}
                    onChange={(e) => handleInputChange('venue', e.target.value)}
                    placeholder="e.g., Millennium Hall"
                    required
                    className="h-11 border-border focus:border-purple-500 focus:ring-purple-500/20"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="max_guests" className="text-sm font-semibold">
                  Maximum Guests <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="max_guests"
                  type="number"
                  value={formData.max_guests}
                  onChange={(e) => handleInputChange('max_guests', e.target.value)}
                  placeholder="e.g., 500"
                  className="h-11 border-border focus:border-purple-500 focus:ring-purple-500/20"
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Set the maximum number of attendees for your event
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Event Image Card */}
          <Card className="border-border/50 shadow-lg shadow-black/5 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md">
                  <Image className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Event Image</CardTitle>
                  <CardDescription>Upload a banner image (optional)</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      ref={imageInputRef}
                      type="file"
                      id="event_image"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => imageInputRef.current?.click()}
                      className="flex items-center gap-2 border-2 border-dashed hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all"
                    >
                      <Upload className="w-4 h-4" />
                      {formData.event_image ? 'Change Image' : 'Choose Image'}
                    </Button>
                    {formData.event_image && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, event_image: null }))
                          if (imageInputRef.current) {
                            imageInputRef.current.value = ''
                          }
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Maximum file size: 2MB. Supported formats: JPG, PNG, GIF
                  </p>
                </div>
                
                <div className="w-full sm:w-48 h-48 rounded-xl border-2 border-dashed border-border overflow-hidden bg-muted/30 flex items-center justify-center">
                  {formData.event_image ? (
                    <img
                      src={URL.createObjectURL(formData.event_image)}
                      alt="Event preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">No image selected</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date & Time Card */}
          <Card className="border-border/50 shadow-lg shadow-black/5 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center shadow-md">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Date & Time</CardTitle>
                  <CardDescription>Event schedule and registration period</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    Event Date Range
                  </Label>
                  <div className="border border-border rounded-xl overflow-hidden">
                    <DateRange
                      ranges={eventRange}
                      onChange={(item) => setEventRange([item.selection])}
                      minDate={new Date()}
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    Registration Period
                  </Label>
                  <div className="border border-border rounded-xl overflow-hidden">
                    <DateRange
                      ranges={regRange}
                      onChange={(item) => setRegRange([item.selection])}
                      minDate={new Date()}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guest Types Card */}
          <Card className="border-border/50 shadow-lg shadow-black/5 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md">
                    <UserCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Guest Types</CardTitle>
                    <CardDescription>
                      {totalSelectedGuestTypes > 0 
                        ? `${totalSelectedGuestTypes} type${totalSelectedGuestTypes > 1 ? 's' : ''} selected`
                        : 'Choose guest types for your event'
                      }
                    </CardDescription>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={addCustomGuestType}
                  variant="outline"
                  size="sm"
                  className="border-emerald-500/50 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Custom Type
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-semibold mb-3 block">Common Guest Types</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {PREDEFINED_GUEST_TYPES.map((guestType) => {
                    const isSelected = selectedGuestTypes.includes(guestType.name)
                    return (
                      <Button
                        key={guestType.name}
                        type="button"
                        variant={isSelected ? 'default' : 'outline'}
                        size="sm"
                        className={`h-auto py-2.5 px-3 transition-all ${
                          isSelected 
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/30' 
                            : 'hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10'
                        }`}
                        onClick={() => toggleGuestType(guestType.name)}
                      >
                        {isSelected && <CheckCircle2 className="w-4 h-4 mr-1.5" />}
                        {guestType.name}
                      </Button>
                    )
                  })}
                </div>
              </div>

              {customGuestTypes.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-sm font-semibold mb-3 block">Custom Guest Types</Label>
                    <div className="space-y-3">
                      {customGuestTypes.map((guestType, index) => (
                        <Card key={index} className="border-border/50 bg-muted/30">
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-sm font-medium">Custom Type {index + 1}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeCustomGuestType(index)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Name</Label>
                                <Input
                                  value={guestType.name}
                                  onChange={(e) => updateCustomGuestType(index, 'name', e.target.value)}
                                  placeholder="e.g., VIP, Corporate"
                                  className="h-9 text-sm"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Price (ETB)</Label>
                                <Input
                                  type="number"
                                  value={guestType.price}
                                  onChange={(e) => updateCustomGuestType(index, 'price', parseFloat(e.target.value) || 0)}
                                  placeholder="0"
                                  className="h-9 text-sm"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Description</Label>
                                <Input
                                  value={guestType.description}
                                  onChange={(e) => updateCustomGuestType(index, 'description', e.target.value)}
                                  placeholder="Brief description..."
                                  className="h-9 text-sm"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {totalSelectedGuestTypes === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-border rounded-xl bg-muted/20">
                  <UserCheck className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-sm font-medium text-foreground mb-1">No guest types selected</p>
                  <p className="text-xs text-muted-foreground">Select from common types above or add custom ones</p>
                </div>
              )}

              {totalSelectedGuestTypes > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {selectedGuestTypes.map((name) => (
                    <Badge key={name} variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800">
                      {name}
                    </Badge>
                  ))}
                  {customGuestTypes.filter(gt => gt.name.trim()).map((gt, index) => (
                    <Badge key={`custom-${index}`} variant="secondary" className="bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border-teal-300 dark:border-teal-800">
                      {gt.name}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Custom Fields Card */}
          <Card className="border-border/50 shadow-lg shadow-black/5 bg-card/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <CustomFieldsManager
                fields={customFields}
                onChange={setCustomFields}
                guestTypes={[
                  ...selectedGuestTypes.map(name => ({
                    id: 0,
                    name: name
                  })),
                  ...customGuestTypes.filter(gt => gt.name.trim()).map(gt => ({
                    id: 0,
                    name: gt.name
                  }))
                ]}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard/events')}
              className="h-11 px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || totalSelectedGuestTypes === 0}
              className="h-11 px-8 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></span>
                  Creating Event...
                </span>
              ) : (
                <span className="flex items-center">
                  Create Free Event
                  <ArrowRight className="w-4 h-4 ml-2" />
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
