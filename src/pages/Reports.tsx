
import { BarChart, Users, Calendar, MessageSquare } from "lucide-react";
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

const monthlyData = [
  { month: "Jan", revenue: 12500, events: 8, attendees: 850 },
  { month: "Feb", revenue: 18200, events: 12, attendees: 1200 },
  { month: "Mar", revenue: 15800, events: 10, attendees: 980 },
  { month: "Apr", revenue: 22300, events: 15, attendees: 1450 },
  { month: "May", revenue: 28500, events: 18, attendees: 1800 },
  { month: "Jun", revenue: 25200, events: 16, attendees: 1600 },
];

const eventTypeData = [
  { name: "Conferences", value: 35, revenue: 45000, color: "#3b82f6" },
  { name: "Festivals", value: 25, revenue: 32000, color: "#8b5cf6" },
  { name: "Workshops", value: 20, revenue: 18000, color: "#06d6a0" },
  { name: "Exhibitions", value: 15, revenue: 12000, color: "#f59e0b" },
  { name: "Other", value: 5, revenue: 5000, color: "#6b7280" },
];

const topEvents = [
  { name: "Tech Conference 2024", attendees: 1250, revenue: 15600, satisfaction: 4.8 },
  { name: "Music Festival", attendees: 2500, revenue: 28000, satisfaction: 4.6 },
  { name: "Business Summit", revenue: 12400, attendees: 850, satisfaction: 4.7 },
  { name: "Art Exhibition", attendees: 450, revenue: 6800, satisfaction: 4.5 },
];

export default function Reports() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Track performance and gain insights into your events</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Export CSV</Button>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            Generate Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value="$125,420"
          icon={<BarChart className="w-6 h-6 text-green-600" />}
          trend={{ value: 15, isPositive: true }}
        />
        <MetricCard
          title="Total Attendees"
          value="8,650"
          icon={<Users className="w-6 h-6 text-blue-600" />}
          trend={{ value: 8, isPositive: true }}
        />
        <MetricCard
          title="Events Completed"
          value="78"
          icon={<Calendar className="w-6 h-6 text-purple-600" />}
          trend={{ value: 12, isPositive: true }}
        />
        <MetricCard
          title="Avg. Satisfaction"
          value="4.7"
          icon={<MessageSquare className="w-6 h-6 text-orange-600" />}
          trend={{ value: 5, isPositive: true }}
        />
      </div>

      {/* Revenue & Events Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard title="Monthly Revenue Trend">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'revenue' ? `$${value.toLocaleString()}` : value,
                  name === 'revenue' ? 'Revenue' : 'Events'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </DashboardCard>

        <DashboardCard title="Events by Month">
          <ResponsiveContainer width="100%" height={300}>
            <RechartsBarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar 
                dataKey="events" 
                fill="url(#colorGradient)"
                radius={[4, 4, 0, 0]}
              />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.9}/>
                </linearGradient>
              </defs>
            </RechartsBarChart>
          </ResponsiveContainer>
        </DashboardCard>
      </div>

      {/* Event Types & Top Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                formatter={(value, name) => [`${value}%`, 'Percentage']}
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
                <span className="text-sm font-medium">${item.revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard title="Top Performing Events">
          <div className="space-y-4">
            {topEvents.map((event, index) => (
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
                    <span className="font-medium ml-1">{event.attendees.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Revenue:</span>
                    <span className="font-medium ml-1">${event.revenue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>

      {/* Attendee Trends */}
      <DashboardCard title="Attendee Growth Trends">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
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
    </div>
  );
}
