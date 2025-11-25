import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { getChartStyles, getChartColors } from '@/utils/reportTransformers';

interface SalesOverviewChartProps {
  data: Array<{
    date: string;
    tickets_sold: number;
    revenue: number;
  }>;
}

export function SalesOverviewChart({ data }: SalesOverviewChartProps) {
  const styles = getChartStyles();
  const chartColors = getChartColors();
  
  const chartData = data.map((item) => ({
    ...item,
    date: format(new Date(item.date), 'MMM dd'),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={styles.gridStroke} />
        <XAxis
          dataKey="date"
          style={{ fontSize: '12px' }}
          stroke={styles.axisStroke}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          yAxisId="left"
          label={{ value: 'Tickets', angle: -90, position: 'insideLeft', style: { fontSize: '12px', fill: styles.axisStroke } }}
          style={{ fontSize: '12px' }}
          stroke={styles.axisStroke}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          label={{ value: 'Revenue (ETB)', angle: 90, position: 'insideRight', style: { fontSize: '12px', fill: styles.axisStroke } }}
          style={{ fontSize: '12px' }}
          stroke={styles.axisStroke}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: styles.tooltipBg,
            border: `1px solid ${styles.tooltipBorder}`,
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            color: styles.tooltipText,
          }}
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
          stroke={chartColors.line}
          strokeWidth={2}
          dot={{ fill: chartColors.line, r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="revenue"
          stroke={chartColors.line}
          strokeWidth={2}
          dot={{ fill: chartColors.line, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

