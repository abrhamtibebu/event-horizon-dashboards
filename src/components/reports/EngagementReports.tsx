import React from 'react';
import { ReportMetrics } from '@/types/reports';
import { RevenueLineChart } from './RevenueLineChart';
import { BarChartComponent } from './BarChartComponent';
import { transformTimeline, transformToBarChart, CHART_COLORS } from '@/utils/reportTransformers';

interface EngagementReportsProps {
  metrics: ReportMetrics | null;
}

export const EngagementReports: React.FC<EngagementReportsProps> = ({ metrics }) => {
  if (!metrics) return null;

  const dailyCheckIns = transformTimeline(metrics.daily_check_ins || {}, 'checkIns');
  const peakCheckInHours = transformToBarChart(
    metrics.peak_check_in_hour || {},
    CHART_COLORS.hours
  ).slice(0, 10);
  const monthlyEvents = transformToBarChart(metrics.events_by_month || {}, CHART_COLORS.primary);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground">Check-in activity</h3>
          <p className="mt-1 text-sm text-muted-foreground">Daily check-ins</p>
          <div className="mt-4">
            <RevenueLineChart
              data={dailyCheckIns}
              dataKey="checkIns"
              gradientId="checkInGradient"
            />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground">Peak check-in hours</h3>
          <p className="mt-1 text-sm text-muted-foreground">Most active hours</p>
          <div className="mt-4">
            <BarChartComponent
              data={peakCheckInHours}
              emptyMessage="No check-in hour data available"
            />
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-base font-semibold text-foreground">Events by month</h3>
        <p className="mt-1 text-sm text-muted-foreground">Events organized each month</p>
        <div className="mt-4">
          <BarChartComponent
            data={monthlyEvents}
            height={280}
            showGradient
            gradientId="eventsBarGradient"
            emptyMessage="No event organization data available"
          />
        </div>
      </div>
    </div>
  );
};
