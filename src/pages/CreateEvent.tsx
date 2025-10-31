import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  MapPin,
  Users,
  Upload,
  Save,
  X,
  Tag,
  FileText,
  Image,
  Ticket,
  Star,
  Crown,
  Gift,
  Users2,
  Plus,
  Trash2,
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
import '@/index.css'
import { useAuth } from '@/hooks/use-auth'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Calendar as ShadCalendar } from '@/components/ui/calendar'

// Ethiopian major cities
const ETHIOPIAN_CITIES = [
  'Addis Ababa',
  'Dire Dawa',
  'Mekelle',
  'Gondar',
  'Adama',
  'Hawassa',
  'Bahir Dar',
  'Jimma',
  'Dessie',
  'Jijiga',
  'Shashamane',
  'Bishoftu',
  'Arba Minch',
  'Hosaena',
  'Harar',
  'Dilla',
  'Nekemte',
  'Debre Birhan',
  'Asella',
  'Adigrat',
  'Moyale',
  'Goba',
  'Sodo',
  'Arsi Negele',
  'Yirgalem',
  'Mizan Teferi',
  'Gambela',
  'Assosa',
  'Jinka',
  'Dembi Dolo'
]

// Utility to filter valid select options
function filterValidOptions<T extends { id?: any }>(arr: T[]) {
  return arr.filter(
    (item) => item.id !== undefined && item.id !== null && item.id !== ''
  )
}

