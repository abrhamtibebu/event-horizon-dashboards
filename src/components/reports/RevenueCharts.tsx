import React from 'react';
import { ReportMetrics } from '@/types/reports';
import { RevenueLineChart } from './RevenueLineChart';
import { PieChartComponent } from './PieChartComponent';
import { BarChartComponent } from './BarChartComponent';
import { transformTimeline, transformToBarChart, transformTicketsByType, CHART_COLORS } from '@/utils/reportTransformers';

interface RevenueChartsProps {
  metrics: ReportMetrics | null;
}

export const RevenueCharts: React.FC<RevenueChartsProps> = ({ metrics }) => {
  if (!metrics) return null;

  const revenueTimeline = transformTimeline(metrics.revenue_timeline || {}, 'revenue');
  const eventTypeRevenue = transformToBarChart(
    metrics.revenue_by_event_type || {},
    CHART_COLORS.revenue
  );
  const ticketTypeData = transformTicketsByType(metrics.tickets_by_type || {}, CHART_COLORS.tickets);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <div className="rounded-xl border border-border bg-card p-5 xl:col-span-2">
        <h3 className="text-base font-semibold text-foreground">Revenue over time</h3>
        <p className="mt-1 text-sm text-muted-foreground">Daily revenue</p>
        <div className="mt-4">
          <RevenueLineChart
            data={revenueTimeline}
            dataKey="revenue"
            gradientId="revenueGradient"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground">Revenue by event type</h3>
          <p className="mt-1 text-sm text-muted-foreground">By category</p>
          <div className="mt-4">
            <BarChartComponent
              data={eventTypeRevenue}
              height={220}
              showGradient
              gradientId="revenueBarGradient"
              emptyMessage="No revenue data available"
              dataKey="value"
            />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground">Tickets by type</h3>
          <p className="mt-1 text-sm text-muted-foreground">Sold tickets</p>
          <div className="mt-4">
            <PieChartComponent
              data={ticketTypeData}
              height={220}
              colorPalette="tickets"
              emptyMessage="No ticket data available"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
