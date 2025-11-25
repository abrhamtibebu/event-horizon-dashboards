import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';
import { getPlatformIcon, getPlatformName } from '@/lib/invitationUtils';
import { getChartStyles, getChartColorPalette } from '@/utils/reportTransformers';

interface PlatformChartProps {
  data: Array<{
    platform: string;
    shares: number;
    clicks: number;
    registrations: number;
  }>;
}

export function PlatformChart({ data }: PlatformChartProps) {
  const styles = getChartStyles();
  const colors = getChartColorPalette('primary');
  
  const chartData = data.map(item => ({
    name: `${getPlatformIcon(item.platform)} ${getPlatformName(item.platform)}`,
    value: item.shares
  }));

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Platform Distribution</h3>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill={colors[0]}
              dataKey="value"
              labelStyle={{ fill: styles.labelColor }}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
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
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          No platform data available yet
        </div>
      )}
    </Card>
  );
}

