import React from 'react';
import { CheckCircle, TrendingUp, Calendar } from 'lucide-react';
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
  ).slice(0, 10); // Top 10 hours
  const monthlyEvents = transformToBarChart(metrics.events_by_month || {}, CHART_COLORS.primary);

  return (
    <>
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 rounded-2xl shadow-sm border border-orange-100 dark:border-orange-800/50 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-orange-900 dark:text-orange-300 flex items-center">
              <CheckCircle className="w-6 h-6 mr-2" />
              Engagement & Interaction Insights
            </h2>
            <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
              Check-in patterns, peak hours, and event organization trends
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Check-In Activity Over Time</h3>
              <p className="text-sm text-muted-foreground">Daily check-in patterns</p>
            </div>
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
          </div>
          <RevenueLineChart
            data={dailyCheckIns}
            dataKey="checkIns"
            gradientId="checkInGradient"
          />
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Peak Check-In Hours</h3>
              <p className="text-sm text-muted-foreground">Most active check-in times</p>
            </div>
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
          </div>
          <BarChartComponent
            data={peakCheckInHours}
            emptyMessage="No check-in hour data available"
          />
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Event Organization Timeline</h3>
            <p className="text-sm text-muted-foreground">Number of events organized per month</p>
          </div>
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <Calendar className="w-4 h-4 text-white" />
          </div>
        </div>
        <BarChartComponent
          data={monthlyEvents}
          height={350}
          showGradient
          gradientId="eventsBarGradient"
          emptyMessage="No event organization data available"
        />
      </div>
    </>
  );
};

