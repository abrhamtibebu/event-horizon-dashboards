import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';
import { Monitor, Smartphone, Tablet } from 'lucide-react';

interface DeviceChartProps {
  data: Array<{
    device_type: 'mobile' | 'desktop' | 'tablet';
    os: string;
    browser: string;
    count: number;
  }>;
}

const COLORS = {
  mobile: '#3B82F6',
  desktop: '#10B981',
  tablet: '#F59E0B'
};

const ICONS = {
  mobile: '📱',
  desktop: '💻',
  tablet: '📲'
};

export function DeviceChart({ data }: DeviceChartProps) {
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
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[entry.type as keyof typeof COLORS]} 
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-64 text-gray-500">
          No device data available yet
        </div>
      )}
    </Card>
  );
}

