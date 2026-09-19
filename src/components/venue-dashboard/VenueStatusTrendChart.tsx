'use client'

import type { ComponentProps } from 'react'
import { Bar, BarChart, Rectangle, XAxis } from 'recharts'
import { BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { VenueDashboardStatusDay } from '@/lib/api/venues'

const chartConfig = {
  pending: { label: 'Pending', color: 'hsl(38 92% 50%)' },
  confirmed: { label: 'Confirmed', color: 'hsl(var(--primary))' },
  cancelled: { label: 'Cancelled', color: 'hsl(0 72% 51%)' },
} satisfies ChartConfig

const BAR_RADIUS = 5

function ColumnHoverCursor(props: ComponentProps<typeof Rectangle>) {
  return <Rectangle fill="hsl(var(--muted))" fillOpacity={0.5} radius={BAR_RADIUS * 2} stroke="none" {...props} />
}

export function VenueStatusTrendChart({
  data = [],
  className,
}: {
  data?: VenueDashboardStatusDay[]
  className?: string
}) {
  const total = data.reduce((sum, d) => sum + d.pending + d.confirmed + d.cancelled, 0)

  return (
    <Card className={cn('rounded-2xl border-border shadow-sm md:col-span-2 dark:ring-0', className)}>
      <CardHeader>
        <CardTitle>Booking status trend</CardTitle>
        <CardDescription>Requests created per day by status, last 10 days</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
              <BarChart3 className="size-6 text-muted-foreground" />
            </div>
            <p className="font-semibold">Nothing in the last 10 days</p>
            <p className="max-w-xs text-sm text-muted-foreground">New booking activity will stack here by status.</p>
          </div>
        ) : (
          <ChartContainer className="h-52 w-full" config={chartConfig}>
            <BarChart accessibilityLayer data={data}>
              <XAxis
                axisLine={false}
                dataKey="day"
                interval={0}
                minTickGap={8}
                tickLine={false}
                tickMargin={10}
              />
              <ChartTooltip content={<ChartTooltipContent />} cursor={<ColumnHoverCursor />} />
              <Bar
                background={{ fill: 'hsl(var(--muted))', radius: BAR_RADIUS }}
                barSize={8}
                dataKey="cancelled"
                fill="var(--color-cancelled)"
                overflow="visible"
                radius={[0, 0, BAR_RADIUS, BAR_RADIUS]}
                stackId="status"
              />
              <Bar barSize={8} dataKey="pending" fill="var(--color-pending)" overflow="visible" radius={0} stackId="status" />
              <Bar
                barSize={8}
                dataKey="confirmed"
                fill="var(--color-confirmed)"
                overflow="visible"
                radius={[BAR_RADIUS, BAR_RADIUS, 0, 0]}
                stackId="status"
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
