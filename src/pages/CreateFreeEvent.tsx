import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
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
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
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
    event_type: 'free', // Add event_type field
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
  const [loading, setLoading] = useState({
    eventTypes: true,
    eventCategories: true,
    organizers: true,
  })
  const [eventTypes, setEventTypes] = useState([])
  const [eventCategories, setEventCategories] = useState([])
  const [organizers, setOrganizers] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchData = async (endpoint: string, setData: Function, loaderKey: string) => {
      try {
        setLoading(prev => ({ ...prev, [loaderKey]: true }))
        const response = await api.get(endpoint)
        setData(response.data)
      } catch (err: any) {
        console.error(`Error fetching ${endpoint}:`, err)
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
        toast.error('Image size must be less than 2MB')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate guest types
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
      toast.error('Please select at least one guest type.')
      return
    }

    // Validate required fields
    if (!formData.name || !formData.event_type_id || !formData.event_category_id || !formData.max_guests) {
      toast.error('Please fill in all required fields.')
      return
    }

    // Validate location data
    if (!formData.city || !formData.venue) {
      toast.error('Please fill in both city and venue.')
      return
    }

    // Validate that event type and category are selected
    if (!eventTypes.some(et => String(et.id) === formData.event_type_id)) {
      toast.error('Please select a valid event type.')
      return
    }

    if (!eventCategories.some(ec => String(ec.id) === formData.event_category_id)) {
      toast.error('Please select a valid event category.')
      return
    }

    // Validate max_guests is a valid number
    const maxGuests = parseInt(formData.max_guests, 10)
    if (isNaN(maxGuests) || maxGuests <= 0) {
      toast.error('Please enter a valid number of maximum guests.')
      return
    }

    // Validate organizer_id for admin users
    if (user?.role !== 'organizer' && !formData.organizer_id) {
      toast.error('Please select an organizer.')
      return
    }

    // Validate dates
    if (eventRange[0].startDate >= eventRange[0].endDate) {
      toast.error('Event end date must be after start date.')
      return
    }

    if (regRange[0].startDate >= regRange[0].endDate) {
      toast.error('Registration end date must be after start date.')
      return
    }

    if (regRange[0].endDate > eventRange[0].endDate) {
      toast.error('Registration must end before or on the event end date.')
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
        // Convert guest types to array of objects
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
            // Skip event_image if no file is uploaded
          } else if (key === 'guest_types') {
            if (Array.isArray(value)) {
              // Send guest types as JSON string for FormData
              payload.append('guest_types', JSON.stringify(value))
            }
          } else if (value !== null && value !== undefined && value !== '') {
            if (key === 'organizer_id' && user?.role === 'organizer') {
              // Skip organizer_id for organizer users as it's determined from JWT
            } else if (key === 'event_image' && !value) {
              // Skip event_image if no file is uploaded
            } else {
              payload.append(key, value as any)
            }
          }
        })
        headers = { 'Content-Type': 'multipart/form-data' }
      } else {
        // Remove empty values from payload
        payload = Object.fromEntries(
          Object.entries(processedFormData).filter(([key, value]) => {
            if (key === 'organizer_id' && user?.role === 'organizer') {
              return false // Skip organizer_id for organizer users
            }
            if (key === 'event_image' && !value) {
              return false // Skip event_image if no file is uploaded
            }
            return value !== null && value !== undefined && value !== ''
          })
        )
      }

      console.log('Sending payload:', payload)
      console.log('Headers:', headers)
      console.log('Guest types being sent:', allGuestTypes)
      if (formData.event_image) {
        console.log('FormData entries:')
        for (let [key, value] of payload.entries()) {
          console.log(`${key}:`, value)
        }
      }
      await api.post('/events/free/add', payload, { headers })
      toast.success('Free event created successfully!')
      navigate('/dashboard/events')
    } catch (error: any) {
      console.error('Error creating event:', error)
      console.error('Error response:', error.response?.data)
      toast.error(error.response?.data?.message || error.response?.data?.error || 'Failed to create free event.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create Free Event</h1>
              <p className="text-gray-600 mt-2">
                Set up a free or corporate event with guest type management
              </p>
            </div>
            <Button
              onClick={() => navigate('/dashboard/events')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Event Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Free Event</h3>
                <p className="text-gray-500 text-sm">No cost to attendees</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name" className="flex items-center gap-2 text-gray-700 font-medium">
                  <Tag className="w-4 h-4 text-blue-500" /> Event Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter event name"
                  required
                  className="mt-2 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                />
              </div>
              
              <div>
                <Label htmlFor="organizer_id" className="flex items-center gap-2 text-gray-700 font-medium">
                  <Tag className="w-4 h-4 text-green-500" /> Organizer
                </Label>
                {user?.role === 'organizer' ? (
                  <Input
                    value={user.organizer?.name || ''}
                    disabled
                    className="mt-2 h-12 border-gray-300 bg-gray-50 rounded-xl"
                  />
                ) : (
                  <Select
                    value={formData.organizer_id}
                    onValueChange={(value) => handleInputChange('organizer_id', value)}
                    disabled={loading.organizers}
                    required
                  >
                    <SelectTrigger className="mt-2 h-12 border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-xl">
                      <SelectValue placeholder="Select an organizer" />
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
              
              <div className="lg:col-span-2">
                <Label htmlFor="description" className="flex items-center gap-2 text-gray-700 font-medium">
                  <FileText className="w-4 h-4 text-green-500" /> Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your free event..."
                  rows={4}
                  className="mt-2 border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-xl resize-none"
                />
              </div>
              
              <div>
                <Label htmlFor="event_type_id" className="flex items-center gap-2 text-gray-700 font-medium">
                  <Tag className="w-4 h-4 text-orange-500" /> Event Type
                </Label>
                <Select
                  value={formData.event_type_id}
                  onValueChange={(value) => handleInputChange('event_type_id', value)}
                  disabled={loading.eventTypes}
                  required
                >
                  <SelectTrigger className="mt-2 h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500 rounded-xl">
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
              
              <div>
                <Label htmlFor="event_category_id" className="flex items-center gap-2 text-gray-700 font-medium">
                  <Tag className="w-4 h-4 text-indigo-500" /> Event Category
                </Label>
                <Select
                  value={formData.event_category_id}
                  onValueChange={(value) => handleInputChange('event_category_id', value)}
                  disabled={loading.eventCategories}
                  required
                >
                  <SelectTrigger className="mt-2 h-12 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl">
                    <SelectValue placeholder="Select event category" />
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
              
              <div>
                <Label htmlFor="city" className="flex items-center gap-2 text-gray-700 font-medium">
                  <MapPin className="w-4 h-4 text-blue-500" /> City
                </Label>
                <Select
                  value={formData.city}
                  onValueChange={(value) => handleInputChange('city', value)}
                  required
                >
                  <SelectTrigger className="mt-2 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
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
              
              <div>
                <Label htmlFor="venue" className="flex items-center gap-2 text-gray-700 font-medium">
                  <MapPin className="w-4 h-4 text-green-500" /> Venue
                </Label>
                <Input
                  id="venue"
                  value={formData.venue}
                  onChange={(e) => handleInputChange('venue', e.target.value)}
                  placeholder="Enter venue name"
                  required
                  className="mt-2 h-12 border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-xl"
                />
              </div>
              
              <div>
                <Label htmlFor="max_guests" className="flex items-center gap-2 text-gray-700 font-medium">
                  <Users className="w-4 h-4 text-teal-500" /> Max Guests
                </Label>
                <Input
                  id="max_guests"
                  type="number"
                  value={formData.max_guests}
                  onChange={(e) => handleInputChange('max_guests', e.target.value)}
                  placeholder="e.g. 500"
                  className="mt-2 h-12 border-gray-300 focus:border-teal-500 focus:ring-teal-500 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Event Image Upload */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Image className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Event Image</h3>
                <p className="text-gray-500 text-sm">Upload an image for your event (optional)</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="event_image" className="flex items-center gap-2 text-gray-700 font-medium">
                    <Upload className="w-4 h-4 text-purple-500" /> Event Image
                  </Label>
                  <div className="mt-2">
                    <input
                      ref={imageInputRef}
                      type="file"
                      id="event_image"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => imageInputRef.current?.click()}
                        className="flex items-center gap-2 border-2 border-dashed border-gray-300 hover:border-purple-500 hover:bg-purple-50 transition-all duration-200"
                      >
                        <Upload className="w-4 h-4" />
                        Choose Image
                      </Button>
                      {formData.event_image && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, event_image: null }))
                            if (imageInputRef.current) {
                              imageInputRef.current.value = ''
                            }
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                          Remove
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Maximum file size: 2MB. Supported formats: JPG, PNG, GIF
                    </p>
                  </div>
                </div>
                
                {/* Image Preview */}
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center">
                  {formData.event_image ? (
                    <img
                      src={URL.createObjectURL(formData.event_image)}
                      alt="Event preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-gray-400">
                      <Image className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-xs">No image</p>
                    </div>
                  )}
                </div>
              </div>
              
              {!formData.event_image && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Image className="w-3 h-3 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">Default Image</p>
                      <p className="text-sm text-blue-700 mt-1">
                        If no image is uploaded, the default banner image will be used for your event.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Date & Time */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Date & Time</h3>
                <p className="text-gray-500 text-sm">Event schedule and registration period</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <Label className="flex items-center gap-2 text-gray-700 font-medium mb-4">
                  <Calendar className="w-4 h-4 text-orange-500" /> Event Date Range
                </Label>
                <DateRange
                  ranges={eventRange}
                  onChange={(item) => setEventRange([item.selection])}
                  minDate={new Date()}
                  className="rounded-xl border border-gray-300"
                />
              </div>
              
              <div>
                <Label className="flex items-center gap-2 text-gray-700 font-medium mb-4">
                  <Calendar className="w-4 h-4 text-green-500" /> Registration Period
                </Label>
                <DateRange
                  ranges={regRange}
                  onChange={(item) => setRegRange([item.selection])}
                  minDate={new Date()}
                  className="rounded-xl border border-gray-300"
                />
              </div>
            </div>
          </div>

          {/* Guest Types */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">Guest Types</h3>
                <p className="text-gray-500 text-sm">Choose the types of guests that can attend your event</p>
              </div>
              <Button
                type="button"
                onClick={addCustomGuestType}
                variant="outline"
                size="sm"
                className="border-green-300 text-green-700 hover:bg-green-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                Custom Type
              </Button>
            </div>
            
            {/* Guest Type Selection */}
            <div className="space-y-6">
              {/* Predefined Guest Types */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Common Guest Types</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {PREDEFINED_GUEST_TYPES.map((guestType) => {
                    const isSelected = selectedGuestTypes.includes(guestType.name)
                    return (
                      <Button
                        key={guestType.name}
                        type="button"
                        variant={isSelected ? 'default' : 'outline'}
                        size="sm"
                        className={`${
                          isSelected 
                            ? 'bg-green-600 text-white border-green-600 shadow-sm' 
                            : 'border-gray-200 hover:border-green-300 hover:bg-green-50 text-gray-700'
                        } rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 h-auto`}
                        onClick={() => toggleGuestType(guestType.name)}
                      >
                        {guestType.name}
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* Custom Guest Types */}
              {customGuestTypes.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Custom Guest Types</h4>
                  <div className="space-y-3">
                    {customGuestTypes.map((guestType, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-sm font-medium text-gray-900">Custom Type {index + 1}</h5>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCustomGuestType(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Name</Label>
                            <Input
                              value={guestType.name}
                              onChange={(e) => updateCustomGuestType(index, 'name', e.target.value)}
                              placeholder="e.g. VIP, Corporate"
                              className="mt-1 h-9 text-sm"
                            />
                          </div>
                          
                          <div>
                            <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Price (ETB)</Label>
                            <Input
                              type="number"
                              value={guestType.price}
                              onChange={(e) => updateCustomGuestType(index, 'price', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              className="mt-1 h-9 text-sm"
                            />
                          </div>
                          
                          <div>
                            <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Description</Label>
                            <Input
                              value={guestType.description}
                              onChange={(e) => updateCustomGuestType(index, 'description', e.target.value)}
                              placeholder="Brief description..."
                              className="mt-1 h-9 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Selection Summary */}
              {(selectedGuestTypes.length > 0 || customGuestTypes.filter(gt => gt.name.trim()).length > 0) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-blue-900">
                      Selected Guest Types ({selectedGuestTypes.length + customGuestTypes.filter(gt => gt.name.trim()).length})
                    </h4>
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                      {selectedGuestTypes.length + customGuestTypes.filter(gt => gt.name.trim()).length} selected
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedGuestTypes.map((name) => (
                      <span key={name} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-medium">
                        {name}
                      </span>
                    ))}
                    {customGuestTypes.filter(gt => gt.name.trim()).map((gt, index) => (
                      <span key={`custom-${index}`} className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs font-medium">
                        {gt.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {selectedGuestTypes.length === 0 && customGuestTypes.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <UserCheck className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">No guest types selected</p>
                  <p className="text-xs text-gray-500 mt-1">Select from common types above or add custom ones</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard/events')}
              className="px-6 py-2 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || (selectedGuestTypes.length === 0 && customGuestTypes.length === 0)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Creating...
                </span>
              ) : (
                'Create Free Event'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 