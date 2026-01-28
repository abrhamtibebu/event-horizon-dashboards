/**
 * Refactored EventDetails Component
 * 
 * This is a simplified version that uses extracted hooks and components.
 * Gradually migrate functionality from EventDetails.tsx to this structure.
 */

import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { usePagination } from '@/hooks/usePagination'
import { useEventDetails } from '@/features/events/hooks/useEventDetails'
import { useAttendees } from '@/features/attendees/hooks/useAttendees'
import { EventDetailsHeader } from '@/features/events/components/EventDetailsHeader'
import { EventDetailsSkeleton } from '@/features/events/components/EventDetailsSkeleton'
import { EventDetailsError } from '@/features/events/components/EventDetailsError'
import { EventNotFound } from '@/features/events/components/EventNotFound'
import { EventDetailsTabs } from '@/features/events/components/EventDetailsTabs'
import { TabsContent } from '@/components/ui/tabs'
import { usePermissionCheck } from '@/hooks/use-permission-check'
import type { AttendeeFilters } from '@/features/attendees/types/attendee.types'
import { exportAttendeesToCSV } from '@/features/attendees/utils/attendeeExport'
import { toast } from 'sonner'

// Placeholder tab components - to be extracted from original file
function DetailsTab({ eventId, event }: { eventId: string; event: any }) {
  return (
    <TabsContent value="details" className="mt-6">
      <div className="text-muted-foreground">Details tab - to be migrated from original component</div>
    </TabsContent>
  )
}

function AttendeesTab({ eventId }: { eventId: string }) {
  return (
    <TabsContent value="attendees" className="mt-6">
      <div className="text-muted-foreground">Attendees tab - to be migrated from original component</div>
    </TabsContent>
  )
}

function UshersTab({ eventId }: { eventId: string }) {
  return (
    <TabsContent value="ushers" className="mt-6">
      <div className="text-muted-foreground">Ushers tab - to be migrated from original component</div>
    </TabsContent>
  )
}

function BadgesTab({ eventId }: { eventId: string }) {
  return (
    <TabsContent value="badges" className="mt-6">
      <div className="text-muted-foreground">Badges tab - to be migrated from original component</div>
    </TabsContent>
  )
}

function BulkBadgesTab({ eventId }: { eventId: string }) {
  return (
    <TabsContent value="bulk-badges" className="mt-6">
      <div className="text-muted-foreground">Bulk Badges tab - to be migrated from original component</div>
    </TabsContent>
  )
}

function TeamTab({ eventId }: { eventId: string }) {
  return (
    <TabsContent value="team" className="mt-6">
      <div className="text-muted-foreground">Team tab - to be migrated from original component</div>
    </TabsContent>
  )
}

function FormsTab({ eventId }: { eventId: string }) {
  return (
    <TabsContent value="forms" className="mt-6">
      <div className="text-muted-foreground">Forms tab - to be migrated from original component</div>
    </TabsContent>
  )
}

function SessionsTab({ eventId }: { eventId: string }) {
  return (
    <TabsContent value="sessions" className="mt-6">
      <div className="text-muted-foreground">Sessions tab - to be migrated from original component</div>
    </TabsContent>
  )
}

function InvitationsTab({ eventId }: { eventId: string }) {
  return (
    <TabsContent value="invitations" className="mt-6">
      <div className="text-muted-foreground">Invitations tab - to be migrated from original component</div>
    </TabsContent>
  )
}

function AnalyticsTab({ eventId }: { eventId: string }) {
  return (
    <TabsContent value="analytics" className="mt-6">
      <div className="text-muted-foreground">Analytics tab - to be migrated from original component</div>
    </TabsContent>
  )
}

export default function EventDetails() {
  const { eventId } = useParams()
  const { user } = useAuth()
  const { hasPermission } = usePermissionCheck()
  const [activeTab, setActiveTab] = useState('details')

  // Check permissions
  const canManageEvent = hasPermission('events.manage')
  const isAdminOrOrganizer = canManageEvent

  // Pagination for attendees
  const {
    currentPage,
    perPage,
    totalPages,
    totalRecords,
    setTotalPages,
    setTotalRecords,
    handlePageChange,
    handlePerPageChange,
    resetPagination,
  } = usePagination({ defaultPerPage: 15, searchParamPrefix: 'attendees' })

  // Filters
  const [filters, setFilters] = useState<AttendeeFilters>({
    search: '',
    guest_type: 'all',
    checked_in: 'all',
  })

  // Fetch event details
  const { eventData, loading: eventLoading, error: eventError, refetch: refetchEvent } = useEventDetails(eventId)

  // Fetch attendees
  const { attendees, loading: attendeesLoading, refetch: refetchAttendees } = useAttendees({
    eventId,
    filters,
    pagination: {
      currentPage,
      perPage,
      setTotalPages,
      setTotalRecords,
    },
    isAdminOrOrganizer,
  })

  // Handlers
  const handleEdit = () => {
    // TODO: Open edit dialog
    console.log('Edit event')
  }

  const handleExport = () => {
    if (attendees.length === 0) {
      toast.info('No attendees to export.')
      return
    }

    try {
      exportAttendeesToCSV(attendees, eventData?.name || 'Event')
      toast.success('Attendee data exported successfully.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to export attendees.')
    }
  }

  // Loading state
  if (eventLoading) {
    return <EventDetailsSkeleton />
  }

  // Error state
  if (eventError) {
    return <EventDetailsError error={eventError} onRetry={refetchEvent} />
  }

  // Not found state
  if (!eventData) {
    return <EventNotFound />
  }

  return (
    <div className="space-y-6">
      <EventDetailsHeader
        event={eventData}
        attendeeCount={attendees.length}
        organizerName={user?.organizer?.name}
      />

      <EventDetailsTabs
        eventId={eventId!}
        event={eventData}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onEdit={handleEdit}
        onExport={handleExport}
      >
        <DetailsTab eventId={eventId!} event={eventData} />
        <AttendeesTab eventId={eventId!} />
        <UshersTab eventId={eventId!} />
        <BadgesTab eventId={eventId!} />
        <BulkBadgesTab eventId={eventId!} />
        <TeamTab eventId={eventId!} />
        <FormsTab eventId={eventId!} />
        <SessionsTab eventId={eventId!} />
        <InvitationsTab eventId={eventId!} />
        <AnalyticsTab eventId={eventId!} />
      </EventDetailsTabs>
    </div>
  )
}
