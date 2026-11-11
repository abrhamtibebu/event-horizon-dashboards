import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BarChart3, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { VenueEmptyState } from '@/components/venue/VenueEmptyState'
import { VenuePageHeader } from '@/components/venue/VenuePageHeader'
import { venueApi, type VenueDashboardData } from '@/lib/api/venues'
import { toast } from 'sonner'

const sourceLabels: Record<string, string> = { manual: 'Manual', event_request: 'Event requests', public_request: 'Public inquiries' }
const sourceColors = ['hsl(var(--primary))', 'hsl(211 90% 60%)', 'hsl(38 92% 55%)']

export default function VenueReportsPage() {
  const [data, setData] = useState<VenueDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    venueApi.dashboard().then(({ data: result }) => setData(result)).catch((error) => toast.error(error.response?.data?.error || 'Could not load venue reports')).finally(() => setLoading(false))
  }, [])

  const totals = useMemo(() => {
    const sources = data?.sourceBreakdown || []
    const total = sources.reduce((sum, row) => sum + row.count, 0)
    const statuses = data?.statusTrend || []
    const requests = statuses.reduce((sum, row) => sum + row.pending + row.confirmed + row.cancelled + row.completed, 0)
    const booked = statuses.reduce((sum, row) => sum + row.confirmed + row.completed, 0)
    return { total, requests, booked, conversion: requests ? Math.round((booked / requests) * 100) : 0 }
  }, [data])

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner text="Preparing venue reports…" /></div>
  if (!data || data.needs_setup) return <VenueEmptyState icon={BarChart3} title="Reports unavailable" description="Set up your venue and record bookings to see operational performance." />

  const sources = (data.sourceBreakdown || []).map((row) => ({ ...row, label: sourceLabels[row.source] || row.source }))
  const hasVolume = (data.bookingVolume || []).some((row) => row.bookings > 0)

  return <div className="space-y-7">
    <VenuePageHeader icon={BarChart3} title="Reports" subtitle="Booking activity, request sources, conversion, and space demand. These are operational reports, separate from financial records." actions={<Button asChild variant="outline"><Link to="/dashboard/venue/revenue"><FileText className="mr-2 size-4" />Open money</Link></Button>} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Bookings received · 30 days" value={totals.total.toLocaleString()} />
      <Metric label="Requests tracked · 10 days" value={totals.requests.toLocaleString()} />
      <Metric label="Confirmed or completed · 10 days" value={totals.booked.toLocaleString()} />
      <Metric label="Booked share · 10 days" value={`${totals.conversion}%`} />
    </div>
    <div className="grid gap-5 xl:grid-cols-2">
      <Card className="rounded-2xl"><CardHeader><CardTitle>Booking volume</CardTitle><CardDescription>New bookings created each day over the last 60 days.</CardDescription></CardHeader><CardContent className="h-72">{hasVolume ? <ResponsiveContainer width="100%" height="100%"><BarChart data={data.bookingVolume} margin={{ left: -18, right: 8, top: 10 }}><CartesianGrid vertical={false} strokeDasharray="3 3" /><XAxis dataKey="date" tickFormatter={(value) => value.slice(5)} minTickGap={30} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="bookings" name="Bookings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer> : <VenueEmptyState icon={BarChart3} title="No booking activity yet" description="New requests and manual bookings will build this report." />}</CardContent></Card>
      <Card className="rounded-2xl"><CardHeader><CardTitle>Request sources</CardTitle><CardDescription>Bookings created over the last 30 days.</CardDescription></CardHeader><CardContent className="grid min-h-72 items-center gap-4 sm:grid-cols-[1fr_180px]">{totals.total ? <><div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={sources} dataKey="count" nameKey="label" innerRadius={58} outerRadius={88} paddingAngle={3}>{sources.map((row, index) => <Cell key={row.source} fill={sourceColors[index % sourceColors.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div><div className="space-y-3">{sources.map((row, index) => <div key={row.source} className="flex items-center justify-between gap-3 text-sm"><span className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ backgroundColor: sourceColors[index % sourceColors.length] }} />{row.label}</span><b>{row.count} · {row.share}%</b></div>)}</div></> : <div className="sm:col-span-2"><VenueEmptyState icon={BarChart3} title="No source data yet" description="Event requests, public inquiries, and manual bookings will be compared here." /></div>}</CardContent></Card>
      <Card className="rounded-2xl xl:col-span-2"><CardHeader><CardTitle>Booking status mix</CardTitle><CardDescription>Current status of bookings created over the last 10 days.</CardDescription></CardHeader><CardContent className="h-72">{(data.statusTrend || []).length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={data.statusTrend} margin={{ left: -18, right: 8, top: 10 }}><CartesianGrid vertical={false} strokeDasharray="3 3" /><XAxis dataKey="day" /><YAxis allowDecimals={false} /><Tooltip /><Legend /><Bar dataKey="pending" stackId="status" name="Pending" fill="hsl(38 92% 55%)" /><Bar dataKey="confirmed" stackId="status" name="Confirmed" fill="hsl(145 55% 43%)" /><Bar dataKey="completed" stackId="status" name="Completed" fill="hsl(211 90% 60%)" /><Bar dataKey="cancelled" stackId="status" name="Cancelled" fill="hsl(0 72% 58%)" /></BarChart></ResponsiveContainer> : <VenueEmptyState icon={BarChart3} title="No status history yet" description="Booking status changes will appear here." />}</CardContent></Card>
    </div>
    <Card className="rounded-2xl"><CardHeader><CardTitle>Reservation link referrals</CardTitle><CardDescription>Traffic labels recorded on public requests over the last 30 days.</CardDescription></CardHeader><CardContent>{data.referralBreakdown?.length ? <div className="space-y-2">{data.referralBreakdown.map((row) => <div key={`${row.source}-${row.campaign || ''}`} className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3 text-sm"><span className="min-w-0 truncate"><b>{row.source}</b>{row.campaign ? <span className="text-muted-foreground"> · {row.campaign}</span> : null}</span><b>{row.count}</b></div>)}</div> : <p className="text-sm text-muted-foreground">No tagged requests yet. Share your reservation link or embed it on your site to track referrals.</p>}</CardContent></Card>
    <Card className="rounded-2xl"><CardHeader><CardTitle>Upcoming space demand</CardTitle><CardDescription>Spaces with pending or confirmed bookings that have not ended.</CardDescription></CardHeader><CardContent>{data.spaceLoad?.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{data.spaceLoad.map((space) => <Link key={space.id} to={`/dashboard/venue/calendar?space_id=${space.id}&view=list`} className="flex items-center justify-between rounded-xl border p-4 transition-colors hover:border-primary/40"><div><p className="font-semibold">{space.name}</p><p className="text-sm text-muted-foreground">{space.capacity ? `${space.capacity} capacity · ` : ''}{space.open} active booking{space.open === 1 ? '' : 's'}</p></div><span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{space.status}</span></Link>)}</div> : <VenueEmptyState icon={BarChart3} title="No spaces to compare" description="Add venue spaces to see demand by room." />}</CardContent></Card>
  </div>
}

function Metric({ label, value }: { label: string; value: string }) {
  return <Card className="rounded-2xl"><CardContent className="p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-bold tabular-nums">{value}</p></CardContent></Card>
}
