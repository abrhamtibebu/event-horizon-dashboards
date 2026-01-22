import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, Clock, MapPin, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'

interface QuickCreateEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: Date | undefined
  onEventCreated?: () => void
}

export function QuickCreateEventDialog({ 
  open, 
  onOpenChange, 
  selectedDate,
  onEventCreated 
}: QuickCreateEventDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    time: '09:00',
  })
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleQuickCreate = async () => {
    if (!formData.name || !selectedDate) {
      toast({
        title: 'Error',
        description: 'Event name and date are required',
        variant: 'destructive'
      })
      return
    }

    if (!user?.organizer_id) {
      toast({
        title: 'Error',
        description: 'Unable to create event. User is not associated with an organizer.',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      const dateStr = selectedDate.toISOString().split('T')[0]
      
      // Calculate registration dates (7 days before event, ends on event day)
      const registrationStart = new Date(selectedDate)
      registrationStart.setDate(registrationStart.getDate() - 7)
      const registrationStartStr = registrationStart.toISOString().split('T')[0]
      
      // Create a basic free event with all required fields
      const response = await api.post('/events/free/add', {
        name: formData.name,
        description: formData.description || 'Event created from calendar',
        date: dateStr,
        start_date: dateStr,  // Required: same as date for 1-day event
        end_date: dateStr,    // Required: same as date for 1-day event
        time: formData.time,
        location: formData.location || 'TBD',
        max_guests: 100,
        status: 'draft',
        event_type_id: 1, // Default to first event type
        event_category_id: 1, // Default to first category
        organizer_id: user.organizer_id, // CRITICAL: Associate event with current organizer
        registration_start_date: registrationStartStr, // Required: 7 days before event
        registration_end_date: dateStr, // Required: same as event date
        guest_types: [
          {
            name: 'General Admission',
            description: 'Standard attendee',
            max_guests: 100
          }
        ] // Required: default guest type
      })
      
      console.log('Event created successfully:', response.data)

      toast({
        title: 'Success',
        description: 'Event created successfully! You can edit all details in the event page.',
        variant: 'default'
      })

      // Reset form
      setFormData({
        name: '',
        description: '',
        location: '',
        time: '09:00',
      })

      onOpenChange(false)
      
      // Refresh the dashboard
      if (onEventCreated) {
        onEventCreated()
      }
    } catch (error: any) {
      console.error('Event creation error:', error)
      const errorMessage = error.response?.data?.error 
        || error.response?.data?.message 
        || (error.response?.data?.errors ? Object.values(error.response.data.errors).flat().join(', ') : null)
        || 'Failed to create event'
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFullCreate = () => {
    onOpenChange(false)
    navigate('/dashboard/events/create')
  }

  const formatDate = (date: Date | undefined) => {
    if (!date) return ''
    return date.toLocaleDateString(undefined, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="pb-4 border-b border-border/50">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/20 rounded-xl flex items-center justify-center border-2 border-blue-200 dark:border-blue-800">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            Quick Create Event
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-2">
            Creating event for {formatDate(selectedDate)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Event Name */}
          <div className="space-y-2">
            <Label htmlFor="event-name">Event Name *</Label>
            <Input
              id="event-name"
              placeholder="Enter event name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label htmlFor="event-time" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Time
            </Label>
            <Input
              id="event-time"
              type="time"
              value={formData.time}
              onChange={(e) => handleInputChange('time', e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="event-location" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location
            </Label>
            <Input
              id="event-location"
              placeholder="Event location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="event-description">Description</Label>
            <Textarea
              id="event-description"
              placeholder="Brief event description"
              rows={3}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2">
              Quick Create Defaults:
            </p>
            <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1 ml-3">
              <li>• Creates as 1-day event (start & end on selected date)</li>
              <li>• Registration opens 7 days before event</li>
              <li>• Default guest type: General Admission</li>
              <li>• Status: Draft (not visible to public)</li>
              <li>• All fields can be edited in event details page</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border/50">
          <Button
            variant="outline"
            onClick={handleFullCreate}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Full Event Form
          </Button>
          <Button
            onClick={handleQuickCreate}
            disabled={loading || !formData.name}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? 'Creating...' : 'Quick Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

