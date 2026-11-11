import React from 'react';
import { ReportMetrics } from '@/types/reports';
import { formatPercentage } from '@/utils/reportTransformers';

interface PerformanceMetricsProps {
  metrics: ReportMetrics | null;
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ metrics }) => {
  if (!metrics) return null;

  const items = [
    { label: 'Registered', value: (metrics.total_attendees || 0).toLocaleString(), hint: 'Total registered' },
    { label: 'Checked in', value: (metrics.checked_in_attendees || 0).toLocaleString(), hint: 'Actual attendance' },
    { label: 'No-shows', value: (metrics.no_shows || 0).toLocaleString(), hint: 'Did not attend' },
    { label: 'Check-in rate', value: formatPercentage(metrics.check_in_rate || 0), hint: 'Show-up rate' },
  ];

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-base font-semibold text-foreground">Event performance</h2>
      <p className="mt-1 text-sm text-muted-foreground">Attendance and check-in.</p>
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
  );
};
