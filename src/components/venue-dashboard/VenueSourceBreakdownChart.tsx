'use client'

import { LabelList, Pie, PieChart } from 'recharts'
import { PieChart as PieIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { type ChartConfig, ChartContainer, ChartLegend, ChartLegendContent } from '@/components/ui/chart'
import type { VenueDashboardSourceShare } from '@/lib/api/venues'

const labels: Record<string, string> = {
  manual: 'Manual',
  event_request: 'Event request',
  public_request: 'Public request',
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
      <CardContent className="my-auto">
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
          <ChartContainer className="mx-auto aspect-square max-h-72 w-full" config={chartConfig}>
            <PieChart accessibilityLayer>
              <Pie
                cornerRadius={8}
                data={chartData}
                dataKey="share"
                innerRadius={36}
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
              <ChartLegend
                content={<ChartLegendContent nameKey="source" />}
                className="-translate-y-1 flex-wrap gap-2 [&>*]:basis-1/3 [&>*]:justify-center"
              />
            </PieChart>
          </ChartContainer>
        )}
        {total > 0 ? (
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {data.map((row) => (
              <li key={row.source} className="flex justify-between gap-2">
                <span>{labels[row.source] || row.source}</span>
                <span className="tabular-nums text-foreground">{row.count}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  )
}
