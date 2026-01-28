import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'
import type { Attendee, AttendeeFilters, AttendeePagination } from '../types/attendee.types'
import { DEFAULT_PAGE_SIZE } from '../../events/constants'

interface UseAttendeesOptions {
  eventId: string | undefined
  filters: AttendeeFilters
  pagination: {
    currentPage: number
    perPage: number
    setTotalPages: (pages: number) => void
    setTotalRecords: (records: number) => void
  }
  isAdminOrOrganizer: boolean
}

interface UseAttendeesReturn {
  attendees: Attendee[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useAttendees({
  eventId,
  filters,
  pagination,
  isAdminOrOrganizer,
}: UseAttendeesOptions): UseAttendeesReturn {
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAttendees = useCallback(async () => {
    if (!eventId) return

    setLoading(true)
    setError(null)

    try {
      // Build query parameters for filtering
      const params = new URLSearchParams()

      // Only add pagination params for admin and organizer
      if (isAdminOrOrganizer) {
        params.append('page', pagination.currentPage.toString())
        params.append('per_page', pagination.perPage.toString())
      }

      if (filters.search) {
        params.append('search', filters.search)
      }

      if (filters.guest_type && filters.guest_type !== 'all') {
        params.append('guest_type', filters.guest_type)
      }

      if (filters.checked_in && filters.checked_in !== 'all') {
        params.append('checked_in', filters.checked_in === 'checked-in' ? 'true' : 'false')
      }

      const res = await api.get(`/events/${Number(eventId)}/attendees?${params.toString()}`)
      console.log('Attendees response:', res.data)

      // Handle paginated response (only for admin/organizer)
      if (isAdminOrOrganizer && res.data.data) {
        setAttendees(res.data.data)
        pagination.setTotalPages(res.data.last_page || 1)
        pagination.setTotalRecords(res.data.total || 0)
      } else {
        // For ushers or non-paginated response, get all data
        const attendeesData = res.data.data || res.data || []
        setAttendees(attendeesData)
        pagination.setTotalPages(1)
        pagination.setTotalRecords(attendeesData.length || 0)
      }

      // Log first attendee structure for debugging
      const attendeesData = res.data.data || res.data || []
      if (attendeesData.length > 0) {
        console.log('First attendee structure:', {
          id: attendeesData[0].id,
          guest_type_id: attendeesData[0].guest_type_id,
          guestType: attendeesData[0].guestType,
          guest_type: attendeesData[0].guest_type,
          guest: attendeesData[0].guest,
        })
      }
    } catch (err) {
      console.error('Failed to fetch attendees:', err)
      setError('Failed to fetch attendees.')
      setAttendees([])
      pagination.setTotalPages(1)
      pagination.setTotalRecords(0)
    } finally {
      setLoading(false)
    }
  }, [eventId, filters, pagination, isAdminOrOrganizer])

  useEffect(() => {
    fetchAttendees()
  }, [fetchAttendees])

  return {
    attendees,
    loading,
    error,
    refetch: fetchAttendees,
  }
}
