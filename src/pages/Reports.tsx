import { BarChart, Users, Calendar, MessageSquare, PieChart as LucidePieChart, TrendingUp, Smile, Star, Globe, DollarSign, Ticket, CheckCircle, RefreshCw, Percent, TrendingDown, XCircle, Target, Award, AlertCircle, Filter, Eye, EyeOff } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { DashboardCard } from "@/components/DashboardCard";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Area,
} from "recharts";
import React, { useEffect, useState } from 'react';
import { getOrganizerReport } from '@/lib/api';
import api from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useModernAlerts } from '@/hooks/useModernAlerts';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';

// All data is now fetched from the API - no static mock data

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [topEvents, setTopEvents] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [revenueTimeline, setRevenueTimeline] = useState<any[]>([]);
  const [checkinTimeline, setCheckinTimeline] = useState<any[]>([]);
  const [guestTypeData, setGuestTypeData] = useState<any[]>([]);
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [exporting, setExporting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [eventTypeRevenueData, setEventTypeRevenueData] = useState<any[]>([]);
  const [ticketTypeData, setTicketTypeData] = useState<any[]>([]);
  const [ageGroupData, setAgeGroupData] = useState<any[]>([]);
  const [monthlyRegistrations, setMonthlyRegistrations] = useState<any[]>([]);
  const [dailyCheckIns, setDailyCheckIns] = useState<any[]>([]);
  const [peakCheckInHours, setPeakCheckInHours] = useState<any[]>([]);
  const [monthlyEvents, setMonthlyEvents] = useState<any[]>([]);

  // Report visibility state
  const [visibleReports, setVisibleReports] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('visibleReports');
    return saved ? new Set(JSON.parse(saved)) : new Set([
      'executive',
      'performance',
      'financial',
      'attendee',
      'engagement',
      'revenue_timeline',
      'revenue_charts',
      'demographics'
    ]);
  });

  // Modern alerts system
  const { showError, showSuccess } = useModernAlerts();

  // Report sections configuration
  const reportSections = [
    { id: 'executive', label: 'Executive Summary', icon: Award },
    { id: 'performance', label: 'Event Performance', icon: BarChart },
    { id: 'financial', label: 'Financial Performance', icon: DollarSign },
    { id: 'attendee', label: 'Attendee & Registration', icon: Users },
    { id: 'engagement', label: 'Engagement & Interaction', icon: CheckCircle },
    { id: 'revenue_timeline', label: 'Revenue Timeline', icon: TrendingUp },
    { id: 'revenue_charts', label: 'Revenue & Ticket Charts', icon: Ticket },
    { id: 'demographics', label: 'Demographics & More', icon: Globe },
  ];

  // Toggle report visibility
  const toggleReportVisibility = (reportId: string) => {
    setVisibleReports((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(reportId)) {
        newSet.delete(reportId);
      } else {
        newSet.add(reportId);
      }
      localStorage.setItem('visibleReports', JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  };

  // Select/Deselect all reports
  const toggleAllReports = (checked: boolean) => {
    if (checked) {
      const allIds = reportSections.map(s => s.id);
      setVisibleReports(new Set(allIds));
      localStorage.setItem('visibleReports', JSON.stringify(allIds));
    } else {
      setVisibleReports(new Set());
      localStorage.setItem('visibleReports', JSON.stringify([]));
    }
  };

  // Helper to download a file from a blob
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  // Export CSV handler
  const handleExportCSV = async () => {
    setExporting(true);
    try {
      let url = '';
      let filename = '';
      if (selectedEventId === 'all') {
        url = '/reports/summary/export';
        filename = 'global_report.csv';
      } else {
        url = `/events/${selectedEventId}/report/export`;
        filename = `event_${selectedEventId}_report.csv`;
      }
      const res = await api.get(url, { responseType: 'blob' });
      downloadBlob(res.data, filename);
    } catch (err) {
      showError('Export Failed', 'Failed to export CSV.');
    } finally {
      setExporting(false);
    }
  };

  // Generate PDF handler
  const handleGeneratePDF = async () => {
    setGenerating(true);
    try {
      let url = '';
      let filename = '';
      if (selectedEventId === 'all') {
        url = '/reports/summary/export-pdf';
        filename = 'global_report.pdf';
      } else {
        url = `/events/${selectedEventId}/report/export-pdf`;
        filename = `event_${selectedEventId}_report.pdf`;
      }
      const res = await api.get(url, { responseType: 'blob' });
      downloadBlob(res.data, filename);
    } catch (err) {
      showError('PDF Generation Failed', 'Failed to generate PDF.');
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    // Fetch all events for the filter dropdown
    api.get('/events').then(res => {
      // Handle paginated response structure
      const eventsData = res.data.data || res.data || []
      setEventsList(Array.isArray(eventsData) ? eventsData : [])
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    let analyticsPromise;
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
    analyticsPromise
      .then(([res, eventsRes]) => {
        setMetrics(res.data);
        // Build event ID to name and price map
        let eventIdToName: Record<string, string> = {};
        let eventIdToPrice: Record<string, number> = {};
        if (selectedEventId === 'all') {
          (Array.isArray(eventsRes.data) ? eventsRes.data : []).forEach((event: any) => {
            eventIdToName[String(event.id)] = event.name;
            eventIdToPrice[String(event.id)] = Number(event.price) || 0;
          });
        } else {
          eventIdToName[String(eventsRes.data.id)] = eventsRes.data.name;
          eventIdToPrice[String(eventsRes.data.id)] = Number(eventsRes.data.price) || 0;
        }
        // Top events by attendance (for bar chart)
        const topEventsArr = selectedEventId === 'all'
          ? Object.entries(res.data.top_events_by_attendance || {}).map(([eventId, attendees]) => ({
              name: eventIdToName[eventId] || `Event #${eventId}`,
              attendees,
            }))
          : [{
              name: eventIdToName[selectedEventId] || 'This Event',
              attendees: res.data.total_attendees || 0,
            }];
        setTopEvents(topEventsArr);
        
        // Pie chart for guest type distribution
        if (selectedEventId === 'all' ? res.data.guest_type_breakdown : res.data.by_guest_type) {
          const breakdown = selectedEventId === 'all' ? res.data.guest_type_breakdown : res.data.by_guest_type;
          const colors = ["#3b82f6", "#8b5cf6", "#06d6a0", "#f59e0b", "#6b7280", "#ef4444", "#10b981", "#6366f1"];
          setGuestTypeData(
            Object.entries(breakdown).map(([name, value], i) => ({
              name,
              value,
              color: colors[i % colors.length],
            }))
          );
        }
        
        // Revenue by Event Type
        if (res.data.revenue_by_event_type) {
          const revenueColors = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06d6a0"];
          setEventTypeRevenueData(
            Object.entries(res.data.revenue_by_event_type).map(([name, value], i) => ({
              name,
              value,
              color: revenueColors[i % revenueColors.length],
            }))
          );
        }
        
        // Tickets by Type
        if (res.data.tickets_by_type) {
          const ticketColors = ["#6366f1", "#8b5cf6", "#3b82f6", "#06d6a0", "#f59e0b", "#ef4444"];
          setTicketTypeData(
            Object.entries(res.data.tickets_by_type).map(([name, data]: [string, any], i) => ({
              name,
              value: data.sold,
              revenue: data.revenue,
              color: ticketColors[i % ticketColors.length],
            }))
          );
        }
        
        // Revenue Timeline
        if (res.data.revenue_timeline) {
          setRevenueTimeline(
            Object.entries(res.data.revenue_timeline).map(([date, revenue]) => ({
              date,
              revenue,
            }))
          );
        }
        
        // Age Group Demographics
        if (res.data.age_group_breakdown) {
          const ageColors = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#6b7280"];
          setAgeGroupData(
            Object.entries(res.data.age_group_breakdown)
              .filter(([_, value]) => value > 0)
              .map(([name, value], i) => ({
                name,
                value,
                color: ageColors[i % ageColors.length],
              }))
          );
        }
        
        // Monthly Registrations
        if (res.data.registrations_by_month) {
          setMonthlyRegistrations(
            Object.entries(res.data.registrations_by_month).map(([month, count]) => ({
              month,
              registrations: count,
            }))
          );
        }
        
        // Daily Check-Ins
        if (res.data.daily_check_ins) {
          setDailyCheckIns(
            Object.entries(res.data.daily_check_ins).map(([date, count]) => ({
              date,
              checkIns: count,
            }))
          );
        }
        
        // Peak Check-In Hours
        if (res.data.peak_check_in_hour) {
          const hourColors = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"];
          setPeakCheckInHours(
            Object.entries(res.data.peak_check_in_hour)
              .slice(0, 10) // Top 10 hours
              .map(([hour, count], i) => ({
                hour,
                count,
                color: hourColors[i % hourColors.length],
              }))
          );
        }
        
        // Monthly Events
        if (res.data.events_by_month) {
          setMonthlyEvents(
            Object.entries(res.data.events_by_month).map(([month, count]) => ({
              month,
              events: count,
            }))
          );
        }
        
        // Line chart for registrations over time
        if (selectedEventId === 'all' ? res.data.registration_timeline : res.data.registration_timeline) {
          const timeline = Object.entries(res.data.registration_timeline || {}).map(([date, attendees]) => ({
            date,
            registrations: attendees,
          })).sort((a, b) => a.date.localeCompare(b.date));
          setRevenueTimeline(timeline.map(d => ({ ...d, revenue: 0 }))); // revenue not available
          setCheckinTimeline(timeline.map(d => ({ ...d, checkins: 0 }))); // check-ins not available
        }
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to load report data');
        setLoading(false);
      });
  }, [selectedEventId]);

  // Transform registration_timeline for chart
  const timelineData = React.useMemo(() => {
    if (!metrics?.registration_timeline) return [];
    // Convert { '2024-07-01': 10, ... } to [{ date: '2024-07-01', attendees: 10 }, ...]
    return Object.entries(metrics.registration_timeline).map(([date, attendees]) => ({
      date,
      attendees,
    })).sort((a, b) => a.date.localeCompare(b.date));
  }, [metrics]);

  // Transform event_type_breakdown for event type chart
  const eventTypeData = React.useMemo(() => {
    if (!metrics?.event_type_breakdown) return [];
    // Convert { 'Conference': 35, ... } to [{ name: 'Conference', value: 35, color: ... }, ...]
    const colors = ["#3b82f6", "#8b5cf6", "#06d6a0", "#f59e0b", "#6b7280", "#ef4444", "#10b981", "#6366f1"];
    return Object.entries(metrics.event_type_breakdown).map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length],
    }));
  }, [metrics]);

  // Transform country_breakdown for chart/list
  const countryData = React.useMemo(() => {
    if (!metrics?.country_breakdown) return [];
    const colors = ["#3b82f6", "#8b5cf6", "#06d6a0", "#f59e0b", "#6b7280", "#ef4444", "#10b981", "#6366f1"];
    return Object.entries(metrics.country_breakdown).map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length],
    }));
  }, [metrics]);

  // Transform gender_breakdown for chart/list
  const genderData = React.useMemo(() => {
    if (!metrics?.gender_breakdown) return [];
    const colors = ["#3b82f6", "#f59e0b", "#ef4444", "#06d6a0", "#8b5cf6"];
    return Object.entries(metrics.gender_breakdown).map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length],
    }));
  }, [metrics]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
            <BarChart className="w-6 h-6 text-white" />
          </div>
        <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Reports & Analytics
            </h1>
            <p className="text-gray-600">Comprehensive insights and performance metrics across all events</p>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger className="w-full sm:w-64 bg-white border-gray-200 shadow-sm">
              <SelectValue placeholder="All Events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {eventsList.map((event: any) => (
                <SelectItem key={event.id} value={String(event.id)}>{event.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleExportCSV} 
              disabled={exporting}
              className="bg-white border-gray-200 shadow-sm hover:bg-gray-50"
            >
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>
            <Button 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg" 
              onClick={handleGeneratePDF} 
              disabled={generating}
            >
            {generating ? 'Generating...' : 'Generate Report'}
          </Button>
          </div>
        </div>
      </div>

      {/* Report Selector Dropdown */}
      <div className="mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                <Filter className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Report Sections</h3>
                <p className="text-xs text-gray-500">Select which sections to display</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Selected count badge */}
              <div className="flex items-center space-x-2 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-200">
                <Eye className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-medium text-indigo-700">
                  {visibleReports.size} of {reportSections.length}
                </span>
              </div>

              {/* Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-white border-gray-300 hover:bg-gray-50 shadow-sm"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Customize Sections
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Select Report Sections</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleAllReports(visibleReports.size !== reportSections.length)}
                      className="h-7 text-xs"
                    >
                      {visibleReports.size === reportSections.length ? (
                        <>
                          <EyeOff className="w-3 h-3 mr-1" />
                          Deselect All
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3 mr-1" />
                          Select All
                        </>
                      )}
                    </Button>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {reportSections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <DropdownMenuCheckboxItem
                        key={section.id}
                        checked={visibleReports.has(section.id)}
                        onCheckedChange={() => toggleReportVisibility(section.id)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center space-x-2">
                          <Icon className="w-4 h-4 text-gray-600" />
                          <span>{section.label}</span>
                        </div>
                      </DropdownMenuCheckboxItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Loading/Error State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <div className="text-lg font-medium text-gray-600">Loading reports dashboard...</div>
          <div className="text-sm text-gray-500 mt-2">Gathering comprehensive analytics data</div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <BarChart className="w-8 h-8 text-red-600" />
          </div>
          <div className="text-lg font-medium text-gray-900 mb-2">Failed to load reports</div>
          <div className="text-gray-600 mb-6">{error}</div>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2"
          >
            Retry
          </Button>
        </div>
      ) : (
        <>
          {/* Key Metrics - Enhanced with Revenue */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Revenue */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-sm border border-green-200 p-6 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-sm font-semibold text-green-800">Total Revenue</div>
                </div>
                <div className="text-3xl font-bold text-green-900 mb-1">
                  ETB {metrics?.total_revenue?.toLocaleString() ?? '0.00'}
                </div>
                <div className="text-xs text-green-700 font-medium">From all ticket sales</div>
              </div>
            </div>

            {/* Total Events */}
            <div className="group relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-sm font-medium text-gray-600">Total Events</div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{metrics?.total_events ?? '-'}</div>
                <div className="text-xs text-gray-500">Organized events</div>
              </div>
            </div>

            {/* Total Attendees */}
            <div className="group relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-sm font-medium text-gray-600">Total Attendees</div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{metrics?.total_attendees?.toLocaleString() ?? '-'}</div>
                <div className="text-xs text-gray-500">All participants</div>
              </div>
            </div>

            {/* Total Tickets Sold */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl shadow-sm border border-indigo-200 p-6 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-500 to-indigo-600 opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                    <Ticket className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-sm font-semibold text-indigo-800">Tickets Sold</div>
                </div>
                <div className="text-3xl font-bold text-indigo-900 mb-1">
                  {metrics?.total_tickets_sold?.toLocaleString() ?? '-'}
                </div>
                <div className="text-xs text-indigo-700 font-medium">Across all events</div>
              </div>
            </div>
          </div>

          {/* Executive Summary Dashboard */}
          {visibleReports.has('executive') && (
          <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-2xl shadow-lg border-2 border-indigo-200 p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-indigo-900 flex items-center">
                  <Award className="w-7 h-7 mr-3" />
                  Executive Summary
                </h2>
                <p className="text-sm text-indigo-700 mt-2">Key performance indicators and ROI analysis at a glance</p>
              </div>
              <div className="hidden md:flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-indigo-200">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-medium text-indigo-900">All Time</span>
              </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {/* Success Rate */}
              <div className="bg-white rounded-xl shadow-sm border-2 border-green-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center space-x-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    <TrendingUp className="w-3 h-3" />
                    <span>High</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-700 mb-1">
                  {metrics?.check_in_rate?.toFixed(1) ?? '-'}%
                </div>
                <div className="text-xs text-gray-600 font-medium">Success Rate</div>
                <div className="text-xs text-gray-500 mt-1">Check-in performance</div>
              </div>

              {/* ROI Indicator */}
              <div className="bg-white rounded-xl shadow-sm border-2 border-purple-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center space-x-1 text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                    <TrendingUp className="w-3 h-3" />
                    <span>ROI</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-700 mb-1">
                  ETB {metrics?.average_revenue_per_event?.toFixed(0) ?? '-'}
                </div>
                <div className="text-xs text-gray-600 font-medium">Avg Revenue/Event</div>
                <div className="text-xs text-gray-500 mt-1">Financial efficiency</div>
              </div>

              {/* Engagement Score */}
              <div className="bg-white rounded-xl shadow-sm border-2 border-blue-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center space-x-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    <TrendingUp className="w-3 h-3" />
                    <span>Good</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-700 mb-1">
                  {metrics?.returning_attendees_percentage?.toFixed(1) ?? '-'}%
                </div>
                <div className="text-xs text-gray-600 font-medium">Loyalty Rate</div>
                <div className="text-xs text-gray-500 mt-1">Returning attendees</div>
              </div>

              {/* Growth Indicator */}
              <div className="bg-white rounded-xl shadow-sm border-2 border-orange-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center space-x-1 text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                    <Target className="w-3 h-3" />
                    <span>Active</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-700 mb-1">
                  {metrics?.total_events ?? '-'}
                </div>
                <div className="text-xs text-gray-600 font-medium">Events Organized</div>
                <div className="text-xs text-gray-500 mt-1">Total portfolio</div>
              </div>
            </div>

            {/* Quick Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Performance Insight */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-green-900 text-sm mb-1">Strong Performance</h4>
                    <p className="text-xs text-green-700 leading-relaxed">
                      {metrics?.check_in_rate > 75 
                        ? `Excellent ${metrics?.check_in_rate?.toFixed(1)}% check-in rate indicates great event engagement`
                        : `${metrics?.check_in_rate?.toFixed(1)}% check-in rate - room for improvement in attendee show-up`
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Revenue Insight */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-purple-900 text-sm mb-1">Revenue Health</h4>
                    <p className="text-xs text-purple-700 leading-relaxed">
                      Average ETB {metrics?.average_ticket_price?.toFixed(0)} per ticket across {metrics?.total_tickets_sold?.toLocaleString()} sales
                    </p>
                  </div>
                </div>
              </div>

              {/* Growth Insight */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 text-sm mb-1">Audience Growth</h4>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      {metrics?.new_attendees?.toLocaleString()} new attendees with {metrics?.returning_attendees_percentage?.toFixed(1)}% return rate
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Event Performance Metrics */}
          {visibleReports.has('performance') && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-sm border border-blue-100 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-blue-900 flex items-center">
                  <BarChart className="w-6 h-6 mr-2" />
                  Event Performance Overview
                </h2>
                <p className="text-sm text-blue-700 mt-1">Comprehensive attendance and engagement metrics</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 text-blue-500" />
                  <span className="text-xs font-medium text-gray-500">REGISTERED</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {metrics?.total_attendees?.toLocaleString() ?? '-'}
                </div>
                <div className="text-xs text-gray-500 mt-1">Total registered</div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <span className="text-xs font-medium text-gray-500">CHECKED-IN</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {metrics?.checked_in_attendees?.toLocaleString() ?? '-'}
                </div>
                <div className="text-xs text-gray-500 mt-1">Actual attendance</div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <XCircle className="w-8 h-8 text-red-500" />
                  <span className="text-xs font-medium text-gray-500">NO-SHOWS</span>
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {metrics?.no_shows?.toLocaleString() ?? '-'}
                </div>
                <div className="text-xs text-gray-500 mt-1">Did not attend</div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <Percent className="w-8 h-8 text-purple-500" />
                  <span className="text-xs font-medium text-gray-500">CHECK-IN RATE</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {metrics?.check_in_rate?.toFixed(1) ?? '-'}%
                </div>
                <div className="text-xs text-gray-500 mt-1">Show-up rate</div>
              </div>
            </div>
          </div>
          )}

          {/* Financial Performance Metrics */}
          {visibleReports.has('financial') && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-sm border border-green-100 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-green-900 flex items-center">
                  <DollarSign className="w-6 h-6 mr-2" />
                  Financial Performance Summary
                </h2>
                <p className="text-sm text-green-700 mt-1">Revenue and ticket sales breakdown</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-8 h-8 text-green-500" />
                  <span className="text-xs font-medium text-gray-500">AVG REVENUE</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  ETB {metrics?.average_revenue_per_event?.toFixed(0) ?? '-'}
                </div>
                <div className="text-xs text-gray-500 mt-1">Per event</div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <Ticket className="w-8 h-8 text-indigo-500" />
                  <span className="text-xs font-medium text-gray-500">AVG PRICE</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  ETB {metrics?.average_ticket_price?.toFixed(0) ?? '-'}
                </div>
                <div className="text-xs text-gray-500 mt-1">Per ticket</div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 text-purple-500" />
                  <span className="text-xs font-medium text-gray-500">AVG ATTENDEES</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {metrics?.average_attendees_per_event ?? '-'}
                </div>
                <div className="text-xs text-gray-500 mt-1">Per event</div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-8 h-8 text-orange-500" />
                  <span className="text-xs font-medium text-gray-500">PEAK</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {metrics?.top_events_by_attendance ? Math.max(...Object.values(metrics.top_events_by_attendance)) : '-'}
                </div>
                <div className="text-xs text-gray-500 mt-1">Highest attendance</div>
              </div>
            </div>
          </div>
          )}

          {/* Attendee & Registration Insights */}
          {visibleReports.has('attendee') && (
          <>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-sm border border-purple-100 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-purple-900 flex items-center">
                  <Users className="w-6 h-6 mr-2" />
                  Attendee & Registration Insights
                </h2>
                <p className="text-sm text-purple-700 mt-1">Demographics, registration patterns, and conversion metrics</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 text-green-500" />
                  <span className="text-xs font-medium text-gray-500">NEW</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {metrics?.new_attendees?.toLocaleString() ?? '-'}
                </div>
                <div className="text-xs text-gray-500 mt-1">First-time attendees</div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <RefreshCw className="w-8 h-8 text-blue-500" />
                  <span className="text-xs font-medium text-gray-500">RETURNING</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {metrics?.returning_attendees?.toLocaleString() ?? '-'}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {metrics?.returning_attendees_percentage?.toFixed(1) ?? 0}% return rate
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="w-8 h-8 text-purple-500" />
                  <span className="text-xs font-medium text-gray-500">CONVERSION</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {metrics?.conversion_rate?.toFixed(1) ?? '-'}%
                </div>
                <div className="text-xs text-gray-500 mt-1">Ticket to attendance</div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 text-orange-500" />
                  <span className="text-xs font-medium text-gray-500">UNIQUE</span>
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {metrics?.unique_attendees?.toLocaleString() ?? '-'}
                </div>
                <div className="text-xs text-gray-500 mt-1">Unique email addresses</div>
              </div>
            </div>
          </div>

          {/* Monthly Registrations & Age Demographics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Monthly Registrations Trend */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Monthly Registration Trend</h3>
                  <p className="text-sm text-gray-600">Registrations per month</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
              </div>
              {monthlyRegistrations.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyRegistrations}>
                  <defs>
                      <linearGradient id="monthlyRegGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                      dataKey="month" 
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                      formatter={(value: any) => [`${value} registrations`, 'Count']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="registrations" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                      fill="url(#monthlyRegGradient)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="registrations" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 7, stroke: '#3b82f6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px]">
                  <div className="text-center">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No registration data available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Age Group Demographics */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Age Group Distribution</h3>
                  <p className="text-sm text-gray-600">Attendee demographics by age</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
              </div>
              {ageGroupData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie 
                        data={ageGroupData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60} 
                    outerRadius={100} 
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                        {ageGroupData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                        formatter={(value: any) => [`${value} attendees`, 'Count']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-4">
                    {ageGroupData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-gray-600">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-[300px]">
                  <div className="text-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No age data available</p>
                  </div>
                </div>
              )}
              </div>
            </div>
          </>
          )}

          {/* Engagement & Interaction Reports */}
          {visibleReports.has('engagement') && (
          <>
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl shadow-sm border border-orange-100 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-orange-900 flex items-center">
                  <CheckCircle className="w-6 h-6 mr-2" />
                  Engagement & Interaction Insights
                </h2>
                <p className="text-sm text-orange-700 mt-1">Check-in patterns, peak hours, and event organization trends</p>
              </div>
            </div>
          </div>

          {/* Check-In Patterns & Peak Hours */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Daily Check-Ins */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Check-In Activity Over Time</h3>
                  <p className="text-sm text-gray-600">Daily check-in patterns</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              </div>
              {dailyCheckIns.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyCheckIns}>
                    <defs>
                      <linearGradient id="checkInGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#64748b"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#64748b"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value: any) => [`${value} check-ins`, 'Count']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="checkIns" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      fill="url(#checkInGradient)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="checkIns" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px]">
                  <div className="text-center">
                    <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No check-in data available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Peak Check-In Hours */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Peak Check-In Hours</h3>
                  <p className="text-sm text-gray-600">Most active check-in times</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
              </div>
              {peakCheckInHours.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={peakCheckInHours}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="hour" 
                      stroke="#64748b"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#64748b"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value: any) => [`${value} check-ins`, 'Count']}
                    />
                    <Bar 
                      dataKey="count" 
                      radius={[4, 4, 0, 0]}
                    >
                      {peakCheckInHours.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px]">
                  <div className="text-center">
                    <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No check-in hour data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Monthly Event Organization */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Event Organization Timeline</h3>
                <p className="text-sm text-gray-600">Number of events organized per month</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
            </div>
            {monthlyEvents.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <RechartsBarChart data={monthlyEvents}>
                  <defs>
                    <linearGradient id="eventsBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: any) => [`${value} events`, 'Count']}
                  />
                  <Bar 
                    dataKey="events" 
                    fill="url(#eventsBarGradient)"
                    radius={[4, 4, 0, 0]}
                  />
                </RechartsBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[350px]">
                <div className="text-center">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No event organization data available</p>
                </div>
              </div>
            )}
          </div>
          </>
          )}

          {/* Revenue Timeline Chart */}
          {visibleReports.has('revenue_timeline') && (
          <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-green-900">Revenue Over Time</h3>
                <p className="text-sm text-gray-600">Daily revenue generation trends</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-white" />
              </div>
            </div>
            {revenueTimeline.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={revenueTimeline}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: any) => [`ETB ${value?.toLocaleString()}`, 'Revenue']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    fill="url(#revenueGradient)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[350px]">
                <div className="text-center">
                  <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No revenue data available</p>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Revenue & Ticket Sales Charts */}
          {visibleReports.has('revenue_charts') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Revenue by Event Type */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Revenue by Event Type</h3>
                  <p className="text-sm text-gray-600">Financial performance by category</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
              </div>
              {eventTypeRevenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={eventTypeRevenueData}>
                  <defs>
                      <linearGradient id="revenueBarGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                      formatter={(value: any) => [`ETB ${value?.toLocaleString()}`, 'Revenue']}
                  />
                  <Bar 
                      dataKey="value" 
                      fill="url(#revenueBarGradient)"
                    radius={[4, 4, 0, 0]}
                  />
                </RechartsBarChart>
              </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px]">
                  <div className="text-center">
                    <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No revenue data available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Tickets by Type Breakdown */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Ticket Sales by Type</h3>
                  <p className="text-sm text-gray-600">Breakdown of tickets sold</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Ticket className="w-4 h-4 text-white" />
                </div>
              </div>
              {ticketTypeData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie 
                        data={ticketTypeData} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={60} 
                        outerRadius={100} 
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {ticketTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value: any) => [`${value} tickets`, 'Sold']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {ticketTypeData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-sm text-gray-600">{item.name}</span>
                        </div>
                        <span className="text-sm font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-[300px]">
                  <div className="text-center">
                    <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No ticket data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          )}

          {/* More Charts Section */}
          {visibleReports.has('demographics') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Guest Type Distribution</h3>
                  <p className="text-sm text-gray-600">Attendee category breakdown</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <LucidePieChart className="w-4 h-4 text-white" />
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie 
                    data={guestTypeData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60} 
                    outerRadius={100} 
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {guestTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {guestTypeData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-gray-600">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          )}

          {/* Event Feedback Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Event Feedback & Surveys</h3>
                <p className="text-sm text-gray-600">Attendee satisfaction and insights</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center">
                <Smile className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-pink-200 rounded-full flex items-center justify-center mb-4">
                <Smile className="w-10 h-10 text-pink-500" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-3">
                Feedback Coming Soon!
              </h2>
              <p className="text-gray-600 text-center max-w-md mb-6">
                We're building a fun and interactive way to collect and view attendee feedback and surveys for your events. Stay tuned for real-time insights and happy faces!
              </p>
              <Button variant="outline" className="bg-white border-gray-200 shadow-sm hover:bg-gray-50">
                View All Feedback
              </Button>
            </div>
          </div>

          {/* Large Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Attendee Registrations Over Time</h3>
                  <p className="text-sm text-gray-600">Registration growth trends</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={timelineData}>
                  <defs>
                    <linearGradient id="attendeeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    allowDecimals={false}
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="attendees" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    fill="url(#attendeeGradient)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="attendees" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Event Types Distribution</h3>
                  <p className="text-sm text-gray-600">Distribution of events by type</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <BarChart className="w-4 h-4 text-white" />
                </div>
              </div>
              {eventTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={eventTypeData}
                    cx="50%"
                    cy="50%"
                      innerRadius={80}
                      outerRadius={140}
                    dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                  >
                    {eventTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                  />
                </PieChart>
              </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[320px]">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <BarChart className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">No event type data available</p>
                  </div>
                </div>
              )}
              {eventTypeData.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-4">
                {eventTypeData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-gray-600">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
              )}
            </div>
          </div>

          {/* Top Performing Events */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Top Performing Events by Attendance</h3>
                <p className="text-sm text-gray-600">Best performing events by attendee count</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                <Star className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topEvents.length === 0 ? (
                <div className="text-gray-500 col-span-full text-center py-8">No top events found.</div>
                ) : (
                  topEvents.map((event, index) => (
                  <div key={index} className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100 hover:shadow-md transition-all duration-300">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 opacity-10 rounded-full -translate-y-6 translate-x-6"></div>
                    <div className="relative">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold text-gray-900 text-sm leading-tight">{event.name}</h4>
                        <div className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded-full">
                          <span className="text-xs text-yellow-600">★</span>
                          <span className="text-xs font-medium text-yellow-700">{event.satisfaction}</span>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Attendees:</span>
                          <span className="font-medium text-gray-900">{event.attendees?.toLocaleString?.() ?? event.attendees}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Revenue:</span>
                          <span className="font-medium text-gray-900">{event.revenue ? `$${event.revenue.toLocaleString()}` : '-'}</span>
                        </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
          </div>

          {/* Demographics Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Country Breakdown</h3>
                  <p className="text-sm text-gray-600">Geographic distribution</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Globe className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="space-y-3">
                {countryData.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">No country data available.</div>
                ) : (
                  countryData.map((item) => (
                    <div key={item.name} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm font-medium text-gray-700 flex-1">{item.name}</span>
                      <div className="h-2 bg-gray-200 rounded-full flex-1 max-w-xs">
                        <div 
                          style={{ 
                            width: `${(item.value / Math.max(...countryData.map(d => d.value))) * 100}%`, 
                            backgroundColor: item.color 
                          }} 
                          className="h-2 rounded-full transition-all duration-300" 
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-900 ml-3">{item.value}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Gender Breakdown</h3>
                  <p className="text-sm text-gray-600">Gender distribution</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="space-y-3">
                {genderData.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">No gender data available.</div>
                ) : (
                  genderData.map((item) => (
                    <div key={item.name} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm font-medium text-gray-700 flex-1">{item.name}</span>
                      <div className="h-2 bg-gray-200 rounded-full flex-1 max-w-xs">
                        <div 
                          style={{ 
                            width: `${(item.value / Math.max(...genderData.map(d => d.value))) * 100}%`, 
                            backgroundColor: item.color 
                          }} 
                          className="h-2 rounded-full transition-all duration-300" 
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-900 ml-3">{item.value}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
