'use client'

import { useId, useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Link } from 'react-router-dom'
import { CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatChartAxisTick, formatChartTooltipDate, parseIsoCalendarDate } from '@/components/formater'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Delta, DeltaIcon, DeltaValue } from '@/components/delta'
import type { VenueDashboardVolumePoint } from '@/lib/api/venues'

type PeriodDays = 7 | 30 | 60

const chartConfig = {
  bookings: {
    label: 'New bookings',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig

export function VenueBookingVolumeChart({
  data = [],
  className,
}: {
  data?: VenueDashboardVolumePoint[]
  className?: string
}) {
  const chartUid = useId().replace(/:/g, '')
  const idAreaGradient = `venue-booking-volume-${chartUid}`
  const [periodDays, setPeriodDays] = useState<PeriodDays>(30)

  const chartRows = useMemo(() => {
    if (!data.length) return []
    const last = data[data.length - 1]
    const end = parseIsoCalendarDate(last.date)
    const start = new Date(end)
    start.setDate(start.getDate() - periodDays)
    return data.filter((item) => parseIsoCalendarDate(item.date) >= start)
  }, [data, periodDays])

  const growthPct = useMemo(() => {
    const first = chartRows[0]
    const last = chartRows.at(-1)
    if (!first || !last || !first.bookings) return 0
    return ((last.bookings - first.bookings) / first.bookings) * 100
  }, [chartRows])

  const total = chartRows.reduce((sum, row) => sum + row.bookings, 0)

  return (
    <Card className={cn('rounded-2xl border-border shadow-sm md:col-span-2 lg:col-span-3 dark:ring-0', className)}>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Booking volume</CardTitle>
            {total > 0 ? (
              <Delta value={growthPct} variant="badge">
                <DeltaIcon variant="trend" />
                <DeltaValue />
              </Delta>
            ) : null}
          </div>
          <CardDescription>New booking requests created per day</CardDescription>
        </div>
        <Select value={String(periodDays)} onValueChange={(v) => setPeriodDays(Number(v) as PeriodDays)}>
          <SelectTrigger aria-label="Booking volume range" className="h-8 w-full min-w-36 sm:w-fit">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="60">Last 60 days</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <EmptyChart
            icon={CalendarDays}
            title="No bookings yet"
            hint="Requests from organizers and the public site will chart here."
            to="/dashboard/venue/bookings"
            cta="Open bookings"
          />
        ) : (
          <ChartContainer className="h-56 w-full" config={chartConfig}>
            <AreaChart accessibilityLayer data={chartRows} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id={idAreaGradient} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-bookings)" stopOpacity={0.45} />
                  <stop offset="55%" stopColor="var(--color-bookings)" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="var(--color-bookings)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/60" />
              <XAxis
                axisLine={false}
                dataKey="date"
                interval={periodDays <= 7 ? 0 : 'preserveStartEnd'}
                minTickGap={periodDays >= 60 ? 20 : 28}
                tickFormatter={(value) => formatChartAxisTick(String(value), periodDays)}
                tickLine={false}
                tickMargin={8}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tick={{ className: 'tabular-nums' }}
                tickLine={false}
                tickMargin={8}
                width={28}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    className="min-w-34"
                    indicator="line"
                    labelFormatter={(_, payload) => {
                      const row = payload?.[0]?.payload as VenueDashboardVolumePoint | undefined
                      return row?.date ? formatChartTooltipDate(row.date, 'long') : ''
                    }}
                  />
                }
              />
              <Area
                dataKey="bookings"
                dot={false}
                fill={`url(#${idAreaGradient})`}
                stroke="var(--color-bookings)"
                strokeWidth={2}
                type="monotone"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

function EmptyChart({
  icon: Icon,
  title,
  hint,
  to,
  cta,
}: {
  icon: typeof CalendarDays
  title: string
  hint: string
  to?: string
  cta?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <div className="mb-1 flex size-12 items-center justify-center rounded-2xl bg-muted">
        <Icon className="size-6 text-muted-foreground" />
      </div>
      <p className="font-semibold text-foreground">{title}</p>
      <p className="max-w-xs text-sm text-muted-foreground">{hint}</p>
      {to && cta ? (
        <Link to={to} className="mt-2 text-sm font-semibold text-primary hover:underline">
          {cta}
        </Link>
      ) : null}
    </div>
  )
}
