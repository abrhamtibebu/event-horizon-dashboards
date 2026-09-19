import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Clock, Ban, User, Hash, Users, Loader2 } from 'lucide-react';
import type { ValidationResult } from '@/types/tickets';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ValidationResultCardProps {
  result: ValidationResult;
  onBulkCheckIn?: (ticketIds: number[]) => void;
  onCheckInOne?: (orderId: string) => void;
  onCheckInAll?: (orderId: string) => void;
  isCheckInOnePending?: boolean;
  isCheckInAllPending?: boolean;
}

export function ValidationResultCard({
  result,
  onBulkCheckIn,
  onCheckInOne,
  onCheckInAll,
  isCheckInOnePending,
  isCheckInAllPending,
}: ValidationResultCardProps) {
  const isPurchasePass = result.validation_type === 'purchase_pass';
  const isValid = result.validation_status === 'valid' || result.validation_status === 'pass_valid';
  const isWarning = ['already_used', 'too_early', 'pending', 'not_event_checked_in', 'pass_fully_used'].includes(result.validation_status);
  const isError = ['invalid', 'expired', 'refunded', 'cancelled', 'pass_invalid', 'tampered'].includes(result.validation_status);

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

  const remaining = result.purchase_pass?.ticket_count.remaining ?? 0;
  const total = result.purchase_pass?.ticket_count.total ?? 0;
  const checkedIn = result.purchase_pass?.ticket_count.checked_in ?? 0;

  return (
    <Card className={`${getStatusColor()} border-2 shadow-sm overflow-hidden`}>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="text-center space-y-3">
            <div className="flex justify-center">{getStatusIcon()}</div>
            <div className="space-y-2">
              <Badge className={getStatusBadgeColor()}>
                {result.validation_status.replace(/_/g, ' ').toUpperCase()}
              </Badge>
              <p className="text-xl font-black">{result.message}</p>
            </div>
          </div>

          {isPurchasePass && result.purchase_pass && (
            <div className="space-y-4 pt-4 border-t">
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Purchase Pass</span>
                </div>
                <p className="text-2xl font-black">
                  {total} ticket{total === 1 ? '' : 's'} · {checkedIn} checked in · {remaining} remaining
                </p>
                {result.purchase_pass.guest_name && (
                  <p className="mt-2 text-sm font-bold flex items-center justify-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {result.purchase_pass.guest_name}
                  </p>
                )}
              </div>

              {result.tickets && result.tickets.length > 0 && (
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                  {result.tickets.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-2 bg-white/50 dark:bg-black/20 rounded-lg border border-border/50 text-xs"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold">{t.attendee_name || 'Guest'}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">{t.ticket_number}</span>
                      </div>
                      <Badge
                        variant={t.checked_in ? 'secondary' : 'default'}
                        className={cn(
                          'text-[9px] font-black uppercase px-1.5 py-0',
                          t.checked_in ? 'opacity-50' : 'bg-blue-500'
                        )}
                      >
                        {t.checked_in ? 'Used' : 'Pending'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                {onCheckInOne && (
                  <Button
                    onClick={() => onCheckInOne(result.purchase_pass!.order_id)}
                    disabled={remaining <= 0 || isCheckInOnePending || isCheckInAllPending}
                    className="h-12 font-black uppercase tracking-wider text-xs"
                  >
                    {isCheckInOnePending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Check in 1'
                    )}
                  </Button>
                )}
                {onCheckInAll && (
                  <Button
                    onClick={() => onCheckInAll(result.purchase_pass!.order_id)}
                    disabled={remaining <= 0 || isCheckInOnePending || isCheckInAllPending}
                    variant="secondary"
                    className="h-12 font-black uppercase tracking-wider text-xs bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    {isCheckInAllPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Check in all'
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}

          {!isPurchasePass && result.ticket && (
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
                    <p className="font-black text-base">{result.ticket.attendee.guest?.name || 'N/A'}</p>
                    <p className="text-xs text-muted-foreground opacity-70">{result.ticket.attendee.guest?.email}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {!isPurchasePass && result.related_tickets && result.related_tickets.length > 0 && (
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
                      variant={t.checked_in ? 'secondary' : 'default'}
                      className={cn('text-[9px] font-black uppercase px-1.5 py-0', t.checked_in ? 'opacity-50' : 'bg-blue-500')}
                    >
                      {t.checked_in ? 'Used' : 'Pending'}
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

          <div className="pt-2">
            {isValid && !isPurchasePass && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-bold text-green-700 dark:text-green-400">Access Granted: Allow entry now.</p>
              </div>
            )}
            {isPurchasePass && isValid && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-bold text-green-700 dark:text-green-400">
                  Pass valid — use Check in 1 or Check in all to admit guests.
                </p>
              </div>
            )}
            {isWarning && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-bold text-yellow-700 dark:text-yellow-400">
                  {result.validation_status === 'pass_fully_used'
                    ? 'All tickets on this pass have been checked in.'
                    : 'Supervisor needed: Verification required.'}
                </p>
              </div>
            )}
            {isError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-destructive flex items-center justify-center shrink-0">
                  <Ban className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-bold text-destructive">Entry Rejected: Ticket is unusable.</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
