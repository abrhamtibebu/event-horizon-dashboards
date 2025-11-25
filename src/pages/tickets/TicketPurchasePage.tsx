import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PaymentProcessingModal } from '@/components/payments/PaymentProcessingModal';
import { getAvailableTicketTypes } from '@/lib/api/tickets';
import { initiatePayment, pollPaymentStatus } from '@/lib/api/payments';
import { Ticket, CreditCard, User, ArrowLeft, ArrowRight, CheckCircle2, Sparkles, Smartphone, Building, Lock } from 'lucide-react';
import { Spinner, SpinnerInline } from '@/components/ui/spinner';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { PaymentMethod } from '@/types/tickets';
import type { TicketType } from '@/types';

type Step = 'select' | 'details' | 'payment';

export default function TicketPurchasePage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [invitationCode, setInvitationCode] = useState<string | null>(null);
  
  const [step, setStep] = useState<Step>('select');
  const [selectedTicketType, setSelectedTicketType] = useState<TicketType | null>(null);
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

  // Extract invitation code from URL parameters and track click
  useEffect(() => {
    const invParam = searchParams.get('inv');
    if (invParam) {
      setInvitationCode(invParam);
      console.log('[TicketPurchase] Invitation code detected:', invParam);
      
      // Track invitation link click
      const trackInvitationClick = async () => {
        try {
          await api.post('/invitations/track-click', {
            invitation_code: invParam,
            user_agent: navigator.userAgent,
            ip_address: '', // Will be captured on backend
            referrer: document.referrer
          });
          console.log('[TicketPurchase] Click tracked successfully');
        } catch (error) {
          console.warn('[TicketPurchase] Failed to track click:', error);
        }
      };
      
      trackInvitationClick();
    }
  }, [searchParams]);

  // Fetch event details
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const response = await api.get(`/events/${eventId}`);
      return response.data;
    },
    enabled: !!eventId,
  });

  // Fetch available ticket types
  const { data: ticketTypes, isLoading: ticketTypesLoading } = useQuery({
    queryKey: ['available-ticket-types', eventId],
    queryFn: () => getAvailableTicketTypes(Number(eventId)),
    enabled: !!eventId,
  });

  const subtotal = selectedTicketType ? Number(selectedTicketType.price) * quantity : 0;
  const serviceFee = subtotal * 0.05; // 5% service fee
  const total = subtotal + serviceFee;

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTicketType || !selectedPaymentMethod) {
        throw new Error('Please select a ticket type and payment method');
      }

      // Initiate guest payment with all details
      const paymentResponse = await api.post('/guest/payments/initiate', {
        event_uuid: event?.uuid,
        event_id: event?.id, // Fallback if UUID not available
        tickets: [
          {
            ticket_type_id: selectedTicketType.id,
            quantity: quantity,
          },
        ],
        attendee_details: {
          name: attendeeDetails.name,
          email: attendeeDetails.email,
          phone: paymentPhoneNumber, // Use payment phone number for mobile money
        },
        payment_method: selectedPaymentMethod,
        phone_number: paymentPhoneNumber, // Required for Telebirr/CBE Birr
        invitation_code: invitationCode || undefined,
      });

      return { payment: paymentResponse.data.data };
    },
    onSuccess: async ({ payment }) => {
      setIsProcessing(true);
      setPaymentStatus('pending');
      setPaymentMessage('Processing your payment...');

      // Simulate payment processing with progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      try {
        // Poll for payment status by confirming the payment
        // This will create tickets and attendees when payment is successful
        let attempts = 0;
        const maxAttempts = 10;
        let confirmedPayment = null;

        while (attempts < maxAttempts) {
          try {
            const response = await api.post(`/guest/payments/${payment.payment_id}/confirm`);
            confirmedPayment = response.data;
            
            if (confirmedPayment.success) {
              break;
            }
          } catch (error: any) {
            // If payment failed, break the loop
            if (error.response?.status === 400) {
              confirmedPayment = { success: false };
              break;
            }
          }
          
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        clearInterval(progressInterval);
        setProgress(100);

        if (confirmedPayment?.success) {
          setPaymentStatus('success');
          setPaymentMessage('Payment successful! Your tickets have been sent to your email.');
          
          // Wait 3 seconds then redirect to success page
          setTimeout(() => {
            navigate('/tickets/purchase/success');
          }, 3000);
        } else {
          setPaymentStatus('failed');
          setPaymentMessage('Payment failed. Please try again.');
        }
      } catch (error) {
        clearInterval(progressInterval);
        setPaymentStatus('failed');
        setPaymentMessage('Payment processing timeout. Please check your email for tickets.');
      } finally {
        setIsProcessing(false);
      }
    },
    onError: (error: any) => {
      setIsProcessing(false);
      toast.error(error.response?.data?.message || 'Failed to initiate purchase');
    },
  });

  const handleContinueToDetails = () => {
    if (!selectedTicketType) {
      toast.error('Please select a ticket type');
      return;
    }
    setStep('details');
  };

  const handleContinueToPayment = () => {
    if (!attendeeDetails.name || !attendeeDetails.email || !attendeeDetails.phone) {
      toast.error('Please fill in all attendee details');
      return;
    }
    setStep('payment');
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const cleanNumber = phone.replace(/\D/g, '');
    return (
      /^0[79]\d{8}$/.test(cleanNumber) || // 09xxxxxxxx or 07xxxxxxxx
      /^251[79]\d{8}$/.test(cleanNumber) || // 2519xxxxxxxx or 2517xxxxxxxx
      /^[79]\d{8}$/.test(cleanNumber) // 9xxxxxxxx or 7xxxxxxxx
    );
  };

  const handlePurchase = () => {
    if (!selectedPaymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    if (!paymentPhoneNumber.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

    if (!validatePhoneNumber(paymentPhoneNumber)) {
      toast.error('Please enter a valid Ethiopian phone number (e.g., 0912345678 or +251912345678)');
      return;
    }

    purchaseMutation.mutate();
  };

  const handleClosePaymentModal = () => {
    if (paymentStatus === 'success') {
      navigate('/tickets/purchase/success');
    } else {
      setIsProcessing(false);
      setProgress(0);
      setPaymentStatus('pending');
    }
  };

  const handleRetryPayment = () => {
    setIsProcessing(false);
    setProgress(0);
    setPaymentStatus('pending');
  };

  if (eventLoading || ticketTypesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-200">
        <Spinner size="lg" variant="primary" text="Loading tickets..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-4 md:p-8 flex flex-col items-center">
      <motion.div
        className="max-w-4xl w-full"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
      {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-brand-gradient bg-clip-text text-transparent">
              🎟️ Get Your Tickets
            </h1>
            <p className="text-lg text-muted-foreground">{event?.name}</p>
          </motion.div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <StepIndicator active={step === 'select'} completed={step !== 'select'} label="Select" icon={<Ticket className="w-4 h-4" />} />
            <div className={`h-0.5 w-12 ${step !== 'select' ? 'bg-primary' : 'bg-muted'}`} />
            <StepIndicator active={step === 'details'} completed={step === 'payment'} label="Details" icon={<User className="w-4 h-4" />} />
            <div className={`h-0.5 w-12 ${step === 'payment' ? 'bg-primary' : 'bg-muted'}`} />
            <StepIndicator active={step === 'payment'} completed={false} label="Payment" icon={<CreditCard className="w-4 h-4" />} />
          </div>
      </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {step === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-6 shadow-xl">
                <CardContent className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                      <Sparkles className="w-6 h-6 text-primary" />
                      Choose Your Ticket
                    </h2>
                    
                    <div className="space-y-3">
              {ticketTypes?.data?.map((ticketType: TicketType) => (
                        <motion.div
                  key={ticketType.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`border-2 rounded-xl p-5 cursor-pointer transition-all ${
                    selectedTicketType?.id === ticketType.id
                              ? 'border-primary bg-primary/10 shadow-md'
                              : 'border-border hover:border-primary/50 hover:shadow'
                  }`}
                  onClick={() => setSelectedTicketType(ticketType)}
                >
                          <div className="flex justify-between items-center">
                    <div className="flex-1">
                              <div className="flex items-center gap-3">
                                {selectedTicketType?.id === ticketType.id && (
                                  <CheckCircle2 className="w-5 h-5 text-primary" />
                                )}
                                <h3 className="font-bold text-lg">{ticketType.name}</h3>
                              </div>
                      {ticketType.description && (
                                <p className="text-sm text-muted-foreground mt-2">{ticketType.description}</p>
                      )}
                      {ticketType.benefits && ticketType.benefits.length > 0 && (
                                <ul className="mt-3 space-y-1">
                          {ticketType.benefits.map((benefit, index) => (
                                    <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                                      <span className="text-primary">✓</span> {benefit}
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="mt-3 text-xs text-muted-foreground">
                        {ticketType.quantity ? (
                                  <span className="inline-flex items-center gap-1">
                                    📊 {ticketType.quantity - ticketType.sold_count} tickets remaining
                                  </span>
                        ) : (
                                  <span className="inline-flex items-center gap-1">
                                    ♾️ Unlimited availability
                                  </span>
                        )}
                      </div>
                    </div>
                            <div className="text-right ml-4">
                              <div className="text-3xl font-bold text-primary">
                                ETB {Number(ticketType.price).toFixed(2)}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">per ticket</div>
                            </div>
                          </div>
                        </motion.div>
                      ))}

                      {ticketTypes?.data?.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                          <Ticket className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No tickets available for this event</p>
                      </div>
                      )}
                    </div>
                  </div>

                  {selectedTicketType && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4 pt-4 border-t"
                    >
                      <div>
                        <Label htmlFor="quantity" className="text-base font-medium">
                          Quantity
                        </Label>
                        <Input
                          id="quantity"
                          type="number"
                          value={quantity}
                          min={1}
                          max={10}
                          onChange={(e) => setQuantity(Math.max(1, Math.min(10, Number(e.target.value))))}
                          className="mt-2 text-lg"
                        />
                </div>

                      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal ({quantity} × ETB {Number(selectedTicketType.price).toFixed(2)})</span>
                          <span className="font-semibold">ETB {subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Service Fee (5%)</span>
                          <span>ETB {serviceFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xl font-bold pt-2 border-t border-border">
                          <span>Total</span>
                          <span className="text-primary">ETB {total.toFixed(2)}</span>
                        </div>
                </div>
                    </motion.div>
                  )}

                  <Button
                    disabled={!selectedTicketType}
                    onClick={handleContinueToDetails}
                    className="w-full text-lg py-6"
                    size="lg"
                  >
                    Continue to Details
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
            </CardContent>
          </Card>
            </motion.div>
          )}

          {step === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-6 shadow-xl">
                <CardContent className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                      <User className="w-6 h-6 text-primary" />
                      Attendee Details
                    </h2>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          placeholder="John Doe"
                          value={attendeeDetails.name}
                          onChange={(e) => setAttendeeDetails({ ...attendeeDetails, name: e.target.value })}
                          className="mt-2"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@example.com"
                          value={attendeeDetails.email}
                          onChange={(e) => setAttendeeDetails({ ...attendeeDetails, email: e.target.value })}
                          className="mt-2"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+251912345678"
                          value={attendeeDetails.phone}
                          onChange={(e) => setAttendeeDetails({ ...attendeeDetails, phone: e.target.value })}
                          className="mt-2"
                        />
                      </div>

                      {/* Order Summary */}
                      <div className="bg-muted/50 rounded-lg p-4 mt-6">
                        <h3 className="font-semibold mb-3">Order Summary</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Ticket Type:</span>
                            <span className="font-medium">{selectedTicketType?.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Quantity:</span>
                            <span className="font-medium">{quantity}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t text-lg font-bold">
                            <span>Total:</span>
                            <span className="text-primary">ETB {total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setStep('select')}
                      className="flex-1"
                      size="lg"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={handleContinueToPayment}
                      className="flex-1"
                      size="lg"
                    >
                      Continue to Payment
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
              </CardContent>
            </Card>
            </motion.div>
          )}

          {step === 'payment' && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-6 shadow-xl">
                <CardContent className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                      <CreditCard className="w-6 h-6 text-primary" />
                      Payment Method
                    </h2>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <PaymentMethodButton
                        method="telebirr"
                        label="Telebirr"
                        icon="💳"
                        selected={selectedPaymentMethod === 'telebirr'}
                        onClick={() => setSelectedPaymentMethod('telebirr')}
                      />
                      <PaymentMethodButton
                        method="cbe_birr"
                        label="CBE Birr"
                        icon="🏦"
                        selected={selectedPaymentMethod === 'cbe_birr'}
                        onClick={() => setSelectedPaymentMethod('cbe_birr')}
                      />
                    </div>

                    {/* Phone Number Input - Animated */}
                    <AnimatePresence>
                      {selectedPaymentMethod && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, y: -10, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-6"
                        >
                          <div className="bg-info/10 border border-info/30 rounded-xl p-5">
                            <div className="flex items-start gap-3 mb-4">
                              <Smartphone className="w-5 h-5 text-info mt-0.5" />
                              <div>
                                <h3 className="font-semibold text-card-foreground mb-1">ℹ️ Payment Details</h3>
                                <p className="text-sm text-info">
                                  You will receive a {selectedPaymentMethod === 'telebirr' ? 'Telebirr' : 'CBE Birr'} payment request via USSD or SMS. 
                                  Please complete the payment on your phone to finalize your purchase.
                                </p>
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="paymentPhone" className="text-base font-medium text-card-foreground">
                                Phone Number *
                              </Label>
                              <Input
                                id="paymentPhone"
                                type="tel"
                                placeholder="0912345678 or +251912345678"
                                value={paymentPhoneNumber}
                                onChange={(e) => setPaymentPhoneNumber(e.target.value)}
                                className="mt-2 h-12 text-base bg-background"
                              />
                              <p className="text-sm text-info mt-2">
                                Enter your {selectedPaymentMethod === 'telebirr' ? 'Telebirr' : 'CBE Birr'} registered phone number
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Secure Payment Notice */}
                    {selectedPaymentMethod && paymentPhoneNumber && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2 text-sm text-muted-foreground justify-center mt-6"
                      >
                        <Lock className="w-4 h-4" />
                        <span>Secure Payment — Processed securely through {selectedPaymentMethod === 'telebirr' ? 'Telebirr' : 'CBE Birr'}</span>
                      </motion.div>
                    )}

                    {/* Final Summary */}
                    <div className="bg-gradient-to-br from-primary/10 to-info/10 rounded-lg p-5 mt-6">
                      <h3 className="font-semibold mb-3 text-lg">Purchase Summary</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Ticket:</span>
                          <span className="font-medium">{selectedTicketType?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Quantity:</span>
                      <span className="font-medium">{quantity}</span>
                    </div>
                        <div className="flex justify-between">
                          <span>Attendee:</span>
                          <span className="font-medium">{attendeeDetails.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Email:</span>
                          <span className="font-medium">{attendeeDetails.email}</span>
                        </div>
                        <div className="flex justify-between pt-3 border-t text-xl font-bold">
                          <span>Total Amount:</span>
                          <span className="text-primary">ETB {total.toFixed(2)}</span>
                    </div>
                  </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                  <Button
                      variant="outline"
                      onClick={() => setStep('details')}
                      className="flex-1"
                    size="lg"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                    onClick={handlePurchase}
                    disabled={!selectedPaymentMethod || !paymentPhoneNumber || purchaseMutation.isPending}
                      className="flex-1 bg-brand-gradient"
                      size="lg"
                  >
                    {purchaseMutation.isPending ? (
                      <>
                        <SpinnerInline className="mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {!selectedPaymentMethod ? 'Select Payment Method' : !paymentPhoneNumber ? 'Enter Phone Number' : 'Send Payment Request'}
                          <CheckCircle2 className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
            </CardContent>
          </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Payment Processing Modal */}
      <PaymentProcessingModal
        isOpen={isProcessing}
        onClose={handleClosePaymentModal}
        status={paymentStatus}
        message={paymentMessage}
        progress={progress}
        onRetry={handleRetryPayment}
      />
    </div>
  );
}

// Step Indicator Component
function StepIndicator({ active, completed, label, icon }: { active: boolean; completed: boolean; label: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          completed
            ? 'bg-primary text-white'
            : active
            ? 'bg-primary text-white ring-4 ring-primary/20'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        {completed ? <CheckCircle2 className="w-5 h-5" /> : icon}
      </div>
      <span className={`text-xs font-medium ${active || completed ? 'text-primary' : 'text-muted-foreground'}`}>
        {label}
      </span>
    </div>
  );
}

// Payment Method Button Component
function PaymentMethodButton({
  method,
  label,
  icon,
  selected,
  onClick,
}: {
  method: string;
  label: string;
  icon: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`p-6 rounded-xl border-2 transition-all text-center ${
        selected
          ? 'border-primary bg-primary/10 shadow-lg'
          : 'border-gray-200 hover:border-primary/50 hover:shadow'
      }`}
    >
      <div className="text-4xl mb-2">{icon}</div>
      <div className="font-semibold">{label}</div>
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mt-2"
        >
          <CheckCircle2 className="w-5 h-5 text-primary mx-auto" />
        </motion.div>
      )}
    </motion.button>
  );
}
