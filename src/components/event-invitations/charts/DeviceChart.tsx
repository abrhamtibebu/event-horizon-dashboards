import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';
import { Monitor, Smartphone, Tablet } from 'lucide-react';
import { getChartStyles, getChartColors } from '@/utils/reportTransformers';

interface DeviceChartProps {
  data: Array<{
    device_type: 'mobile' | 'desktop' | 'tablet';
    os: string;
    browser: string;
    count: number;
  }>;
}

const ICONS = {
  mobile: '📱',
  desktop: '💻',
  tablet: '📲'
};

export function DeviceChart({ data }: DeviceChartProps) {
  const styles = getChartStyles();
  const chartColors = getChartColors();
  
  // Theme-aware colors for device types
  const COLORS = {
    mobile: chartColors.info,      // Blue Sapphire
    desktop: chartColors.success,  // Eton Blue
    tablet: chartColors.accent,    // Honey Yellow
  };
  
  // Aggregate by device type
  const deviceCounts = data.reduce((acc, item) => {
    acc[item.device_type] = (acc[item.device_type] || 0) + item.count;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(deviceCounts).map(([type, count]) => ({
    name: `${ICONS[type as keyof typeof ICONS]} ${type.charAt(0).toUpperCase() + type.slice(1)}`,
    value: count,
    type
  }));

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Device Analytics</h3>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill={chartColors.info}
              paddingAngle={5}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelStyle={{ fill: styles.labelColor }}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[entry.type as keyof typeof COLORS] || chartColors.info} 
                />
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
          No device data available yet
        </div>
      )}
    </Card>
  );
}

