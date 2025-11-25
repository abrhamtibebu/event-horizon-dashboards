import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { getChartStyles, getChartColors } from '@/utils/reportTransformers';

interface RevenueTrendChartProps {
  data: Array<{
    date: string;
    tickets_sold: number;
    revenue: number;
  }>;
}

export function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  const styles = getChartStyles();
  const chartColors = getChartColors();
  
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
            <stop offset="5%" stopColor={chartColors.success} stopOpacity={0.8} />
            <stop offset="95%" stopColor={chartColors.success} stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={chartColors.info} stopOpacity={0.8} />
            <stop offset="95%" stopColor={chartColors.info} stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={styles.gridStroke} />
        <XAxis
          dataKey="date"
          style={{ fontSize: '12px' }}
          stroke={styles.axisStroke}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          label={{ value: 'Revenue (ETB)', angle: -90, position: 'insideLeft', style: { fontSize: '12px', fill: styles.axisStroke } }}
          style={{ fontSize: '12px' }}
          stroke={styles.axisStroke}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value.toLocaleString()}`}
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
            if (name === 'revenue') return [`ETB ${value.toFixed(2)}`, 'Daily Revenue'];
            return [`ETB ${value.toFixed(2)}`, 'Cumulative Revenue'];
          }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke={chartColors.success}
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorRevenue)"
        />
        <Area
          type="monotone"
          dataKey="cumulative_revenue"
          stroke={chartColors.info}
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorCumulative)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

