import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface RevenueTrendChartProps {
  data: Array<{
    date: string;
    tickets_sold: number;
    revenue: number;
  }>;
}

export function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  // Calculate cumulative revenue
  let cumulative = 0;
  const chartData = data.map((item) => {
    cumulative += item.revenue;
    return {
      date: format(new Date(item.date), 'MMM dd'),
      revenue: item.revenue,
      cumulative_revenue: cumulative,
    };
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          style={{ fontSize: '12px' }}
        />
        <YAxis
          label={{ value: 'Revenue (ETB)', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
          style={{ fontSize: '12px' }}
          tickFormatter={(value) => `${value.toLocaleString()}`}
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
          formatter={(value: number, name: string) => {
            if (name === 'revenue') return [`ETB ${value.toFixed(2)}`, 'Daily Revenue'];
            return [`ETB ${value.toFixed(2)}`, 'Cumulative Revenue'];
          }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#10b981"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorRevenue)"
        />
        <Area
          type="monotone"
          dataKey="cumulative_revenue"
          stroke="#6366f1"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorCumulative)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

