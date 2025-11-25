import { useState, useEffect } from 'react'
import { Users, Calendar, Ticket, CheckCircle, XCircle, Search, ChevronDown, ChevronRight, Info } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import api from '@/lib/api'

interface Event {
  id: number
  title?: string
  name?: string
  start_date: string
  status?: string
}

interface AudienceSelectorProps {
  selectedEventId: string | undefined
  onSelectEvent: (eventId: string) => void
  audienceType: 'all' | 'specific' | 'custom'
  onSelectAudienceType: (type: 'all' | 'specific' | 'custom') => void
  selectedTicketTypes: string[]
  onSelectTicketTypes: (types: string[]) => void
  onlyCheckedIn: boolean
  onSetCheckedIn: (value: boolean) => void
  onNext: () => void
  onPrevious?: () => void
  onRecipientCountChange?: (count: number) => void
}

export function AudienceSelector({
  selectedEventId,
  onSelectEvent,
  audienceType,
  onSelectAudienceType,
  selectedTicketTypes,
  onSelectTicketTypes,
  onlyCheckedIn,
  onSetCheckedIn,
  onNext,
  onPrevious,
  onRecipientCountChange,
}: AudienceSelectorProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [recipientCount, setRecipientCount] = useState<number | null>(null)
  const [calculatingCount, setCalculatingCount] = useState(false)
  const [useAdvanced, setUseAdvanced] = useState(false)

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    calculateRecipientCount()
  }, [selectedEventId, audienceType, selectedTicketTypes, onlyCheckedIn])

  const fetchEvents = async () => {
    try {
      const response = await api.get('/events')
      const data = response.data.data || response.data
      // Filter to show only active and completed events
      const filteredEvents = Array.isArray(data) ? data.filter((event: any) => 
        event.status === 'active' || event.status === 'completed'
      ) : []
      setEvents(filteredEvents)
    } catch (error) {
      console.error('Error fetching events:', error)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const calculateRecipientCount = async () => {
    if (!selectedEventId) {
      setRecipientCount(null)
      onRecipientCountChange?.(0)
      return
    }

    setCalculatingCount(true)
    try {
      const response = await api.post('/marketing/campaigns/calculate-recipients', {
        event_id: selectedEventId,
        audience_type: audienceType,
        selected_ticket_types: selectedTicketTypes,
        only_checked_in: onlyCheckedIn,
      })
      const count = response.data.count || 0
      setRecipientCount(count)
      onRecipientCountChange?.(count)
    } catch (error: any) {
      console.error('Error calculating recipient count:', error)
      // Log detailed error information
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data,
        })
      }
      // Set to 0 on error to show that count couldn't be calculated
      setRecipientCount(0)
      onRecipientCountChange?.(0)
    } finally {
      setCalculatingCount(false)
    }
  }

  const selectedEvent = events.find(e => e.id === Number(selectedEventId))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900">Select Your Audience</h3>
        <p className="text-gray-600 mt-2">Choose who will receive this message</p>
      </div>

      {/* Simple Mode (Default) */}
      {!useAdvanced && (
        <div className="space-y-4">
          {/* Event Selection */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Event Selection</h3>
                <p className="text-sm text-gray-600">Choose which event's attendees to message</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Select Event</Label>
              <Select value={selectedEventId} onValueChange={onSelectEvent}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id.toString()}>
                      <div className="flex flex-col">
                        <span className="font-medium">{event.title || event.name}</span>
                        {event.start_date && (
                          <span className="text-sm text-gray-500">
                            {new Date(event.start_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Audience Type Selection */}
          {selectedEventId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  Who should receive this?
                </CardTitle>
                <CardDescription>Choose your audience type</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={audienceType} onValueChange={(v) => onSelectAudienceType(v as 'all' | 'specific' | 'custom')}>
                  <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <RadioGroupItem value="all" id="all" className="mt-1" />
                    <Label htmlFor="all" className="flex-1 cursor-pointer">
                      <div className="font-semibold">All Attendees</div>
                      <div className="text-sm text-gray-600">Send to everyone registered for this event</div>
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <RadioGroupItem value="specific" id="specific" className="mt-1" />
                    <Label htmlFor="specific" className="flex-1 cursor-pointer">
                      <div className="font-semibold">Specific Ticket Types</div>
                      <div className="text-sm text-gray-600">Target specific ticket categories</div>
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <RadioGroupItem value="custom" id="custom" className="mt-1" />
                    <Label htmlFor="custom" className="flex-1 cursor-pointer">
                      <div className="font-semibold">Advanced Targeting</div>
                      <div className="text-sm text-gray-600">Use custom segments with advanced filters</div>
                    </Label>
                  </div>
                </RadioGroup>

                {/* Additional Options */}
                {audienceType === 'all' || audienceType === 'specific' ? (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="only-checked-in"
                        checked={onlyCheckedIn}
                        onCheckedChange={(checked) => onSetCheckedIn(checked as boolean)}
                      />
                      <Label htmlFor="only-checked-in" className="cursor-pointer">
                        Only send to checked-in attendees
                      </Label>
                    </div>
                    <p className="text-xs text-gray-500 ml-6 mt-1">
                      Send only to people who have already checked in to the event
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}

          {/* Advanced Mode Link */}
          <Button 
            variant="ghost" 
            className="w-full"
            onClick={() => setUseAdvanced(true)}
          >
            <Users className="w-4 h-4 mr-2" />
            Use Advanced Audience Builder
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Advanced Mode */}
      {useAdvanced && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Advanced Audience Builder</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setUseAdvanced(false)}>
                Use Simple Mode
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>
                Advanced mode with custom segments coming soon. Use simple mode for now.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Recipient Count Preview */}
      {recipientCount !== null && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-lg">Recipient Count</span>
                </div>
                <p className="text-sm text-gray-600">
                  {calculatingCount ? 'Calculating...' : `${recipientCount} people will receive this message`}
                </p>
              </div>
              <Badge variant="outline" className="text-lg font-bold text-blue-600 border-blue-300">
                {recipientCount}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Alert */}
      {!selectedEventId && (
        <Alert variant="default">
          <Info className="w-4 h-4" />
          <AlertDescription>Please select an event to continue</AlertDescription>
        </Alert>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8 pt-6 border-t">
        {onPrevious && (
          <Button variant="outline" onClick={onPrevious}>
            Back
          </Button>
        )}
        <Button 
          onClick={onNext}
          disabled={!selectedEventId}
          className="ml-auto px-8"
        >
          Next Step
        </Button>
      </div>
    </div>
  )
}
