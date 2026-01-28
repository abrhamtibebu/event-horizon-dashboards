import { useState, useEffect } from 'react'
import api from '@/lib/api'
import type { Event } from '../types/event.types'

interface UseEventDetailsReturn {
  eventData: Event | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useEventDetails(eventId: string | undefined): UseEventDetailsReturn {
  const [eventData, setEventData] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvent = async () => {
    if (!eventId) return

    setLoading(true)
    setError(null)

    try {
      const res = await api.get(`/events/${Number(eventId)}`)
      const data = res.data

      // Decode HTML entities in names
      if (data.name) data.name = data.name.replace(/&amp;/g, '&')
      if (data.organizer?.name) data.organizer.name = data.organizer.name.replace(/&amp;/g, '&')

      console.log('Event data fetched:', {
        id: data.id,
        name: data.name,
        event_type: data.event_type,
        guestTypes: data.guestTypes,
        ticketTypes: data.ticketTypes,
      })

      setEventData(data)
    } catch (err) {
      console.error('Failed to fetch event:', err)
      setError('Failed to fetch event details.')
      setEventData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvent()
  }, [eventId])

  return {
    eventData,
    loading,
    error,
    refetch: fetchEvent,
  }
}
