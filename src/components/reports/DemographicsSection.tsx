import React from 'react';
import { ReportMetrics, TopEvent } from '@/types/reports';
import { PieChartComponent } from './PieChartComponent';
import { RevenueLineChart } from './RevenueLineChart';
import { transformToPieChart, transformTimeline, getChartColorPalette } from '@/utils/reportTransformers';
import { formatCurrency } from '@/utils/reportTransformers';

interface DemographicsSectionProps {
  metrics: ReportMetrics | null;
  topEvents: TopEvent[];
  eventIdToName: Record<string, string>;
}

export const DemographicsSection: React.FC<DemographicsSectionProps> = ({
  metrics,
  topEvents,
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
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground">Registrations over time</h3>
          <p className="mt-1 text-sm text-muted-foreground">Registration growth</p>
          <div className="mt-4">
            <RevenueLineChart
              data={registrationTimeline}
              dataKey="attendees"
              gradientId="attendeeGradient"
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground">Event types</h3>
          <p className="mt-1 text-sm text-muted-foreground">Distribution by type</p>
          <div className="mt-4">
            <PieChartComponent
              data={eventTypeData}
              height={280}
              innerRadius={70}
              outerRadius={110}
              colorPalette="primary"
              emptyMessage="No event type data available"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-base font-semibold text-foreground">Top events by attendance</h3>
        <p className="mt-1 text-sm text-muted-foreground">Highest attendance</p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {topEvents.length === 0 ? (
            <div className="col-span-full py-8 text-center text-sm text-muted-foreground">
              No top events found.
            </div>
          ) : (
            topEvents.map((event, index) => (
              <div key={index} className="rounded-lg border border-border px-3 py-3">
                <h4 className="text-sm font-semibold text-foreground">{event.name}</h4>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-muted-foreground">Attendees</span>
                  <span className="font-medium text-foreground">
                    {event.attendees?.toLocaleString?.() ?? event.attendees}
                  </span>
                </div>
                {event.revenue ? (
                  <div className="mt-1 flex justify-between text-sm">
                    <span className="text-muted-foreground">Revenue</span>
                    <span className="font-medium text-foreground">{formatCurrency(event.revenue)}</span>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground">Guest types</h3>
          <p className="mt-1 text-sm text-muted-foreground">Attendee categories</p>
          <div className="mt-4">
            <PieChartComponent
              data={guestTypeData}
              height={280}
              colorPalette="primary"
              emptyMessage="No guest type data available"
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground">Countries</h3>
          <p className="mt-1 text-sm text-muted-foreground">Where attendees are from</p>
          <div className="mt-4 space-y-3">
            {countryData.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No country data available.</div>
            ) : (
              countryData.map((item) => (
                <div key={item.name} className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="flex-1 text-sm font-medium text-foreground">{item.name}</span>
                  <div className="h-2 max-w-xs flex-1 rounded-full bg-muted">
                    <div
                      style={{
                        width: `${(item.value / Math.max(...countryData.map(d => d.value))) * 100}%`,
                        backgroundColor: item.color,
                      }}
                      className="h-2 rounded-full"
                    />
                  </div>
                  <span className="ml-3 text-sm font-semibold text-foreground">
                    {item.value.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-base font-semibold text-foreground">Gender</h3>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">Gender distribution</p>
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
    </div>
  );
};

