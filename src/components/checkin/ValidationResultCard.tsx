import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Clock, Ban, Calendar, User, Hash } from 'lucide-react';
import type { ValidationResult } from '@/types/tickets';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ValidationResultCardProps {
  result: ValidationResult;
  onBulkCheckIn?: (ticketIds: number[]) => void;
}

export function ValidationResultCard({ result, onBulkCheckIn }: ValidationResultCardProps) {
  const isValid = result.validation_status === 'valid';
  const isWarning = ['already_used', 'too_early', 'pending'].includes(result.validation_status);
  const isError = ['invalid', 'expired', 'refunded', 'cancelled'].includes(result.validation_status);

  // Helper for group check-in
  const handleGroupCheckIn = () => {
    if (!result.related_tickets) return;
    const pendingIds = result.related_tickets
      .filter((t: any) => !t.checked_in && (t.status === 'active' || t.status === 'confirmed'))
      .map((t: any) => t.id);

    if (pendingIds.length > 0 && onBulkCheckIn) {
      onBulkCheckIn(pendingIds);
    }
  };

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
    <Card className={`${getStatusColor()} border-2 shadow-sm overflow-hidden`}>
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
              <p className="text-xl font-black">
                {result.message}
              </p>
            </div>
          </div>

          {/* Ticket Details (if available) */}
          {result.ticket && (
            <div className="space-y-3 pt-4 border-t">
              <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Individual Details</h4>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <div className="flex items-center text-muted-foreground">
                    <Hash className="w-3 h-3 mr-1" />
                    <span className="text-[10px] font-bold uppercase">Ticket #</span>
                  </div>
                  <p className="font-mono font-bold text-lg">{result.ticket.ticket_number}</p>
                </div>

                {result.ticket.ticket_type && (
                  <div className="space-y-1">
                    <div className="flex items-center text-muted-foreground">
                      <span className="text-[10px] font-bold uppercase">Variant</span>
                    </div>
                    <Badge variant="outline" className="font-black border-primary/20 text-primary">
                      {result.ticket.ticket_type.name}
                    </Badge>
                  </div>
                )}

                {result.ticket.attendee && (
                  <div className="space-y-1 col-span-2">
                    <div className="flex items-center text-muted-foreground">
                      <User className="w-3 h-3 mr-1" />
                      <span className="text-[10px] font-bold uppercase">Purchaser / Attendee</span>
                    </div>
                    <p className="font-black text-base">
                      {result.ticket.attendee.guest?.name || 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground opacity-70">
                      {result.ticket.attendee.guest?.email}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Related Tickets / Group Purchase */}
          {result.related_tickets && result.related_tickets.length > 0 && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs uppercase tracking-widest text-amber-600">Group Bundle Contents</h4>
                <Badge variant="outline" className="text-[10px] font-black border-amber-200 bg-amber-50">
                  {result.related_tickets.length + 1} Tickets
                </Badge>
              </div>

              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {result.related_tickets.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between p-2 bg-white/50 dark:bg-black/20 rounded-lg border border-border/50 text-xs">
                    <div className="flex flex-col">
                      <span className="font-mono font-bold">{t.ticket_number}</span>
                      <span className="text-[10px] text-muted-foreground">{t.ticket_type?.name}</span>
                    </div>
                    <Badge
                      variant={t.checked_in ? "secondary" : "default"}
                      className={cn(
                        "text-[9px] font-black uppercase px-1.5 py-0",
                        t.checked_in ? "opacity-50" : "bg-blue-500"
                      )}
                    >
                      {t.checked_in ? "Used" : "Pending"}
                    </Badge>
                  </div>
                ))}
              </div>

              {onBulkCheckIn && (
                <Button
                  onClick={handleGroupCheckIn}
                  disabled={!result.related_tickets.some((t: any) => !t.checked_in)}
                  className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white font-black uppercase tracking-widest shadow-lg shadow-amber-500/20"
                >
                  Check-in All Group Members
                </Button>
              )}
            </div>
          )}

          {/* Action Recommendations */}
          <div className="pt-2">
            {isValid && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-bold text-green-700 dark:text-green-400">
                  Access Granted: Allow entry now.
                </p>
              </div>
            )}

            {isWarning && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-bold text-yellow-700 dark:text-yellow-400">
                  Supervisor needed: Verification required.
                </p>
              </div>
            )}

            {isError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-destructive flex items-center justify-center shrink-0">
                  <Ban className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-bold text-destructive">
                  Entry Rejected: Ticket is unusable.
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

