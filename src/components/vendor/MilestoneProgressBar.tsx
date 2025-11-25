import React from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Milestone {
  id: number;
  milestone_name: string;
  percentage: number;
  amount: number;
  status: 'pending' | 'triggered' | 'approved' | 'paid' | 'cancelled';
  sequence_order: number;
}

interface MilestoneProgressBarProps {
  milestones: Milestone[];
  totalAmount: number;
}

export default function MilestoneProgressBar({ milestones, totalAmount }: MilestoneProgressBarProps) {
  const sortedMilestones = [...milestones].sort((a, b) => a.sequence_order - b.sequence_order);
  const paidAmount = milestones
    .filter(m => m.status === 'paid')
    .reduce((sum, m) => sum + m.amount, 0);
  const paidPercentage = (paidAmount / totalAmount) * 100;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'approved':
      case 'triggered':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500';
      case 'approved':
      case 'triggered':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Payment Progress</p>
          <p className="text-xs text-muted-foreground">
            {paidAmount.toLocaleString()} ETB of {totalAmount.toLocaleString()} ETB paid
          </p>
        </div>
        <Badge variant="outline">{paidPercentage.toFixed(1)}%</Badge>
      </div>
      
      <Progress value={paidPercentage} className="h-2" />
      
      <div className="space-y-2">
        {sortedMilestones.map((milestone) => (
          <div key={milestone.id} className="flex items-center gap-3 p-3 border rounded-lg">
            <div className="flex-shrink-0">
              {getStatusIcon(milestone.status)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{milestone.milestone_name}</p>
              <p className="text-xs text-muted-foreground">
                {milestone.percentage}% • {milestone.amount.toLocaleString()} ETB
              </p>
            </div>
            <Badge variant={milestone.status === 'paid' ? 'default' : 'secondary'}>
              {milestone.status}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}


