import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface SalesOverviewChartProps {
  data: Array<{
    date: string;
    tickets_sold: number;
    revenue: number;
  }>;
}

export function SalesOverviewChart({ data }: SalesOverviewChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    date: format(new Date(item.date), 'MMM dd'),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          style={{ fontSize: '12px' }}
        />
        <YAxis
          yAxisId="left"
          label={{ value: 'Tickets', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
          style={{ fontSize: '12px' }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          label={{ value: 'Revenue (ETB)', angle: 90, position: 'insideRight', style: { fontSize: '12px' } }}
          style={{ fontSize: '12px' }}
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
          formatter={(value: number, name: string) => {
            if (name === 'tickets_sold') return [value, 'Tickets Sold'];
            return [`ETB ${value.toFixed(2)}`, 'Revenue'];
          }}
        />
        <Legend
          formatter={(value) => {
            if (value === 'tickets_sold') return 'Tickets Sold';
            return 'Revenue (ETB)';
          }}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="tickets_sold"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ fill: '#3b82f6', r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="revenue"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ fill: '#10b981', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

