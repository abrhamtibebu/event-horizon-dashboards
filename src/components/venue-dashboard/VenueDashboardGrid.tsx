import type { VenueDashboardData } from '@/lib/api/venues'
import { VenueDashboardStats } from './VenueDashboardStats'
import { VenueBookingVolumeChart } from './VenueBookingVolumeChart'
import { VenueSourceBreakdownChart } from './VenueSourceBreakdownChart'
import { VenueStatusTrendChart } from './VenueStatusTrendChart'
import { VenueSpaceLoadCard } from './VenueSpaceLoadCard'
import { VenueRecentBookingsCard } from './VenueRecentBookingsCard'
import { VenueRecentActivityCard } from './VenueRecentActivityCard'

export function VenueDashboardGrid({ data }: { data: VenueDashboardData }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <VenueDashboardStats metrics={data.keyMetrics} />
      <VenueBookingVolumeChart data={data.bookingVolume} />
      <VenueSourceBreakdownChart data={data.sourceBreakdown} />
      <VenueStatusTrendChart data={data.statusTrend} />
      <VenueSpaceLoadCard spaces={data.spaceLoad} />
      <VenueRecentBookingsCard bookings={data.recentBookings} />
      <VenueRecentActivityCard items={data.recentActivity} />
    </div>
  )
}
