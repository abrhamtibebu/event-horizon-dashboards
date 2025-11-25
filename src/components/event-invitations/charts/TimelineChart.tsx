import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/ui/card';
import { getChartStyles, getChartColors } from '@/utils/reportTransformers';

interface TimelineChartProps {
  data: Array<{
    date: string;
    clicks: number;
    shares: number;
    registrations: number;
  }>;
}

export function TimelineChart({ data }: TimelineChartProps) {
  const styles = getChartStyles();
  const chartColors = getChartColors();
  
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Activity Timeline</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColors.info} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={chartColors.info} stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorShares" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColors.success} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={chartColors.success} stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorRegistrations" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColors.accent} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={chartColors.accent} stopOpacity={0}/>
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
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="clicks"
            stroke={chartColors.info}
            fillOpacity={1}
            fill="url(#colorClicks)"
            name="Clicks"
          />
          <Area
            type="monotone"
            dataKey="shares"
            stroke={chartColors.success}
            fillOpacity={1}
            fill="url(#colorShares)"
            name="Shares"
          />
          <Area
            type="monotone"
            dataKey="registrations"
            stroke={chartColors.accent}
            fillOpacity={1}
            fill="url(#colorRegistrations)"
            name="Registrations"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

