import React from 'react';
import { DollarSign, Ticket, Users, TrendingUp } from 'lucide-react';
import { ReportMetrics } from '@/types/reports';
import { formatCurrency } from '@/utils/reportTransformers';

interface FinancialMetricsProps {
  metrics: ReportMetrics | null;
}

export const FinancialMetrics: React.FC<FinancialMetricsProps> = ({ metrics }) => {
  if (!metrics) return null;

  const topAttendance = metrics.top_events_by_attendance
    ? Math.max(...Object.values(metrics.top_events_by_attendance))
    : 0;

  return (
    <div className="bg-gradient-to-br from-green-500/5 to-emerald-500/5 dark:from-background dark:to-muted/30 rounded-2xl shadow-sm border border-green-200 dark:border-green-700/50 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-green-900 dark:text-green-300 flex items-center">
            <DollarSign className="w-6 h-6 mr-2" />
            Financial Performance Summary
          </h2>
          <p className="text-sm text-green-700 dark:text-green-400 mt-1">Revenue and ticket sales breakdown</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl shadow-sm border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 text-green-500" />
            <span className="text-xs font-medium text-muted-foreground">AVG REVENUE</span>
          </div>
          <div className="text-2xl font-bold text-card-foreground">
            {formatCurrency(metrics.average_revenue_per_event || 0)}
          </div>
          <div className="text-xs text-muted-foreground/70 mt-1">Per event</div>
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <Ticket className="w-8 h-8 text-indigo-500" />
            <span className="text-xs font-medium text-muted-foreground">AVG PRICE</span>
          </div>
          <div className="text-2xl font-bold text-card-foreground">
            {formatCurrency(metrics.average_ticket_price || 0)}
          </div>
          <div className="text-xs text-muted-foreground/70 mt-1">Per ticket</div>
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 text-purple-500" />
            <span className="text-xs font-medium text-muted-foreground">AVG ATTENDEES</span>
          </div>
          <div className="text-2xl font-bold text-card-foreground">
            {metrics.average_attendees_per_event || 0}
          </div>
          <div className="text-xs text-muted-foreground/70 mt-1">Per event</div>
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-orange-500" />
            <span className="text-xs font-medium text-muted-foreground">PEAK</span>
          </div>
          <div className="text-2xl font-bold text-card-foreground">
            {topAttendance.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground/70 mt-1">Highest attendance</div>
        </div>
      </div>
    </div>
  );
};




















