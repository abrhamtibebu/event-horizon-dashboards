import React from 'react';
import { BarChart, Users, CheckCircle, XCircle, Percent } from 'lucide-react';
import { ReportMetrics } from '@/types/reports';
import { formatPercentage } from '@/utils/reportTransformers';

interface PerformanceMetricsProps {
  metrics: ReportMetrics | null;
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ metrics }) => {
  if (!metrics) return null;

  return (
    <div className="bg-gradient-to-br from-blue-500/5 to-indigo-500/5 dark:from-background dark:to-muted/30 rounded-2xl shadow-sm border border-blue-200 dark:border-blue-700/50 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-blue-900 dark:text-blue-300 flex items-center">
            <BarChart className="w-6 h-6 mr-2" />
            Event Performance Overview
          </h2>
          <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">Comprehensive attendance and engagement metrics</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl shadow-sm border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 text-blue-500" />
            <span className="text-xs font-medium text-muted-foreground">REGISTERED</span>
          </div>
          <div className="text-2xl font-bold text-card-foreground">
            {(metrics.total_attendees || 0).toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground/70 mt-1">Total registered</div>
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <span className="text-xs font-medium text-muted-foreground">CHECKED-IN</span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {(metrics.checked_in_attendees || 0).toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground/70 mt-1">Actual attendance</div>
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <XCircle className="w-8 h-8 text-red-500" />
            <span className="text-xs font-medium text-muted-foreground">NO-SHOWS</span>
          </div>
          <div className="text-2xl font-bold text-red-600">
            {(metrics.no_shows || 0).toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground/70 mt-1">Did not attend</div>
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <Percent className="w-8 h-8 text-purple-500" />
            <span className="text-xs font-medium text-muted-foreground">CHECK-IN RATE</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {formatPercentage(metrics.check_in_rate || 0)}
          </div>
          <div className="text-xs text-muted-foreground/70 mt-1">Show-up rate</div>
        </div>
      </div>
    </div>
  );
};




















