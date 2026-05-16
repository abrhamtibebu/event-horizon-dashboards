import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QrCode, Search, UserCheck, History, Info, AlertCircle, CheckCircle, Smartphone, Camera, X } from 'lucide-react';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { validateTicket, bulkCheckInTickets } from '@/lib/api/tickets';
import { ValidationResultCard } from '@/components/checkin/ValidationResultCard';
import type { ValidationResult } from '@/types/tickets';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
// Note: In a real app, we'd use a QR scanner library like react-qr-reader or html5-qrcode
// For this demo, we'll use a placeholder UI for scanning

export default function TicketRedemption() {
    const [ticketNumber, setTicketNumber] = useState('');
    const [lastResult, setLastResult] = useState<ValidationResult | null>(null);
    const [history, setHistory] = useState<ValidationResult[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
    const [selectedSessionId, setSelectedSessionId] = useState<string>('default');
    const [isScanning, setIsScanning] = useState(false);
    const [activeTab, setActiveTab] = useState('scanner');

    const queryClient = useQueryClient();

    // Fetch events assigned to this usher
    const { data: assignedEvents, isLoading: eventsLoading } = useQuery({
        queryKey: ['usher-assigned-events'],
        queryFn: async () => {
            const response = await api.get('/usher/events');
            return response.data;
        },
    });

    // Auto-select when usher has exactly one assigned event
    useEffect(() => {
        if (assignedEvents?.length === 1 && selectedEventId == null) {
            setSelectedEventId(assignedEvents[0].id);
            setSelectedSessionId('default');
        }
    }, [assignedEvents, selectedEventId]);

    const validateMutation = useMutation({
        mutationFn: (id: string) => validateTicket({
            ticket_identifier: id,
            event_id: selectedEventId || undefined,
            session_id: selectedSessionId !== 'default' ? Number(selectedSessionId) : undefined
        }),
        onSuccess: (data) => {
            setLastResult(data);
            setHistory(prev => [data, ...prev].slice(0, 10)); // Keep last 10
            if (data.validation_status === 'valid') {
                toast.success(data.message || 'Check-in successful');
            } else if (data.validation_status === 'not_event_checked_in') {
                toast.error(
                    data.message ||
                        'Check in at Main Event Entry first, or register walk-ins under Guests.',
                );
            } else {
                toast.error(data.message || 'Validation Failed');
            }
            setTicketNumber('');
            setIsScanning(false);
        },
        onError: (error: any) => {
            const status = error.response?.data?.validation_status;
            const message = error.response?.data?.message;
            if (status === 'not_event_checked_in') {
                toast.error(
                    message ||
                        'Check in at Main Event Entry first, or register walk-ins under Guests.',
                );
            } else {
                toast.error(message || 'Error validating ticket');
            }
        }
    });

    const bulkCheckInMutation = useMutation({
        mutationFn: (ticketIds: number[]) => bulkCheckInTickets({
            ticket_ids: ticketIds,
            event_id: selectedEventId!
        }),
        onSuccess: (data) => {
            toast.success(data.message || 'Group check-in successful');
            // Update last result to reflect changes if possible or clear it
            setLastResult(null);
            queryClient.invalidateQueries({ queryKey: ['usher-stats', selectedEventId] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Bulk check-in failed');
        }
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

    if (eventsLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Spinner size="lg" />
                <p className="text-muted-foreground animate-pulse font-bold">Initializing Validator...</p>
            </div>
        );
    }

    return (
        <div className="container max-w-2xl mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between px-2">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter">Validator <span className="text-primary italic">Pro</span></h1>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Entry Management System</p>
                </div>
                <div className="flex gap-2">
                    <Badge variant="outline" className="h-8 border-brand-gradient text-[10px] font-black uppercase">
                        Live Sync
                    </Badge>
                </div>
            </div>

            {/* Event Selector - Critical Context */}
            <Card className="border-2 shadow-lg bg-brand-gradient/5">
                <CardHeader className="pb-3 pt-4">
                    <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-primary" />
                        Active Deployment
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-3">
                        {assignedEvents && assignedEvents.length > 0 ? (
                            <div className="grid grid-cols-1 gap-2">
                                {assignedEvents.map((event: any) => (
                                    <div key={event.id} className="space-y-2">
                                        <Button
                                            variant={selectedEventId === event.id ? "default" : "outline"}
                                            className={cn(
                                                "h-14 w-full justify-start px-4 text-left border-2 transition-all",
                                                selectedEventId === event.id ? "ring-2 ring-primary ring-offset-2 scale-[1.01]" : "hover:border-primary/50"
                                            )}
                                            onClick={() => {
                                                setSelectedEventId(event.id);
                                                setSelectedSessionId('default');
                                            }}
                                        >
                                            <div className="flex items-center gap-3 w-full">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-full flex items-center justify-center font-black",
                                                    selectedEventId === event.id ? "bg-white text-primary" : "bg-primary/10 text-primary"
                                                )}>
                                                    {event.name.charAt(0)}
                                                </div>
                                                <div className="flex-1 truncate">
                                                    <p className="font-black text-sm leading-tight">{event.name}</p>
                                                    <p className="text-[10px] font-bold opacity-70 uppercase truncate">
                                                        {event.location} • {event.date}
                                                    </p>
                                                </div>
                                            </div>
                                        </Button>

                                        {selectedEventId === event.id && event.sessions && event.sessions.length > 0 && (
                                            <div className="pl-4 pr-1 py-2 space-y-2 bg-white/5 rounded-xl border border-white/5 animate-in slide-in-from-top-2">
                                                <p className="text-[9px] font-black uppercase text-muted-foreground px-2">Check-in mode</p>
                                                <p className="text-[10px] text-muted-foreground px-2 leading-snug">
                                                    Main Event Entry checks guests in and supports walk-ins (via Guests tab).
                                                    Sessions only admit guests already checked in at the event.
                                                </p>
                                                <div className="grid grid-cols-1 gap-2">
                                                    <Button
                                                        variant={selectedSessionId === 'default' ? "secondary" : "ghost"}
                                                        size="sm"
                                                        className="h-auto min-h-8 py-2 justify-between text-[10px] font-bold uppercase text-left"
                                                        onClick={() => setSelectedSessionId('default')}
                                                    >
                                                        <span>
                                                            Main Event Entry
                                                            <span className="block text-[8px] font-medium normal-case opacity-70">Event check-in &amp; walk-ins</span>
                                                        </span>
                                                        {selectedSessionId === 'default' && <CheckCircle className="w-3 h-3 text-primary shrink-0" />}
                                                    </Button>
                                                    {event.sessions.map((session: any) => (
                                                        <Button
                                                            key={session.id}
                                                            variant={selectedSessionId === String(session.id) ? "secondary" : "ghost"}
                                                            size="sm"
                                                            className="h-auto min-h-10 py-2 justify-between text-[10px] font-bold uppercase text-left"
                                                            onClick={() => setSelectedSessionId(String(session.id))}
                                                        >
                                                            <div className="flex flex-col items-start">
                                                                <span>{session.name}</span>
                                                                <span className="text-[8px] font-medium normal-case opacity-60">Session entry only</span>
                                                                <span className="text-[8px] opacity-60">Live: {session.current_attendance || 0} checked-in</span>
                                                            </div>
                                                            {selectedSessionId === String(session.id) && <CheckCircle className="w-3 h-3 text-primary shrink-0" />}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center border-2 border-dashed rounded-xl bg-muted/20">
                                <AlertCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
                                <p className="font-bold">No active assignments</p>
                                <p className="text-xs text-muted-foreground mt-1">You aren't currently assigned to any live events.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-3 h-14 bg-muted/50 p-1 border">
                    <TabsTrigger value="scanner" className="h-full font-black text-xs uppercase tracking-widest">
                        <QrCode className="w-4 h-4 mr-2" /> Scanner
                    </TabsTrigger>
                    <TabsTrigger value="manual" className="h-full font-black text-xs uppercase tracking-widest">
                        <Search className="w-4 h-4 mr-2" /> Manual
                    </TabsTrigger>
                    <TabsTrigger value="history" className="h-full font-black text-xs uppercase tracking-widest">
                        <History className="w-4 h-4 mr-2" /> Activity
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="scanner" className="mt-4 animate-in fade-in slide-in-from-bottom-4">
                    <Card className="border-2 overflow-hidden shadow-2xl">
                        <CardContent className="p-0">
                            {!isScanning ? (
                                <div className="py-20 flex flex-col items-center justify-center space-y-6 bg-muted/10">
                                    <div className="relative">
                                        <div className="absolute -inset-4 bg-primary/20 rounded-full animate-ping opacity-20" />
                                        <div className="w-24 h-24 bg-primary/10 rounded-3xl border-4 border-primary/30 flex items-center justify-center">
                                            <QrCode className="w-12 h-12 text-primary" />
                                        </div>
                                    </div>
                                    <div className="text-center space-y-2">
                                        <h3 className="text-2xl font-black">Scan Ready</h3>
                                        <p className="text-sm text-muted-foreground max-w-xs px-4">
                                            Position the attendee's QR code front and center for instant verification.
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() => setIsScanning(true)}
                                        disabled={!selectedEventId}
                                        size="lg"
                                        className="px-8 h-12 font-black uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                                    >
                                        <Camera className="w-5 h-5 mr-3" />
                                        Initialize Lens
                                    </Button>
                                    {!selectedEventId && (
                                        <p className="text-[10px] font-black text-destructive uppercase animate-pulse">
                                            Please select an event target above
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="aspect-square relative bg-black flex items-center justify-center group">
                                    {/* Simulated Scanner UI */}
                                    <div className="absolute inset-0 border-[40px] border-black/60 z-10" />
                                    <div className="w-64 h-64 border-2 border-white/50 rounded-2xl relative z-10">
                                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl" />
                                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.8)] animate-scan" />
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Spinner size="lg" className="text-primary/50" />
                                    </div>
                                    <div className="absolute bottom-8 left-0 right-0 text-center z-20">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="rounded-full bg-white/20 backdrop-blur-md text-white border-0 px-6 font-black uppercase text-[10px]"
                                            onClick={() => setIsScanning(false)}
                                        >
                                            <X className="w-3 h-3 mr-2" /> Cancel Scan
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="manual" className="mt-4 animate-in fade-in slide-in-from-bottom-4">
                    <Card className="border-2 shadow-xl">
                        <CardHeader>
                            <CardTitle>Manual Entry</CardTitle>
                            <CardDescription>Enter the 10-digit ticket numeric ID or alphanumeric code</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleManualSubmit} className="space-y-4">
                                <div className="relative">
                                    <Input
                                        value={ticketNumber}
                                        onChange={(e) => setTicketNumber(e.target.value)}
                                        placeholder="e.g. TKT-1234567"
                                        className="h-14 text-xl font-mono text-center tracking-widest uppercase border-2 focus:ring-primary"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={!ticketNumber || validateMutation.isPending || !selectedEventId}
                                    className="w-full h-12 font-black uppercase tracking-widest"
                                >
                                    {validateMutation.isPending ? <Spinner size="sm" /> : <UserCheck className="w-5 h-5 mr-3" />}
                                    Validate Ticket
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="mt-4 animate-in fade-in slide-in-from-bottom-4">
                    <Card className="border-2 shadow-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center justify-between">
                                Recent Validations
                                <Badge variant="secondary">{history.length}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {history.length > 0 ? (
                                history.map((res, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-transparent hover:border-border transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-10 h-10 rounded-full flex items-center justify-center",
                                                res.validation_status === 'valid' ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"
                                            )}>
                                                {res.validation_status === 'valid' ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-mono font-bold text-xs">{res.ticket?.ticket_number || 'UNKNOWN'}</span>
                                                <span className="text-[10px] uppercase font-black text-muted-foreground">{res.message}</span>
                                            </div>
                                        </div>
                                        <div className="text-[10px] font-bold text-muted-foreground opacity-50">
                                            JUST NOW
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-20 text-center space-y-2 opacity-30">
                                    <History className="w-12 h-12 mx-auto" />
                                    <p className="font-black uppercase text-xs">No activity yet</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Result Display Overlay / Section */}
            {lastResult && (
                <div className="animate-in zoom-in-95 duration-300">
                    <div className="flex items-center justify-between mb-2 px-1">
                        <h3 className="font-black text-xs uppercase tracking-widest text-muted-foreground">Validation Result</h3>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] font-black uppercase" onClick={() => setLastResult(null)}>
                            Clear
                        </Button>
                    </div>
                    <ValidationResultCard
                        result={lastResult}
                        onBulkCheckIn={handleBulkCheckIn}
                    />
                </div>
            )}

            {/* Footer Info */}
            <div className="pt-8 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full border border-border/50">
                    <Info className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">
                        Connected to Evella Central • Usher #612
                    </span>
                </div>
            </div>
        </div>
    );
}
