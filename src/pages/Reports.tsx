import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Award, BarChart, DollarSign, Users, CheckCircle, TrendingUp, Ticket, Globe } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { getOrganizerReport } from '@/lib/api';
import api from '@/lib/api';
import { useModernAlerts } from '@/hooks/useModernAlerts';
import { usePermissionCheck } from '@/hooks/use-permission-check';
import { ProtectedButton } from '@/components/ProtectedButton';
import { ReportMetrics, Event, TopEvent, ReportSection, DEFAULT_VISIBLE_REPORTS } from '@/types/reports';
import { 
  transformTopEvents, 
  safeGetLocalStorage, 
  safeSetLocalStorage 
} from '@/utils/reportTransformers';
import { Card, CardContent } from '@/components/ui/card';
import { ReportsHeader } from '@/components/reports/ReportsHeader';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { ExecutiveSummary } from '@/components/reports/ExecutiveSummary';
import { PerformanceMetrics } from '@/components/reports/PerformanceMetrics';
import { FinancialMetrics } from '@/components/reports/FinancialMetrics';
import { AttendeeInsights } from '@/components/reports/AttendeeInsights';
import { EngagementReports } from '@/components/reports/EngagementReports';
import { RevenueCharts } from '@/components/reports/RevenueCharts';
import { DemographicsSection } from '@/components/reports/DemographicsSection';

