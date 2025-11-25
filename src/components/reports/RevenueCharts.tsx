import React from 'react';
import { DollarSign, Ticket } from 'lucide-react';
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
    <>
      <div className="bg-card rounded-2xl shadow-sm border border-green-100 dark:border-green-800/50 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-300">Revenue Over Time</h3>
            <p className="text-sm text-muted-foreground">Daily revenue generation trends</p>
          </div>
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-white" />
          </div>
        </div>
        <RevenueLineChart
          data={revenueTimeline}
          dataKey="revenue"
          gradientId="revenueGradient"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Revenue by Event Type</h3>
              <p className="text-sm text-muted-foreground">Financial performance by category</p>
            </div>
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
          </div>
          <BarChartComponent
            data={eventTypeRevenue}
            height={300}
            showGradient
            gradientId="revenueBarGradient"
            emptyMessage="No revenue data available"
            dataKey="value"
          />
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Ticket Sales by Type</h3>
              <p className="text-sm text-muted-foreground">Breakdown of tickets sold</p>
            </div>
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Ticket className="w-4 h-4 text-white" />
            </div>
          </div>
          <PieChartComponent
            data={ticketTypeData}
            height={300}
            colorPalette="tickets"
            emptyMessage="No ticket data available"
          />
        </div>
      </div>
    </>
  );
};

