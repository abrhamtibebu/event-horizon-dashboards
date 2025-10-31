import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Clock, Ban, Calendar, User, Hash } from 'lucide-react';
import type { ValidationResult } from '@/types/tickets';
import { format } from 'date-fns';

interface ValidationResultCardProps {
  result: ValidationResult;
}

export function ValidationResultCard({ result }: ValidationResultCardProps) {
  const isValid = result.validation_status === 'valid';
  const isWarning = ['already_used', 'too_early', 'pending'].includes(result.validation_status);
  const isError = ['invalid', 'expired', 'refunded', 'cancelled'].includes(result.validation_status);

  const getStatusIcon = () => {
    if (isValid) return <CheckCircle className="w-16 h-16 text-green-500" />;
    if (isWarning) return <AlertTriangle className="w-16 h-16 text-yellow-500" />;
    if (isError) return <XCircle className="w-16 h-16 text-destructive" />;
    return <Clock className="w-16 h-16 text-blue-500" />;
  };

  const getStatusColor = () => {
    if (isValid) return 'bg-green-50 border-green-200';
    if (isWarning) return 'bg-yellow-50 border-yellow-200';
    if (isError) return 'bg-red-50 border-red-200';
    return 'bg-blue-50 border-blue-200';
  };

  const getStatusBadgeColor = () => {
    if (isValid) return 'bg-green-100 text-green-800 border-green-200';
    if (isWarning) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (isError) return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  return (
    <Card className={`${getStatusColor()} border-2`}>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Status Icon and Message */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              {getStatusIcon()}
            </div>
            <div className="space-y-2">
              <Badge className={getStatusBadgeColor()}>
                {result.validation_status.replace('_', ' ').toUpperCase()}
              </Badge>
              <p className="text-lg font-semibold">
                {result.message}
              </p>
            </div>
          </div>

          {/* Ticket Details (if available) */}
          {result.ticket && (
            <div className="space-y-3 pt-4 border-t">
              <h4 className="font-semibold text-sm text-muted-foreground">Ticket Details</h4>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <div className="flex items-center text-muted-foreground">
                    <Hash className="w-4 h-4 mr-2" />
                    <span className="text-xs">Ticket #</span>
                  </div>
                  <p className="font-mono font-semibold">{result.ticket.ticket_number}</p>
                </div>

                {result.ticket.ticket_type && (
                  <div className="space-y-1">
                    <div className="flex items-center text-muted-foreground">
                      <Badge variant="outline" className="h-4 px-1 text-xs">Type</Badge>
                    </div>
                    <p className="font-medium">{result.ticket.ticket_type.name}</p>
                  </div>
                )}

                {result.ticket.attendee_info && (
                  <div className="space-y-1 col-span-2">
                    <div className="flex items-center text-muted-foreground">
                      <User className="w-4 h-4 mr-2" />
                      <span className="text-xs">Attendee</span>
                    </div>
                    <p className="font-medium">
                      {result.ticket.attendee_info.name || 'N/A'}
                    </p>
                  </div>
                )}

                {result.ticket.event && (
                  <div className="space-y-1 col-span-2">
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span className="text-xs">Event</span>
                    </div>
                    <p className="font-medium">{result.ticket.event.title}</p>
                    {result.ticket.event.start_date && (
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(result.ticket.event.start_date), 'PPP p')}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Purchase Info */}
              <div className="pt-2 border-t text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Price Paid:</span>
                  <span className="font-semibold">ETB {result.ticket.price_paid.toFixed(2)}</span>
                </div>
                {result.ticket.purchased_at && (
                  <div className="flex justify-between mt-1">
                    <span>Purchased:</span>
                    <span>{format(new Date(result.ticket.purchased_at), 'PP')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Recommendations */}
          {isValid && (
            <div className="bg-green-100 border border-green-200 rounded-lg p-3">
              <p className="text-sm font-medium text-green-800">
                ✓ Grant entry to the event
              </p>
            </div>
          )}

          {isWarning && (
            <div className="bg-yellow-100 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm font-medium text-yellow-800">
                ⚠ Verify with supervisor before granting entry
              </p>
            </div>
          )}

          {isError && (
            <div className="bg-red-100 border border-red-200 rounded-lg p-3">
              <p className="text-sm font-medium text-red-800">
                ✗ Do not grant entry - ticket is invalid
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

