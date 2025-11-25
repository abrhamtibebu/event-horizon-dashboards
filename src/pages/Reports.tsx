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

  return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="group relative overflow-hidden bg-success/5 rounded-2xl shadow-sm border border-success/30 p-6 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-success/15 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-success rounded-xl flex items-center justify-center shadow-md">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-sm font-semibold text-success">Total Revenue</div>
                </div>
                <div className="text-3xl font-bold text-success mb-1">
              ETB {(metrics.total_revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-success font-medium">From all ticket sales</div>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-card rounded-2xl shadow-sm border border-border p-6 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-info/15 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-info rounded-xl flex items-center justify-center">
                <BarChart className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">Total Events</div>
                </div>
            <div className="text-3xl font-bold text-card-foreground mb-1">
              {metrics.total_events || 0}
            </div>
                <div className="text-xs text-muted-foreground/70">Organized events</div>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-card rounded-2xl shadow-sm border border-border p-6 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-[hsl(var(--color-warning))]/15 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[hsl(var(--color-warning))] rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">Total Attendees</div>
                </div>
            <div className="text-3xl font-bold text-card-foreground mb-1">
              {(metrics.total_attendees || 0).toLocaleString()}
            </div>
                <div className="text-xs text-muted-foreground/70">All participants</div>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-info/5 rounded-2xl shadow-sm border border-info/30 p-6 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-info/15 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-info rounded-xl flex items-center justify-center shadow-md">
                    <Ticket className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-sm font-semibold text-info">Tickets Sold</div>
                </div>
                <div className="text-3xl font-bold text-info mb-1">
              {(metrics.total_tickets_sold || 0).toLocaleString()}
                </div>
                <div className="text-xs text-info font-medium">Across all events</div>
              </div>
            </div>
          </div>
    );
  }, [metrics]);

  return (
    <div className="min-h-screen bg-background p-6">
      <Breadcrumbs 
        items={[{ label: 'Reports', href: '/dashboard/reports' }]}
        className="mb-4"
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
        <div className="flex flex-col items-center justify-center py-20">
          <Spinner size="xl" variant="primary" text="Loading reports dashboard..." />
          <div className="text-sm text-muted-foreground mt-2">Gathering comprehensive analytics data</div>
                </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mb-4">
            <BarChart className="w-8 h-8 text-error" />
                </div>
          <div className="text-lg font-medium text-foreground mb-2">Failed to load reports</div>
          <div className="text-muted-foreground mb-6">{error}</div>
          <Button 
            variant="outline" 
            onClick={() => fetchReportData()}
            className="flex items-center gap-2"
          >
            Retry
          </Button>
                  </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
