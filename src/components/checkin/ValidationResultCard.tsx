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
  onCheckInDeclined?: (identifier: string) => void;
  isCheckInOnePending?: boolean;
  isCheckInAllPending?: boolean;
  isCheckInDeclinedPending?: boolean;
}

export function ValidationResultCard({
  result,
  onBulkCheckIn,
  onCheckInOne,
  onCheckInAll,
  onCheckInDeclined,
  isCheckInOnePending,
  isCheckInAllPending,
  isCheckInDeclinedPending,
}: ValidationResultCardProps) {
  const isPurchasePass = result.validation_type === 'purchase_pass';
  const isValid = result.validation_status === 'valid' || result.validation_status === 'pass_valid';
  const isWarning = ['already_used', 'too_early', 'pending', 'not_event_checked_in', 'pass_fully_used', 'rsvp_declined'].includes(result.validation_status);
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
    if (isValid) return 'border-emerald-400 bg-emerald-800 text-white';
    if (isWarning) return 'border-amber-300 bg-amber-800 text-white';
    if (isError) return 'border-red-300 bg-red-800 text-white';
    return 'border-sky-300 bg-sky-900 text-white';
  };

  const getStatusBadgeColor = () => {
    return 'border-white/30 bg-white/15 text-white';
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
              <p className="text-xl font-semibold text-white">{result.message}</p>
            </div>
          </div>

          {isPurchasePass && result.purchase_pass && (
            <div className="space-y-4 pt-4 border-t">
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Purchase Pass</span>
                </div>
                <p className="text-xl font-semibold text-white sm:text-2xl">
                  {total} ticket{total === 1 ? '' : 's'} · {checkedIn} checked in · {remaining} remaining
                </p>
                {result.purchase_pass.guest_name && (
                  <p className="mt-2 flex items-center justify-center gap-1 text-sm font-semibold text-white">
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
                      className="flex items-center justify-between rounded-lg border border-white/20 bg-black/25 p-2 text-xs text-white"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold">{t.attendee_name || 'Guest'}</span>
                        <span className="font-mono text-[11px] text-white/80">{t.ticket_number}</span>
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

          {result.validation_status === 'rsvp_declined' && (
            <div className="space-y-4 border-t border-white/20 pt-4">
              <div className="space-y-1 text-center text-sm text-white">
                <p className="text-lg font-semibold">{result.guest?.name || 'Invited guest'}</p>
                {result.guest?.email && <p className="text-white/80">{result.guest.email}</p>}
                {result.guest?.phone && <p className="text-white/80">{result.guest.phone}</p>}
                {result.guest?.guest_type && (
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/70">{result.guest.guest_type}</p>
                )}
              </div>
              {onCheckInDeclined && result.ticket_identifier && (
                <Button
                  onClick={() => onCheckInDeclined(result.ticket_identifier!)}
                  disabled={isCheckInDeclinedPending}
                  className="h-12 w-full text-sm font-semibold"
                >
                  {isCheckInDeclinedPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Check in anyway'}
                </Button>
              )}
            </div>
          )}

          {!isPurchasePass && result.ticket && (
            <div className="space-y-3 pt-4 border-t">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-white/80">Ticket</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <div className="flex items-center text-white/80">
                    <Hash className="w-3 h-3 mr-1" />
                    <span className="text-xs font-semibold uppercase">Ticket number</span>
                  </div>
                  <p className="font-mono text-lg font-semibold text-white">{result.ticket.ticket_number}</p>
                </div>
                {result.ticket.ticket_type && (
                  <div className="space-y-1">
                    <div className="flex items-center text-white/80">
                      <span className="text-xs font-semibold uppercase">Type</span>
                    </div>
                    <Badge variant="outline" className="border-white/30 font-semibold text-white">
                      {result.ticket.ticket_type.name}
                    </Badge>
                  </div>
                )}
                {result.ticket.attendee && (
                  <div className="space-y-1 col-span-2">
                    <div className="flex items-center text-white/80">
                      <User className="w-3 h-3 mr-1" />
                      <span className="text-xs font-semibold uppercase">Guest</span>
                    </div>
                    <p className="text-base font-semibold text-white">{result.ticket.attendee.guest?.name || 'N/A'}</p>
                    <p className="text-sm text-white/80">{result.ticket.attendee.guest?.email}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {!isPurchasePass && result.related_tickets && result.related_tickets.length > 0 && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-widest text-white">Group tickets</h4>
                <Badge variant="outline" className="border-white/30 bg-white/10 text-xs font-semibold text-white">
                  {result.related_tickets.length + 1} Tickets
                </Badge>
              </div>
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {result.related_tickets.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between rounded-lg border border-white/20 bg-black/25 p-2 text-xs text-white">
                    <div className="flex flex-col">
                      <span className="font-mono font-semibold">{t.ticket_number}</span>
                      <span className="text-xs text-white/80">{t.ticket_type?.name}</span>
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
              <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-black/25 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-semibold text-white">Allow entry.</p>
              </div>
            )}
            {isPurchasePass && isValid && (
              <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-black/25 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-semibold text-white">
                  Pass is valid. Check in one guest or the whole group.
                </p>
              </div>
            )}
            {isWarning && (
              <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-black/25 p-4">
                <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-semibold text-white">
                  {result.validation_status === 'pass_fully_used'
                    ? 'All tickets on this pass have been checked in.'
                    : 'Supervisor needed: Verification required.'}
                </p>
              </div>
            )}
            {isError && (
              <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-black/25 p-4">
                <div className="w-8 h-8 rounded-full bg-destructive flex items-center justify-center shrink-0">
                  <Ban className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-semibold text-white">Do not admit this guest.</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
