import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  MapPin,
  Users,
  Save,
  X,
  Tag,
  FileText,
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
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: null as Date | null,
    end_date: null as Date | null,
    start_time: '09:00', // Default start time
    end_time: '17:00',   // Default end time
    city: '',
    venue: '',
    max_guests: '',
    registration_start_date: null as Date | null,
    registration_end_date: null as Date | null,
    event_type_id: '', // Remove default '1'
    event_category_id: '', // Remove default '1'
    organizer_id: '', // Remove default '1'
    status: 'draft',
    requirements: '',
    agenda: '',
    guest_types: '',
    event_type: 'free' as 'free' | 'ticketed', // Add event type selection
    visibility: 'public' as 'public' | 'private', // Add visibility selection
  })
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

  // For enhanced date selection
  const [selectedEventDate, setSelectedEventDate] = useState<Date | null>(null)
  const [isSingleDayEvent, setIsSingleDayEvent] = useState(false)

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
    if (user && (user.role === 'organizer' || user.role === 'organizer_admin') && user.organizer_id) {
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

    if (user?.role !== 'organizer' && user?.role !== 'organizer_admin') {
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

    // For single day events, end_date is automatically set to start_date
    if (isSingleDayEvent) {
      requiredFields.splice(requiredFields.indexOf('end_date'), 1); // Remove end_date from required for single day events
    }

    for (const field of requiredFields) {
      if (!formData[field] || (typeof formData[field] === 'string' && formData[field].trim() === '')) {
        toast.error(`Please fill in the required field: ${field.replace(/_/g, ' ')}`);
        return;
      }
    }

    // Additional validation for single day events
    if (isSingleDayEvent && !selectedEventDate) {
      toast.error('Please select an event date for the single day event.');
      return;
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
      // For single day events, combine date and time into ISO strings
      let startDateTime, endDateTime;
      if (isSingleDayEvent && selectedEventDate) {
        // Create Date objects with selected date and times
        startDateTime = new Date(selectedEventDate);
        const [startHours, startMinutes] = formData.start_time.split(':').map(Number);
        startDateTime.setHours(startHours, startMinutes, 0, 0);

        endDateTime = new Date(selectedEventDate);
        const [endHours, endMinutes] = formData.end_time.split(':').map(Number);
        endDateTime.setHours(endHours, endMinutes, 0, 0);
      } else {
        // For multi-day events, use the date range
        startDateTime = eventRange[0].startDate;
        endDateTime = eventRange[0].endDate;
      }

      const processedFormData = {
        ...formData,
        start_date: startDateTime.toISOString(),
        end_date: endDateTime.toISOString(),
        registration_start_date: regRange[0].startDate.toISOString(),
        registration_end_date: regRange[0].endDate.toISOString(),
        // Combine city and venue into location for backend
        location: `${formData.city}, ${formData.venue}`,
        // Ensure max_guests is sent as an integer
        max_guests: parseInt(formData.max_guests, 10),
        // Only include organizer_id if not an organizer or organizer_admin (backend sets it for them)
        ...(user?.role !== 'organizer' && user?.role !== 'organizer_admin' && { organizer_id: formData.organizer_id }),
        ticket_types: formData.event_type === 'ticketed' ? ticketTypes : [],
        guest_types: formData.event_type === 'free'
          ? selectedGuestTypes
          : ticketTypes.map((t) => t.name), // <-- send ticket type names as guest_types for ticketed events
      }
      // Handle FormData for guest_types and ticket_types arrays
      if (formData.event_type === 'free' && selectedGuestTypes.length > 0) {
        payload = new FormData()
        Object.entries(processedFormData).forEach(([key, value]) => {
          if (key === 'guest_types') {
            (Array.isArray(value) ? value : [value]).forEach((type: string) =>
              payload.append('guest_types[]', type)
            )
          } else if (key === 'ticket_types') {
            if (Array.isArray(value)) {
              value.forEach((ticketType: any) => {
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
      } else if (formData.event_type === 'ticketed' && ticketTypes.length > 0) {
        payload = new FormData()
        Object.entries(processedFormData).forEach(([key, value]) => {
          if (key === 'guest_types') {
            (Array.isArray(value) ? value : [value]).forEach((type: string) =>
              payload.append('guest_types[]', type)
            )
          } else if (key === 'ticket_types') {
            if (Array.isArray(value)) {
              value.forEach((ticketType: any) => {
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
    <div className="min-h-screen bg-background">
      <style>{customRangeStyles}</style>
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Tag className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-semibold text-foreground">
                Create New Event
              </h2>
              <p className="text-muted-foreground mt-1">
                Set up a new event with core details, visibility, and dates.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6">
          <div className="space-y-8">
            {/* Event Type Selection */}
            <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-card-foreground">
                    Event Type
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Choose between free or ticketed event
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Free Event Option */}
                <div
                  className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${formData.event_type === 'free'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40'
                    }`}
                  onClick={() => handleInputChange('event_type', 'free')}
                >
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mr-4">
                      <Gift className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-card-foreground">Free Event</h4>
                      <p className="text-muted-foreground">No cost to attendees</p>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                      Guest type management
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                      Simple registration
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                      Basic attendee tracking
                    </li>
                  </ul>
                </div>

                {/* Ticketed Event Option */}
                <div
                  className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${formData.event_type === 'ticketed'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40'
                    }`}
                  onClick={() => handleInputChange('event_type', 'ticketed')}
                >
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mr-4">
                      <Ticket className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-card-foreground">Ticketed Event</h4>
                      <p className="text-muted-foreground">Paid tickets with multiple tiers</p>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                      le                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                      Revenue tracking
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                      Advanced analytics
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Event Visibility */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Eye className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    Event Visibility
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Control who can discover and register for your event
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Public Event Option */}
                <label className="relative cursor-pointer group">
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    checked={formData.visibility === 'public'}
                    onChange={(e) => handleInputChange('visibility', e.target.value)}
                    className="peer sr-only"
                  />
                  <div className="relative p-6 border-2 border-border rounded-2xl transition-all duration-300 group-hover:border-primary/40 peer-checked:border-primary peer-checked:bg-primary/5">
                    {/* Selected indicator */}
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center opacity-0 peer-checked:opacity-100 transition-opacity duration-300">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>

                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-foreground mb-1">Public Event</h4>
                        <p className="text-muted-foreground text-sm">Discoverable by everyone</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                        <span className="text-muted-foreground">Visible on Evella platform</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                        <span className="text-muted-foreground">Can be featured by admins</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                        <span className="text-muted-foreground">Open registration for all users</span>
                      </div>
                    </div>
                  </div>
                </label>

                {/* Private Event Option */}
                <label className="relative cursor-pointer group">
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    checked={formData.visibility === 'private'}
                    onChange={(e) => handleInputChange('visibility', e.target.value)}
                    className="peer sr-only"
                  />
                  <div className="relative p-6 border-2 border-border rounded-2xl transition-all duration-300 group-hover:border-muted-foreground/50 peer-checked:border-muted-foreground peer-checked:bg-muted/5">
                    {/* Selected indicator */}
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-muted-foreground rounded-full flex items-center justify-center opacity-0 peer-checked:opacity-100 transition-opacity duration-300">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>

                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center flex-shrink-0">
                        <Lock className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-foreground mb-1">Private Event</h4>
                        <p className="text-muted-foreground text-sm">Invite-only access</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-gray-400 rounded-full flex-shrink-0"></div>
                        <span className="text-muted-foreground">Hidden from public discovery</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-gray-400 rounded-full flex-shrink-0"></div>
                        <span className="text-muted-foreground">Internal registration only</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-gray-400 rounded-full flex-shrink-0"></div>
                        <span className="text-muted-foreground">Cannot be featured publicly</span>
                      </div>
                    </div>
                  </div>
                </label>
              </div>

              {/* Additional Info */}
              <div className="mt-6 p-4 bg-muted/40 rounded-xl border border-border">
                <div className="flex items-start gap-3">
                  <div className="text-primary mt-0.5">ℹ️</div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Visibility Settings</p>
                    <p className="text-sm text-muted-foreground">
                      Public events can be discovered on the Evella platform and may be featured by administrators.
                      Private events are only accessible through direct invitations and are not visible in public searches.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Information */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Tag className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-card-foreground">
                    Event Information
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Basic event details and logistics
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name" className="flex items-center gap-2 text-foreground font-medium">
                    <Tag className="w-4 h-4 text-primary" /> Event Name
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter event name"
                    required
                    className="mt-2 h-12 border-border focus:border-primary focus:ring-primary/20 rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="organizer_id" className="flex items-center gap-2 text-foreground font-medium">
                    <Tag className="w-4 h-4 text-primary" /> Organizer
                  </Label>
                  {(user?.role === 'organizer' || user?.role === 'organizer_admin') ? (
                    <Input
                      value={user.organizer?.name || 'Loading organizer...'}
                      disabled
                      className="mt-2 h-12 border-border bg-muted rounded-xl cursor-not-allowed"
                      placeholder="Your organization"
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
                      <SelectTrigger className="mt-2 h-12 border-border focus:border-primary focus:ring-primary/20 rounded-xl" id="organizer_id">
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
                  <Label htmlFor="description" className="flex items-center gap-2 text-foreground font-medium">
                    <FileText className="w-4 h-4 text-primary" /> Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange('description', e.target.value)
                    }
                    placeholder="Describe your event..."
                    rows={4}
                    className="mt-2 border-border focus:border-primary focus:ring-primary/20 rounded-xl resize-none"
                  />
                </div>
                <div>
                  <Label htmlFor="event_type_id" className="flex items-center gap-2 text-foreground font-medium">
                    <Tag className="w-4 h-4 text-primary" /> Event Type
                  </Label>
                  <Select
                    value={formData.event_type_id}
                    onValueChange={(value) =>
                      handleInputChange('event_type_id', value)
                    }
                    disabled={loading.eventTypes}
                    required
                  >
                    <SelectTrigger className="mt-2 h-12 border-border focus:border-primary focus:ring-primary/20 rounded-xl" id="event_type_id">
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
                  <Label htmlFor="event_category_id" className="flex items-center gap-2 text-foreground font-medium">
                    <Tag className="w-4 h-4 text-primary" /> Event Category
                  </Label>
                  <Select
                    value={formData.event_category_id}
                    onValueChange={(value) =>
                      handleInputChange('event_category_id', value)
                    }
                    disabled={loading.eventCategories}
                    required
                  >
                    <SelectTrigger className="mt-2 h-12 border-border focus:border-primary focus:ring-primary/20 rounded-xl" id="event_category_id">
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
                  <Label className="flex items-center gap-2 text-foreground font-medium">
                    <MapPin className="w-4 h-4 text-primary" /> City
                  </Label>
                  <Select
                    value={formData.city}
                    onValueChange={(value) => handleInputChange('city', value)}
                  >
                    <SelectTrigger className="mt-2 h-12 border-border focus:border-primary focus:ring-primary/20 rounded-xl">
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
                  <Label htmlFor="venue" className="flex items-center gap-2 text-foreground font-medium">
                    <MapPin className="w-4 h-4 text-primary" /> Venue
                  </Label>
                  <Input
                    id="venue"
                    value={formData.venue}
                    onChange={(e) =>
                      handleInputChange('venue', e.target.value)
                    }
                    placeholder="e.g. Grand Convention Center"
                    className="mt-2 h-12 border-border focus:border-primary focus:ring-primary/20 rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="max_guests" className="flex items-center gap-2 text-foreground font-medium">
                    <Users className="w-4 h-4 text-primary" /> Max Guests
                  </Label>
                  <Input
                    id="max_guests"
                    type="number"
                    value={formData.max_guests}
                    onChange={(e) =>
                      handleInputChange('max_guests', e.target.value)
                    }
                    placeholder="e.g. 500"
                    className="mt-2 h-12 border-border focus:border-primary focus:ring-primary/20 rounded-xl"
                  />
                </div>
                <div className="lg:col-span-2">
                  <Label htmlFor="guest_types" className="flex items-center gap-2 text-foreground font-medium">
                    <Users className="w-4 h-4 text-primary" /> {formData.event_type === 'ticketed' ? 'Ticket Types' : 'Guest Types'}
                  </Label>
                  {formData.event_type === 'free' ? (
                    <div className="flex flex-wrap gap-2 mb-3 mt-2">
                      {PREDEFINED_GUEST_TYPES.map(type => (
                        <Button
                          key={type}
                          type="button"
                          variant={selectedGuestTypes.includes(type) ? 'default' : 'outline'}
                          className={`${selectedGuestTypes.includes(type) ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/40'} rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200`}
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
                    <div className="text-sm text-muted-foreground mt-2">
                      Ticket types will be configured in the ticketing section below.
                    </div>
                  )}
                  {formData.event_type === 'free' && selectedGuestTypes.length === 0 && (
                    <div className="text-xs text-red-500 mb-2">Select at least one guest type.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
      </div>

      {/* Event & Registration Dates Section */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">
              Event & Registration Dates
            </h3>
            <p className="text-muted-foreground text-sm">
              Set event and registration periods
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Event Date & Time Picker */}
          <div>
            <Label className="flex items-center gap-2 text-foreground">
              <Calendar className="w-4 h-4" /> Event Date & Time
            </Label>

            {/* Single Day Toggle */}
            <div className="flex items-center gap-2 mt-2 mb-3">
              <input
                type="checkbox"
                id="single-day-event"
                checked={isSingleDayEvent}
                onChange={(e) => {
                  setIsSingleDayEvent(e.target.checked)
                  if (e.target.checked && selectedEventDate) {
                    // For single day events, set both start and end to same date
                    setFormData((prev) => ({
                      ...prev,
                      start_date: selectedEventDate,
                      end_date: selectedEventDate
                    }))
                    setEventRange([{
                      ...eventRange[0],
                      startDate: selectedEventDate,
                      endDate: selectedEventDate
                    }])
                  }
                }}
                className="rounded border-border"
              />
              <label htmlFor="single-day-event" className="text-sm text-muted-foreground">
                Single day event
              </label>
            </div>

            {isSingleDayEvent ? (
              /* Single Day Event Picker */
              <div className="space-y-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full rounded-xl shadow"
                    >
                      {selectedEventDate
                        ? selectedEventDate.toLocaleDateString()
                        : 'Select event date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-4 bg-popover rounded-2xl shadow-xl border border-border w-auto">
                    <div className="flex flex-col gap-4">
                      <ShadCalendar
                        mode="single"
                        selected={selectedEventDate || undefined}
                        onSelect={(date) => {
                          if (date) {
                            setSelectedEventDate(date)
                            setFormData((prev) => ({
                              ...prev,
                              start_date: date,
                              end_date: date
                            }))
                            setEventRange([{
                              ...eventRange[0],
                              startDate: date,
                              endDate: date
                            }])
                          }
                        }}
                        className="rounded-xl border"
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      />
                      {/* Time Pickers for Single Day */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">Start Time</Label>
                          <Input
                            type="time"
                            value={formData.start_time}
                            onChange={(e) => setFormData((prev) => ({ ...prev, start_time: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">End Time</Label>
                          <Input
                            type="time"
                            value={formData.end_time}
                            onChange={(e) => setFormData((prev) => ({ ...prev, end_time: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {selectedEventDate && (
                  <div className="text-sm text-muted-foreground">
                    {selectedEventDate.toLocaleDateString()} from {formData.start_time} to {formData.end_time}
                  </div>
                )}
              </div>
            ) : (
              /* Multi-Day Event Picker */
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-xl shadow"
                  >
                    {formData.start_date && formData.end_date
                      ? `${eventRange[0].startDate.toLocaleDateString()} - ${eventRange[0].endDate.toLocaleDateString()}`
                      : 'Select event date range'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-4 bg-popover rounded-2xl shadow-xl border border-border w-auto">
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Start Date & Time</div>
                        <ShadCalendar
                          mode="single"
                          selected={eventRange[0].startDate}
                          onSelect={(date) => {
                            setEventRange([{ ...eventRange[0], startDate: date || new Date(), endDate: eventRange[0].endDate }])
                            setFormData((prev) => ({ ...prev, start_date: date }))
                          }}
                          className="rounded-xl border mb-2"
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        />
                        <Input
                          type="time"
                          value={formData.start_time}
                          onChange={(e) => setFormData((prev) => ({ ...prev, start_time: e.target.value }))}
                          className="text-xs"
                        />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">End Date & Time</div>
                        <ShadCalendar
                          mode="single"
                          selected={eventRange[0].endDate}
                          onSelect={(date) => {
                            setEventRange([{ ...eventRange[0], endDate: date || new Date(), startDate: eventRange[0].startDate }])
                            setFormData((prev) => ({ ...prev, end_date: date }))
                          }}
                          className="rounded-xl border mb-2"
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        />
                        <Input
                          type="time"
                          value={formData.end_time}
                          onChange={(e) => setFormData((prev) => ({ ...prev, end_time: e.target.value }))}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
          {/* Registration Date Range Picker */}
          <div>
            <Label className="flex items-center gap-2 text-foreground">
              <Calendar className="w-4 h-4" /> Registration Period
            </Label>
            <div className="mt-1 mb-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-xl shadow"
                  >
                    {formData.registration_start_date && formData.registration_end_date
                      ? `${regRange[0].startDate.toLocaleDateString()} - ${regRange[0].endDate.toLocaleDateString()}`
                      : 'Select registration date range'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-4 bg-popover rounded-2xl shadow-xl border border-border w-auto">
                  <div className="flex flex-col gap-4">
                    {/* Info about date restrictions */}
                    <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg">
                      Registration dates must be between today and the event start date (inclusive).
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Start Date</div>
                        <ShadCalendar
                          mode="single"
                          selected={regRange[0].startDate}
                          onSelect={(date) => {
                            if (date) {
                              // Validate date is not before today
                              const today = new Date()
                              today.setHours(0, 0, 0, 0)

                              if (date < today) {
                                toast.error('Registration start date cannot be before today')
                                return
                              }

                              // Validate date is not after event start date
                              if (formData.start_date && date > formData.start_date) {
                                toast.error('Registration start date cannot be after event start date')
                                return
                              }

                              setRegRange([{ ...regRange[0], startDate: date, endDate: regRange[0].endDate }])
                              setFormData((prev) => ({ ...prev, registration_start_date: date }))
                            }
                          }}
                          className="rounded-xl border"
                          disabled={(date) => {
                            const today = new Date()
                            today.setHours(0, 0, 0, 0)
                            const eventStart = formData.start_date

                            // Disable dates before today
                            if (date < today) return true

                            // Disable dates after event start date (if set)
                            if (eventStart && date > eventStart) return true

                            return false
                          }}
                        />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">End Date</div>
                        <ShadCalendar
                          mode="single"
                          selected={regRange[0].endDate}
                          onSelect={(date) => {
                            if (date) {
                              // Validate date is not before today
                              const today = new Date()
                              today.setHours(0, 0, 0, 0)

                              if (date < today) {
                                toast.error('Registration end date cannot be before today')
                                return
                              }

                              // Validate date is not after event start date
                              if (formData.start_date && date > formData.start_date) {
                                toast.error('Registration end date cannot be after event start date')
                                return
                              }

                              // Validate end date is not before start date
                              if (date < regRange[0].startDate) {
                                toast.error('Registration end date cannot be before start date')
                                return
                              }

                              setRegRange([{ ...regRange[0], endDate: date, startDate: regRange[0].startDate }])
                              setFormData((prev) => ({ ...prev, registration_end_date: date }))
                            }
                          }}
                          className="rounded-xl border"
                          disabled={(date) => {
                            const today = new Date()
                            today.setHours(0, 0, 0, 0)
                            const eventStart = formData.start_date
                            const regStart = regRange[0].startDate

                            // Disable dates before today
                            if (date < today) return true

                            // Disable dates before registration start date
                            if (regStart && date < regStart) return true

                            // Disable dates after event start date (if set)
                            if (eventStart && date > eventStart) return true

                            return false
                          }}
                        />
                      </div>
                    </div>

                    {/* Show selected range info */}
                    {formData.registration_start_date && formData.registration_end_date && (
                      <div className="text-xs text-center text-muted-foreground bg-muted/30 p-2 rounded-lg">
                        Selected: {regRange[0].startDate.toLocaleDateString()} to {regRange[0].endDate.toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Additional validation info */}
            <div className="text-xs text-muted-foreground">
              Registration must open on or after today and close on or before the event starts.
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Types Section - Only show for ticketed events */}
      {formData.event_type === 'ticketed' && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Ticket className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  Ticket Types <span className="text-sm font-normal text-muted-foreground">(Optional)</span>
                </h3>
                <p className="text-muted-foreground text-sm">
                  You can add ticket types now or later in Ticket Management
                </p>
              </div>
            </div>
          </div>

          {/* Info Alert */}
          <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="text-primary mt-0.5">ℹ️</div>
              <div>
                <p className="text-sm text-primary font-medium">Ticket types are optional during event creation</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You can skip this section and add ticket types later through the <strong>Ticket Management</strong> dashboard.
                  This allows you to configure pricing and availability after your event is created.
                </p>
              </div>
            </div>
          </div>

          {/* Available Ticket Types */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-foreground mb-4">Available Ticket Types</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ticketTypeOptions.map((option) => {
                const isSelected = ticketTypes.some(t => t.name === option.name)
                return (
                  <div
                    key={option.name}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                      }`}
                    onClick={() => !isSelected && addTicketType(option)}
                  >
                    <div className="flex items-center mb-2">
                      <option.icon className="w-5 h-5 text-primary dark:text-primary mr-2" />
                      <span className="font-semibold text-foreground">{option.name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                    <p className="text-sm font-medium text-primary dark:text-primary mt-2">
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
              <h4 className="text-lg font-semibold text-foreground mb-4">Configure Ticket Types</h4>
              <div className="space-y-4">
                {ticketTypes.map((ticketType, index) => (
                  <div key={index} className="p-6 border border-border rounded-xl bg-card">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="text-lg font-semibold text-foreground">{ticketType.name}</h5>
                      <button
                        type="button"
                        onClick={() => removeTicketType(index)}
                        className="p-2 text-error hover:bg-error/10 rounded-lg"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="block text-sm font-medium text-foreground mb-2">
                          Price (ETB) *
                        </Label>
                        <Input
                          type="number"
                          value={ticketType.price}
                          onChange={(e) => updateTicketType(index, 'price', parseFloat(e.target.value))}
                          className="w-full h-12 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                          placeholder="0"
                          min="0"
                          step="1"
                        />
                      </div>

                      <div>
                        <Label className="block text-sm font-medium text-foreground mb-2">
                          Quantity (leave empty for unlimited)
                        </Label>
                        <Input
                          type="number"
                          value={ticketType.quantity || ''}
                          onChange={(e) => updateTicketType(index, 'quantity', e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full h-12 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                          placeholder="Unlimited"
                          min="1"
                        />
                      </div>

                      <div>
                        <Label className="block text-sm font-medium text-foreground mb-2">
                          Sales End Date
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full h-12 rounded-xl shadow focus:ring-2 focus:ring-primary focus:border-primary"
                            >
                              {ticketType.sales_end_date
                                ? new Date(ticketType.sales_end_date).toLocaleDateString()
                                : 'Select sales end date'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="p-4 bg-popover rounded-2xl shadow-xl border border-border w-auto">
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
                        <Label className="block text-sm font-medium text-foreground mb-2">
                          Description
                        </Label>
                        <Textarea
                          value={ticketType.description}
                          onChange={(e) => updateTicketType(index, 'description', e.target.value)}
                          rows={2}
                          className="w-full border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary resize-none"
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
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">
              Additional Information
            </h3>
            <p className="text-muted-foreground text-sm">
              Requirements, agenda, and additional details
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6">
          <div>
            <Label htmlFor="requirements" className="flex items-center gap-2 text-foreground font-medium">
              <FileText className="w-4 h-4 text-primary" /> Requirements & Prerequisites
            </Label>
            <Textarea
              id="requirements"
              value={formData.requirements}
              onChange={(e) =>
                handleInputChange('requirements', e.target.value)
              }
              placeholder="Any requirements or prerequisites for attendees..."
              rows={3}
              className="mt-2 border-border focus:border-primary focus:ring-primary/20 rounded-xl resize-none"
            />
          </div>
          <div>
            <Label htmlFor="agenda" className="flex items-center gap-2 text-foreground font-medium">
              <FileText className="w-4 h-4 text-primary" /> Event Agenda
            </Label>
            <Textarea
              id="agenda"
              value={formData.agenda}
              onChange={(e) => handleInputChange('agenda', e.target.value)}
              placeholder="Detailed event schedule and agenda..."
              rows={4}
              className="mt-2 border-border focus:border-primary focus:ring-primary/20 rounded-xl resize-none"
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
            ((user?.role !== 'organizer' && user?.role !== 'organizer_admin') && loading.organizers) ||
            !formData.name.trim() ||
            !formData.city.trim() ||
            !formData.venue.trim() ||
            !formData.max_guests.trim() ||
            !formData.event_type_id ||
            !formData.event_category_id ||
            ((user?.role !== 'organizer' && user?.role !== 'organizer_admin') && !formData.organizer_id) ||
            !filterValidOptions(eventTypes).some(et => String(et.id) === formData.event_type_id) ||
            !filterValidOptions(eventCategories).some(ec => String(ec.id) === formData.event_category_id) ||
            ((user?.role !== 'organizer' && user?.role !== 'organizer_admin') && !filterValidOptions(organizers).some(org => String(org.id) === formData.organizer_id)) ||
            (formData.event_type === 'free' && selectedGuestTypes.length === 0) ||
            (formData.event_type === 'ticketed' && ticketTypes.length === 0)
          }
          className="bg-primary text-primary-foreground font-semibold px-6 py-2 rounded-xl shadow-sm hover:bg-primary/90 transition-colors"
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
        </form>
      </div>
    </div>
  )
}
