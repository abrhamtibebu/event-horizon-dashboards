import { Badge } from '@/components/ui/badge';
import type { TicketStatus } from '@/types/tickets';
import { CheckCircle, Clock, XCircle, Ban, RefreshCw } from 'lucide-react';

interface TicketStatusBadgeProps {
  status: TicketStatus;
  className?: string;
}

export function TicketStatusBadge({ status, className }: TicketStatusBadgeProps) {
  const config = {
    confirmed: {
      label: 'Confirmed',
      variant: 'default' as const,
      icon: CheckCircle,
      className: 'bg-green-100 text-green-800 border-green-200',
    },
    pending: {
      label: 'Pending',
      variant: 'secondary' as const,
      icon: Clock,
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    },
    cancelled: {
      label: 'Cancelled',
      variant: 'destructive' as const,
      icon: XCircle,
      className: 'bg-red-100 text-red-800 border-red-200',
    },
    used: {
      label: 'Used',
      variant: 'outline' as const,
      icon: CheckCircle,
      className: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    refunded: {
      label: 'Refunded',
      variant: 'outline' as const,
      icon: RefreshCw,
      className: 'bg-gray-100 text-gray-800 border-gray-200',
    },
  };

  const statusConfig = config[status] || config.confirmed;
  const Icon = statusConfig.icon;

  return (
    <Badge variant={statusConfig.variant} className={`${statusConfig.className} ${className || ''}`}>
      <Icon className="w-3 h-3 mr-1" />
      {statusConfig.label}
    </Badge>
  );
}

