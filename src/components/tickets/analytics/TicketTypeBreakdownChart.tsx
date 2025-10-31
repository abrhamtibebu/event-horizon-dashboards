import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface TicketTypeBreakdownChartProps {
  data: Array<{
    ticket_type_id: number;
    ticket_type_name: string;
    tickets_sold: number;
    revenue: number;
  }>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export function TicketTypeBreakdownChart({ data }: TicketTypeBreakdownChartProps) {
  const chartData = data.map((item) => ({
    name: item.ticket_type_name,
    value: item.tickets_sold,
    revenue: item.revenue,
  }));

  const renderLabel = (entry: any) => {
    const percent = ((entry.value / data.reduce((sum, item) => sum + item.tickets_sold, 0)) * 100).toFixed(1);
    return `${entry.name} (${percent}%)`;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderLabel}
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
          formatter={(value: number, name: string, props: any) => [
            `${value} tickets (ETB ${props.payload.revenue.toLocaleString()})`,
            name,
          ]}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value: string, entry: any) => {
            // Safely get the item using the entry's value or find by name
            const item = chartData.find(d => d.name === value) || entry.payload;
            if (!item || !item.name) {
              return value; // Fallback to the value if item not found
            }
            return `${item.name}: ${item.value} tickets`;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

