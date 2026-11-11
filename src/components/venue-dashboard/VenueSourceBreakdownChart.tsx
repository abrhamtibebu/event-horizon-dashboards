'use client'

import { LabelList, Pie, PieChart } from 'recharts'
import { PieChart as PieIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { type ChartConfig, ChartContainer } from '@/components/ui/chart'
import type { VenueDashboardSourceShare } from '@/lib/api/venues'

const labels: Record<string, string> = {
  manual: 'Manual',
  event_request: 'Event request',
  public_request: 'Public request',
}
const sourceColors: Record<string, string> = {
  manual: 'hsl(var(--primary))',
  event_request: 'hsl(var(--chart-3))',
  public_request: 'hsl(var(--chart-5))',
}

const chartConfig = {
  share: { label: 'Share' },
  manual: { label: 'Manual', color: 'hsl(var(--primary))' },
  event_request: { label: 'Event request', color: 'hsl(var(--chart-3))' },
  public_request: { label: 'Public request', color: 'hsl(var(--chart-5))' },
} satisfies ChartConfig

export function VenueSourceBreakdownChart({
  data = [],
  className,
}: {
  data?: VenueDashboardSourceShare[]
  className?: string
}) {
  const total = data.reduce((sum, row) => sum + row.count, 0)
  const chartData = data.map((row) => ({
    source: row.source,
    share: row.share,
    count: row.count,
    fill: `var(--color-${row.source})`,
  }))

  return (
    <Card className={cn('flex flex-col rounded-2xl border-border shadow-sm dark:ring-0', className)}>
      <CardHeader className="items-center space-y-1 pb-0 sm:items-start">
        <CardTitle>Request sources</CardTitle>
        <CardDescription>Share of bookings in the last 30 days</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-center">
        {total === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
              <PieIcon className="size-6 text-muted-foreground" />
            </div>
            <p className="font-semibold">No source data yet</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Manual logs, organizer event requests, and public inquiries will appear here.
            </p>
          </div>
        ) : (
          <div className="grid min-w-0 items-center gap-3 sm:grid-cols-[minmax(128px,0.9fr)_minmax(112px,1.1fr)] sm:gap-2">
            <ChartContainer className="mx-auto aspect-square w-full max-w-[230px]" config={chartConfig}>
              <PieChart accessibilityLayer>
                <Pie
                  cornerRadius={8}
                  data={chartData}
                  dataKey="share"
                  innerRadius="48%"
                  nameKey="source"
                  outerRadius="88%"
                  stroke="hsl(var(--card))"
                  strokeWidth={4}
                >
                  <LabelList
                    className="fill-background font-medium"
                    dataKey="share"
                    fontWeight={500}
                    formatter={(label) => {
                      const n = Number(label)
                      return Number.isFinite(n) && n > 0 ? `${n}%` : ''
                    }}
                    position="inside"
                    stroke="none"
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
            <ul aria-label="Booking request source legend" className="grid min-w-0 gap-2">
              {data.map((row) => (
                <li key={row.source} className="flex min-w-0 items-center justify-between gap-2 rounded-lg bg-muted/40 px-2.5 py-2 text-xs">
                  <span className="flex min-w-0 items-center gap-2">
                    <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: sourceColors[row.source] || 'hsl(var(--muted-foreground))' }} />
                    <span className="truncate text-muted-foreground">{labels[row.source] || row.source}</span>
                  </span>
                  <span className="shrink-0 font-medium tabular-nums text-foreground">{row.share}% <span className="font-normal text-muted-foreground">({row.count})</span></span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
