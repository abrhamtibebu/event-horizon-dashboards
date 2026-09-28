import type { VenueDashboardData } from '@/lib/api/venues'
import { VenueBookingVolumeChart } from './VenueBookingVolumeChart'
import { VenueSourceBreakdownChart } from './VenueSourceBreakdownChart'
import { VenueStatusTrendChart } from './VenueStatusTrendChart'
import { VenueRecentActivityCard } from './VenueRecentActivityCard'

export function VenueDashboardGrid({ data }: { data: VenueDashboardData }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <VenueBookingVolumeChart data={data.bookingVolume} />
      <VenueSourceBreakdownChart data={data.sourceBreakdown} />
      <VenueStatusTrendChart data={data.statusTrend} />
      <VenueRecentActivityCard items={data.recentActivity} className="md:col-span-2 lg:col-span-4" />
    </div>
  )
}
