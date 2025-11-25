import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  AlertTriangle,
  Pause
} from 'lucide-react';

interface DeliverableStatusBadgeProps {
  status: 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled' | 'at_risk' | 'on_hold';
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: Clock,
    variant: 'secondary' as const,
    color: 'bg-gray-100 text-gray-800'
  },
  in_progress: {
    label: 'In Progress',
    icon: Play,
    variant: 'default' as const,
    color: 'bg-blue-100 text-blue-800'
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    variant: 'default' as const,
    color: 'bg-green-100 text-green-800'
  },
  delayed: {
    label: 'Delayed',
    icon: AlertCircle,
    variant: 'destructive' as const,
    color: 'bg-red-100 text-red-800'
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    variant: 'secondary' as const,
    color: 'bg-gray-100 text-gray-800'
  },
  at_risk: {
    label: 'At Risk',
    icon: AlertTriangle,
    variant: 'destructive' as const,
    color: 'bg-orange-100 text-orange-800'
  },
  on_hold: {
    label: 'On Hold',
    icon: Pause,
    variant: 'secondary' as const,
    color: 'bg-yellow-100 text-yellow-800'
  }
};

export default function DeliverableStatusBadge({ status, size = 'md' }: DeliverableStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <Badge variant={config.variant} className={`${config.color} ${sizeClasses[size]} flex items-center gap-1.5`}>
      <Icon className={`${size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
      {config.label}
    </Badge>
  );
}


