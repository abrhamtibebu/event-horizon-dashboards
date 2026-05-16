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
                            <p className="text-xs text-gray-500 font-medium">Select the event and area to begin validation.</p>
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
                                                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{event.location}</p>
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
                                        <p className="text-xs text-gray-500 px-8">You aren't assigned to any deployments.</p>
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
                                <span className="block text-[8px] font-bold uppercase text-gray-500 tracking-wider">Active Deployment</span>
                                <span className="block text-xs font-bold text-white truncate max-w-[150px]">
                                    {currentEvent?.name} • {selectedSessionId === 'default' ? 'Main' : currentSession?.name}
                                </span>
                            </div>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setStep('selection')}
                            className="h-8 rounded-lg px-3 text-[10px] font-bold uppercase text-gray-400 hover:text-white"
                        >
                            Change
                        </Button>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid grid-cols-3 h-12 bg-white/5 p-1 border-white/10 rounded-xl">
                            <TabsTrigger value="scanner" className="h-full font-bold text-[10px] uppercase tracking-wider rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                                Scanner
                            </TabsTrigger>
                            <TabsTrigger value="manual" className="h-full font-bold text-[10px] uppercase tracking-wider rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                                Manual
                            </TabsTrigger>
                            <TabsTrigger value="history" className="h-full font-bold text-[10px] uppercase tracking-wider rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                                Activity
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="scanner" className="mt-4">
                            <Card className="border-white/10 bg-white/5 rounded-3xl overflow-hidden">
                                <CardContent className="p-0">
                                    {!isScanning ? (
                                        <div className="py-12 flex flex-col items-center justify-center space-y-6">
                                            <div className="w-20 h-20 bg-primary/10 rounded-[2rem] border-2 border-primary/20 flex items-center justify-center">
                                                <QrCode className="w-10 h-10 text-primary" />
                                            </div>
                                            <div className="text-center space-y-1 px-8">
                                                <h3 className="text-xl font-bold text-white">Ready to Scan</h3>
                                                <p className="text-xs text-gray-500 font-medium">Tap below to open camera and scan QR codes.</p>
                                            </div>
                                            <Button
                                                onClick={() => setIsScanning(true)}
                                                className="px-8 h-12 rounded-xl font-bold uppercase tracking-widest bg-primary hover:bg-primary/90"
                                            >
                                                <Camera className="w-4 h-4 mr-2" />
                                                Open Camera
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <QrScanner
                                                onScan={(decodedText) => {
                                                    // Auto-validate the scanned code
                                                    validateMutation.mutate(decodedText);
                                                }}
                                                onError={(err) => {
                                                    console.error('Scanner error:', err);
                                                }}
                                                onClose={() => setIsScanning(false)}
                                                paused={validateMutation.isPending}
                                            />
                                            {validateMutation.isPending && (
                                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-40 rounded-2xl gap-3">
                                                    <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                                    <span className="text-xs font-bold uppercase tracking-widest text-white">
                                                        Validating...
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="manual" className="mt-4">
                            <Card className="border-white/10 bg-white/5 rounded-3xl p-5">
                                <form onSubmit={handleManualSubmit} className="space-y-4">
                                    <div className="text-center space-y-1">
                                        <h3 className="text-lg font-bold text-white uppercase tracking-tight">Manual Entry</h3>
                                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Enter numeric ID or code</p>
                                    </div>
                                    <Input
                                        value={ticketNumber}
                                        onChange={(e) => setTicketNumber(e.target.value)}
                                        placeholder="TKT-1234567"
                                        className="h-14 text-xl font-mono text-center tracking-widest uppercase bg-white/5 border-white/10 rounded-xl text-white"
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
                                                        <span className="font-mono font-bold text-xs text-white">{res.ticket?.ticket_number || 'TKT-?'}</span>
                                                        <span className="text-[8px] uppercase font-bold text-gray-500">{res.message}</span>
                                                    </div>
                                                </div>
                                                <span className="text-[8px] font-bold text-gray-600 uppercase">Now</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-12 text-center opacity-20">
                                            <History className="w-8 h-8 mx-auto text-white" />
                                            <p className="font-bold uppercase text-[9px] tracking-widest mt-2 text-white">No activity</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    {lastResult && (
                        <div className="animate-in fade-in duration-300">
                            <div className="flex justify-between items-center mb-2 px-1">
                                <h3 className="font-bold text-[9px] uppercase tracking-wider text-gray-500">Live Result</h3>
                                <Button variant="ghost" size="sm" className="h-6 text-[8px] font-bold uppercase" onClick={() => setLastResult(null)}>Dismiss</Button>
                            </div>
                            <ValidationResultCard result={lastResult} onBulkCheckIn={handleBulkCheckIn} />
                        </div>
                    )}
                </div>

                <div className="pb-24 pt-4 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full">
                        <span className="text-[8px] font-bold uppercase tracking-wider text-gray-600">
                            Protocol 2.4 Active
                        </span>
                    </div>
                </div>
            </div>
        </UsherMobileLayout>
    );
}
