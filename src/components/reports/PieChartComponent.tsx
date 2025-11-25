import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { PieChartData } from '@/types/reports';
import { getChartStyles, getChartColorPalette } from '@/utils/reportTransformers';
import { ChartEmptyState } from './ChartEmptyState';
import { PieChart as LucidePieChart } from 'lucide-react';

interface PieChartComponentProps {
  data: PieChartData[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  showLegend?: boolean;
  showLabels?: boolean;
  emptyMessage?: string;
  colorPalette?: 'primary' | 'revenue' | 'tickets' | 'age' | 'hours';
}

export const PieChartComponent: React.FC<PieChartComponentProps> = ({
  data,
  height = 300,
  innerRadius = 60,
  outerRadius = 100,
  showLegend = false,
  showLabels = true,
  emptyMessage = 'No data available',
  colorPalette = 'primary',
}) => {
  const styles = getChartStyles();
  const colors = getChartColorPalette(colorPalette);

  if (!data || data.length === 0) {
    return (
      <ChartEmptyState
        icon={LucidePieChart}
        message={emptyMessage}
        className="h-[300px]"
      />
    );
  }

  return (
    <>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            dataKey="value"
            label={showLabels ? ({ name, percent }) => 
              `${name} ${(percent * 100).toFixed(0)}%` : false
            }
            labelLine={false}
            labelStyle={{ fill: styles.labelColor }}
            fill={colors[0]}
          >
            {data.map((entry, index) => (
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
            formatter={(value: number) => [value.toLocaleString(), 'Count']}
          />
          {showLegend && <Legend />}
        </PieChart>
      </ResponsiveContainer>
      {!showLegend && (
        <div className="grid grid-cols-2 gap-2 mt-4">
          {data.map((item, index) => {
            const itemColor = colors[index % colors.length];
            return (
              <div
                key={item.name}
                className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: itemColor }}
                  />
                  <span className="text-sm text-foreground">{item.name}</span>
                </div>
                <span className="text-sm font-medium text-foreground">
                  {item.value.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

