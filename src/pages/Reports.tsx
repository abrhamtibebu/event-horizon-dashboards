import { BarChart, Users, Calendar, MessageSquare, PieChart as LucidePieChart, TrendingUp, Smile, Star, Globe } from "lucide-react";
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

const monthlyData = [
  { month: "Jan", revenue: 12500, events: 8, attendees: 850 },
  { month: "Feb", revenue: 18200, events: 12, attendees: 1200 },
  { month: "Mar", revenue: 15800, events: 10, attendees: 980 },
  { month: "Apr", revenue: 22300, events: 15, attendees: 1450 },
  { month: "May", revenue: 28500, events: 18, attendees: 1800 },
  { month: "Jun", revenue: 25200, events: 16, attendees: 1600 },
];

const topEventsStatic = [
  { name: "Tech Conference 2024", attendees: 1250, revenue: 15600, satisfaction: 4.8 },
  { name: "Music Festival", attendees: 2500, revenue: 28000, satisfaction: 4.6 },
  { name: "Business Summit", revenue: 12400, attendees: 850, satisfaction: 4.7 },
  { name: "Art Exhibition", attendees: 450, revenue: 6800, satisfaction: 4.5 },
];

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [topEvents, setTopEvents] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [revenueTimeline, setRevenueTimeline] = useState<any[]>([]);
  const [checkinTimeline, setCheckinTimeline] = useState<any[]>([]);
  const [guestTypeData, setGuestTypeData] = useState<any[]>([]);
  const [eventPopularity, setEventPopularity] = useState<any[]>([]);
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [exporting, setExporting] = useState(false);
  const [generating, setGenerating] = useState(false);

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
      alert('Failed to export CSV.');
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
      alert('Failed to generate PDF.');
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    // Fetch all events for the filter dropdown
    api.get('/events').then(res => setEventsList(res.data || []));
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
        setEventPopularity(topEventsArr);
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
        } else {
          setGuestTypeData([]);
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
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="group relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <BarChart className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-sm font-medium text-gray-600">Total Events</div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{metrics?.total_events ?? '-'}</div>
                <div className="text-xs text-gray-500">Organized events</div>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-sm font-medium text-gray-600">Total Attendees</div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{metrics?.total_attendees?.toLocaleString() ?? '-'}</div>
                <div className="text-xs text-gray-500">All participants</div>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-sm font-medium text-gray-600">Avg. Attendees/Event</div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{metrics?.average_attendees_per_event ?? '-'}</div>
                <div className="text-xs text-gray-500">Per event average</div>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-sm font-medium text-gray-600">Top Event Attendance</div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {metrics?.top_events_by_attendance ? Math.max(...Object.values(metrics.top_events_by_attendance)) : '-'}
                </div>
                <div className="text-xs text-gray-500">Peak attendance</div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Registrations Over Time</h3>
                  <p className="text-sm text-gray-600">Registration trends and patterns</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={revenueTimeline}>
                  <defs>
                    <linearGradient id="registrationGradient" x1="0" y1="0" x2="0" y2="1">
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
                    dataKey="registrations" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    fill="url(#registrationGradient)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="registrations" 
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

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Event Popularity</h3>
                  <p className="text-sm text-gray-600">Most attended events</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <BarChart className="w-4 h-4 text-white" />
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <RechartsBarChart data={eventPopularity}>
                  <defs>
                    <linearGradient id="popularityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.3}/>
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
                  <Bar 
                    dataKey="attendees" 
                    fill="url(#popularityGradient)"
                    radius={[4, 4, 0, 0]}
                  />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>

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
                <h3 className="text-lg font-semibold text-gray-900">Top Performing Events</h3>
                <p className="text-sm text-gray-600">Best performing events by metrics</p>
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

          {/* Attendee Growth Trends */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Attendee Growth Trends</h3>
                <p className="text-sm text-gray-600">Long-term attendance patterns</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={timelineData}>
                <defs>
                  <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06d6a0" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06d6a0" stopOpacity={0}/>
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
                  stroke="#06d6a0" 
                  strokeWidth={3}
                  fill="url(#growthGradient)"
                />
                <Line 
                  type="monotone" 
                  dataKey="attendees" 
                  stroke="#06d6a0" 
                  strokeWidth={3}
                  dot={{ fill: '#06d6a0', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#06d6a0', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
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
