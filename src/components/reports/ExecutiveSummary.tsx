import React from 'react';
import { Award, Target, DollarSign, Users, TrendingUp, CheckCircle } from 'lucide-react';
import { ReportMetrics } from '@/types/reports';
import { formatCurrency, formatPercentage } from '@/utils/reportTransformers';

interface ExecutiveSummaryProps {
  metrics: ReportMetrics | null;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ metrics }) => {
  if (!metrics) return null;

  const checkInRate = metrics.check_in_rate || 0;
  const avgRevenue = metrics.average_revenue_per_event || 0;
  const loyaltyRate = metrics.returning_attendees_percentage || 0;

  return (
    <div className="bg-info/10 dark:bg-info/20 rounded-2xl shadow-lg border-2 border-info/30 p-8 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-info flex items-center">
            <Award className="w-7 h-7 mr-3" />
            Executive Summary
          </h2>
          <p className="text-sm text-info mt-2">Key performance indicators and ROI analysis at a glance</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-xl shadow-sm border-2 border-green-200 dark:border-green-700/50 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center space-x-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
              <TrendingUp className="w-3 h-3" />
              <span>High</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-green-700 dark:text-green-400 mb-1">
            {formatPercentage(checkInRate)}
          </div>
          <div className="text-xs text-muted-foreground font-medium">Success Rate</div>
          <div className="text-xs text-muted-foreground/70 mt-1">Check-in performance</div>
        </div>

        <div className="bg-card rounded-xl shadow-sm border-2 border-purple-200 dark:border-purple-700/50 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center space-x-1 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded-full">
              <TrendingUp className="w-3 h-3" />
              <span>ROI</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-purple-700 dark:text-purple-400 mb-1">
            {formatCurrency(avgRevenue)}
          </div>
          <div className="text-xs text-muted-foreground font-medium">Avg Revenue/Event</div>
          <div className="text-xs text-muted-foreground/70 mt-1">Financial efficiency</div>
        </div>

        <div className="bg-card rounded-xl shadow-sm border-2 border-blue-200 dark:border-blue-700/50 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center space-x-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">
              <TrendingUp className="w-3 h-3" />
              <span>Good</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-700 dark:text-blue-400 mb-1">
            {formatPercentage(loyaltyRate)}
          </div>
          <div className="text-xs text-muted-foreground font-medium">Loyalty Rate</div>
          <div className="text-xs text-muted-foreground/70 mt-1">Returning attendees</div>
        </div>

        <div className="bg-card rounded-xl shadow-sm border-2 border-orange-200 dark:border-orange-700/50 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center space-x-1 text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-2 py-1 rounded-full">
              <Target className="w-3 h-3" />
              <span>Active</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-orange-700 dark:text-orange-400 mb-1">
            {metrics.total_events || 0}
          </div>
          <div className="text-xs text-muted-foreground font-medium">Events Organized</div>
          <div className="text-xs text-muted-foreground/70 mt-1">Total portfolio</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg p-4 border border-green-200 dark:border-green-800/50">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-green-900 dark:text-green-300 text-sm mb-1">Strong Performance</h4>
              <p className="text-xs text-green-700 dark:text-green-400 leading-relaxed">
                {checkInRate > 75
                  ? `Excellent ${formatPercentage(checkInRate)} check-in rate indicates great event engagement`
                  : `${formatPercentage(checkInRate)} check-in rate - room for improvement in attendee show-up`}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-lg p-4 border border-purple-200 dark:border-purple-800/50">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-purple-900 dark:text-purple-300 text-sm mb-1">Revenue Health</h4>
              <p className="text-xs text-purple-700 dark:text-purple-400 leading-relaxed">
                Average {formatCurrency(metrics.average_ticket_price || 0)} per ticket across{' '}
                {(metrics.total_tickets_sold || 0).toLocaleString()} sales
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800/50">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 dark:text-blue-300 text-sm mb-1">Audience Growth</h4>
              <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                {(metrics.new_attendees || 0).toLocaleString()} new attendees with{' '}
                {formatPercentage(loyaltyRate)} return rate
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};




















