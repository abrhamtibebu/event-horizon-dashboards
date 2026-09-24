import { useEffect, useId, useState } from 'react'
import { endOfMonth, format } from 'date-fns'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Banknote, Download, FileText, Loader2, Sheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Spinner } from '@/components/ui/spinner'
import { MetricCard } from '@/components/MetricCard'
import { VenueEmptyState } from '@/components/venue/VenueEmptyState'
import { VenuePageHeader } from '@/components/venue/VenuePageHeader'
import { venueApi, type VenueBooking, type VenueRevenueReport } from '@/lib/api/venues'
import { exportVenueRevenueCsv, exportVenueRevenuePdf } from '@/lib/venue/venueReportExport'
import { toast } from 'sonner'

const methodLabel: Record<string, string> = {
  cash: 'Cash',
  bank: 'Bank transfer',
  chapa: 'Chapa',
}

const chartConfig = {
  collected: { label: 'Collected', color: 'hsl(var(--primary))' },
} satisfies ChartConfig

function money(amount?: number | null) {
  return `ETB ${Number(amount ?? 0).toLocaleString()}`
}

export default function VenueRevenuePage() {
  const chartId = useId().replace(/:/g, '')
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [report, setReport] = useState<VenueRevenueReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const [year, mon] = month.split('-').map(Number)
    const from = `${month}-01`
    const to = format(endOfMonth(new Date(year, (mon || 1) - 1, 1)), 'yyyy-MM-dd')
    setLoading(true)
    venueApi
      .revenue({ from, to })
      .then((res) => setReport(res.data))
      .catch((err) => toast.error(err.response?.data?.error || 'Could not load revenue'))
      .finally(() => setLoading(false))
  }, [month])

  const collectedTotal = report?.daily.reduce((sum, row) => sum + row.collected, 0) ?? 0

  const monthRange = () => {
    const [year, mon] = month.split('-').map(Number)
    return {
      from: `${month}-01`,
      to: format(endOfMonth(new Date(year, (mon || 1) - 1, 1)), 'yyyy-MM-dd'),
    }
  }

  const exportReport = async (kind: 'pdf' | 'csv') => {
    if (!report || exporting) return
    setExporting(true)
    try {
      const { from, to } = monthRange()
      const [bookingsRes, profileRes] = await Promise.all([
        venueApi.bookings({ from, to }),
        venueApi.profile(),
      ])
      const bookings = (Array.isArray(bookingsRes.data) ? bookingsRes.data : []) as VenueBooking[]
      const input = {
        venueName: profileRes.data?.name || 'Venue',
        month,
        report,
        bookings,
      }
      if (kind === 'pdf') await exportVenueRevenuePdf(input)
      else exportVenueRevenueCsv(input)
      toast.success(kind === 'pdf' ? 'PDF report downloaded' : 'CSV report downloaded')
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Could not export the report'
      toast.error(message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-8">
      <VenuePageHeader
        icon={Banknote}
        title="Revenue"
        subtitle="Quoted hall fees and payments recorded in this month."
        actions={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={loading || !report || exporting}>
                  {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportReport('pdf')}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportReport('csv')}>
                  <Sheet className="mr-2 h-4 w-4" />
                  Export as CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Input
              type="month"
              value={month}
              onChange={(e) => e.target.value && setMonth(e.target.value)}
              className="w-44 bg-card shadow-sm"
            />
          </>
        }
      />

      {loading || !report ? (
        <div className="flex justify-center py-16">
          <Spinner text="Loading revenue..." />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard title="Collected" value={money(report.collected)} icon={<Banknote className="h-5 w-5" />} />
            <MetricCard title="Quoted" value={money(report.quoted)} icon={<Banknote className="h-5 w-5" />} />
            <MetricCard title="Outstanding" value={money(report.outstanding)} icon={<Banknote className="h-5 w-5" />} />
          </div>

          <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
            <Card className="rounded-2xl border-border shadow-sm">
              <CardHeader>
                <CardTitle>By method</CardTitle>
                <CardDescription>Payments recorded this month</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {report.byMethod.map((row) => (
                  <div key={row.method} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{methodLabel[row.method] || row.method}</span>
                    <span className="font-semibold tabular-nums">{money(row.amount)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border shadow-sm">
              <CardHeader>
                <CardTitle>Collected</CardTitle>
                <CardDescription>Payments by the day they were received</CardDescription>
              </CardHeader>
              <CardContent>
                {collectedTotal === 0 ? (
                  <VenueEmptyState
                    icon={Banknote}
                    title="No payments this month"
                    description="Record cash, bank, or Chapa receipts on a booking to see them here."
                  />
                ) : (
                  <ChartContainer className="h-56 w-full" config={chartConfig}>
                    <AreaChart data={report.daily} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
                      <defs>
                        <linearGradient id={chartId} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-collected)" stopOpacity={0.45} />
                          <stop offset="100%" stopColor="var(--color-collected)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/60" />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tickMargin={8}
                        minTickGap={24}
                        tickFormatter={(value) => format(new Date(`${value}T00:00:00`), 'MMM d')}
                      />
                      <YAxis axisLine={false} tickLine={false} width={40} tick={{ className: 'tabular-nums' }} />
                      <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                      <Area
                        type="monotone"
                        dataKey="collected"
                        stroke="var(--color-collected)"
                        fill={`url(#${chartId})`}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-lg font-semibold">By space</h2>
            </div>
            {report.bySpace.length === 0 ? (
              <VenueEmptyState
                icon={Banknote}
                title="Nothing quoted this month"
                description="Add a quote on a booking that starts this month to compare it with what was collected."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>Space</TableHead>
                    <TableHead>Quoted</TableHead>
                    <TableHead>Collected</TableHead>
                    <TableHead>Outstanding</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.bySpace.map((space) => (
                    <TableRow key={space.id}>
                      <TableCell className="font-medium">{space.name}</TableCell>
                      <TableCell>{money(space.quoted)}</TableCell>
                      <TableCell>{money(space.collected)}</TableCell>
                      <TableCell>{money(space.outstanding)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
