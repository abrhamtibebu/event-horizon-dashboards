import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/ui/card';
import { getChartStyles, getChartColors } from '@/utils/reportTransformers';

interface GeographicChartProps {
  data: Array<{
    country: string;
    city: string;
    clicks: number;
    registrations: number;
  }>;
}

export function GeographicChart({ data }: GeographicChartProps) {
  const styles = getChartStyles();
  const chartColors = getChartColors();
  
  // Group by country and aggregate
  const countryData = data.reduce((acc, item) => {
    const existing = acc.find(d => d.country === item.country);
    if (existing) {
      existing.clicks += item.clicks;
      existing.registrations += item.registrations;
    } else {
      acc.push({
        country: item.country,
        clicks: item.clicks,
        registrations: item.registrations
      });
    }
    return acc;
  }, [] as Array<{ country: string; clicks: number; registrations: number; }>);

  // Sort by clicks and take top 10
  const topCountries = countryData
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Geographic Distribution (Top Countries)</h3>
      {topCountries.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topCountries}>
            <CartesianGrid strokeDasharray="3 3" stroke={styles.gridStroke} />
            <XAxis 
              dataKey="country" 
              style={{ fontSize: '12px' }}
              stroke={styles.axisStroke}
              tickLine={false}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              height={100}
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
            <Bar dataKey="clicks" fill={chartColors.info} name="Clicks" />
            <Bar dataKey="registrations" fill={chartColors.success} name="Registrations" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          No geographic data available yet
        </div>
      )}
    </Card>
  );
}

