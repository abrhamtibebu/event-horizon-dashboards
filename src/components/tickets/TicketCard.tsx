import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TicketStatusBadge } from './TicketStatusBadge';
import { Calendar, MapPin, DollarSign, Hash } from 'lucide-react';
import type { Ticket } from '@/types';
import { format } from 'date-fns';

interface TicketCardProps {
  ticket: Ticket;
  onViewQR?: () => void;
  onDownload?: () => void;
  onRefund?: () => void;
  className?: string;
}

export function TicketCard({ ticket, onViewQR, onDownload, onRefund, className }: TicketCardProps) {
  const canRefund = ticket.status === 'confirmed' && ticket.event && new Date(ticket.event.start_date) > new Date();

  return (
    <Card className={`hover:shadow-lg transition-shadow ${className || ''}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">
              {ticket.event?.title || 'Event'}
            </h3>
            <TicketStatusBadge status={ticket.status} />
          </div>
          {ticket.event?.image && (
            <img
              src={ticket.event.image as string}
              alt={ticket.event.title}
              className="w-16 h-16 rounded object-cover ml-3"
            />
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Event Details */}
        <div className="space-y-2 text-sm">
          {ticket.event?.start_date && (
            <div className="flex items-center text-muted-foreground">
              <Calendar className="w-4 h-4 mr-2" />
              {format(new Date(ticket.event.start_date), 'PPP p')}
            </div>
          )}
          
          {ticket.event?.location && (
            <div className="flex items-center text-muted-foreground">
              <MapPin className="w-4 h-4 mr-2" />
              {ticket.event.location}
            </div>
          )}

          <div className="flex items-center text-muted-foreground">
            <Hash className="w-4 h-4 mr-2" />
            {ticket.ticket_number}
          </div>

          <div className="flex items-center font-semibold text-primary">
            <DollarSign className="w-4 h-4 mr-2" />
            ETB {ticket.price_paid.toFixed(2)}
          </div>
        </div>

        {/* Ticket Type */}
        {ticket.ticket_type && (
          <div className="pt-2 border-t">
            <span className="text-xs text-muted-foreground">Type: </span>
            <span className="text-sm font-medium">{ticket.ticket_type.name}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {onViewQR && (
            <Button variant="outline" size="sm" onClick={onViewQR} className="flex-1">
              View QR
            </Button>
          )}
          {onDownload && (
            <Button variant="outline" size="sm" onClick={onDownload} className="flex-1">
              Download
            </Button>
          )}
          {onRefund && canRefund && (
            <Button variant="ghost" size="sm" onClick={onRefund} className="text-destructive">
              Request Refund
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

