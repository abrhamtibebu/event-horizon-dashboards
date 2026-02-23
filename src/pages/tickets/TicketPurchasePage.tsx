import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PaymentProcessingModal } from '@/components/payments/PaymentProcessingModal';
import {
  Ticket, CreditCard, User, ArrowLeft, ArrowRight, CheckCircle2,
  Smartphone, Lock, Calendar, MapPin, Clock, ShieldCheck,
  ChevronRight, Info, AlertCircle, Wallet
} from 'lucide-react';
import { Spinner, SpinnerInline } from '@/components/ui/spinner';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { PaymentMethod } from '@/types/tickets';
import type { TicketType } from '@/types';
import { format } from 'date-fns';

type Step = 'select' | 'details' | 'payment';

export default function TicketPurchasePage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [invitationCode, setInvitationCode] = useState<string | null>(null);

  const [step, setStep] = useState<Step>('select');
  const [selectedTicketType, setSelectedTicketType] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [paymentMessage, setPaymentMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [paymentPhoneNumber, setPaymentPhoneNumber] = useState('');

  // Attendee details
  const [attendeeDetails, setAttendeeDetails] = useState({
    name: '',
    email: '',
    phone: '',
  });

  // Extract invitation code
  useEffect(() => {
    const invParam = searchParams.get('inv');
    if (invParam) setInvitationCode(invParam);
  }, [searchParams]);

  // Fetch event details
  const { data: eventResult, isLoading: eventLoading } = useQuery({
    queryKey: ['event-public', eventId],
    queryFn: async () => {
      const response = await api.get(`/guest/events/${eventId}/ticket-types`);
      return response.data;
    },
    enabled: !!eventId,
  });

  const event = eventResult?.event;
  const ticketTypes = eventResult?.ticket_types || [];

  // Real-time Inventory Polling
  const { data: availabilityData, refetch: refetchTickets } = useQuery({
    queryKey: ['available-ticket-types', event?.uuid],
    queryFn: async () => {
      const idToUse = event?.uuid || eventId;
      const response = await api.get(`/guest/events/${idToUse}/availability`);
      return response.data;
    },
    enabled: !!event?.uuid && step === 'select',
    refetchInterval: 10000,
  });

  const liveAvailability = availabilityData?.availability || [];

  // Price Calculations
  const { data: calculatedTotals, isLoading: calculatingTotals } = useQuery({
    queryKey: ['ticket-totals', selectedTicketType?.id, quantity],
    queryFn: async () => {
      if (!selectedTicketType || !event?.uuid) return null;
      const response = await api.post('/guest/tickets/calculate', {
        event_uuid: event.uuid,
        tickets: [{ ticket_type_id: selectedTicketType.id, quantity }]
      });
      return response.data;
    },
    enabled: !!selectedTicketType && !!event?.uuid,
  });

  const subtotal = calculatedTotals?.subtotal || (selectedTicketType ? Number(selectedTicketType.price) * quantity : 0);
  const total = calculatedTotals?.total || subtotal;
  const organizerServiceFee = calculatedTotals?.organizer_service_fee || (subtotal * 0.05);

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTicketType || !selectedPaymentMethod) {
        throw new Error('Please select a ticket type and payment method');
      }

      const response = await api.post('/guest/payments/initiate', {
        event_uuid: event?.uuid,
        tickets: [{ ticket_type_id: selectedTicketType.id, quantity }],
        attendee_details: {
          name: attendeeDetails.name,
          email: attendeeDetails.email,
          phone: attendeeDetails.phone,
          agreed_to_terms: true
        },
        payment_method: selectedPaymentMethod,
        phone_number: paymentPhoneNumber,
        invitation_code: invitationCode || undefined,
      });

      return response.data.data;
    },
    onSuccess: async (payment) => {
      setIsProcessing(true);
      setPaymentStatus('pending');
      setPaymentMessage('Securely processing your payment...');
      setProgress(20);

      // Polling for Chapa/Telebirr status if it's integrated via backend
      // Or redirect if it returns a checkout URL
      if (payment.checkout_url) {
        window.location.href = payment.checkout_url;
        return;
      }

      // Fallback polling logic for mobile payments
      try {
        let attempts = 0;
        const maxAttempts = 45;
        let isSuccess = false;

        const intervalId = setInterval(() => setProgress(p => Math.min(p + 1.5, 95)), 1000);

        while (attempts < maxAttempts) {
          try {
            const response = await api.get(`/guest/payments/${payment.id}/status`);
            if (response.data.payment_status === 'success') {
              isSuccess = true;
              break;
            } else if (response.data.payment_status === 'failed') {
              break;
            }
          } catch (e) { }
          attempts++;
          await new Promise(r => setTimeout(r, 2000));
        }

        clearInterval(intervalId);
        setProgress(100);

        if (isSuccess) {
          setPaymentStatus('success');
          setPaymentMessage('Success! Your tickets have been issued.');
          setTimeout(() => navigate('/tickets/purchase/success'), 2000);
        } else {
          setPaymentStatus('failed');
          setPaymentMessage('Payment could not be verified. Please try again.');
        }
      } catch (error) {
        setPaymentStatus('failed');
      }
    },
    onError: (error: any) => {
      setIsProcessing(false);
      toast.error(error.response?.data?.message || 'Failed to initiate purchase');
    },
  });

  const handleNext = () => {
    if (step === 'select') {
      if (!selectedTicketType) return toast.error('Choose your ticket type first');
      setStep('details');
    } else if (step === 'details') {
      if (!attendeeDetails.name || !attendeeDetails.email || !attendeeDetails.phone) {
        return toast.error('Please provide all required attendee details');
      }
      setStep('payment');
    }
  };

  if (eventLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background pt-20">
        <Spinner size="lg" variant="primary" />
        <p className="mt-4 text-muted-foreground animate-pulse">Loading Event Experience...</p>
      </div>
    );
  }

  const startDate = event?.start_date ? new Date(event.start_date) : null;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500">
      {/* Dynamic Header / Banner */}
      <div className="relative h-[30vh] md:h-[40vh] overflow-hidden">
        {event?.image_url ? (
          <img src={event.image_url} alt={event.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/5 to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12">
          <div className="max-w-6xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 mb-3">
                <ShieldCheck className="w-3 h-3 mr-1" /> Official Event Sales
              </span>
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter mb-4">{event?.name}</h1>
              <div className="flex flex-wrap gap-4 text-sm font-medium text-muted-foreground">
                {startDate && (
                  <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-primary" /> {format(startDate, 'PPPP')}</div>
                )}
                <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-primary" /> {event?.venue_name || event?.location}</div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12 -mt-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

          {/* Main Checkout Flow */}
          <div className="lg:col-span-8 space-y-8">
            {/* Step Progress */}
            <div className="flex items-center justify-between px-2">
              <ProgressDot active={step === 'select'} completed={step !== 'select'} label="Tickets" />
              <div className="flex-1 h-px bg-border mx-4" />
              <ProgressDot active={step === 'details'} completed={step === 'payment'} label="Details" />
              <div className="flex-1 h-px bg-border mx-4" />
              <ProgressDot active={step === 'payment'} completed={false} label="Secure Pay" />
            </div>

            <AnimatePresence mode="wait">
              {step === 'select' && (
                <motion.div key="step-select" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <div className="grid grid-cols-1 gap-4">
                    {ticketTypes.map((type: any) => {
                      const availability = liveAvailability.find((a: any) => a.ticket_type_id === type.id);
                      const isSoldOut = availability ? !availability.is_available : false;
                      const isSelected = selectedTicketType?.id === type.id;

                      return (
                        <Card
                          key={type.id}
                          onClick={() => !isSoldOut && setSelectedTicketType(type)}
                          className={`
                            relative overflow-hidden cursor-pointer transition-all duration-300 group
                            ${isSelected ? 'ring-2 ring-primary border-transparent' : 'hover:border-primary/50'}
                            ${isSoldOut ? 'opacity-60 grayscale cursor-not-allowed' : ''}
                          `}
                        >
                          <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="text-xl font-bold tracking-tight">{type.name}</h3>
                                  {isSoldOut && <span className="bg-destructive/10 text-destructive text-[10px] uppercase font-bold px-2 py-0.5 rounded">Sold Out</span>}
                                </div>
                                <p className="text-muted-foreground text-sm leading-relaxed mb-3 line-clamp-2">{type.description}</p>

                                <div className="flex items-center gap-3">
                                  {type.benefits?.slice(0, 2).map((b: string, i: number) => (
                                    <span key={i} className="flex items-center text-[11px] font-semibold text-primary uppercase tracking-wider">
                                      <CheckCircle2 className="w-3 h-3 mr-1" /> {b}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="text-left md:text-right shrink-0">
                                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Price per Ticket</div>
                                <div className="text-3xl font-black tracking-tighter">ETB {Number(type.price).toLocaleString()}</div>
                                {isSelected && (
                                  <div className="mt-2 text-primary font-bold flex items-center md:justify-end text-sm">
                                    Selected <CheckCircle2 className="w-4 h-4 ml-1.5" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                          {isSelected && <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-bl-full border-t border-r border-primary/20" />}
                        </Card>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {step === 'details' && (
                <motion.div key="step-details" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <Card>
                    <CardContent className="p-8 space-y-6">
                      <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-xl border border-primary/10 text-primary">
                        <Info className="w-5 h-5 shrink-0" />
                        <p className="text-sm font-medium">Please provide accurate info. Your tickets will be delivered to this email.</p>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input
                              placeholder="Abebe Kebede"
                              value={attendeeDetails.name}
                              onChange={e => setAttendeeDetails(prev => ({ ...prev, name: e.target.value }))}
                              className="h-12 bg-muted/30"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Email Address</Label>
                            <Input
                              type="email"
                              placeholder="abekebe@gmail.com"
                              value={attendeeDetails.email}
                              onChange={e => setAttendeeDetails(prev => ({ ...prev, email: e.target.value }))}
                              className="h-12 bg-muted/30"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Phone Number</Label>
                          <Input
                            placeholder="0911223344"
                            value={attendeeDetails.phone}
                            onChange={e => setAttendeeDetails(prev => ({ ...prev, phone: e.target.value }))}
                            className="h-12 bg-muted/30"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {step === 'payment' && (
                <motion.div key="step-payment" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <PaymentOption
                      id="chapa"
                      label="Chapa"
                      description="Cards, Mobile Money & More"
                      icon={<Wallet className="w-6 h-6" />}
                      selected={selectedPaymentMethod === 'chapa'}
                      onClick={() => {
                        setSelectedPaymentMethod('chapa');
                        setPaymentPhoneNumber(attendeeDetails.phone);
                      }}
                    />
                    <PaymentOption
                      id="telebirr"
                      label="Telebirr"
                      description="Instant Mobile Checkout"
                      icon={<Smartphone className="w-6 h-6" />}
                      selected={selectedPaymentMethod === 'telebirr'}
                      onClick={() => {
                        setSelectedPaymentMethod('telebirr');
                        setPaymentPhoneNumber(attendeeDetails.phone);
                      }}
                    />
                  </div>

                  <AnimatePresence>
                    {selectedPaymentMethod && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
                        <Card className="border-primary/20 bg-primary/[0.02]">
                          <CardContent className="p-6 space-y-4">
                            <Label className="text-base font-bold">Payment Phone Number</Label>
                            <div className="relative">
                              <Input
                                type="tel"
                                placeholder="0911223344"
                                value={paymentPhoneNumber}
                                onChange={e => setPaymentPhoneNumber(e.target.value)}
                                className="h-14 text-lg font-black tracking-widest pl-12"
                              />
                              <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5" /> 256-bit Secure Encryption Application
                            </p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Checkout Sticky Summary */}
          <div className="lg:col-span-4 lg:sticky lg:top-24">
            <Card className="shadow-2xl border-primary/10 overflow-hidden">
              <div className="p-6 border-b bg-muted/30">
                <h2 className="font-bold flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-primary" /> Purchase Summary
                </h2>
              </div>
              <CardContent className="p-6 space-y-6">
                {selectedTicketType ? (
                  <>
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-lg">{selectedTicketType.name}</p>
                          <p className="text-sm text-muted-foreground">ETB {Number(selectedTicketType.price).toLocaleString()} / ticket</p>
                        </div>
                        <div className="flex items-center gap-3 bg-muted rounded-lg p-1">
                          <button
                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                            disabled={step !== 'select'}
                            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-background disabled:opacity-50 transition-colors"
                          >-</button>
                          <span className="font-bold min-w-[20px] text-center">{quantity}</span>
                          <button
                            onClick={() => setQuantity(q => Math.min(10, q + 1))}
                            disabled={step !== 'select'}
                            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-background disabled:opacity-50 transition-colors"
                          >+</button>
                        </div>
                      </div>

                      <div className="space-y-2.5 pt-4 border-t border-dashed">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span className="font-semibold">{calculatingTotals ? <SpinnerInline /> : `ETB ${subtotal.toLocaleString()}`}</span>
                        </div>
                        <div className="flex justify-between text-sm items-center">
                          <span className="text-muted-foreground inline-flex items-center gap-1">
                            Service Fee (5%) <InfoTooltip text="Organizers cover the service fee for you." />
                          </span>
                          <span className="text-green-600 font-bold uppercase text-[10px] tracking-tighter bg-green-500/10 px-1.5 py-0.5 rounded">Paid by Organizer</span>
                        </div>
                      </div>

                      <div className="pt-4 flex justify-between items-end">
                        <span className="text-base font-bold">Total Payable</span>
                        <div className="text-right">
                          <span className="block text-3xl font-black tracking-tighter text-primary">{calculatingTotals ? <SpinnerInline /> : `ETB ${total.toLocaleString()}`}</span>
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Secure Checkout</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {step !== 'payment' ? (
                        <Button onClick={handleNext} size="lg" className="w-full h-14 text-lg font-bold group shadow-lg shadow-primary/20">
                          Next Step <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      ) : (
                        <Button
                          onClick={() => purchaseMutation.mutate()}
                          disabled={!selectedPaymentMethod || purchaseMutation.isPending}
                          size="lg"
                          className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700 shadow-xl shadow-green-600/20"
                        >
                          {purchaseMutation.isPending ? <SpinnerInline className="mr-2" /> : <Lock className="w-5 h-5 mr-2" />}
                          {purchaseMutation.isPending ? 'Processing...' : `Pay ETB ${total.toLocaleString()}`}
                        </Button>
                      )}

                      {step !== 'select' && (
                        <Button variant="ghost" onClick={() => setStep(step === 'payment' ? 'details' : 'select')} className="w-full text-muted-foreground">
                          <ArrowLeft className="w-4 h-4 mr-2" /> Previous Step
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                      <Ticket className="w-8 h-8 text-muted-foreground/40" />
                    </div>
                    <p className="text-muted-foreground font-medium">Choose a ticket to <br /> see your summary</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="mt-8 flex items-center justify-center gap-6 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck className="w-6 h-6" />
                <span className="text-[10px] font-black uppercase">Secure</span>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="flex flex-col items-center gap-1">
                <Lock className="w-6 h-6" />
                <span className="text-[10px] font-black uppercase">SSL</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      <PaymentProcessingModal
        isOpen={isProcessing}
        onClose={() => setIsProcessing(false)}
        status={paymentStatus}
        message={paymentMessage}
        progress={progress}
        onRetry={() => setIsProcessing(false)}
      />
    </div>
  );
}

function ProgressDot({ active, completed, label }: { active: boolean, completed: boolean, label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`
        w-4 h-4 rounded-full transition-all duration-500
        ${active ? 'bg-primary ring-4 ring-primary/20 scale-125' : completed ? 'bg-primary' : 'bg-muted'}
      `} />
      <span className={`text-[10px] font-bold uppercase tracking-widest ${active ? 'text-primary' : 'text-muted-foreground/60'}`}>{label}</span>
    </div>
  );
}

function PaymentOption({ id, label, description, icon, selected, onClick }: any) {
  return (
    <Card
      onClick={onClick}
      className={`
        cursor-pointer transition-all duration-300 border-2
        ${selected ? 'border-primary bg-primary/[0.03] shadow-inner shadow-primary/5' : 'hover:border-primary/30'}
      `}
    >
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className={`
            w-12 h-12 rounded-2xl flex items-center justify-center transition-colors
            ${selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
          `}>
            {icon}
          </div>
          <div>
            <h4 className="font-bold">{label}</h4>
            <p className="text-[11px] text-muted-foreground">{description}</p>
          </div>
          {selected && <CheckCircle2 className="w-5 h-5 text-primary ml-auto" />}
        </div>
      </CardContent>
    </Card>
  );
}

function InfoTooltip({ text }: { text: string }) {
  return (
    <div className="group relative inline-block cursor-help ml-1">
      <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-popover text-popover-foreground text-[10px] rounded-lg shadow-xl border border-border z-50">
        {text}
      </div>
    </div>
  );
}
