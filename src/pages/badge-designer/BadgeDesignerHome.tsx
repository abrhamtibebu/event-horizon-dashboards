import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Palette, Calendar, ArrowRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { format } from 'date-fns'

export function BadgeDesignerHome() {
  const navigate = useNavigate()
  
  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['events', 'active-draft'],
    queryFn: async () => {
      const response = await api.get('/events')
      return response.data
    },
  })

  // Debug: Log the raw events data
  console.log('Raw events data:', eventsData)
  console.log('Response structure check:', {
    hasData: !!eventsData,
    isArray: Array.isArray(eventsData),
    hasDataProp: eventsData?.data !== undefined,
    isDataArray: Array.isArray(eventsData?.data)
  })

  // Handle different API response structures - same as CreateFreeEvent fix
  const allEvents = Array.isArray(eventsData) 
    ? eventsData 
    : (Array.isArray(eventsData?.data) ? eventsData.data : [])
  
  console.log('All events extracted:', allEvents)

  // Filter to only show active and draft events (exclude completed/cancelled)
  const events = allEvents.filter((event: any) => {
    const status = event.status?.toLowerCase().trim()
    console.log(`Event "${event.name}" has status:`, event.status, 'normalized:', status)
    
    // Include if status is active, draft, upcoming, ongoing, or if no status field exists
    const shouldInclude = !status || 
           status === 'active' || 
           status === 'draft' || 
           status === 'upcoming' ||
           status === 'ongoing'
    
    console.log(`  -> Should include: ${shouldInclude}`)
    return shouldInclude
  })
  
  console.log('Filtered events:', events)
  console.log('Total events:', allEvents.length, 'Filtered events:', events.length)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-600 rounded-lg">
              <Palette className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Badge Designer</h1>
              <p className="text-muted-foreground mt-1">
                Create and manage beautiful badge designs for your events
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded">
                  <Palette className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground mb-1">Visual Designer</h3>
                  <p className="text-sm text-muted-foreground">
                    Drag, resize, and rotate elements with Fabric.js canvas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded">
                  <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground mb-1">Dynamic Fields</h3>
                  <p className="text-sm text-muted-foreground">
                    Insert attendee names, companies, and QR codes automatically
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground mb-1">Export</h3>
                  <p className="text-sm text-muted-foreground">
                    Export badges as high-resolution PNG or PDF files
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Events List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-card-foreground">Select an Event</h2>
            <p className="text-sm text-muted-foreground">
              {events.length} {events.length === 1 ? 'event' : 'events'} available
            </p>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-muted-foreground">Loading events...</span>
            </div>
          ) : events.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Events Available</h3>
                <p className="text-gray-600 mb-4">
                  Create an event to start designing badges
                </p>
                <div className="text-xs text-gray-500 mb-4">
                  Debug: Check browser console for event data
                </div>
                <Button onClick={() => navigate('/dashboard/events/create')}>
                  Create Event
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event: any) => (
                <Card key={event.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between">
                      <span className="text-lg">{event.name}</span>
                      {event.status && (
                        <span className={`text-xs px-2 py-1 rounded font-medium ${
                          event.status === 'active' ? 'bg-green-100 text-green-700' :
                          event.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                          event.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                          event.status === 'ongoing' ? 'bg-green-100 text-green-700' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {event.status === 'active' ? '✓ Active' :
                           event.status === 'draft' ? '📝 Draft' :
                           event.status}
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      {event.start_date && (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(event.start_date), 'MMM dd, yyyy')}
                        </p>
                      )}
                      {event.location && (
                        <p className="text-sm text-gray-600">
                          📍 {event.location}
                        </p>
                      )}
                      {event.attendees_count !== undefined && (
                        <p className="text-sm text-gray-600">
                          👥 {event.attendees_count} attendee{event.attendees_count !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() => navigate(`/badge-designer/templates/${event.id}`)}
                      className="w-full"
                    >
                      Design Badges
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BadgeDesignerHome

