import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QrCode, History, Info, AlertCircle, CheckCircle, Smartphone, Camera, X } from 'lucide-react';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { validateTicket, bulkCheckInTickets, checkInPurchasePassOne, checkInPurchasePassAll } from '@/lib/api/tickets';
import { ValidationResultCard } from '@/components/checkin/ValidationResultCard';
import type { ValidationResult } from '@/types/tickets';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { UsherMobileLayout } from '@/components/UsherMobileLayout';
import QrScanner from '@/components/QrScanner';

export default function TicketRedemption() {
    const [step, setStep] = useState<'selection' | 'validator'>('selection');
    const [ticketNumber, setTicketNumber] = useState('');
    const [lastResult, setLastResult] = useState<ValidationResult | null>(null);
    const [history, setHistory] = useState<ValidationResult[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
    const [selectedSessionId, setSelectedSessionId] = useState<string>('default');
    const [isScanning, setIsScanning] = useState(false);
    const [activeTab, setActiveTab] = useState('scanner');
    const [scanFeedback, setScanFeedback] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

    const queryClient = useQueryClient();

    // Fetch events assigned to this usher
    const { data: assignedEvents, isLoading: eventsLoading } = useQuery({
        queryKey: ['usher-assigned-events'],
        queryFn: async () => {
            const response = await api.get('/usher/events');
            return response.data;
        },
    });

    // Get currently selected event object for display
    const currentEvent = assignedEvents?.find((e: any) => e.id === selectedEventId);
    const currentSession = currentEvent?.sessions?.find((s: any) => String(s.id) === selectedSessionId);

    const validateMutation = useMutation({
        mutationFn: (input: string | { id: string; confirmDeclined?: boolean }) => {
            const id = typeof input === 'string' ? input : input.id;
            const confirmDeclined = typeof input === 'string' ? false : Boolean(input.confirmDeclined);
            return validateTicket({
                ticket_identifier: id,
                event_id: selectedEventId || undefined,
                session_id: selectedSessionId !== 'default' ? Number(selectedSessionId) : undefined,
                confirm_declined: confirmDeclined || undefined,
            });
        },
        onSuccess: (data) => {
            setLastResult(data);
            setHistory(prev => [data, ...prev].slice(0, 10));
            if (data.validation_status === 'rsvp_declined') {
                setScanFeedback({ type: 'warning', message: data.message || 'RSVP declined' });
            } else if (data.validation_type === 'purchase_pass') {
                if (data.validation_status === 'pass_valid') {
                    setScanFeedback({
                        type: 'success',
                        message: data.purchase_pass?.guest_name || data.message || 'Purchase pass found',
                    });
                } else if (data.validation_status === 'pass_fully_used') {
                    setScanFeedback({ type: 'error', message: 'All tickets already checked in' });
                } else {
                    setScanFeedback({ type: 'error', message: data.message || 'Invalid purchase pass' });
                }
            } else if (data.validation_status === 'valid') {
                setScanFeedback({ type: 'success', message: data.attendee?.guest?.name || data.message || 'Check-in successful' });
            } else if (data.validation_status === 'not_event_checked_in') {
                setScanFeedback({ type: 'error', message: 'Not checked in at main entry' });
            } else {
                setScanFeedback({ type: 'error', message: data.message || 'Validation failed' });
            }
            setTicketNumber('');
            setTimeout(() => setScanFeedback(null), 4000);
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Error validating ticket';
            setScanFeedback({ type: 'error', message });
            setTimeout(() => setScanFeedback(null), 4000);
        }
    });

    const bulkCheckInMutation = useMutation({
        mutationFn: (ticketIds: number[]) => bulkCheckInTickets({
            ticket_ids: ticketIds,
            event_id: selectedEventId!
        }),
        onSuccess: (data) => {
            toast.success(data.message || 'Group check-in successful');
            setLastResult(null);
            queryClient.invalidateQueries({ queryKey: ['usher-stats', selectedEventId] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Bulk check-in failed');
        }
    });

    const checkInOneMutation = useMutation({
        mutationFn: (orderId: string) => checkInPurchasePassOne({
            order_id: orderId,
            event_id: selectedEventId!,
        }),
        onSuccess: (data) => {
            setLastResult(data);
            setHistory(prev => [data, ...prev].slice(0, 10));
            toast.success(data.message || 'Checked in 1 ticket');
            setScanFeedback({ type: 'success', message: data.message || 'Checked in 1' });
            setTimeout(() => setScanFeedback(null), 4000);
            queryClient.invalidateQueries({ queryKey: ['usher-stats', selectedEventId] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Check-in failed');
        },
    });

    const checkInAllMutation = useMutation({
        mutationFn: (orderId: string) => checkInPurchasePassAll({
            order_id: orderId,
            event_id: selectedEventId!,
        }),
        onSuccess: (data) => {
            setLastResult(data);
            setHistory(prev => [data, ...prev].slice(0, 10));
            toast.success(data.message || 'All tickets checked in');
            setScanFeedback({ type: 'success', message: data.message || 'All checked in' });
            setTimeout(() => setScanFeedback(null), 4000);
            queryClient.invalidateQueries({ queryKey: ['usher-stats', selectedEventId] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Bulk check-in failed');
        },
    });

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!ticketNumber) return;
        validateMutation.mutate(ticketNumber);
    };

    const handleBulkCheckIn = (ticketIds: number[]) => {
        if (!selectedEventId) {
            toast.error('Event context missing. Please re-select event.');
            return;
        }
        bulkCheckInMutation.mutate(ticketIds);
    };

    const handleCheckInOne = (orderId: string) => {
        if (!selectedEventId) {
            toast.error('Event context missing. Please re-select event.');
            return;
        }
        checkInOneMutation.mutate(orderId);
    };

    const handleCheckInAll = (orderId: string) => {
        if (!selectedEventId) {
            toast.error('Event context missing. Please re-select event.');
            return;
        }
        checkInAllMutation.mutate(orderId);
    };

    if (eventsLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Spinner size="lg" />
                <p className="text-gray-400 font-bold">Initializing Validator...</p>
            </div>
        );
    }

    // Step 1: Selection View
    if (step === 'selection') {
        return (
            <UsherMobileLayout title="Select Deployment">
                <div className="flex flex-col h-full md:h-auto">
                    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
                        <div className="space-y-1">
                            <h2 className="text-[10px] font-bold uppercase tracking-[0.1em] text-primary/80">Mission Control</h2>
                            <h1 className="text-2xl font-bold text-white leading-tight">Pick Your Deployment</h1>
                            <p className="text-sm text-white/80">Choose the event and entrance, then start scanning.</p>
                        </div>

                        <div className="grid grid-cols-1 gap-3 pb-32">
                            {assignedEvents && assignedEvents.length > 0 ? (
                                assignedEvents.map((event: any) => (
                                    <Card 
                                        key={event.id} 
                                        className={cn(
                                            "border-white/10 bg-white/5 rounded-2xl overflow-hidden transition-all duration-200",
                                            selectedEventId === event.id ? "ring-1 ring-primary/50 bg-white/[0.08]" : "hover:bg-white/[0.07]"
                                        )}
                                    >
                                        <div 
                                            className="p-5 cursor-pointer"
                                            onClick={() => {
                                                setSelectedEventId(event.id);
                                                if (!event.sessions || event.sessions.length === 0) {
                                                    setSelectedSessionId('default');
                                                }
                                            }}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base transition-colors",
                                                        selectedEventId === event.id ? "bg-primary text-white" : "bg-white/10 text-gray-400"
                                                    )}>
                                                        {event.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-base text-white leading-tight">{event.name}</h3>
                                                        <p className="text-sm text-white/75">{event.location}</p>
                                                    </div>
                                                </div>
                                                {selectedEventId === event.id && (
                                                    <CheckCircle className="w-5 h-5 text-primary" />
                                                )}
                                            </div>

                                            {selectedEventId === event.id && (
                                                <div className="mt-4 space-y-2 animate-in fade-in duration-300">
                                                    <div className="flex items-center gap-2 px-1">
                                                        <Info className="w-3 h-3 text-primary/60" />
                                                        <span className="text-[9px] font-bold uppercase tracking-widest text-primary/60">Select Zone</span>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        <Button
                                                            variant={selectedSessionId === 'default' ? "default" : "outline"}
                                                            className={cn(
                                                                "h-12 rounded-xl justify-between px-4 text-left border-white/10",
                                                                selectedSessionId === 'default' ? "bg-primary text-white" : "bg-white/5 text-gray-400"
                                                            )}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedSessionId('default');
                                                            }}
                                                        >
                                                            <div className="flex flex-col items-start">
                                                                <span className="text-xs font-bold uppercase">Main Entry</span>
                                                                <span className="text-[8px] font-medium opacity-60 normal-case">Gate & walk-ins</span>
                                                            </div>
                                                            {selectedSessionId === 'default' && <CheckCircle className="w-3 h-3" />}
                                                        </Button>

                                                        {event.sessions?.map((session: any) => (
                                                            <Button
                                                                key={session.id}
                                                                variant={selectedSessionId === String(session.id) ? "default" : "outline"}
                                                                className={cn(
                                                                    "h-12 rounded-xl justify-between px-4 text-left border-white/10",
                                                                    selectedSessionId === String(session.id) ? "bg-primary text-white" : "bg-white/5 text-gray-400"
                                                                )}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedSessionId(String(session.id));
                                                                }}
                                                            >
                                                                <div className="flex flex-col items-start">
                                                                    <span className="text-xs font-bold uppercase">{session.name}</span>
                                                                    <span className="text-[8px] font-medium opacity-60 normal-case">Session access</span>
                                                                </div>
                                                                {selectedSessionId === String(session.id) && <CheckCircle className="w-3 h-3" />}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                ))
                            ) : (
                                <div className="py-16 text-center space-y-4">
                                    <AlertCircle className="w-12 h-12 mx-auto text-gray-700" />
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-bold text-white">No Assignments</h3>
                                        <p className="px-8 text-sm text-white/80">You are not assigned to an event yet.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {selectedEventId && (
                        <div className="p-4 bg-[#0b1630] border-t border-white/5 pb-24 sticky bottom-0">
                            <Button 
                                className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest text-xs transition-all active:scale-[0.98]"
                                onClick={() => setStep('validator')}
                            >
                                Confirm & Start Scanning
                            </Button>
                        </div>
                    )}
                </div>
            </UsherMobileLayout>
        );
    }

    // Step 2: Validator View
    return (
        <UsherMobileLayout title="Validator">
            <div className="flex flex-col h-full md:h-auto">
                <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
                    {/* Compact Header */}
                    <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-3">
                        <div className="flex items-center gap-3">
                            <Smartphone className="w-4 h-4 text-primary" />
                            <div>
                                <span className="block text-xs text-white/70">Scanning for</span>
                                <span className="block max-w-[180px] truncate text-sm font-semibold text-white sm:max-w-xs">
                                    {currentEvent?.name} • {selectedSessionId === 'default' ? 'Main' : currentSession?.name}
                                </span>
                            </div>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setStep('selection')}
                            className="h-10 rounded-lg px-3 text-sm font-semibold text-white hover:bg-white/10"
                        >
                            Change
                        </Button>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid grid-cols-3 h-12 bg-white/5 p-1 border-white/10 rounded-xl">
                            <TabsTrigger value="scanner" className="h-full rounded-lg text-sm font-semibold text-white/70 data-[state=active]:bg-primary data-[state=active]:text-white">
                                Scan
                            </TabsTrigger>
                            <TabsTrigger value="manual" className="h-full rounded-lg text-sm font-semibold text-white/70 data-[state=active]:bg-primary data-[state=active]:text-white">
                                Type
                            </TabsTrigger>
                            <TabsTrigger value="history" className="h-full rounded-lg text-sm font-semibold text-white/70 data-[state=active]:bg-primary data-[state=active]:text-white">
                                Recent
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="scanner" className="mt-3">
                            <div className="relative overflow-hidden rounded-2xl bg-black" style={{ height: 'min(62dvh, 560px)' }}>
                                {!isScanning ? (
                                    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
                                        <QrCode className="h-12 w-12 text-white" />
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-semibold text-white">Ready to scan</h3>
                                            <p className="text-sm text-white/80">Hold the guest code inside the frame.</p>
                                        </div>
                                        <Button
                                            onClick={() => setIsScanning(true)}
                                            className="h-12 w-full max-w-xs bg-primary text-base font-semibold text-white"
                                        >
                                            <Camera className="mr-2 h-4 w-4" />
                                            Open camera
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="relative h-full">
                                        <QrScanner
                                            paused={validateMutation.isPending}
                                            onScan={(decodedText) => {
                                                if (!validateMutation.isPending) {
                                                    validateMutation.mutate(decodedText);
                                                }
                                            }}
                                            onError={(err) => {
                                                console.error('Scanner error:', err);
                                            }}
                                            onClose={() => setIsScanning(false)}
                                        />
                                        {scanFeedback && (
                                            <div className={cn(
                                                'absolute inset-x-0 bottom-0 z-40 flex items-center gap-3 p-4',
                                                scanFeedback.type === 'success' ? 'bg-emerald-700' : scanFeedback.type === 'warning' ? 'bg-amber-700' : 'bg-red-700'
                                            )}>
                                                {scanFeedback.type === 'success' ? (
                                                    <CheckCircle className="h-7 w-7 shrink-0 text-white" />
                                                ) : (
                                                    <AlertCircle className="h-7 w-7 shrink-0 text-white" />
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <span className="block text-sm font-medium text-white/90">
                                                        {scanFeedback.type === 'success' ? 'Checked in' : scanFeedback.type === 'warning' ? 'RSVP declined' : 'Not admitted'}
                                                    </span>
                                                    <span className="block text-lg font-semibold leading-tight text-white">
                                                        {scanFeedback.message}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                        {validateMutation.isPending && !scanFeedback && (
                                            <div className="absolute inset-x-0 bottom-0 z-40 flex items-center justify-center gap-3 bg-black/80 p-4">
                                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                <span className="text-base font-semibold text-white">Checking ticket</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="manual" className="mt-4">
                            <Card className="border-white/10 bg-white/5 rounded-3xl p-5">
                                <form onSubmit={handleManualSubmit} className="space-y-4">
                                    <div className="space-y-1 text-center">
                                        <h3 className="text-lg font-semibold text-white">Enter a code</h3>
                                        <p className="text-sm text-white/80">Type the ticket number if the camera cannot read it.</p>
                                    </div>
                                    <Input
                                        value={ticketNumber}
                                        onChange={(e) => setTicketNumber(e.target.value)}
                                        placeholder="TKT-1234567"
                                        className="h-14 rounded-xl border-white/20 bg-black/30 text-center font-mono text-lg uppercase tracking-widest text-white placeholder:text-white/50"
                                    />
                                    <Button
                                        type="submit"
                                        disabled={!ticketNumber || validateMutation.isPending}
                                        className="w-full h-14 rounded-xl font-bold uppercase tracking-widest bg-primary"
                                    >
                                        Validate Ticket
                                    </Button>
                                </form>
                            </Card>
                        </TabsContent>

                        <TabsContent value="history" className="mt-4">
                            <Card className="border-white/10 bg-white/5 rounded-3xl p-1 overflow-hidden">
                                <div className="max-h-[300px] overflow-y-auto">
                                    {history.length > 0 ? (
                                        history.map((res, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 rounded-2xl border-b border-white/5 last:border-0">
                                                <div className="flex items-center gap-3">
                                                    {res.validation_status === 'valid' ? 
                                                        <CheckCircle className="w-4 h-4 text-green-400" /> : 
                                                        <X className="w-4 h-4 text-red-400" />
                                                    }
                                                    <div className="flex flex-col">
                                                        <span className="font-mono text-sm font-semibold text-white">{res.ticket?.ticket_number || 'Ticket'}</span>
                                                        <span className="text-sm text-white/80">{res.message}</span>
                                                    </div>
                                                </div>
                                                <span className="text-xs text-white/70">Now</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-12 text-center">
                                            <History className="mx-auto h-8 w-8 text-white/70" />
                                            <p className="mt-2 text-sm font-medium text-white">No scans yet</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    {lastResult && (
                        <div className="animate-in fade-in duration-300">
                            <div className="flex justify-between items-center mb-2 px-1">
                                <h3 className="text-sm font-semibold text-white">Latest result</h3>
                                <Button variant="ghost" size="sm" className="h-8 text-sm text-white" onClick={() => setLastResult(null)}>Dismiss</Button>
                            </div>
                            <ValidationResultCard
                                result={lastResult}
                                onBulkCheckIn={handleBulkCheckIn}
                                onCheckInOne={handleCheckInOne}
                                onCheckInAll={handleCheckInAll}
                                onCheckInDeclined={(identifier) => validateMutation.mutate({ id: identifier, confirmDeclined: true })}
                                isCheckInOnePending={checkInOneMutation.isPending}
                                isCheckInAllPending={checkInAllMutation.isPending}
                                isCheckInDeclinedPending={validateMutation.isPending}
                            />
                        </div>
                    )}
                </div>

            </div>
        </UsherMobileLayout>
    );
}
