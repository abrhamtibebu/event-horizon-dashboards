import { BarChart, Users, Calendar, MessageSquare, PieChart as LucidePieChart, TrendingUp, Smile } from "lucide-react";
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

  // Transform guest_type_breakdown for event type chart
  const eventTypeData = React.useMemo(() => {
    if (!metrics?.guest_type_breakdown) return [];
    // Convert { 'Conference': 35, ... } to [{ name: 'Conference', value: 35, color: ... }, ...]
    const colors = ["#3b82f6", "#8b5cf6", "#06d6a0", "#f59e0b", "#6b7280", "#ef4444", "#10b981", "#6366f1"];
    return Object.entries(metrics.guest_type_breakdown).map(([name, value], i) => ({
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Track performance and gain insights into your events</p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="All Events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {eventsList.map((event: any) => (
                <SelectItem key={event.id} value={String(event.id)}>{event.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportCSV} disabled={exporting}>
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" onClick={handleGeneratePDF} disabled={generating}>
            {generating ? 'Generating...' : 'Generate Report'}
          </Button>
        </div>
      </div>

      {/* Loading/Error State */}
      {loading ? (
        <div className="text-center py-10">Loading report data...</div>
      ) : error ? (
        <div className="text-center text-red-500 py-10">{error}</div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Events"
              value={metrics?.total_events ?? '-'}
              icon={<BarChart className="w-6 h-6 text-green-600" />}
              trend={undefined}
            />
            <MetricCard
              title="Total Attendees"
              value={metrics?.total_attendees?.toLocaleString() ?? '-'}
              icon={<Users className="w-6 h-6 text-blue-600" />}
              trend={undefined}
            />
            <MetricCard
              title="Avg. Attendees/Event"
              value={metrics?.average_attendees_per_event ?? '-'}
              icon={<Calendar className="w-6 h-6 text-purple-600" />}
              trend={undefined}
            />
            <MetricCard
              title="Top Event Attendance"
              value={metrics?.top_events_by_attendance ? Math.max(...Object.values(metrics.top_events_by_attendance)) : '-'}
              icon={<MessageSquare className="w-6 h-6 text-orange-600" />}
              trend={undefined}
            />
          </div>

          {/* Event Analytics Widget */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <DashboardCard title="Registrations Over Time" icon={<TrendingUp className="w-5 h-5 text-blue-500" />}>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={revenueTimeline} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="registrations" stroke="#3b82f6" strokeWidth={3} dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </DashboardCard>
            <DashboardCard title="Guest Type Distribution" icon={<LucidePieChart className="w-5 h-5 text-purple-500" />}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={guestTypeData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value">
                    {guestTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value}`, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {guestTypeData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-gray-600">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </DashboardCard>
            <DashboardCard title="Event Popularity" icon={<BarChart className="w-5 h-5 text-orange-500" />}>
              <ResponsiveContainer width="100%" height={220}>
                <RechartsBarChart data={eventPopularity} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="attendees" fill="#8b5cf6" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </DashboardCard>
          </div>

          {/* Event Feedback/Surveys Widget */}
          <DashboardCard title="Event Feedback & Surveys" icon={<Smile className="w-5 h-5 text-pink-500" />}>
            <div className="flex flex-col items-center justify-center py-8">
              <Smile className="w-16 h-16 text-pink-400 animate-bounce mb-2" />
              <h2 className="text-2xl font-bold text-gradient bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">Feedback Coming Soon!</h2>
              <p className="text-gray-600 mb-4">We're building a fun and interactive way to collect and view attendee feedback and surveys for your events.<br />Stay tuned for real-time insights and happy faces!</p>
              <Button variant="outline" className="mt-2">View All Feedback</Button>
            </div>
          </DashboardCard>

          {/* Revenue & Events Chart (now realtime) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DashboardCard title="Attendee Registrations Over Time">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="attendees" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </DashboardCard>
            <DashboardCard title="Event Types Distribution">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={eventTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    dataKey="value"
                  >
                    {eventTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [`${value}`, 'Count']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {eventTypeData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
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
            </DashboardCard>
          </div>

          {/* Event Types & Top Events */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DashboardCard title="Top Performing Events">
              <div className="space-y-4">
                {topEvents.length === 0 ? (
                  <div className="text-gray-500">No top events found.</div>
                ) : (
                  topEvents.map((event, index) => (
                    <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">{event.name}</h4>
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-yellow-500">★</span>
                          <span className="text-sm font-medium">{event.satisfaction}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Attendees:</span>
                          <span className="font-medium ml-1">{event.attendees?.toLocaleString?.() ?? event.attendees}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Revenue:</span>
                          <span className="font-medium ml-1">{event.revenue ? `$${event.revenue.toLocaleString()}` : '-'}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DashboardCard>
          </div>

          {/* Attendee Trends (now realtime) */}
          <DashboardCard title="Attendee Growth Trends">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="attendees" 
                  stroke="#06d6a0" 
                  strokeWidth={3}
                  dot={{ fill: "#06d6a0", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </DashboardCard>

          {/* Country & Gender Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DashboardCard title="Country Breakdown">
              <div className="space-y-2">
                {countryData.length === 0 ? (
                  <div className="text-gray-500">No country data.</div>
                ) : (
                  countryData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-gray-600 flex-1">{item.name}</span>
                      <div className="h-2 bg-gray-200 rounded flex-1 max-w-xs">
                        <div style={{ width: `${(item.value / Math.max(...countryData.map(d => d.value))) * 100}%`, backgroundColor: item.color }} className="h-2 rounded" />
                      </div>
                      <span className="text-sm font-medium ml-2">{item.value}</span>
                    </div>
                  ))
                )}
              </div>
            </DashboardCard>
            <DashboardCard title="Gender Breakdown">
              <div className="space-y-2">
                {genderData.length === 0 ? (
                  <div className="text-gray-500">No gender data.</div>
                ) : (
                  genderData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-gray-600 flex-1">{item.name}</span>
                      <div className="h-2 bg-gray-200 rounded flex-1 max-w-xs">
                        <div style={{ width: `${(item.value / Math.max(...genderData.map(d => d.value))) * 100}%`, backgroundColor: item.color }} className="h-2 rounded" />
                      </div>
                      <span className="text-sm font-medium ml-2">{item.value}</span>
                    </div>
                  ))
                )}
              </div>
            </DashboardCard>
          </div>
        </>
      )}
    </div>
  );
}
