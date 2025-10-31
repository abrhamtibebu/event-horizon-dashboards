import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/ui/card';

interface TimelineChartProps {
  data: Array<{
    date: string;
    clicks: number;
    shares: number;
    registrations: number;
  }>;
}

export function TimelineChart({ data }: TimelineChartProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Activity Timeline</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorShares" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorRegistrations" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            style={{ fontSize: '12px' }}
          />
          <YAxis style={{ fontSize: '12px' }} />
          <Tooltip />
          <Legend />
          <Area
            type="monotone"
            dataKey="clicks"
            stroke="#3B82F6"
            fillOpacity={1}
            fill="url(#colorClicks)"
            name="Clicks"
          />
          <Area
            type="monotone"
            dataKey="shares"
            stroke="#10B981"
            fillOpacity={1}
            fill="url(#colorShares)"
            name="Shares"
          />
          <Area
            type="monotone"
            dataKey="registrations"
            stroke="#8B5CF6"
            fillOpacity={1}
            fill="url(#colorRegistrations)"
            name="Registrations"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

