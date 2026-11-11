import React from 'react';
import { ReportMetrics } from '@/types/reports';
import { formatCurrency } from '@/utils/reportTransformers';

interface FinancialMetricsProps {
  metrics: ReportMetrics | null;
}

export const FinancialMetrics: React.FC<FinancialMetricsProps> = ({ metrics }) => {
  if (!metrics) return null;

  const topAttendance = metrics.top_events_by_attendance
    ? Math.max(...Object.values(metrics.top_events_by_attendance), 0)
    : 0;

  const items = [
    { label: 'Avg revenue', value: formatCurrency(metrics.average_revenue_per_event || 0), hint: 'Per event' },
    { label: 'Avg price', value: formatCurrency(metrics.average_ticket_price || 0), hint: 'Per ticket' },
    { label: 'Avg attendees', value: (metrics.average_attendees_per_event || 0).toLocaleString(), hint: 'Per event' },
    { label: 'Peak attendance', value: topAttendance.toLocaleString(), hint: 'Highest single event' },
  ];

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-base font-semibold text-foreground">Financial performance</h2>
      <p className="mt-1 text-sm text-muted-foreground">Revenue and ticket sales.</p>
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
