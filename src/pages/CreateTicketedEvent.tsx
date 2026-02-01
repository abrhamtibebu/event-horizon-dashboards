import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Breadcrumbs from '@/components/Breadcrumbs'
import {
  Calendar,
  MapPin,
  Users,
  X,
  Tag,
  FileText,
  Ticket,
  Eye,
  Lock,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { showSuccessToast, showErrorToast } from '@/components/ui/ModernToast'
import api from '@/lib/api'
import { useAuth } from '@/hooks/use-auth'
import { useFeatureAccess } from '@/hooks/useFeatureAccess'
import { UpgradePrompt } from '@/components/subscription/UpgradePrompt'
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

export default function CreateTicketedEvent() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { canUseTicketing, canCreateEvent } = useFeatureAccess()
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const [upgradeMessage, setUpgradeMessage] = useState('')
  const [upgradeTitle, setUpgradeTitle] = useState('')

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
    visibility: 'public' as 'public' | 'private',
  })

  const [eventRange, setEventRange] = useState<any[]>([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: 'selection',
    },
  ])
  const [eventStartTime, setEventStartTime] = useState('09:00')
  const [eventEndTime, setEventEndTime] = useState('17:00')

  const [regRange, setRegRange] = useState<any[]>([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: 'selection',
    },
  ])
  const [regStartTime, setRegStartTime] = useState('09:00')
  const [regEndTime, setRegEndTime] = useState('17:00')

  // Single day event state
  const [isSingleDayEvent, setIsSingleDayEvent] = useState(false)
  const [selectedEventDate, setSelectedEventDate] = useState<Date | null>(null)

  const [loading, setLoading] = useState({
    eventTypes: true,
    eventCategories: true,
    organizers: true,
  })
  const [eventTypes, setEventTypes] = useState([])
  const [eventCategories, setEventCategories] = useState([])
  const [organizers, setOrganizers] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Ticket Type Creation Dialog State
  const [showTicketTypeDialog, setShowTicketTypeDialog] = useState(false)
  const [createdEventId, setCreatedEventId] = useState<number | null>(null)
  const [ticketTypes, setTicketTypes] = useState<any[]>([])
  const [currentTicketType, setCurrentTicketType] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    sales_end_date: null as Date | null,
    benefits: [] as string[],
    min_group_size: '',
    max_group_size: '',
  })
  const [isAddingTicketType, setIsAddingTicketType] = useState(false)

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  useEffect(() => {
    const fetchData = async (endpoint: string, setData: Function, loaderKey: string) => {
      try {
        setLoading(prev => ({ ...prev, [loaderKey]: true }))
        const response = await api.get(endpoint)
        // Handle paginated or non-paginated response
        let data = response.data
        if (data?.data && Array.isArray(data.data)) {
          data = data.data
        } else if (!Array.isArray(data)) {
          data = []
        }
        setData(data)
      } catch (err: any) {
        console.error(`Error fetching ${endpoint}:`, err)
        // Ensure data is always an array on error
        if (loaderKey === 'organizers') {
          setOrganizers([])
        } else if (loaderKey === 'eventTypes') {
          setEventTypes([])
        } else if (loaderKey === 'eventCategories') {
          setEventCategories([])
        }
      } finally {
        setLoading(prev => ({ ...prev, [loaderKey]: false }))
      }
    }

    fetchData('/event-types', setEventTypes, 'eventTypes')
    fetchData('/event-categories', setEventCategories, 'eventCategories')

    // Pre-select organizer for organizers and organizer_admins
    if (user && (user.role === 'organizer' || user.role === 'organizer_admin') && user.organizer_id) {
      setFormData(prev => ({ ...prev, organizer_id: String(user.organizer_id) }))
    }

    if (user?.role !== 'organizer' && user?.role !== 'organizer_admin') {
      fetchData('/organizers', setOrganizers, 'organizers')
    } else {
      setLoading(prev => ({ ...prev, organizers: false }))
    }
  }, [user?.role, user?.organizer_id])




  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate location data
    if (!formData.city || !formData.venue) {
      showErrorToast('Please fill in both city and venue.')
      return
    }

    // Check subscription access for ticketing
    if (!canUseTicketing()) {
      setUpgradeTitle('Ticketing Not Available')
      setUpgradeMessage('Ticketing is available in Pro and Enterprise plans. Please upgrade to create ticketed events.')
      setShowUpgradePrompt(true)
      return
    }

    // Check event creation limit
    const eventAccess = canCreateEvent()
    if (!eventAccess.allowed) {
      setUpgradeTitle('Event Limit Reached')
      setUpgradeMessage(
        eventAccess.limit !== null
          ? `You have reached your monthly event limit of ${eventAccess.limit}. Please upgrade to create more events.`
          : 'You have reached your event creation limit. Please upgrade to create more events.'
      )
      setShowUpgradePrompt(true)
      return
    }

    // For single day events, end date is automatically set, so only check for multi-day events
    if (!isSingleDayEvent && !eventRange[0].endDate) {
      showErrorToast('Please select an event end date.')
      return
    }

    if (!regRange[0].endDate) {
      showErrorToast('Please select a registration end date.')
      return
    }

    // For multi-day events, end date must be after start date
    // For single day events, start and end dates can be the same
    if (!isSingleDayEvent && eventRange[0].startDate >= eventRange[0].endDate) {
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
      // Combine Date and Time
      const formatDateTime = (date: Date, time: string) => {
        const [hours, minutes] = time.split(':').map(Number)
        const newDate = new Date(date)
        newDate.setHours(hours, minutes, 0, 0)
        return newDate.toISOString()
      }

      const payload = {
        name: formData.name,
        description: formData.description,
        event_type: 'ticketed',
        organizer_id: user?.organizer_id, // Use optional chaining for user
        status: 'active', // Default to active upon creation
        start_date: formatDateTime(eventRange[0].startDate, eventStartTime),
        end_date: eventRange[0].endDate
          ? formatDateTime(eventRange[0].endDate, eventEndTime)
          : formatDateTime(eventRange[0].startDate, eventEndTime),
        registration_start_date: formatDateTime(regRange[0].startDate, regStartTime),
        registration_end_date: regRange[0].endDate
          ? formatDateTime(regRange[0].endDate, regEndTime)
          : formatDateTime(regRange[0].startDate, regEndTime),
        location: formData.city, // Using city as location for now
        venue_name: formData.venue,
        max_guests: parseInt(formData.max_guests, 10),
        // Only include organizer_id if not an organizer or organizer_admin (backend sets it for them)
        ...(user?.role !== 'organizer' && user?.role !== 'organizer_admin' && { organizer_id: formData.organizer_id }),

      }
      const headers = {}

      const response = await api.post('/events/ticketed/add', payload, { headers })

      // Store the created event ID and show ticket type dialog
      const eventId = response.data.event?.id || response.data.data?.id || response.data.id
      if(!eventId) {
          console.error('Event creation response:', response.data)
          showErrorToast('Event created but unable to retrieve event ID. Please refresh the page.')
          return
        }

      setCreatedEventId(eventId)
      setShowTicketTypeDialog(true)
      } catch (error: any) {
        showErrorToast(error.response?.data?.message || 'Failed to create ticketed event.')
      } finally {
        setIsSubmitting(false)
      }
    }

  // Handle ticket type creation
  const handleAddTicketType = async () => {
      if (!currentTicketType.name.trim() || !currentTicketType.price) {
        showErrorToast('Please fill in ticket name and price.')
        return
      }

      if (!createdEventId) {
        showErrorToast('Event ID not found. Please try creating the event again.')
        return
      }

      setIsAddingTicketType(true)
      try {
        const payload = {
          name: currentTicketType.name,
          description: currentTicketType.description,
          price: parseFloat(currentTicketType.price),
          quantity: currentTicketType.quantity ? parseInt(currentTicketType.quantity) : null,
          sales_end_date: currentTicketType.sales_end_date?.toISOString(),
          benefits: currentTicketType.benefits,
          min_group_size: currentTicketType.min_group_size ? parseInt(currentTicketType.min_group_size) : null,
          max_group_size: currentTicketType.max_group_size ? parseInt(currentTicketType.max_group_size) : null,
        }

        const response = await api.post(`/events/${createdEventId}/ticket-types`, payload)

        setTicketTypes(prev => [...prev, response.data.data])
        showSuccessToast('Ticket type added successfully!')

        // Reset form
        setCurrentTicketType({
          name: '',
          description: '',
          price: '',
          quantity: '',
          sales_end_date: null,
          benefits: [],
          min_group_size: '',
          max_group_size: '',
        })
      } catch (error: any) {
        showErrorToast(error.response?.data?.message || 'Failed to add ticket type.')
      } finally {
        setIsAddingTicketType(false)
      }
    }

    // Handle navigation to event details or ticket management
    const handleContinueToEvent = () => {
      if (createdEventId) {
        navigate(`/dashboard/events/${createdEventId}`)
      }
    }

    const handleGoToTicketManagement = () => {
      navigate('/dashboard/ticket-management')
    }

    // Modern elegant date picker styles
    const modernDatePickerStyles = `
    /* Modern Date Picker Styles */
    :root {
      --dropdown-arrow: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='hsl(215.4%2016.3%2046.9%)' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
    }

    .dark {
      --dropdown-arrow: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='hsl(217.2%2032.6%2017.5%)' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
    }

    .modern-date-picker {
      font-family: system-ui, -apple-system, sans-serif;
    }

    .date-picker-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem;
      background: linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--primary) / 0.05));
      border-bottom: 1px solid hsl(var(--border));
    }

    .date-picker-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: hsl(var(--foreground));
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .date-picker-nav {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .nav-btn {
      width: 2.5rem;
      height: 2.5rem;
      border: none;
      border-radius: 0.75rem;
      background: hsl(var(--muted));
      color: hsl(var(--foreground));
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px hsl(var(--foreground) / 0.1);
    }

    .nav-btn:hover {
      background: hsl(var(--accent));
      transform: translateY(-1px);
      box-shadow: 0 4px 12px hsl(var(--foreground) / 0.15);
    }

    .nav-btn:active {
      transform: translateY(0);
    }

    .month-year-selector {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      background: hsl(var(--card));
      border-bottom: 1px solid hsl(var(--border));
    }

    .month-selector,
    .year-selector {
      padding: 0.625rem 0.875rem;
      border: 1.5px solid hsl(var(--border));
      border-radius: 0.625rem;
      background: hsl(var(--background));
      color: hsl(var(--foreground));
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 1px 2px 0 hsl(var(--muted-foreground) / 0.05);
      min-width: 120px;
      appearance: none;
      background-image: var(--dropdown-arrow);
      background-position: right 0.5rem center;
      background-repeat: no-repeat;
      background-size: 1.5em 1.5em;
      padding-right: 2.5rem;
    }

    .month-selector:focus,
    .year-selector:focus {
      outline: none;
      border-color: hsl(var(--primary));
      box-shadow: 0 0 0 3px hsl(var(--primary) / 0.1);
      background-color: hsl(var(--background));
    }

    .month-selector:hover,
    .year-selector:hover {
      border-color: hsl(var(--primary));
      background-color: hsl(var(--accent));
      box-shadow: 0 2px 4px 0 hsl(var(--muted-foreground) / 0.1);
    }

    .month-selector option,
    .year-selector option {
      background-color: hsl(var(--popover));
      color: hsl(var(--popover-foreground));
      padding: 0.5rem;
    }

    .weekdays-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      padding: 1rem 1.5rem 0.5rem;
      gap: 0.25rem;
    }

    .weekday {
      text-align: center;
      font-size: 0.75rem;
      font-weight: 600;
      color: hsl(var(--muted-foreground));
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .days-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      padding: 0.5rem 1.5rem 1.5rem;
      gap: 0.25rem;
    }

    .day-cell {
      position: relative;
      width: 2.75rem;
      height: 2.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.75rem;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 0.875rem;
      font-weight: 500;
      color: hsl(var(--foreground));
      user-select: none;
    }

    .day-cell:hover {
      background: hsl(var(--accent));
      transform: scale(1.05);
    }

    .day-cell.today {
      background: hsl(var(--primary) / 0.1);
      color: hsl(var(--primary));
      font-weight: 600;
    }

    .day-cell.today::after {
      content: '';
      position: absolute;
      bottom: 0.25rem;
      left: 50%;
      transform: translateX(-50%);
      width: 0.25rem;
      height: 0.25rem;
      border-radius: 50%;
      background: hsl(var(--primary));
    }

    .day-cell.selected {
      background: hsl(var(--primary));
      color: hsl(var(--primary-foreground));
      font-weight: 600;
      box-shadow: 0 2px 8px hsl(var(--primary) / 0.3);
    }

    .day-cell.in-range {
      background: hsl(var(--primary) / 0.1);
      color: hsl(var(--primary));
    }

    .day-cell.range-start,
    .day-cell.range-end {
      background: hsl(var(--primary));
      color: hsl(var(--primary-foreground));
      position: relative;
    }

    .day-cell.range-start::before,
    .day-cell.range-end::before {
      content: '';
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 0.25rem;
      height: 0.25rem;
      border-radius: 50%;
      background: hsl(var(--primary-foreground));
    }

    .day-cell.range-start::before {
      left: 0.5rem;
    }

    .day-cell.range-end::before {
      right: 0.5rem;
    }

    .day-cell.disabled {
      color: hsl(var(--muted-foreground));
      opacity: 0.4;
      cursor: not-allowed;
    }

    .day-cell.disabled:hover {
      background: transparent;
      transform: none;
    }

    .day-cell.other-month {
      color: hsl(var(--muted-foreground));
      opacity: 0.6;
    }

    /* Quick actions */
    .date-picker-actions {
      padding: 1rem 1.5rem;
      border-top: 1px solid hsl(var(--border));
      background: hsl(var(--muted) / 0.3);
      display: flex;
      gap: 0.5rem;
      justify-content: center;
    }

    .action-btn {
      padding: 0.5rem 1rem;
      border: 1px solid hsl(var(--border));
      border-radius: 0.5rem;
      background: hsl(var(--background));
      color: hsl(var(--foreground));
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .action-btn:hover {
      border-color: hsl(var(--primary));
      background: hsl(var(--primary) / 0.05);
      color: hsl(var(--primary));
    }

    .action-btn.today {
      border-color: hsl(var(--primary));
      background: hsl(var(--primary));
      color: hsl(var(--primary-foreground));
    }

    /* Responsive design */
    @media (max-width: 640px) {
      .date-picker-header,
      .month-year-selector,
      .weekdays-grid,
      .days-grid,
      .date-picker-actions {
        padding-left: 1rem;
        padding-right: 1rem;
      }

      .day-cell {
        width: 2.5rem;
        height: 2.5rem;
        font-size: 0.8125rem;
      }
    }

    /* Animation for range selection */
    .range-transition {
      animation: rangeSelect 0.3s ease-out;
    }

    @keyframes rangeSelect {
      0% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.1);
      }
      100% {
        transform: scale(1);
      }
    }
  `

    return (
      <div className="min-h-screen bg-background">
        <style>{modernDatePickerStyles}</style>
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Breadcrumbs */}
          <Breadcrumbs
            items={[
              { label: 'Events', href: '/dashboard/events' },
              { label: 'Create Ticketed Event' }
            ]}
            className="mb-4"
          />

          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Create Ticketed Event</h1>
                <p className="text-muted-foreground mt-2">
                  Set up a paid event with multiple ticket tiers and revenue tracking
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
            <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
              <style>{modernDatePickerStyles}</style>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-card-foreground">Ticketed Event</h3>
                  <p className="text-muted-foreground text-sm">Paid tickets with multiple tiers</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name" className="flex items-center gap-2 text-foreground font-medium">
                    <Tag className="w-4 h-4 text-blue-500" /> Event Name
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter event name"
                    required
                    className="mt-2 h-12 border-border focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                  />
                </div>

                <div>
                  <Label htmlFor="organizer_id" className="flex items-center gap-2 text-foreground font-medium">
                    <Tag className="w-4 h-4 text-green-500" /> Organizer
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
                      onValueChange={(value) => handleInputChange('organizer_id', value)}
                      disabled={loading.organizers}
                      required
                    >
                      <SelectTrigger className="mt-2 h-12 border-border focus:border-primary focus:ring-primary/20 rounded-xl">
                        <SelectValue placeholder="Select an organizer" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(organizers) && organizers.map((org: any) => (
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
                    <FileText className="w-4 h-4 text-purple-500" /> Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your ticketed event..."
                    rows={4}
                    className="mt-2 border-border focus:border-purple-500 focus:ring-purple-500 rounded-xl resize-none"
                  />
                </div>

                <div>
                  <Label htmlFor="event_type_id" className="flex items-center gap-2 text-foreground font-medium">
                    <Tag className="w-4 h-4 text-orange-500" /> Event Type
                  </Label>
                  <Select
                    value={formData.event_type_id}
                    onValueChange={(value) => handleInputChange('event_type_id', value)}
                    disabled={loading.eventTypes}
                    required
                  >
                    <SelectTrigger className="mt-2 h-12 border-border focus:border-primary focus:ring-primary/20 rounded-xl">
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
                  <Label htmlFor="event_category_id" className="flex items-center gap-2 text-foreground font-medium">
                    <Tag className="w-4 h-4 text-indigo-500" /> Event Category
                  </Label>
                  <Select
                    value={formData.event_category_id}
                    onValueChange={(value) => handleInputChange('event_category_id', value)}
                    disabled={loading.eventCategories}
                    required
                  >
                    <SelectTrigger className="mt-2 h-12 border-border focus:border-primary focus:ring-primary/20 rounded-xl">
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
                  <Label htmlFor="city" className="flex items-center gap-2 text-foreground font-medium">
                    <MapPin className="w-4 h-4 text-blue-500" /> City
                  </Label>
                  <Select
                    value={formData.city}
                    onValueChange={(value) => handleInputChange('city', value)}
                    required
                  >
                    <SelectTrigger className="mt-2 h-12 border-border focus:border-primary focus:ring-primary/20 rounded-xl">
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
                  <Label htmlFor="venue" className="flex items-center gap-2 text-foreground font-medium">
                    <MapPin className="w-4 h-4 text-green-500" /> Venue
                  </Label>
                  <Input
                    id="venue"
                    value={formData.venue}
                    onChange={(e) => handleInputChange('venue', e.target.value)}
                    placeholder="Enter venue name"
                    required
                    className="mt-2 h-12 border-border focus:border-green-500 focus:ring-green-500 rounded-xl"
                  />
                </div>

                <div>
                  <Label htmlFor="max_guests" className="flex items-center gap-2 text-foreground font-medium">
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

            {/* Event Visibility */}
            <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Eye className="w-5 h-5 text-white" />
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <div className="relative p-5 border-2 border-border rounded-2xl transition-all duration-300 group-hover:border-primary/50 peer-checked:border-primary peer-checked:bg-primary/5 dark:peer-checked:bg-primary/10">
                    {/* Selected indicator */}
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center opacity-0 peer-checked:opacity-100 transition-opacity duration-300 shadow-lg">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>

                    <div className="flex items-start gap-4 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-bold text-foreground mb-1">Public Event</h4>
                        <p className="text-muted-foreground text-sm">Discoverable by everyone</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                        <span className="text-muted-foreground">Visible on Evella platform</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                        <span className="text-muted-foreground">Paid ticket registration</span>
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
                  <div className="relative p-5 border-2 border-border rounded-2xl transition-all duration-300 group-hover:border-muted-foreground/50 peer-checked:border-muted-foreground peer-checked:bg-muted/5 dark:peer-checked:bg-muted/10">
                    {/* Selected indicator */}
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-muted-foreground rounded-full flex items-center justify-center opacity-0 peer-checked:opacity-100 transition-opacity duration-300 shadow-lg">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>

                    <div className="flex items-start gap-4 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                        <Lock className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-bold text-foreground mb-1">Private Event</h4>
                        <p className="text-muted-foreground text-sm">Invite-only access</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-gray-400 rounded-full flex-shrink-0"></div>
                        <span className="text-muted-foreground">Hidden from public discovery</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-gray-400 rounded-full flex-shrink-0"></div>
                        <span className="text-muted-foreground">Exclusive ticket access</span>
                      </div>
                    </div>
                  </div>
                </label>
              </div>

              {/* Additional Info */}
              <div className="mt-6 p-4 bg-muted/30 rounded-xl border border-border">
                <div className="flex items-start gap-3">
                  <div className="text-info mt-0.5">ℹ️</div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Visibility Settings</p>
                    <p className="text-sm text-muted-foreground">
                      Public events can be discovered on the Evella platform and have open ticket registration.
                      Private events require direct invitations and are not visible in public searches.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Date & Time */}
            <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-brand-gradient rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Date & Time</h3>
                  <p className="text-muted-foreground text-sm">Event schedule and registration period</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <Label className="flex items-center gap-2 text-foreground font-medium mb-4">
                    <Calendar className="w-4 h-4 text-warning" /> Event Date Range
                  </Label>

                  {/* Single Day Toggle */}
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      id="single-day-event-ticketed"
                      checked={isSingleDayEvent}
                      onChange={(e) => {
                        setIsSingleDayEvent(e.target.checked)
                        if (e.target.checked && selectedEventDate) {
                          // For single day events, set both start and end to same date
                          setEventRange([{
                            ...eventRange[0],
                            startDate: selectedEventDate,
                            endDate: selectedEventDate
                          }])
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="single-day-event-ticketed" className="text-sm text-muted-foreground">
                      Single day event
                    </label>
                  </div>

                  <div className="modern-date-picker border border-border rounded-2xl overflow-hidden shadow-lg bg-card">
                    <div className="date-picker-header">
                      <div className="date-picker-title">
                        <Calendar className="w-5 h-5" />
                        Select Event Dates
                      </div>
                      <div className="date-picker-nav">
                        <button type="button" className="nav-btn" onClick={() => {
                          const newDate = new Date(eventRange[0].startDate);
                          newDate.setMonth(newDate.getMonth() - 1);
                          setEventRange([{
                            ...eventRange[0],
                            startDate: newDate
                          }]);
                        }}>
                          ←
                        </button>
                        <button type="button" className="nav-btn" onClick={() => {
                          const newDate = new Date(eventRange[0].startDate);
                          newDate.setMonth(newDate.getMonth() + 1);
                          setEventRange([{
                            ...eventRange[0],
                            startDate: newDate
                          }]);
                        }}>
                          →
                        </button>
                      </div>
                    </div>
                    <div className="month-year-selector">
                      <select
                        className="month-selector"
                        value={eventRange[0].startDate.getMonth()}
                        onChange={(e) => {
                          const newDate = new Date(eventRange[0].startDate);
                          newDate.setMonth(parseInt(e.target.value));
                          setEventRange([{
                            ...eventRange[0],
                            startDate: newDate
                          }]);
                        }}
                      >
                        {[
                          'January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'
                        ].map((month, index) => (
                          <option key={month} value={index}>{month}</option>
                        ))}
                      </select>
                      <select
                        className="year-selector"
                        value={eventRange[0].startDate.getFullYear()}
                        onChange={(e) => {
                          const newDate = new Date(eventRange[0].startDate);
                          newDate.setFullYear(parseInt(e.target.value));
                          setEventRange([{
                            ...eventRange[0],
                            startDate: newDate
                          }]);
                        }}
                      >
                        {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    <div className="weekdays-grid">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="weekday">{day}</div>
                      ))}
                    </div>
                    <div className="days-grid">
                      {Array.from({ length: 42 }, (_, index) => {
                        const monthStart = new Date(eventRange[0].startDate.getFullYear(), eventRange[0].startDate.getMonth(), 1);
                        const firstDay = monthStart.getDay();
                        const day = index - firstDay + 1;
                        const currentDate = new Date(eventRange[0].startDate.getFullYear(), eventRange[0].startDate.getMonth(), day);

                        // Normalize dates to midnight for comparison
                        const normalizeDate = (date: Date) => {
                          const normalized = new Date(date);
                          normalized.setHours(0, 0, 0, 0);
                          return normalized;
                        };

                        const normalizedCurrent = normalizeDate(currentDate);
                        const normalizedStart = eventRange[0].startDate ? normalizeDate(eventRange[0].startDate) : null;
                        const normalizedEnd = eventRange[0].endDate ? normalizeDate(eventRange[0].endDate) : null;
                        const normalizedToday = normalizeDate(new Date());

                        const isCurrentMonth = currentDate.getMonth() === eventRange[0].startDate.getMonth();
                        const isToday = normalizedCurrent.getTime() === normalizedToday.getTime();
                        const isSelected = (normalizedStart && normalizedStart.getTime() === normalizedCurrent.getTime()) ||
                          (normalizedEnd && normalizedEnd.getTime() === normalizedCurrent.getTime());
                        const isInRange = normalizedStart && normalizedEnd &&
                          normalizedCurrent >= normalizedStart && normalizedCurrent <= normalizedEnd;
                        const isDisabled = normalizedCurrent < normalizedToday;

                        return (
                          <div
                            key={index}
                            className={`day-cell ${!isCurrentMonth ? 'other-month' :
                              isDisabled ? 'disabled' :
                                isSelected ? 'selected' :
                                  isInRange ? 'in-range' :
                                    isToday ? 'today' : ''
                              }`}
                            onClick={() => {
                              if (isDisabled) return;
                              const newRange = { ...eventRange[0] };
                              // If both dates are set or neither is set, start a new selection
                              if ((newRange.startDate && newRange.endDate) || (!newRange.startDate && !newRange.endDate)) {
                                newRange.startDate = normalizeDate(currentDate);
                                newRange.endDate = undefined;
                              } else if (newRange.startDate && normalizedCurrent < normalizeDate(newRange.startDate)) {
                                // If clicking before start date, make it the new start
                                newRange.startDate = normalizeDate(currentDate);
                                newRange.endDate = undefined;
                              } else if (newRange.startDate) {
                                // Set end date
                                newRange.endDate = normalizeDate(currentDate);
                              }
                              setEventRange([newRange]);
                            }}
                          >
                            {isCurrentMonth && day > 0 && day <= new Date(eventRange[0].startDate.getFullYear(), eventRange[0].startDate.getMonth() + 1, 0).getDate() ? day : ''}
                          </div>
                        );
                      })}
                    </div>
                    <div className="date-picker-actions">
                      <button
                        type="button"
                        className="action-btn today"
                        onClick={() => {
                          const today = new Date();
                          setEventRange([{
                            startDate: today,
                            endDate: today,
                            key: 'selection'
                          }]);
                        }}
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        className="action-btn"
                        onClick={() => {
                          setEventRange([{
                            startDate: new Date(),
                            endDate: undefined,
                            key: 'selection'
                          }]);
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Event Time Selectors */}
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Start Time</Label>
                      <Input
                        type="time"
                        value={eventStartTime}
                        onChange={(e) => setEventStartTime(e.target.value)}
                        className="rounded-xl border-gray-300"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium mb-2 block">End Time</Label>
                      <Input
                        type="time"
                        value={eventEndTime}
                        onChange={(e) => setEventEndTime(e.target.value)}
                        className="rounded-xl border-gray-300"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="flex items-center gap-2 text-foreground font-medium mb-4">
                    <Calendar className="w-4 h-4 text-success" /> Registration Period
                  </Label>
                  <div className="modern-date-picker border border-border rounded-2xl overflow-hidden shadow-lg bg-card">
                    <div className="date-picker-header">
                      <div className="date-picker-title">
                        <Calendar className="w-5 h-5" />
                        Select Registration Dates
                      </div>
                      <div className="date-picker-nav">
                        <button type="button" className="nav-btn" onClick={() => {
                          const newDate = new Date(regRange[0].startDate);
                          newDate.setMonth(newDate.getMonth() - 1);
                          setRegRange([{
                            ...regRange[0],
                            startDate: newDate
                          }]);
                        }}>
                          ←
                        </button>
                        <button type="button" className="nav-btn" onClick={() => {
                          const newDate = new Date(regRange[0].startDate);
                          newDate.setMonth(newDate.getMonth() + 1);
                          setRegRange([{
                            ...regRange[0],
                            startDate: newDate
                          }]);
                        }}>
                          →
                        </button>
                      </div>
                    </div>
                    <div className="month-year-selector">
                      <select
                        className="month-selector"
                        value={regRange[0].startDate.getMonth()}
                        onChange={(e) => {
                          const newDate = new Date(regRange[0].startDate);
                          newDate.setMonth(parseInt(e.target.value));
                          setRegRange([{
                            ...regRange[0],
                            startDate: newDate
                          }]);
                        }}
                      >
                        {[
                          'January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'
                        ].map((month, index) => (
                          <option key={month} value={index}>{month}</option>
                        ))}
                      </select>
                      <select
                        className="year-selector"
                        value={regRange[0].startDate.getFullYear()}
                        onChange={(e) => {
                          const newDate = new Date(regRange[0].startDate);
                          newDate.setFullYear(parseInt(e.target.value));
                          setRegRange([{
                            ...regRange[0],
                            startDate: newDate
                          }]);
                        }}
                      >
                        {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    <div className="weekdays-grid">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="weekday">{day}</div>
                      ))}
                    </div>
                    <div className="days-grid">
                      {Array.from({ length: 42 }, (_, index) => {
                        const monthStart = new Date(regRange[0].startDate.getFullYear(), regRange[0].startDate.getMonth(), 1);
                        const firstDay = monthStart.getDay();
                        const day = index - firstDay + 1;
                        const currentDate = new Date(regRange[0].startDate.getFullYear(), regRange[0].startDate.getMonth(), day);

                        // Normalize dates to midnight for comparison
                        const normalizeDate = (date: Date) => {
                          const normalized = new Date(date);
                          normalized.setHours(0, 0, 0, 0);
                          return normalized;
                        };

                        const normalizedCurrent = normalizeDate(currentDate);
                        const normalizedStart = regRange[0].startDate ? normalizeDate(regRange[0].startDate) : null;
                        const normalizedEnd = regRange[0].endDate ? normalizeDate(regRange[0].endDate) : null;
                        const normalizedToday = normalizeDate(new Date());

                        const isCurrentMonth = currentDate.getMonth() === regRange[0].startDate.getMonth();
                        const isToday = normalizedCurrent.getTime() === normalizedToday.getTime();
                        const isSelected = (normalizedStart && normalizedStart.getTime() === normalizedCurrent.getTime()) ||
                          (normalizedEnd && normalizedEnd.getTime() === normalizedCurrent.getTime());
                        const isInRange = normalizedStart && normalizedEnd &&
                          normalizedCurrent >= normalizedStart && normalizedCurrent <= normalizedEnd;
                        const isDisabled = normalizedCurrent < normalizedToday;

                        return (
                          <div
                            key={index}
                            className={`day-cell ${!isCurrentMonth ? 'other-month' :
                              isDisabled ? 'disabled' :
                                isSelected ? 'selected' :
                                  isInRange ? 'in-range' :
                                    isToday ? 'today' : ''
                              }`}
                            onClick={() => {
                              if (isDisabled) return;
                              const newRange = { ...regRange[0] };
                              // If both dates are set or neither is set, start a new selection
                              if ((newRange.startDate && newRange.endDate) || (!newRange.startDate && !newRange.endDate)) {
                                newRange.startDate = normalizeDate(currentDate);
                                newRange.endDate = undefined;
                              } else if (newRange.startDate && normalizedCurrent < normalizeDate(newRange.startDate)) {
                                // If clicking before start date, make it the new start
                                newRange.startDate = normalizeDate(currentDate);
                                newRange.endDate = undefined;
                              } else if (newRange.startDate) {
                                // Set end date
                                newRange.endDate = normalizeDate(currentDate);
                              }
                              setRegRange([newRange]);
                            }}
                          >
                            {isCurrentMonth && day > 0 && day <= new Date(regRange[0].startDate.getFullYear(), regRange[0].startDate.getMonth() + 1, 0).getDate() ? day : ''}
                          </div>
                        );
                      })}
                    </div>
                    <div className="date-picker-actions">
                      <button
                        type="button"
                        className="action-btn today"
                        onClick={() => {
                          const today = new Date();
                          setRegRange([{
                            startDate: today,
                            endDate: today,
                            key: 'selection'
                          }]);
                        }}
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        className="action-btn"
                        onClick={() => {
                          setRegRange([{
                            startDate: new Date(),
                            endDate: undefined,
                            key: 'selection'
                          }]);
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Registration Time Selectors */}
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Start Time</Label>
                      <Input
                        type="time"
                        value={regStartTime}
                        onChange={(e) => setRegStartTime(e.target.value)}
                        className="rounded-xl border-gray-300"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium mb-2 block">End Time</Label>
                      <Input
                        type="time"
                        value={regEndTime}
                        onChange={(e) => setRegEndTime(e.target.value)}
                        className="rounded-xl border-gray-300"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Message */}
            <div className="bg-info/10 border border-info/30 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <div className="text-info text-2xl dark:text-info">ℹ️</div>
                <div>
                  <h3 className="text-lg font-semibold text-info dark:text-info mb-2">
                    Ticket Types Configuration
                  </h3>
                  <p className="text-info/90 dark:text-info/80">
                    After creating your event, you can add ticket types through the <strong>Ticket Management</strong> dashboard.
                    This allows you to configure pricing, quantities, and benefits for each ticket tier.
                  </p>
                  <p className="text-info/80 dark:text-info/70 text-sm mt-2">
                    Navigate to: Dashboard → Ticket Management → Select Your Event → Create Ticket Type
                  </p>
                </div>
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
                disabled={isSubmitting}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                    Creating...
                  </span>
                ) : (
                  'Create Ticketed Event'
                )}
              </Button>
            </div>
          </form>

          <UpgradePrompt
            open={showUpgradePrompt}
            onOpenChange={setShowUpgradePrompt}
            title={upgradeTitle}
            message={upgradeMessage}
          />

          {/* Ticket Type Creation Dialog */}
          <Dialog open={showTicketTypeDialog} onOpenChange={setShowTicketTypeDialog}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Ticket className="w-5 h-5 text-white" />
                  </div>
                  Add Ticket Types
                </DialogTitle>
                <DialogDescription>
                  Your ticketed event has been created successfully! Add ticket types to start selling tickets.
                  You can always add more ticket types later in Ticket Management.
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                {/* Success Message */}
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="text-green-600 mt-0.5">✅</div>
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-300">Event Created Successfully!</p>
                      <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                        Your ticketed event has been created. Now let's add some ticket types to start accepting payments.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Current Ticket Types */}
                {ticketTypes.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">Current Ticket Types</h4>
                    <div className="space-y-2">
                      {ticketTypes.map((ticketType, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
                          <div>
                            <p className="font-medium text-foreground">{ticketType.name}</p>
                            <p className="text-sm text-muted-foreground">
                              ETB {ticketType.price.toLocaleString()}
                              {ticketType.quantity && ` • ${ticketType.quantity} available`}
                            </p>
                          </div>
                          <Badge variant="secondary">Active</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Ticket Type Form */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-foreground">Add New Ticket Type</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ticket-name" className="text-sm font-medium">
                        Ticket Name *
                      </Label>
                      <Input
                        id="ticket-name"
                        placeholder="e.g., Early Bird, VIP, General Admission"
                        value={currentTicketType.name}
                        onChange={(e) => setCurrentTicketType(prev => ({ ...prev, name: e.target.value }))}
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ticket-price" className="text-sm font-medium">
                        Price (ETB) *
                      </Label>
                      <Input
                        id="ticket-price"
                        type="number"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        value={currentTicketType.price}
                        onChange={(e) => setCurrentTicketType(prev => ({ ...prev, price: e.target.value }))}
                        className="h-10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ticket-quantity" className="text-sm font-medium">
                        Quantity Available
                      </Label>
                      <Input
                        id="ticket-quantity"
                        type="number"
                        placeholder="Unlimited"
                        min="1"
                        value={currentTicketType.quantity}
                        onChange={(e) => setCurrentTicketType(prev => ({ ...prev, quantity: e.target.value }))}
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sales-end-date" className="text-sm font-medium">
                        Sales End Date
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-start text-left font-normal h-10"
                          >
                            {currentTicketType.sales_end_date
                              ? currentTicketType.sales_end_date.toLocaleDateString()
                              : 'Select date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={currentTicketType.sales_end_date || undefined}
                            onSelect={(date) => setCurrentTicketType(prev => ({ ...prev, sales_end_date: date || null }))}
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ticket-description" className="text-sm font-medium">
                      Description
                    </Label>
                    <Textarea
                      id="ticket-description"
                      placeholder="Describe what's included with this ticket type..."
                      value={currentTicketType.description}
                      onChange={(e) => setCurrentTicketType(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={handleAddTicketType}
                    disabled={isAddingTicketType || !currentTicketType.name.trim() || !currentTicketType.price}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  >
                    {isAddingTicketType ? 'Adding...' : 'Add Ticket Type'}
                  </Button>
                </div>
              </div>

              <DialogFooter className="flex-shrink-0 gap-2">
                <Button
                  variant="outline"
                  onClick={handleContinueToEvent}
                  className="flex-1"
                >
                  Skip for Now
                </Button>
                <Button
                  onClick={handleGoToTicketManagement}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                >
                  Manage Tickets
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    )
  } 