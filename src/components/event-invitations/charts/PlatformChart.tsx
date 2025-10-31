import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';
import { getPlatformIcon, getPlatformName } from '@/lib/invitationUtils';

interface PlatformChartProps {
  data: Array<{
    platform: string;
    shares: number;
    clicks: number;
    registrations: number;
  }>;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export function PlatformChart({ data }: PlatformChartProps) {
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
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-64 text-gray-500">
          No platform data available yet
        </div>
      )}
    </Card>
  );
}

