import type { VenueDashboardData } from '@/lib/api/venues'
import { VenueBookingVolumeChart } from './VenueBookingVolumeChart'
import { VenueSourceBreakdownChart } from './VenueSourceBreakdownChart'
import { VenueStatusTrendChart } from './VenueStatusTrendChart'
import { VenueRecentActivityCard } from './VenueRecentActivityCard'

export function VenueDashboardGrid({ data }: { data: VenueDashboardData }) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-3">
      <VenueBookingVolumeChart data={data.bookingVolume} className="min-w-0 xl:col-span-2" />
      <VenueSourceBreakdownChart data={data.sourceBreakdown} className="min-w-0" />
      <VenueStatusTrendChart data={data.statusTrend} className="min-w-0 xl:col-span-1" />
      <VenueRecentActivityCard items={data.recentActivity} className="min-w-0 xl:col-span-2" />
    </div>
  )
}
