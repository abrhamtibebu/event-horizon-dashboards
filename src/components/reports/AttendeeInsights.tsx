import React from 'react';
import { ReportMetrics } from '@/types/reports';
import { formatPercentage } from '@/utils/reportTransformers';
import { RevenueLineChart } from './RevenueLineChart';
import { PieChartComponent } from './PieChartComponent';
import { transformTimeline, transformToPieChart, getChartColorPalette } from '@/utils/reportTransformers';

interface AttendeeInsightsProps {
  metrics: ReportMetrics | null;
}

export const AttendeeInsights: React.FC<AttendeeInsightsProps> = ({ metrics }) => {
  if (!metrics) return null;

  const monthlyRegistrations = transformTimeline(
    metrics.registrations_by_month || {},
    'registrations'
  );
  const ageColors = getChartColorPalette('age');
  const ageGroupData = transformToPieChart(
    metrics.age_group_breakdown || {},
    ageColors
  );

  const items = [
    { label: 'New', value: (metrics.new_attendees || 0).toLocaleString(), hint: 'First-time attendees' },
    { label: 'Returning', value: (metrics.returning_attendees || 0).toLocaleString(), hint: `${formatPercentage(metrics.returning_attendees_percentage || 0)} return rate` },
    { label: 'Conversion', value: formatPercentage(metrics.conversion_rate || 0), hint: 'Ticket to attendance' },
    { label: 'Unique', value: (metrics.unique_attendees || 0).toLocaleString(), hint: 'Unique email addresses' },
  ];

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-base font-semibold text-foreground">Attendees and registrations</h2>
        <p className="mt-1 text-sm text-muted-foreground">New, returning, and conversion.</p>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {items.map((item) => (
            <div key={item.label} className="rounded-lg border border-border px-3 py-3">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-xl font-semibold tracking-tight">{item.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground">Monthly registrations</h3>
          <p className="mt-1 text-sm text-muted-foreground">Registrations per month</p>
          <div className="mt-4">
            <RevenueLineChart
              data={monthlyRegistrations}
              dataKey="registrations"
              gradientId="monthlyRegGradient"
            />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground">Age groups</h3>
          <p className="mt-1 text-sm text-muted-foreground">Attendee age breakdown</p>
          <div className="mt-4">
            <PieChartComponent
              data={ageGroupData}
              height={300}
              colorPalette="age"
              emptyMessage="No age data available"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