// Report sections configuration
const REPORT_SECTIONS: ReportSection[] = [
  { id: 'executive', label: 'Executive Summary', icon: Award },
  { id: 'performance', label: 'Event Performance', icon: BarChart },
  { id: 'financial', label: 'Financial Performance', icon: DollarSign },
  { id: 'attendee', label: 'Attendee & Registration', icon: Users },
  { id: 'engagement', label: 'Engagement & Interaction', icon: CheckCircle },
  { id: 'revenue', label: 'Revenue Analytics', icon: TrendingUp },
  { id: 'demographics', label: 'Demographics', icon: Globe },
];

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<ReportMetrics | null>(null);
  const { checkPermission } = usePermissionCheck();
  const [topEvents, setTopEvents] = useState<TopEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [eventsList, setEventsList] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [exporting, setExporting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [eventIdToName, setEventIdToName] = useState<Record<string, string>>({});

  // Report visibility state with safe localStorage access
  const [visibleReports, setVisibleReports] = useState<Set<string>>(() => {
    return new Set(safeGetLocalStorage<string[]>('visibleReports', DEFAULT_VISIBLE_REPORTS));
  });

  const { showError, showSuccess } = useModernAlerts();

  // Toggle report visibility
  const toggleReportVisibility = useCallback((reportId: string) => {
    setVisibleReports((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(reportId)) {
        newSet.delete(reportId);
      } else {
        newSet.add(reportId);
      }
      safeSetLocalStorage('visibleReports', Array.from(newSet));
      return newSet;
    });
  }, []);

  // Select/Deselect all reports
  const toggleAllReports = useCallback((checked: boolean) => {
    if (checked) {
      const allIds = REPORT_SECTIONS.map(s => s.id);
      setVisibleReports(new Set(allIds));
      safeSetLocalStorage('visibleReports', allIds);
    } else {
      setVisibleReports(new Set());
      safeSetLocalStorage('visibleReports', []);
    }
  }, []);

  // Helper to download a file from a blob
  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }, []);

  // Export CSV handler
  const handleExportCSV = useCallback(async () => {
    if (!checkPermission('reports.export', 'export reports')) {
      return;
    }
    setExporting(true);
    try {
      const url = selectedEventId === 'all'
        ? '/reports/summary/export'
        : `/events/${selectedEventId}/report/export`;
      const filename = selectedEventId === 'all'
        ? 'global_report.csv'
        : `event_${selectedEventId}_report.csv`;
      
      const res = await api.get(url, { responseType: 'blob' });
      downloadBlob(res.data, filename);
      showSuccess('Export Complete', 'CSV file downloaded successfully');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to export CSV.';
      showError('Export Failed', errorMessage);
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  }, [selectedEventId, downloadBlob, showError, showSuccess]);

  // Generate PDF handler
  const handleGeneratePDF = useCallback(async () => {
    if (!checkPermission('reports.export', 'export reports')) {
      return;
    }
    setGenerating(true);
    try {
      const url = selectedEventId === 'all'
        ? '/reports/summary/export-pdf'
        : `/events/${selectedEventId}/report/export-pdf`;
      const filename = selectedEventId === 'all'
        ? 'global_report.pdf'
        : `event_${selectedEventId}_report.pdf`;
      
      const res = await api.get(url, { responseType: 'blob' });
      downloadBlob(res.data, filename);
      showSuccess('PDF Generated', 'PDF report downloaded successfully');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to generate PDF.';
      showError('PDF Generation Failed', errorMessage);
      console.error('PDF generation error:', err);
    } finally {
      setGenerating(false);
    }
  }, [selectedEventId, downloadBlob, showError, showSuccess]);

  // Fetch events list
  useEffect(() => {
    let isMounted = true;
    
    api.get('/events')
      .then(res => {
        if (!isMounted) return;
        const eventsData = res.data.data || res.data || [];
        setEventsList(Array.isArray(eventsData) ? eventsData : []);
      })
      .catch(err => {
        if (!isMounted) return;
        console.error('Failed to fetch events:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch report data
  const fetchReportData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
    setLoading(true);
    }
    setError(null);

    try {
      let analyticsPromise: Promise<any[]>;
      
    if (selectedEventId === 'all') {
      analyticsPromise = Promise.all([
        getOrganizerReport(),
        api.get('/events'),
      ]);
    } else {
      analyticsPromise = Promise.all([
        api.get(`/events/${selectedEventId}/report`),
        api.get(`/events/${selectedEventId}`),
      ]);
    }

      const [res, eventsRes] = await analyticsPromise;
      
      // Build event ID to name map
      const eventMap: Record<string, string> = {};
        if (selectedEventId === 'all') {
        const eventsData = Array.isArray(eventsRes.data) ? eventsRes.data : [];
        eventsData.forEach((event: Event) => {
          eventMap[String(event.id)] = event.name;
          });
        } else {
        eventMap[String(eventsRes.data.id)] = eventsRes.data.name;
      }
      setEventIdToName(eventMap);

      // Set metrics
      setMetrics(res.data as ReportMetrics);

      // Transform top events
      const topEventsData = selectedEventId === 'all'
        ? transformTopEvents(res.data.top_events_by_attendance || {}, eventMap)
        : [{
            name: eventMap[selectedEventId] || 'This Event',
              attendees: res.data.total_attendees || 0,
            }];
      setTopEvents(topEventsData);

      if (isRefresh) {
        showSuccess('Data Refreshed', 'Report data has been updated');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message 
        || err.message 
        || 'Failed to load report data. Please try again.';
      setError(errorMessage);
      showError('Failed to Load Reports', errorMessage);
      console.error('Report fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedEventId, showError, showSuccess]);

  // Fetch data on mount and when event changes
  useEffect(() => {
    fetchReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId]); // fetchReportData is recreated when selectedEventId changes

  // Refresh handler
  const handleRefresh = useCallback(() => {
    fetchReportData(true);
  }, [fetchReportData]);

  // Key metrics cards
  const keyMetrics = useMemo(() => {
    if (!metrics) return null;

    const cards = [
      {
        id: 'revenue',
        label: 'Total Revenue',
        value: `ETB ${(metrics.total_revenue || 0).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        hint: 'From ticket sales',
        icon: DollarSign,
      },
      {
        id: 'events',
        label: 'Total Events',
        value: (metrics.total_events || 0).toLocaleString(),
        hint: 'Organized events',
        icon: BarChart,
      },
      {
        id: 'attendees',
        label: 'Total Attendees',
        value: (metrics.total_attendees || 0).toLocaleString(),
        hint: 'Registered participants',
        icon: Users,
      },
      {
        id: 'tickets',
        label: 'Tickets Sold',
        value: (metrics.total_tickets_sold || 0).toLocaleString(),
        hint: 'Across all events',
        icon: Ticket,
      },
    ];

  return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.id} className="border-border/80">
              <CardContent className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {card.label}
                  </p>
                  <div className="rounded-md bg-muted p-2 text-muted-foreground">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-2xl font-semibold tracking-tight text-foreground">{card.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }, [metrics]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-7xl space-y-5 p-4 md:p-6">
        <Breadcrumbs 
          items={[{ label: 'Reports', href: '/dashboard/reports' }]}
          className="mb-1"
        />
        
        <ReportsHeader
          selectedEventId={selectedEventId}
          onEventChange={setSelectedEventId}
          eventsList={eventsList}
          onExportCSV={handleExportCSV}
          onExportPDF={handleGeneratePDF}
          onRefresh={handleRefresh}
          exporting={exporting}
          generating={generating}
          refreshing={refreshing}
        />

        <ReportFilters
          reportSections={REPORT_SECTIONS}
          visibleReports={visibleReports}
          onToggleReport={toggleReportVisibility}
          onToggleAll={toggleAllReports}
        />

        {loading ? (
          <Card className="border-border/80">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Spinner size="xl" variant="primary" text="Loading reports..." />
              <div className="mt-2 text-sm text-muted-foreground">
                Gathering analytics for your selected scope
              </div>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="border-border/80">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error/10">
                <BarChart className="h-6 w-6 text-error" />
              </div>
              <div className="mb-1 text-lg font-medium text-foreground">Failed to load reports</div>
              <div className="mb-5 text-sm text-muted-foreground">{error}</div>
              <Button 
                variant="outline" 
                onClick={() => fetchReportData()}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5">
            {keyMetrics}
            
            {visibleReports.has('executive') && <ExecutiveSummary metrics={metrics} />}
            {visibleReports.has('performance') && <PerformanceMetrics metrics={metrics} />}
            {visibleReports.has('financial') && <FinancialMetrics metrics={metrics} />}
            {visibleReports.has('attendee') && <AttendeeInsights metrics={metrics} />}
            {visibleReports.has('engagement') && <EngagementReports metrics={metrics} />}
            {visibleReports.has('revenue') && <RevenueCharts metrics={metrics} />}
            {visibleReports.has('demographics') && (
              <DemographicsSection
                metrics={metrics}
                topEvents={topEvents}
                eventIdToName={eventIdToName}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
