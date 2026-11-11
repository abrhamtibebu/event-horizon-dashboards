import React from 'react';
import { ReportMetrics } from '@/types/reports';
import { formatCurrency, formatPercentage } from '@/utils/reportTransformers';

interface ExecutiveSummaryProps {
  metrics: ReportMetrics | null;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ metrics }) => {
  if (!metrics) return null;

  const checkInRate = metrics.check_in_rate || 0;
  const loyaltyRate = metrics.returning_attendees_percentage || 0;

  const items = [
    { label: 'Check-in rate', value: formatPercentage(checkInRate), hint: 'Show-up performance' },
    { label: 'Avg revenue / event', value: formatCurrency(metrics.average_revenue_per_event || 0), hint: 'Financial efficiency' },
    { label: 'Return rate', value: formatPercentage(loyaltyRate), hint: 'Returning attendees' },
    { label: 'Events', value: (metrics.total_events || 0).toLocaleString(), hint: 'Organized events' },
  ];

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-base font-semibold text-foreground">Summary</h2>
      <p className="mt-1 text-sm text-muted-foreground">Check-in, revenue, and returning attendees.</p>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-lg border border-border px-3 py-3">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-xl font-semibold tracking-tight">{item.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
        <p>Check-in rate is {formatPercentage(checkInRate)}.</p>
        <p>
          Average ticket price is {formatCurrency(metrics.average_ticket_price || 0)} across{' '}
          {(metrics.total_tickets_sold || 0).toLocaleString()} sales.
        </p>
        <p>
          {(metrics.new_attendees || 0).toLocaleString()} new attendees, {formatPercentage(loyaltyRate)} return rate.
        </p>
      </div>
    </section>
  );
};
