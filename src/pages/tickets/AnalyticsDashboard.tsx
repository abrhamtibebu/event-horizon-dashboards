import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import api from '@/lib/api'
import { EventSalesTab } from '@/features/events/tabs/EventSalesTab'

export default function AnalyticsDashboard() {
  const { eventId: paramEventId } = useParams()
  const [selectedEventId, setSelectedEventId] = useState<number>(paramEventId ? Number(paramEventId) : 0)

  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const response = await api.get('/events')
      return response.data
    },
  })

  if (!selectedEventId && events?.data?.length > 0) {
    setSelectedEventId(events.data[0].id)
  }

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="bg-brand-gradient bg-clip-text text-3xl font-bold text-transparent">
            Event Analytics Dashboard
          </h1>
          <p className="mt-1 text-muted-foreground">
            Comprehensive revenue, sales performance, and attendance insights
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Event</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Select
            value={selectedEventId?.toString() || ''}
            onValueChange={(value) => setSelectedEventId(Number(value))}
          >
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Select an event" />
            </SelectTrigger>
            <SelectContent>
              {events?.data?.map((event: any) => (
                <SelectItem key={event.id} value={event.id.toString()}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {!selectedEventId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-lg font-semibold">No Event Selected</p>
            <p className="text-sm text-muted-foreground">Select an event to view analytics</p>
          </CardContent>
        </Card>
      ) : (
        <EventSalesTab eventId={selectedEventId} />
      )}
    </div>
  )
}
