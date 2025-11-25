import React from 'react';
import { Globe, Users, LucidePieChart, Star } from 'lucide-react';
import { ReportMetrics, TopEvent } from '@/types/reports';
import { PieChartComponent } from './PieChartComponent';
import { RevenueLineChart } from './RevenueLineChart';
import { transformToPieChart, transformTimeline, transformTopEvents, CHART_COLORS, getChartColorPalette } from '@/utils/reportTransformers';
import { formatCurrency } from '@/utils/reportTransformers';

interface DemographicsSectionProps {
  metrics: ReportMetrics | null;
  topEvents: TopEvent[];
  eventIdToName: Record<string, string>;
}

export const DemographicsSection: React.FC<DemographicsSectionProps> = ({
  metrics,
  topEvents,
  eventIdToName,
}) => {
  if (!metrics) return null;

  // Get theme-aware colors dynamically
  const primaryColors = getChartColorPalette('primary');
  
  const guestTypeData = transformToPieChart(metrics.guest_type_breakdown || {}, primaryColors);
  const eventTypeData = transformToPieChart(metrics.event_type_breakdown || {}, primaryColors);
  const countryData = transformToPieChart(metrics.country_breakdown || {}, primaryColors);
  const genderData = transformToPieChart(metrics.gender_breakdown || {}, primaryColors);
  const registrationTimeline = transformTimeline(metrics.registration_timeline || {}, 'attendees');

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Attendee Registrations Over Time</h3>
              <p className="text-sm text-muted-foreground">Registration growth trends</p>
            </div>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
          </div>
          <RevenueLineChart
            data={registrationTimeline}
            dataKey="attendees"
            gradientId="attendeeGradient"
          />
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Event Types Distribution</h3>
              <p className="text-sm text-muted-foreground">Distribution of events by type</p>
            </div>
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <LucidePieChart className="w-4 h-4 text-white" />
            </div>
          </div>
          <PieChartComponent
            data={eventTypeData}
            height={320}
            innerRadius={80}
            outerRadius={140}
            colorPalette="primary"
            emptyMessage="No event type data available"
          />
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Top Performing Events by Attendance</h3>
            <p className="text-sm text-muted-foreground">Best performing events by attendee count</p>
          </div>
          <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
            <Star className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topEvents.length === 0 ? (
            <div className="text-muted-foreground col-span-full text-center py-8">
              No top events found.
            </div>
          ) : (
            topEvents.map((event, index) => (
              <div
                key={index}
                className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-xl p-4 border border-blue-100 dark:border-blue-800/50 hover:shadow-md transition-all duration-300"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 opacity-10 dark:opacity-20 rounded-full -translate-y-6 translate-x-6"></div>
                <div className="relative">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-semibold text-foreground text-sm leading-tight">{event.name}</h4>
                    {event.satisfaction && (
                      <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded-full">
                        <span className="text-xs text-yellow-600 dark:text-yellow-400">★</span>
                        <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
                          {event.satisfaction}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Attendees:</span>
                      <span className="font-medium text-foreground">
                        {event.attendees?.toLocaleString?.() ?? event.attendees}
                      </span>
                    </div>
                    {event.revenue && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Revenue:</span>
                        <span className="font-medium text-foreground">
                          {formatCurrency(event.revenue)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Guest Type Distribution</h3>
              <p className="text-sm text-muted-foreground">Attendee category breakdown</p>
            </div>
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <LucidePieChart className="w-4 h-4 text-white" />
            </div>
          </div>
          <PieChartComponent
            data={guestTypeData}
            height={280}
            colorPalette="primary"
            emptyMessage="No guest type data available"
          />
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Geographic Distribution</h3>
              <p className="text-sm text-muted-foreground">Country breakdown</p>
            </div>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Globe className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="space-y-3">
            {countryData.length === 0 ? (
              <div className="text-muted-foreground text-center py-8">No country data available.</div>
            ) : (
              countryData.map((item) => (
                <div key={item.name} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm font-medium text-foreground flex-1">{item.name}</span>
                  <div className="h-2 bg-muted rounded-full flex-1 max-w-xs">
                    <div
                      style={{
                        width: `${(item.value / Math.max(...countryData.map(d => d.value))) * 100}%`,
                        backgroundColor: item.color,
                      }}
                      className="h-2 rounded-full transition-all duration-300"
                    />
                  </div>
                  <span className="text-sm font-semibold text-foreground ml-3">
                    {item.value.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Gender Breakdown</h3>
            <p className="text-sm text-muted-foreground">Gender distribution</p>
          </div>
          <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center">
            <Users className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="space-y-3">
          {genderData.length === 0 ? (
            <div className="text-muted-foreground text-center py-8">No gender data available.</div>
          ) : (
            genderData.map((item) => (
              <div key={item.name} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm font-medium text-foreground flex-1">{item.name}</span>
                <div className="h-2 bg-muted rounded-full flex-1 max-w-xs">
                  <div
                    style={{
                      width: `${(item.value / Math.max(...genderData.map(d => d.value))) * 100}%`,
                      backgroundColor: item.color,
                    }}
                    className="h-2 rounded-full transition-all duration-300"
                  />
                </div>
                <span className="text-sm font-semibold text-foreground ml-3">
                  {item.value.toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

