import React from 'react';
import { Users, RefreshCw, CheckCircle } from 'lucide-react';
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
  // Get theme-aware colors dynamically - PieChartComponent will use its own colors, but this ensures data consistency
  const ageColors = getChartColorPalette('age');
  const ageGroupData = transformToPieChart(
    metrics.age_group_breakdown || {},
    ageColors
  );

  return (
    <>
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-2xl shadow-sm border border-purple-100 dark:border-purple-800/50 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-purple-900 dark:text-purple-300 flex items-center">
              <Users className="w-6 h-6 mr-2" />
              Attendee & Registration Insights
            </h2>
            <p className="text-sm text-purple-700 dark:text-purple-400 mt-1">
              Demographics, registration patterns, and conversion metrics
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl shadow-sm border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-green-500" />
              <span className="text-xs font-medium text-muted-foreground">NEW</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {(metrics.new_attendees || 0).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground/70 mt-1">First-time attendees</div>
          </div>

          <div className="bg-card rounded-xl shadow-sm border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <RefreshCw className="w-8 h-8 text-blue-500" />
              <span className="text-xs font-medium text-muted-foreground">RETURNING</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {(metrics.returning_attendees || 0).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground/70 mt-1">
              {formatPercentage(metrics.returning_attendees_percentage || 0)} return rate
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-sm border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-purple-500" />
              <span className="text-xs font-medium text-muted-foreground">CONVERSION</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {formatPercentage(metrics.conversion_rate || 0)}
            </div>
            <div className="text-xs text-muted-foreground/70 mt-1">Ticket to attendance</div>
          </div>

          <div className="bg-card rounded-xl shadow-sm border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-orange-500" />
              <span className="text-xs font-medium text-muted-foreground">UNIQUE</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {(metrics.unique_attendees || 0).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground/70 mt-1">Unique email addresses</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Monthly Registration Trend</h3>
              <p className="text-sm text-muted-foreground">Registrations per month</p>
            </div>
          </div>
          <RevenueLineChart
            data={monthlyRegistrations}
            dataKey="registrations"
            gradientId="monthlyRegGradient"
          />
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Age Group Distribution</h3>
              <p className="text-sm text-muted-foreground">Attendee demographics by age</p>
            </div>
          </div>
          <PieChartComponent
            data={ageGroupData}
            height={300}
            colorPalette="age"
            emptyMessage="No age data available"
          />
        </div>
      </div>
    </>
  );
};

