import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { BarChartData } from '@/types/reports';
import { getChartStyles, getChartColors, formatChartDate } from '@/utils/reportTransformers';
import { ChartEmptyState } from './ChartEmptyState';
import { BarChart as LucideBarChart } from 'lucide-react';

interface BarChartComponentProps {
  data: BarChartData[];
  height?: number;
  dataKey?: string;
  emptyMessage?: string;
  showGradient?: boolean;
  gradientId?: string;
  gradientColor?: string;
}

export const BarChartComponent: React.FC<BarChartComponentProps> = ({
  data,
  height = 300,
  dataKey = 'value',
  emptyMessage = 'No data available',
  showGradient = false,
  gradientId = 'barGradient',
  gradientColor,
}) => {
  const styles = getChartStyles();
  const chartColors = getChartColors();
  const defaultGradientColor = gradientColor || chartColors.info;

  if (!data || data.length === 0) {
    return (
      <ChartEmptyState
        icon={LucideBarChart}
        message={emptyMessage}
        className="h-[300px]"
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
      >
        {showGradient && (
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={defaultGradientColor} stopOpacity={0.8} />
              <stop offset="95%" stopColor={defaultGradientColor} stopOpacity={0.3} />
            </linearGradient>
          </defs>
        )}
        <CartesianGrid strokeDasharray="3 3" stroke={styles.gridStroke} />
        <XAxis
          dataKey="name"
          stroke={styles.axisStroke}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => {
            // Check if it's a date format
            if (value.match(/^\d{4}-\d{2}/)) {
              return formatChartDate(value);
            }
            return value;
          }}
        />
        <YAxis
          stroke={styles.axisStroke}
          fontSize={12}
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
          formatter={(value: number) => [value.toLocaleString(), 'Count']}
        />
        <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={showGradient ? `url(#${gradientId})` : entry.color || defaultGradientColor}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

