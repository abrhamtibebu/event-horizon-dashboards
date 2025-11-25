import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
} from 'recharts';
import { TimelineDataPoint } from '@/types/reports';
import { getChartStyles, getChartColors, formatChartDate, formatCurrency } from '@/utils/reportTransformers';
import { ChartEmptyState } from './ChartEmptyState';
import { DollarSign } from 'lucide-react';

interface RevenueLineChartProps {
  data: TimelineDataPoint[];
  height?: number;
  dataKey?: 'revenue' | 'attendees' | 'registrations' | 'checkIns';
  color?: string;
  gradientId?: string;
}

export const RevenueLineChart: React.FC<RevenueLineChartProps> = ({
  data,
  height = 350,
  dataKey = 'revenue',
  color,
  gradientId = 'revenueGradient',
}) => {
  const styles = getChartStyles();
  const chartColors = getChartColors();
  // Use theme-aware line chart color if not provided
  const chartColor = color || chartColors.line;

  if (!data || data.length === 0) {
    return (
      <ChartEmptyState
        icon={DollarSign}
        message="No revenue data available"
        description="Revenue data will appear here once available"
      />
    );
  }

  const formatValue = (value: number) => {
    if (dataKey === 'revenue') {
      return formatCurrency(value);
    }
    return value.toLocaleString();
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={data}
        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
            <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={styles.gridStroke} />
        <XAxis
          dataKey="date"
          stroke={styles.axisStroke}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatChartDate}
        />
        <YAxis
          stroke={styles.axisStroke}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatValue}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: styles.tooltipBg,
            border: `1px solid ${styles.tooltipBorder}`,
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            color: styles.tooltipText,
          }}
          labelFormatter={(value) => formatChartDate(String(value))}
          formatter={(value: number) => [formatValue(value), dataKey === 'revenue' ? 'Revenue' : 'Count']}
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={chartColor}
          strokeWidth={3}
          fill={`url(#${gradientId})`}
        />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={chartColor}
          strokeWidth={3}
          dot={{ fill: chartColor, strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: chartColor, strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