export default function CreateEvent() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: null as Date | null,
    end_date: null as Date | null,
    city: '',
    venue: '',
    max_guests: '',
    registration_start_date: null as Date | null,
    registration_end_date: null as Date | null,
    event_type_id: '', // Remove default '1'
    event_category_id: '', // Remove default '1'
    organizer_id: '', // Remove default '1'
    status: 'draft',
    event_image: null as File | null,
    requirements: '',
    agenda: '',
    guest_types: '',
    event_type: 'free' as 'free' | 'ticketed', // Add event type selection
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showEventRange, setShowEventRange] = useState(false)
  const [showRegRange, setShowRegRange] = useState(false)
  const [eventTypes, setEventTypes] = useState<any[]>([])
  const [eventCategories, setEventCategories] = useState<any[]>([])
  const [eventRange, setEventRange] = useState([
    {
      startDate: formData.start_date || new Date(),
      endDate: formData.end_date || new Date(),
      key: 'selection',
    },
  ])
  const [regRange, setRegRange] = useState([
    {
      startDate: formData.registration_start_date || new Date(),
      endDate: formData.registration_end_date || new Date(),
      key: 'selection',
    },
  ])

  const [organizers, setOrganizers] = useState<any[]>([])
  const [loading, setLoading] = useState({
    organizers: true,
    eventTypes: true,
    eventCategories: true,
  })
  const [error, setError] = useState({
    organizers: null,
    eventTypes: null,
    eventCategories: null,
  })

  // Add predefined guest types
  const PREDEFINED_GUEST_TYPES = [
    'VIP', 'Speaker', 'Staff', 'Exhibitor', 'Media', 'Regular', 'Visitor', 'Sponsor', 'Organizer', 'Volunteer', 'Partner', 'Vendor', 'Press', 'Student', 'Other'
  ];

  // Ticket type options for ticketed events
  const ticketTypeOptions = [
    { name: 'Regular', icon: Ticket, description: 'Standard event access', defaultPrice: 1500 },
    { name: 'VIP', icon: Star, description: 'Premium experience with exclusive benefits', defaultPrice: 4500 },
    { name: 'VVIP', icon: Crown, description: 'Ultimate experience with all perks included', defaultPrice: 9000 },
    { name: 'Early Bird', icon: Gift, description: 'Limited time discounted pricing', defaultPrice: 900 },
    { name: 'Group Package', icon: Users2, description: 'Special pricing for groups of 3-5 people', defaultPrice: 3600 }
  ]

  // State for ticket types and guest types
  const [ticketTypes, setTicketTypes] = useState<any[]>([])
  const [guestTypes, setGuestTypes] = useState<any[]>([])
  const [selectedGuestTypes, setSelectedGuestTypes] = useState<string[]>([]);

  useEffect(() => {
    if (user && user.role === 'organizer' && user.organizer_id) {
      handleInputChange('organizer_id', String(user.organizer_id))
    }

    const fetchData = async (
      endpoint: string,
      setData: Function,
      loaderKey: keyof typeof loading,
      errorKey: keyof typeof error
    ) => {
      try {
        setLoading((prev) => ({ ...prev, [loaderKey]: true }))
        setError((prev) => ({ ...prev, [errorKey]: null }))
        const res = await api.get(endpoint)
        setData(res.data)
      } catch (err: any) {
        setError((prev) => ({
          ...prev,
          [errorKey]: `Failed to fetch ${errorKey}`,
        }))
      } finally {
        setLoading((prev) => ({ ...prev, [loaderKey]: false }))
      }
    }

    if (user?.role !== 'organizer') {
      fetchData('/organizers', setOrganizers, 'organizers', 'organizers')
    } else {
      setLoading((prev) => ({ ...prev, organizers: false }))
    }

    fetchData('/event-types', setEventTypes, 'eventTypes', 'eventTypes')
    fetchData(
      '/event-categories',
      setEventCategories,
      'eventCategories',
      'eventCategories'
    )
  }, [user])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData((prev) => ({ ...prev, event_image: file }))
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, event_image: null }))
    setImagePreview(null)
    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }
  }

  // Ticket type management functions
  const addTicketType = (option: typeof ticketTypeOptions[0]) => {
    const newTicketType = {
      name: option.name,
      description: option.description,
      price: option.defaultPrice,
      quantity: null,
      sales_end_date: '',
      benefits: []
    }
    setTicketTypes([...ticketTypes, newTicketType])
  }

  const updateTicketType = (index: number, field: string, value: any) => {
    const updated = [...ticketTypes]
    updated[index] = { ...updated[index], [field]: value }
    setTicketTypes(updated)
  }

  const removeTicketType = (index: number) => {
    setTicketTypes(ticketTypes.filter((_, i) => i !== index))
  }

  // Guest type management functions
  const addGuestType = () => {
    const newGuestType = {
      name: '',
      description: '',
      price: 0
    }
    setGuestTypes([...guestTypes, newGuestType])
  }

  const updateGuestType = (index: number, field: string, value: any) => {
    const updated = [...guestTypes]
    updated[index] = { ...updated[index], [field]: value }
    setGuestTypes(updated)
  }

  const removeGuestType = (index: number) => {
    setGuestTypes(guestTypes.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Frontend validation for required fields
    const requiredFields = [
      'name', 'start_date', 'end_date', 'city', 'venue', 'max_guests',
      'registration_start_date', 'registration_end_date', 'event_type_id', 'event_category_id'
    ];
    for (const field of requiredFields) {
      if (!formData[field] || (typeof formData[field] === 'string' && formData[field].trim() === '')) {
        toast.error(`Please fill in the required field: ${field.replace(/_/g, ' ')}`);
        return;
      }
    }
    // Validate max_guests is a positive integer
    if (isNaN(Number(formData.max_guests)) || parseInt(formData.max_guests, 10) < 1) {
      toast.error('Max Guests must be a positive integer.');
      return;
    }
    // Validate based on event type
    if (formData.event_type === 'free') {
      if (selectedGuestTypes.length === 0) {
        toast.error('Please select at least one guest type for free events.');
        return;
      }
    } else if (formData.event_type === 'ticketed') {
      if (ticketTypes.length === 0) {
        toast.error('Please add at least one ticket type for ticketed events.');
        return;
      }
      // Validate ticket types have names and prices
      for (let i = 0; i < ticketTypes.length; i++) {
        if (!ticketTypes[i].name.trim()) {
          toast.error(`Ticket Type ${i + 1} must have a name.`);
          return;
        }
        if (ticketTypes[i].price < 0) {
          toast.error(`Ticket Type ${i + 1} must have a valid price.`);
          return;
        }
      }
    }
    setIsSubmitting(true)
    try {
      let payload
      let headers = {}
      // Convert date objects to ISO strings for API
      const processedFormData = {
        ...formData,
        start_date: eventRange[0].startDate.toISOString(),
        end_date: eventRange[0].endDate.toISOString(),
        registration_start_date: regRange[0].startDate.toISOString(),
        registration_end_date: regRange[0].endDate.toISOString(),
        // Combine city and venue into location for backend
        location: `${formData.city}, ${formData.venue}`,
        // Ensure max_guests is sent as an integer
        max_guests: parseInt(formData.max_guests, 10),
        // Only include organizer_id if not an organizer (backend sets it for organizers)
        ...(user?.role !== 'organizer' && { organizer_id: formData.organizer_id }),
        ticket_types: formData.event_type === 'ticketed' ? ticketTypes : [],
        guest_types: formData.event_type === 'free'
          ? selectedGuestTypes
          : ticketTypes.map((t) => t.name), // <-- send ticket type names as guest_types for ticketed events
      }
      if (formData.event_image) {
        payload = new FormData()
        Object.entries(processedFormData).forEach(([key, value]) => {
          if (key === 'event_image' && value) {
            payload.append('event_image', value)
          } else if (key === 'guest_types') {
            (Array.isArray(value) ? value : [value]).forEach((type: string) =>
              payload.append('guest_types[]', type)
            )
          } else if (key === 'ticket_types') {
            if (Array.isArray(value)) {
              value.forEach((ticketType: any) => {
                // Send each field separately for FormData
                Object.keys(ticketType).forEach(field => {
                  payload.append(`ticket_types[${ticketTypes.indexOf(ticketType)}][${field}]`, ticketType[field] || '')
                })
              })
            }
          } else if (key === 'guest_types_custom') {
            if (Array.isArray(value)) {
              value.forEach((guestType: any) =>
                payload.append('guest_types_custom[]', JSON.stringify(guestType))
              )
            }
          } else {
            payload.append(key, value as any)
          }
        })
        headers = { 'Content-Type': 'multipart/form-data' }
      } else {
        payload = processedFormData
      }
      console.log('Sending payload:', payload)
      await api.post('/events', payload, { headers })
      toast.success('Event created successfully!')
      navigate('/dashboard/events')
    } catch (error: any) {
      if (error.response?.status === 422 && error.response?.data) {
        // Show the first validation error
        const firstKey = Object.keys(error.response.data)[0]
        const firstError = Array.isArray(error.response.data[firstKey]) ? error.response.data[firstKey][0] : error.response.data[firstKey]
        toast.error(firstError || 'Validation error')
      } else {
        toast.error(error.response?.data?.message || 'Failed to create event.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Custom purple theme for react-date-range
  const customRangeStyles = `
    .rdrCalendarWrapper, .rdrDateDisplayWrapper, .rdrMonthAndYearWrapper, .rdrMonthPicker, .rdrYearPicker {
      background: white;
    }
    .rdrDayNumber span {
      color: #6d28d9;
      font-weight: 500;
    }
    .rdrDay.rdrDaySelected, .rdrDay.rdrDayInRange, .rdrDay.rdrDayStartPreview, .rdrDay.rdrDayEndPreview {
      background: #a21caf !important;
      color: white !important;
      border-radius: 9999px !important;
    }
    .rdrDay.rdrDayStartOfMonth, .rdrDay.rdrDayEndOfMonth {
      border-radius: 9999px !important;
    }
    .rdrDay.rdrDayToday .rdrDayNumber span {
      border: 1.5px solid #a21caf;
      border-radius: 9999px;
    }
    .rdrMonthAndYearPickers select {
      color: #a21caf;
      font-weight: 600;
    }
    .rdrDefinedRangesWrapper { display: none; }
    .rdrDateRangePickerWrapper { box-shadow: 0 8px 32px rgba(80,0,80,0.12); border-radius: 1.5rem; }
  `

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm">
      <style>{customRangeStyles}</style>
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl shadow-2xl w-full max-w-6xl mx-auto p-0 animate-fade-in relative h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 bg-white rounded-t-xl p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Tag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Create New Event
                </h2>
                <p className="text-gray-600 mt-1">
                  Set up a new event in the system
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="text-gray-400 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6"
        >
          <div className="max-w-5xl mx-auto space-y-8">
          {/* Event Type Selection */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Event Type
                </h3>
                <p className="text-gray-500 text-sm">
                  Choose between free or ticketed event
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Free Event Option */}
              <div 
                className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                  formData.event_type === 'free' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-purple-300'
                }`}
                onClick={() => handleInputChange('event_type', 'free')}
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                    <Gift className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">Free Event</h4>
                    <p className="text-gray-600">No cost to attendees</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Guest type management
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Simple registration
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Basic attendee tracking
                  </li>
                </ul>
              </div>

              {/* Ticketed Event Option */}
              <div 
                className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                  formData.event_type === 'ticketed' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-purple-300'
                }`}
                onClick={() => handleInputChange('event_type', 'ticketed')}
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                    <Ticket className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">Ticketed Event</h4>
                    <p className="text-gray-600">Paid tickets with multiple tiers</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                    Multiple ticket types
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                    Revenue tracking
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                    Advanced analytics
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Event Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Tag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Event Information
                </h3>
                <p className="text-gray-500 text-sm">
                  Basic event details and logistics
                </p>
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
                    onValueChange={(value) =>
                      handleInputChange('organizer_id', value)
                    }
                    disabled={loading.organizers}
                    required
                  >
                    <SelectTrigger className="mt-2 h-12 border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-xl" id="organizer_id">
                      <SelectValue placeholder="Select an organizer" />
                    </SelectTrigger>
                    <SelectContent>
                      {loading.organizers && (
                        <SelectItem value="__loading" disabled>
                          Loading...
                        </SelectItem>
                      )}
                      {error.organizers && (
                        <SelectItem value="__error" disabled>
                          Error loading organizers
                        </SelectItem>
                      )}
                      {!loading.organizers &&
                        !error.organizers &&
                        filterValidOptions(organizers).map((org) => (
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
                  <FileText className="w-4 h-4 text-purple-500" /> Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange('description', e.target.value)
                  }
                  placeholder="Describe your event..."
                  rows={4}
                  className="mt-2 border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-xl resize-none"
                />
              </div>
              <div>
                <Label htmlFor="event_type_id" className="flex items-center gap-2 text-gray-700 font-medium">
                  <Tag className="w-4 h-4 text-orange-500" /> Event Type
                </Label>
                <Select
                  value={formData.event_type_id}
                  onValueChange={(value) =>
                    handleInputChange('event_type_id', value)
                  }
                  disabled={loading.eventTypes}
                  required
                >
                  <SelectTrigger className="mt-2 h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500 rounded-xl" id="event_type_id">
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterValidOptions(eventTypes).map((type: any) => (
                      <SelectItem key={type.id} value={String(type.id)}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {error.eventTypes && (
                  <div className="text-xs text-red-500 mt-1">
                    {error.eventTypes}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="event_category_id" className="flex items-center gap-2 text-gray-700 font-medium">
                  <Tag className="w-4 h-4 text-indigo-500" /> Event Category
                </Label>
                <Select
                  value={formData.event_category_id}
                  onValueChange={(value) =>
                    handleInputChange('event_category_id', value)
                  }
                  disabled={loading.eventCategories}
                  required
                >
                  <SelectTrigger className="mt-2 h-12 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl" id="event_category_id">
                    <SelectValue placeholder="Select event category" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterValidOptions(eventCategories).map((cat: any) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {error.eventCategories && (
                  <div className="text-xs text-red-500 mt-1">
                    {error.eventCategories}
                  </div>
                )}
              </div>
              <div>
                <Label className="flex items-center gap-2 text-gray-700 font-medium">
                  <MapPin className="w-4 h-4 text-green-500" /> City
                </Label>
                <Select
                  value={formData.city}
                  onValueChange={(value) => handleInputChange('city', value)}
                >
                  <SelectTrigger className="mt-2 h-12 border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-xl">
                    <SelectValue placeholder="Select a city" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
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
                  onChange={(e) =>
                    handleInputChange('venue', e.target.value)
                  }
                  placeholder="e.g. Grand Convention Center"
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
                  onChange={(e) =>
                    handleInputChange('max_guests', e.target.value)
                  }
                  placeholder="e.g. 500"
                  className="mt-2 h-12 border-gray-300 focus:border-teal-500 focus:ring-teal-500 rounded-xl"
                />
              </div>
              <div className="lg:col-span-2">
                <Label htmlFor="guest_types" className="flex items-center gap-2 text-gray-700 font-medium">
                  <Users className="w-4 h-4 text-pink-500" /> {formData.event_type === 'ticketed' ? 'Ticket Types' : 'Guest Types'}
                </Label>
                {formData.event_type === 'free' ? (
                  <div className="flex flex-wrap gap-2 mb-3 mt-2">
                    {PREDEFINED_GUEST_TYPES.map(type => (
                      <Button
                        key={type}
                        type="button"
                        variant={selectedGuestTypes.includes(type) ? 'default' : 'outline'}
                        className={`${selectedGuestTypes.includes(type) ? 'bg-pink-600 text-white border-pink-600' : 'border-gray-300 hover:border-pink-300'} rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200`}
                        onClick={() => {
                          setSelectedGuestTypes(prev => prev.includes(type)
                            ? prev.filter(t => t !== type)
                            : [...prev, type]);
                        }}
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 mt-2">
                    Ticket types will be configured in the ticketing section below.
                  </div>
                )}
                {formData.event_type === 'free' && selectedGuestTypes.length === 0 && (
                  <div className="text-xs text-red-500 mb-2">Select at least one guest type.</div>
                )}
              </div>
            </div>
          </div>
              {/* <div className="md:col-span-2">
                <Label
                  htmlFor="event_image"
                  className="flex items-center gap-2 text-gray-700"
                >
                  {' '}
                  <Image className="w-4 h-4" /> Event Image{' '}
                </Label>
                <div className="flex items-center gap-3 mt-1">
                  <input
                    type="file"
                    id="event_image"
                    ref={imageInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label htmlFor="event_image" className="inline-block">
                    <span className="inline-block px-4 py-2 bg-blue-50 text-blue-700 font-medium rounded cursor-pointer border border-blue-200 hover:bg-blue-100 transition">
                      Choose File
                    </span>
                  </label>
                  <span className="text-gray-600 text-sm">
                    {formData.event_image
                      ? formData.event_image.name
                      : 'No file chosen'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Upload your event banner (PNG, JPG, SVG)
                </p>
                {imagePreview && (
                  <div className="mt-2 relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Event image preview"
                    className="h-24 rounded shadow border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 rounded-full h-6 w-6"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* Event & Registration Dates Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Event & Registration Dates
                </h3>
                <p className="text-gray-500 text-sm">
                  Set event and registration periods
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Event Date Range Picker */}
              <div>
                <Label className="flex items-center gap-2 text-gray-700">
                  <Calendar className="w-4 h-4" /> Event Date Range
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full mt-1 mb-2 bg-white/80 text-purple-700 border-purple-200 hover:bg-purple-50 rounded-xl shadow"
                    >
                      {formData.start_date && formData.end_date
                        ? `${eventRange[0].startDate.toLocaleDateString()} - ${eventRange[0].endDate.toLocaleDateString()}`
                        : 'Select event date range'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-4 bg-white/90 rounded-2xl shadow-xl border border-purple-200 w-auto">
                    <div className="flex flex-col gap-4">
                      <div className="flex gap-4">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Start Date</div>
                          <ShadCalendar
                            mode="single"
                            selected={eventRange[0].startDate}
                            onSelect={(date) => {
                              setEventRange([{ ...eventRange[0], startDate: date || new Date(), endDate: eventRange[0].endDate }])
                              setFormData((prev) => ({ ...prev, start_date: date }))
                            }}
                            className="rounded-xl border"
                          />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">End Date</div>
                          <ShadCalendar
                            mode="single"
                            selected={eventRange[0].endDate}
                            onSelect={(date) => {
                              setEventRange([{ ...eventRange[0], endDate: date || new Date(), startDate: eventRange[0].startDate }])
                              setFormData((prev) => ({ ...prev, end_date: date }))
                            }}
                            className="rounded-xl border"
                          />
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              {/* Registration Date Range Picker */}
              <div>
                <Label className="flex items-center gap-2 text-gray-700">
                  <Calendar className="w-4 h-4" /> Registration Date Range
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full mt-1 mb-2 bg-white/80 text-purple-700 border-purple-200 hover:bg-purple-50 rounded-xl shadow"
                    >
                      {formData.registration_start_date && formData.registration_end_date
                        ? `${regRange[0].startDate.toLocaleDateString()} - ${regRange[0].endDate.toLocaleDateString()}`
                        : 'Select registration date range'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-4 bg-white/90 rounded-2xl shadow-xl border border-purple-200 w-auto">
                    <div className="flex flex-col gap-4">
                      <div className="flex gap-4">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Start Date</div>
                          <ShadCalendar
                            mode="single"
                            selected={regRange[0].startDate}
                            onSelect={(date) => {
                              setRegRange([{ ...regRange[0], startDate: date || new Date(), endDate: regRange[0].endDate }])
                              setFormData((prev) => ({ ...prev, registration_start_date: date }))
                            }}
                            className="rounded-xl border"
                          />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">End Date</div>
                          <ShadCalendar
                            mode="single"
                            selected={regRange[0].endDate}
                            onSelect={(date) => {
                              setRegRange([{ ...regRange[0], endDate: date || new Date(), startDate: regRange[0].startDate }])
                              setFormData((prev) => ({ ...prev, registration_end_date: date }))
                            }}
                            className="rounded-xl border"
                          />
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Ticket Types Section - Only show for ticketed events */}
          {formData.event_type === 'ticketed' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Ticket className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Ticket Types <span className="text-sm font-normal text-gray-500">(Optional)</span>
                    </h3>
                    <p className="text-gray-500 text-sm">
                      You can add ticket types now or later in Ticket Management
                    </p>
                  </div>
                </div>
              </div>

              {/* Info Alert */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="text-blue-600 mt-0.5">ℹ️</div>
                  <div>
                    <p className="text-sm text-blue-900 font-medium">Ticket types are optional during event creation</p>
                    <p className="text-sm text-blue-700 mt-1">
                      You can skip this section and add ticket types later through the <strong>Ticket Management</strong> dashboard. 
                      This allows you to configure pricing and availability after your event is created.
                    </p>
                  </div>
                </div>
              </div>

              {/* Available Ticket Types */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Available Ticket Types</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ticketTypeOptions.map((option) => {
                    const isSelected = ticketTypes.some(t => t.name === option.name)
                    return (
                      <div
                        key={option.name}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                          isSelected 
                            ? 'border-purple-500 bg-purple-50' 
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                        onClick={() => !isSelected && addTicketType(option)}
                      >
                        <div className="flex items-center mb-2">
                          <option.icon className="w-5 h-5 text-purple-600 mr-2" />
                          <span className="font-semibold text-gray-900">{option.name}</span>
                        </div>
                        <p className="text-sm text-gray-600">{option.description}</p>
                                                    <p className="text-sm font-medium text-purple-600 mt-2">
                              Starting at ETB {option.defaultPrice.toLocaleString()}
                            </p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Selected Ticket Types */}
              {ticketTypes.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Configure Ticket Types</h4>
                  <div className="space-y-4">
                    {ticketTypes.map((ticketType, index) => (
                      <div key={index} className="p-6 border border-gray-200 rounded-xl">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="text-lg font-semibold text-gray-900">{ticketType.name}</h5>
                          <button
                            type="button"
                            onClick={() => removeTicketType(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="block text-sm font-medium text-gray-700 mb-2">
                              Price (ETB) *
                            </Label>
                            <Input
                              type="number"
                              value={ticketType.price}
                              onChange={(e) => updateTicketType(index, 'price', parseFloat(e.target.value))}
                              className="w-full h-12 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="0"
                              min="0"
                              step="1"
                            />
                          </div>
                          
                          <div>
                            <Label className="block text-sm font-medium text-gray-700 mb-2">
                              Quantity (leave empty for unlimited)
                            </Label>
                            <Input
                              type="number"
                              value={ticketType.quantity || ''}
                              onChange={(e) => updateTicketType(index, 'quantity', e.target.value ? parseInt(e.target.value) : null)}
                              className="w-full h-12 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="Unlimited"
                              min="1"
                            />
                          </div>
                          
                          <div>
                            <Label className="block text-sm font-medium text-gray-700 mb-2">
                              Sales End Date
                            </Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="w-full h-12 bg-white/80 text-purple-700 border-purple-200 hover:bg-purple-50 rounded-xl shadow focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                  {ticketType.sales_end_date
                                    ? new Date(ticketType.sales_end_date).toLocaleDateString()
                                    : 'Select sales end date'}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="p-4 bg-white/90 rounded-2xl shadow-xl border border-purple-200 w-auto">
                                <ShadCalendar
                                  mode="single"
                                  selected={ticketType.sales_end_date ? new Date(ticketType.sales_end_date) : undefined}
                                  onSelect={(date) => {
                                    if (date) {
                                      updateTicketType(index, 'sales_end_date', date.toISOString())
                                    }
                                  }}
                                  className="rounded-xl border"
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          
                          <div>
                            <Label className="block text-sm font-medium text-gray-700 mb-2">
                              Description
                            </Label>
                            <Textarea
                              value={ticketType.description}
                              onChange={(e) => updateTicketType(index, 'description', e.target.value)}
                              rows={2}
                              className="w-full border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                              placeholder="Describe this ticket type..."
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}



          {/* Additional Information Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Additional Information
                </h3>
                <p className="text-gray-500 text-sm">
                  Requirements, agenda, and additional details
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <Label htmlFor="requirements" className="flex items-center gap-2 text-gray-700 font-medium">
                  <FileText className="w-4 h-4 text-amber-500" /> Requirements & Prerequisites
                </Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) =>
                    handleInputChange('requirements', e.target.value)
                  }
                  placeholder="Any requirements or prerequisites for attendees..."
                  rows={3}
                  className="mt-2 border-gray-300 focus:border-amber-500 focus:ring-amber-500 rounded-xl resize-none"
                />
              </div>
              <div>
                <Label htmlFor="agenda" className="flex items-center gap-2 text-gray-700 font-medium">
                  <FileText className="w-4 h-4 text-amber-500" /> Event Agenda
                </Label>
                <Textarea
                  id="agenda"
                  value={formData.agenda}
                  onChange={(e) => handleInputChange('agenda', e.target.value)}
                  placeholder="Detailed event schedule and agenda..."
                  rows={4}
                  className="mt-2 border-gray-300 focus:border-amber-500 focus:ring-amber-500 rounded-xl resize-none"
                />
              </div>
            </div>
          </div>

          {/* Debug Section - Remove after fixing
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-yellow-800 mb-2">Debug Info (Remove this section after fixing):</h4>
            <div className="text-sm text-yellow-700 space-y-1">
              <div>isSubmitting: {isSubmitting.toString()}</div>
              <div>loading.eventTypes: {loading.eventTypes.toString()}</div>
              <div>loading.eventCategories: {loading.eventCategories.toString()}</div>
              <div>loading.organizers: {loading.organizers.toString()}</div>
              <div>user?.role: {user?.role}</div>
              <div>formData.name: "{formData.name}"</div>
              <div>formData.city: "{formData.city}"</div>
              <div>formData.venue: "{formData.venue}"</div>
              <div>formData.max_guests: "{formData.max_guests}"</div>
              <div>formData.event_type_id: "{formData.event_type_id}"</div>
              <div>formData.event_category_id: "{formData.event_category_id}"</div>
              <div>formData.organizer_id: "{formData.organizer_id}"</div>
              <div>formData.event_type: "{formData.event_type}"</div>
              <div>selectedGuestTypes.length: {selectedGuestTypes.length}</div>
              <div>ticketTypes.length: {ticketTypes.length}</div>
              <div>eventTypes.length: {eventTypes.length}</div>
              <div>eventCategories.length: {eventCategories.length}</div>
              <div>organizers.length: {organizers.length}</div>
            </div>
          </div> */}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              className="px-6 py-2 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                loading.eventTypes ||
                loading.eventCategories ||
                (user?.role !== 'organizer' && loading.organizers) ||
                !formData.name.trim() ||
                !formData.city.trim() ||
                !formData.venue.trim() ||
                !formData.max_guests.trim() ||
                !formData.event_type_id ||
                !formData.event_category_id ||
                (user?.role !== 'organizer' && !formData.organizer_id) ||
                !filterValidOptions(eventTypes).some(et => String(et.id) === formData.event_type_id) ||
                !filterValidOptions(eventCategories).some(ec => String(ec.id) === formData.event_category_id) ||
                (user?.role !== 'organizer' && !filterValidOptions(organizers).some(org => String(org.id) === formData.organizer_id)) ||
                (formData.event_type === 'free' && selectedGuestTypes.length === 0) ||
                (formData.event_type === 'ticketed' && ticketTypes.length === 0)
              }
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Creating...
                </span>
              ) : (
                'Create Event'
              )}
            </Button>
          </div>
        </div>
        </form>
      </div>
    </div>
  )
}
