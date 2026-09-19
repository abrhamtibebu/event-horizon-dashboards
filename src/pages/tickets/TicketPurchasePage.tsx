import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PaymentProcessingModal } from '@/components/payments/PaymentProcessingModal';
import {
  ArrowLeft,
  Clock,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import api from '@/lib/api';
import { validateGuestPromoCode } from '@/lib/api/guestTicketPurchase';
import { getPaymentMethods } from '@/lib/api/payments';
import { useRegistrationShareMeta } from '@/lib/registrationShareMeta';
import type { PaymentMethod } from '@/types/tickets';
import EventLocationMapCard from '@/components/EventLocationMapCard';
import { cn } from '@/lib/utils';
import { CheckoutSection } from '@/components/tickets/checkout/CheckoutSection';
import { CheckoutTopBar } from '@/components/tickets/checkout/CheckoutTopBar';
import { EventContextCard } from '@/components/tickets/checkout/EventContextCard';
import { PurchaseStepper } from '@/components/tickets/checkout/PurchaseStepper';
import { TicketTypeOption } from '@/components/tickets/checkout/TicketTypeOption';
import { PaymentMethodOption } from '@/components/tickets/checkout/PaymentMethodOption';
import { PurchaseOrderSummary } from '@/components/tickets/checkout/PurchaseOrderSummary';
import { CheckoutActionDock } from '@/components/tickets/checkout/CheckoutActionDock';
import { CheckoutPromoFields } from '@/components/tickets/checkout/CheckoutPromoFields';
import { SeatMapStep, tierColorsByTicketType } from '@/components/tickets/checkout/SeatMapStep';
import {
  fetchBestAvailable,
  fetchPublicSeatingMap,
  releaseSeats,
  releaseSeatsOnUnload,
  reserveSeats,
} from '@/lib/api/publicSeating';
import { referralTracking } from '@/lib/referralTracking';
import {
  extractReferralSuffix,
  isPromoInputReadyForValidation,
  promoCodeFromUrlParam,
  toFullReferralCode,
} from '@/lib/referralCode';
import { isQaCheckoutPhone } from '@/lib/inputQuality';

type Step = 'select' | 'seats' | 'details' | 'payment';

const MAX_SEATS_PER_ORDER = 10;

/** Ticks down to an ISO deadline, returning null when there is nothing to count. */
function useSecondsUntil(deadline: string | null): number | null {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!deadline) {
      setSecondsLeft(null);
      return;
    }
    const target = new Date(deadline).getTime();
    const tick = () => setSecondsLeft(Math.max(0, Math.round((target - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  return secondsLeft;
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const stepMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export default function TicketPurchasePage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [promoCode, setPromoCode] = useState<string>('');
  const [showPromoCodes, setShowPromoCodes] = useState(false);

  const [step, setStep] = useState<Step>('select');
  /** Quantity per ticket type id; tiers absent from the map are not in the order. */
  const [cart, setCart] = useState<Record<number, number>>({});
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [paymentMessage, setPaymentMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [paymentPhoneNumber, setPaymentPhoneNumber] = useState('');
  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([]);
  /** Quantity per standing section id; these tickets have no seat. */
  const [standingQty, setStandingQty] = useState<Record<number, number>>({});
  const [seatReservationToken, setSeatReservationToken] = useState<string | undefined>();
  const [seatHoldExpiresAt, setSeatHoldExpiresAt] = useState<string | null>(null);
  // Mirrors of state that unload handlers can read without re-subscribing.
  const seatTokenRef = useRef<string | undefined>(undefined);
  const paymentStartedRef = useRef(false);
  const [isHoldingSeats, setIsHoldingSeats] = useState(false);
  const [isBestAvailableLoading, setIsBestAvailableLoading] = useState(false);

  const availablePaymentMethods = getPaymentMethods().filter((m) => m.is_available);

  const [attendeeDetails, setAttendeeDetails] = useState({
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    const invParam = searchParams.get('inv');
    const refParam = searchParams.get('ref');
    const storedRef = referralTracking.getReferralCode();

    if (invParam) {
      setPromoCode(promoCodeFromUrlParam(invParam, 'inv'));
      setShowPromoCodes(true);
    }
    if (refParam) {
      const display = promoCodeFromUrlParam(refParam, 'ref');
      setPromoCode(display);
      referralTracking.setReferralCode(toFullReferralCode(display));
      referralTracking.trackLinkClick().catch(() => {});
      setShowPromoCodes(true);
    } else if (storedRef) {
      setPromoCode(promoCodeFromUrlParam(storedRef, 'ref'));
    }
  }, [searchParams]);

  const handlePromoCodeChange = (value: string) => {
    setPromoCode(value);
    const trimmed = value.trim();
    if (!trimmed) {
      referralTracking.clearReferralData();
      return;
    }
    if (!trimmed.match(/^[\d\s+()-]+$/)) {
      referralTracking.setReferralCode(toFullReferralCode(trimmed));
    } else {
      referralTracking.setReferralCode(trimmed);
    }
  };

  const { data: eventResult, isLoading: eventLoading, isError } = useQuery({
    queryKey: ['event-public', eventId],
    queryFn: async () => {
      const response = await api.get(`/guest/events/${eventId}/ticket-types`);
      return response.data;
    },
    enabled: !!eventId,
  });

  const event = eventResult?.event;
  const ticketTypes = eventResult?.ticket_types || [];

  const isReservedEvent = event?.seating_mode === 'reserved_seating';

  const { data: seatingMap } = useQuery({
    queryKey: ['public-seating-map', event?.uuid],
    queryFn: () => fetchPublicSeatingMap(event!.uuid),
    enabled: Boolean(event?.uuid && isReservedEvent),
  });

  const showSeatStep = Boolean(
    isReservedEvent &&
      seatingMap?.chart?.sections.some(
        (section) =>
          (section.seats ?? section.rows.flatMap((r) => r.seats)).length > 0 ||
          (section.type === 'standing' && (section.capacity ?? 0) > 0),
      ),
  );
  const standingTicketTypeById = useMemo(() => {
    const out = new Map<number, number | null>();
    for (const section of seatingMap?.chart?.sections ?? []) {
      if (section.type === 'standing') out.set(section.id, section.ticket_type_id ?? null);
    }
    return out;
  }, [seatingMap]);
  const seatLabelById = useMemo(() => {
    const out = new Map<number, string>();
    for (const section of seatingMap?.chart?.sections ?? []) {
      for (const seat of section.seats ?? section.rows.flatMap((r) => r.seats)) {
        out.set(seat.id, seat.label);
      }
    }
    return out;
  }, [seatingMap]);

  // A seat's price comes from its section's ticket type. Sections left unmapped fall
  // back to the only ticket type, when the event has exactly one.
  const soleTicketTypeId = ticketTypes.length === 1 ? (ticketTypes[0].id as number) : null;
  const seatTicketTypeById = useMemo(() => {
    const out = new Map<number, number>();
    for (const section of seatingMap?.chart?.sections ?? []) {
      const typeId = section.ticket_type_id ?? soleTicketTypeId;
      if (typeId == null) continue;
      for (const seat of section.seats ?? section.rows.flatMap((r) => r.seats)) {
        out.set(seat.id, typeId);
      }
    }
    return out;
  }, [seatingMap, soleTicketTypeId]);

  const ticketLines = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => ({ ticket_type_id: Number(id), quantity: qty }))
        .filter((line) => line.quantity > 0)
        .sort((a, b) => a.ticket_type_id - b.ticket_type_id),
    [cart],
  );

  const totalTickets = ticketLines.reduce((sum, l) => sum + l.quantity, 0);
  const standingLines = useMemo(
    () =>
      Object.entries(standingQty)
        .map(([id, qty]) => ({ section_id: Number(id), quantity: qty }))
        .filter((line) => line.quantity > 0),
    [standingQty],
  );
  const standingTotal = standingLines.reduce((sum, l) => sum + l.quantity, 0);
  /** Seats plus standing spots; both count toward the ticket total. */
  const placedTotal = selectedSeatIds.length + standingTotal;

  const setCartQuantity = (ticketTypeId: number, qty: number) => {
    setCart((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[ticketTypeId];
      else next[ticketTypeId] = qty;
      return next;
    });
  };

  const tierColorByTicketType = useMemo(
    () => tierColorsByTicketType(seatingMap?.chart?.sections ?? []),
    [seatingMap],
  );

  const orderLines = useMemo(
    () =>
      ticketLines.map((line) => {
        const type = ticketTypes.find((t: any) => t.id === line.ticket_type_id);
        return {
          ticketTypeId: line.ticket_type_id,
          name: type?.name ?? 'Ticket',
          unitPrice: Number(type?.price ?? 0),
          quantity: line.quantity,
        };
      }),
    [ticketLines, ticketTypes],
  );

  const trimmedPromo = promoCode.trim();

  const { data: promoValidation } = useQuery({
    queryKey: ['promo-validate', event?.uuid, trimmedPromo],
    queryFn: () => validateGuestPromoCode(event!.uuid, trimmedPromo, 'promo'),
    enabled: Boolean(event?.uuid && isPromoInputReadyForValidation(trimmedPromo)),
    retry: false,
  });

  useRegistrationShareMeta({
    enabled: !!event,
    title: event?.name,
    description: event?.description,
    imageRaw: event?.image_url || event?.image || event?.event_image,
    eventId: event?.id,
  });

  const { data: availabilityData } = useQuery({
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

  const { data: calculatedTotals, isLoading: calculatingTotals, error: calculateError } = useQuery({
    queryKey: ['ticket-totals', JSON.stringify(ticketLines), trimmedPromo],
    queryFn: async () => {
      if (ticketLines.length === 0 || !event?.uuid) return null;
      const response = await api.post('/guest/tickets/calculate', {
        event_uuid: event.uuid,
        tickets: ticketLines,
        promo_code: trimmedPromo || undefined,
      });
      return response.data;
    },
    enabled: ticketLines.length > 0 && !!event?.uuid,
  });

  // Changing the cart invalidates seats already picked.
  // Clearing the selection is enough — the sync effect releases the hold.
  const cartKey = JSON.stringify(ticketLines);
  useEffect(() => {
    setSelectedSeatIds([]);
  }, [cartKey]);

  useEffect(() => {
    seatTokenRef.current = seatReservationToken;
  }, [seatReservationToken]);


  const seatHoldSecondsLeft = useSecondsUntil(seatHoldExpiresAt);

  // The server drops the hold when it lapses, so mirror that in the UI.
  useEffect(() => {
    if (seatHoldSecondsLeft !== 0) return;
    setSelectedSeatIds([]);
    setStandingQty({});
    setSeatReservationToken(undefined);
    setSeatHoldExpiresAt(null);
    setStep((current) => (current === 'select' ? current : 'seats'));
    toast.error('Your seat hold expired. Please pick your seats again.');
  }, [seatHoldSecondsLeft]);

  useEffect(() => {
    if (!calculateError) return;
    if (!trimmedPromo) return;
    const err = calculateError as { response?: { data?: { message?: string } } };
    toast.error(err.response?.data?.message || 'Could not apply referral code');
  }, [calculateError, trimmedPromo]);

  const linesSubtotal = orderLines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const subtotal = calculatedTotals?.subtotal || linesSubtotal;
  const discount = calculatedTotals?.discount ?? 0;
  const total = calculatedTotals?.total || subtotal;
  const isQaCheckout = isQaCheckoutPhone(attendeeDetails.phone);
  const selectedSeatLabels = selectedSeatIds.map((id) => seatLabelById.get(id) ?? String(id));
  const seatHoldLabel =
    seatHoldSecondsLeft && seatHoldSecondsLeft > 0
      ? `Seats held for ${formatCountdown(seatHoldSecondsLeft)}`
      : null;
  const storedReferralCode = referralTracking.getReferralCode();

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      if (ticketLines.length === 0) {
        throw new Error(
          'Add at least one ticket to your order',
        );
      }
      if (!selectedPaymentMethod) {
        throw new Error('Please select a payment method');
      }
      // From here the hold belongs to the payment, not the browser session.
      paymentStartedRef.current = true;

      const response = await api.post('/guest/payments/initiate', {
        event_uuid: event?.uuid,
        tickets: ticketLines,
        seat_ids: showSeatStep ? selectedSeatIds : undefined,
        standing: showSeatStep && standingLines.length > 0 ? standingLines : undefined,
        seat_reservation_token: showSeatStep ? seatReservationToken : undefined,
        attendee_details: {
          name: attendeeDetails.name,
          email: attendeeDetails.email,
          phone: attendeeDetails.phone,
          agreed_to_terms: true,
        },
        payment_method: selectedPaymentMethod,
        phone_number: paymentPhoneNumber || attendeeDetails.phone,
        registration_type: searchParams.get('type') || 'prereg',
        promo_code: trimmedPromo || undefined,
        referral_code: storedReferralCode || undefined,
        frontend_origin: typeof window !== 'undefined' ? window.location.origin : undefined,
      });

      return response.data.data;
    },
    onSuccess: async (payment) => {
      const paymentId = payment.payment_id ?? payment.id;
      if (!paymentId) {
        toast.error('Payment reference missing');
        return;
      }

      setIsProcessing(true);
      setPaymentStatus('pending');
      setPaymentMessage('Securely processing your payment...');
      setProgress(20);

      const checkoutUrl = payment.checkout_url ?? '';
      const isApiCallback = checkoutUrl.includes('/api/guest/payments/');

      if (checkoutUrl && !isApiCallback) {
        window.location.href = checkoutUrl;
        return;
      }

      try {
        const confirmResponse = await api.post(`/guest/payments/${paymentId}/confirm`);

        if (confirmResponse.data?.tickets_issued) {
          setProgress(100);
          setPaymentStatus('success');
          setPaymentMessage('Success! Your tickets have been issued.');
          setTimeout(() => {
            setIsProcessing(false);
            navigate(`/tickets/purchase/success?paymentId=${paymentId}`, { replace: true });
          }, 800);
          return;
        }

        let attempts = 0;
        const maxAttempts = 45;
        let isSuccess = false;

        const intervalId = setInterval(() => setProgress((p) => Math.min(p + 1.5, 95)), 1000);

        while (attempts < maxAttempts) {
          try {
            const response = await api.get(`/guest/payments/${paymentId}/status`);
            if (response.data.payment_status === 'success') {
              if (response.data.tickets_issued || response.data.purchase_pass) {
                isSuccess = true;
                break;
              }
            } else if (response.data.payment_status === 'failed') {
              break;
            }
          } catch {
            // keep polling
          }
          attempts++;
          await new Promise((r) => setTimeout(r, 2000));
        }

        clearInterval(intervalId);
        setProgress(100);

        if (isSuccess) {
          setPaymentStatus('success');
          setPaymentMessage('Success! Your tickets have been issued.');
          setTimeout(() => {
            setIsProcessing(false);
            navigate(`/tickets/purchase/success?paymentId=${paymentId}`, { replace: true });
          }, 800);
        } else {
          setPaymentStatus('failed');
          setPaymentMessage('Payment could not be verified. Please try again.');
        }
      } catch {
        setPaymentStatus('failed');
        setPaymentMessage('Payment could not be verified. Please try again.');
      }
    },
    onError: (error: any) => {
      paymentStartedRef.current = false;
      setIsProcessing(false);
      toast.error(error.response?.data?.message || 'Failed to initiate purchase');
    },
  });

  /**
   * Holds exactly what is on screen. The server replaces any previous hold on the same
   * token, so this doubles as "extend" when re-run with an unchanged selection.
   */
  const holdSeats = async (
    seatIds: number[],
    options?: { silent?: boolean; standing?: Array<{ section_id: number; quantity: number }> },
  ) => {
    const standing = options?.standing ?? standingLines;
    if (!event?.uuid || (seatIds.length === 0 && standing.length === 0)) return false;

    // Hold exactly what is picked, grouped by each seat's own tier.
    const counts = new Map<number, number>();
    for (const seatId of seatIds) {
      const typeId = seatTicketTypeById.get(seatId);
      if (typeId == null) continue;
      counts.set(typeId, (counts.get(typeId) ?? 0) + 1);
    }
    for (const line of standing) {
      const typeId = standingTicketTypeById.get(line.section_id) ?? soleTicketTypeId;
      if (typeId == null) continue;
      counts.set(typeId, (counts.get(typeId) ?? 0) + line.quantity);
    }
    if (counts.size === 0) return false;

    if (!options?.silent) setIsHoldingSeats(true);
    try {
      const result = await reserveSeats({
        event_uuid: event.uuid,
        seat_ids: seatIds,
        standing: standing.length > 0 ? standing : undefined,
        tickets: [...counts.entries()].map(([ticket_type_id, qty]) => ({
          ticket_type_id,
          quantity: qty,
        })),
        reservation_token: seatTokenRef.current,
      });
      setSeatReservationToken(result.reservation_token);
      setSeatHoldExpiresAt(result.expires_at);
      return true;
    } catch (error: any) {
      if (!options?.silent) {
        toast.error(error.response?.data?.message || 'Those seats are no longer available');
      }
      return false;
    } finally {
      if (!options?.silent) setIsHoldingSeats(false);
    }
  };

  const dropHold = () => {
    const token = seatTokenRef.current;
    setSeatReservationToken(undefined);
    setSeatHoldExpiresAt(null);
    if (token) void releaseSeats(token).catch(() => {});
  };

  // Seats are held as soon as they are picked, and freed the moment the cart is emptied.
  useEffect(() => {
    if (!showSeatStep) return;
    if (placedTotal === 0) {
      if (seatTokenRef.current) dropHold();
      return;
    }
    const id = setTimeout(() => void holdSeats(selectedSeatIds, { silent: true }), 500);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSeatIds, standingQty, showSeatStep]);

  // Keep the hold alive while the buyer is still working through checkout.
  useEffect(() => {
    if (!seatReservationToken || placedTotal === 0) return;
    const id = setInterval(
      () => void holdSeats(selectedSeatIds, { silent: true }),
      5 * 60 * 1000,
    );
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seatReservationToken, selectedSeatIds, standingQty]);

  // Leaving checkout without paying must not leave seats locked for the full TTL.
  useEffect(() => {
    const release = () => {
      const token = seatTokenRef.current;
      if (!token || paymentStartedRef.current) return;
      releaseSeatsOnUnload(token);
    };
    window.addEventListener('pagehide', release);
    return () => {
      window.removeEventListener('pagehide', release);
      release();
    };
  }, []);

  const handleBestAvailable = async (sectionId?: number) => {
    if (!event?.uuid || ticketLines.length === 0) return;
    setIsBestAvailableLoading(true);
    try {
      const result = await fetchBestAvailable({
        event_uuid: event.uuid,
        tickets: ticketLines,
        section_id: sectionId,
      });
      setSelectedSeatIds(result.seat_ids);
      await holdSeats(result.seat_ids);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Could not find seats together');
    } finally {
      setIsBestAvailableLoading(false);
    }
  };

  const handleNext = async () => {
    if (step === 'select') {
      if (totalTickets === 0) return toast.error('Add at least one ticket');
      setStep(showSeatStep ? 'seats' : 'details');
    } else if (step === 'seats') {
      if (placedTotal !== totalTickets) {
        return toast.error(
          `Select ${totalTickets} seat${totalTickets === 1 ? '' : 's'} to continue`,
        );
      }
      if (await holdSeats(selectedSeatIds)) {
        setStep('details');
      }
    } else if (step === 'details') {
      if (!attendeeDetails.name || !attendeeDetails.email || !attendeeDetails.phone) {
        return toast.error('Please provide all required attendee details');
      }
      setStep('payment');
    }
  };

  const handleBack = () => {
    if (step === 'payment') setStep('details');
    else if (step === 'details') setStep(showSeatStep ? 'seats' : 'select');
    else if (step === 'seats') setStep('select');
    else navigate(-1);
  };

  const handlePrimaryAction = () => {
    if (step === 'payment') {
      purchaseMutation.mutate();
    } else {
      void handleNext();
    }
  };

  const primaryLabel =
    step === 'select'
      ? 'Continue'
      : step === 'seats'
        ? isHoldingSeats
          ? 'Holding seats…'
          : 'Continue'
        : step === 'details'
          ? 'Review & pay'
          : `Pay ETB ${total.toLocaleString()}`;

  const primaryDisabled =
    step === 'select'
      ? totalTickets === 0
      : step === 'seats'
        ? placedTotal !== totalTickets || isHoldingSeats
        : step === 'details'
        ? !attendeeDetails.name || !attendeeDetails.email || !attendeeDetails.phone
        : !selectedPaymentMethod ||
          (selectedPaymentMethod !== 'chapa' &&
            selectedPaymentMethod !== 'm_pesa' &&
            !paymentPhoneNumber) ||
          purchaseMutation.isPending;

  if (eventLoading) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center gap-3 overflow-hidden bg-background">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.12),transparent_55%)]" />
        <Spinner size="lg" variant="primary" />
        <p className="text-sm text-muted-foreground">Loading checkout…</p>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg font-semibold tracking-tight">Event not available</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          This event may be inactive or ticket sales are not open yet.
        </p>
        <Button variant="outline" className="rounded-full" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go back
        </Button>
      </div>
    );
  }

  const isFirstStep = step === 'select';
  const startDate = event?.start_date ? new Date(event.start_date) : null;
  const locationLabel = event?.venue_name || event?.location;
  const eventImage = event?.image_url || event?.image || event?.event_image;
  const showLocation =
    event?.latitude ||
    event?.longitude ||
    event?.venue_name ||
    event?.location ||
    event?.formatted_address;

  const sectionLabel =
    step === 'select'
      ? 'Choose tickets'
      : step === 'seats'
        ? 'Select seats'
        : step === 'details'
          ? 'Your details'
          : 'Payment';
  const sectionDescription =
    step === 'select'
      ? 'Add the tickets you want — mix tiers freely'
      : step === 'seats'
        ? `Choose ${totalTickets} seat${totalTickets === 1 ? '' : 's'} to match your tickets`
        : step === 'details'
          ? 'Tickets are sent to the email you enter'
          : 'Select how you’d like to pay';

  const stepContent = (
    <AnimatePresence mode="wait">
      {step === 'select' && (
        <motion.div key="select" {...stepMotion} className="space-y-3">
          {ticketTypes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-card/30 p-8 text-center text-sm text-muted-foreground">
              No tickets are available for this event right now.
            </div>
          ) : (
            ticketTypes.map((type: any) => {
              const availability = liveAvailability.find((a: any) => a.ticket_type_id === type.id);
              const isSoldOut = availability
                ? !availability.is_available
                : type.availability_status === 'sold_out';
              const remaining = availability?.remaining ?? type.available_for_sale ?? null;

              return (
                <TicketTypeOption
                  key={type.id}
                  id={type.id}
                  name={type.name}
                  description={type.description}
                  price={Number(type.price)}
                  benefits={type.benefits}
                  isSoldOut={isSoldOut}
                  quantity={cart[type.id] ?? 0}
                  maxQuantity={Math.max(1, Math.min(MAX_SEATS_PER_ORDER, remaining ?? MAX_SEATS_PER_ORDER))}
                  remaining={remaining}
                  availabilityStatus={type.availability_status}
                  tierColor={showSeatStep ? tierColorByTicketType.get(type.id) ?? null : null}
                  onQuantityChange={(qty) => setCartQuantity(type.id, qty)}
                />
              );
            })
          )}
          <CheckoutPromoFields
            promoCode={promoCode}
            onPromoCodeChange={handlePromoCodeChange}
            expanded={showPromoCodes}
            onExpandedChange={setShowPromoCodes}
            discountHint={promoValidation?.valid ? promoValidation.discount_label : null}
            error={
              trimmedPromo && promoValidation && !promoValidation.valid
                ? promoValidation.message ?? 'Invalid referral code'
                : null
            }
            className="pt-1"
          />
        </motion.div>
      )}

      {step === 'seats' && seatingMap && (
        <motion.div key="seats" {...stepMotion} className="space-y-4">
          {seatHoldLabel && (
            <div className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-600 dark:text-amber-400">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              {seatHoldLabel} — finish checkout before the hold expires.
            </div>
          )}
          <SeatMapStep
            map={seatingMap}
            requiredCount={totalTickets}
            tierQuota={cart}
            fallbackTicketTypeId={soleTicketTypeId}
            selectedSeatIds={selectedSeatIds}
            onChange={(ids) => setSelectedSeatIds(ids)}
            standingQty={standingQty}
            onStandingChange={setStandingQty}
            onBestAvailable={handleBestAvailable}
            isBestAvailableLoading={isBestAvailableLoading}
          />
        </motion.div>
      )}

      {step === 'details' && (
        <motion.div key="details" {...stepMotion} className="space-y-4">
          <div className="space-y-4 rounded-2xl border border-border/40 bg-card/40 p-4 sm:p-5">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                placeholder="Abebe Kebede"
                value={attendeeDetails.name}
                onChange={(e) => setAttendeeDetails((prev) => ({ ...prev, name: e.target.value }))}
                className="h-11 rounded-xl border-border/50 bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="abebe@example.com"
                value={attendeeDetails.email}
                onChange={(e) => setAttendeeDetails((prev) => ({ ...prev, email: e.target.value }))}
                className="h-11 rounded-xl border-border/50 bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                placeholder="0911223344"
                value={attendeeDetails.phone}
                onChange={(e) => setAttendeeDetails((prev) => ({ ...prev, phone: e.target.value }))}
                className="h-11 rounded-xl border-border/50 bg-background/50"
              />
            </div>
          </div>
        </motion.div>
      )}

      {step === 'payment' && (
        <motion.div key="payment" {...stepMotion} className="space-y-4">
          <div className="space-y-2.5">
            {availablePaymentMethods.map((method) => (
              <PaymentMethodOption
                key={method.id}
                id={method.id}
                label={method.name}
                description={method.description}
                icon={method.icon}
                selected={selectedPaymentMethod === method.id}
                onClick={() => {
                  setSelectedPaymentMethod(method.id);
                  setPaymentPhoneNumber(attendeeDetails.phone);
                }}
              />
            ))}
          </div>

          {selectedPaymentMethod &&
            selectedPaymentMethod !== 'chapa' &&
            selectedPaymentMethod !== 'm_pesa' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2 rounded-2xl border border-border/40 bg-card/40 p-4"
              >
                <Label htmlFor="payment-phone">Payment phone number</Label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="payment-phone"
                    type="tel"
                    placeholder="0911223344"
                    value={paymentPhoneNumber}
                    onChange={(e) => setPaymentPhoneNumber(e.target.value)}
                    className="h-11 rounded-xl border-border/50 bg-background/50 pl-10"
                  />
                </div>
              </motion.div>
            )}

          {selectedPaymentMethod === 'chapa' && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              You’ll finish securely on Chapa — cards, Telebirr, CBE, and more.
            </p>
          )}

          {isQaCheckout && selectedPaymentMethod !== 'chapa' && (
            <p className="text-xs text-muted-foreground">
              QA checkout: payment will auto-confirm after you complete this step.
            </p>
          )}

          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
            Secure payment · tickets emailed after confirmation
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const dockDetails = orderLines.length > 0 ? (
    <PurchaseOrderSummary
      variant="inline"
      lines={orderLines}
      quantity={totalTickets}
      subtotal={subtotal}
      discount={discount}
      discountPercent={calculatedTotals?.discount_percent}
      discountLabel={calculatedTotals?.discount_label}
      total={total}
      calculating={calculatingTotals}
      seatLabels={showSeatStep ? selectedSeatLabels : undefined}
    />
  ) : undefined;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background pb-[calc(10rem+env(safe-area-inset-bottom,0px))] text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_55%)]" />

      <CheckoutTopBar
        eventName={event.name}
        imageUrl={eventImage}
        eventId={event.id}
        startDate={startDate}
        onBack={handleBack}
      />

      <main
        className={cn(
          'relative mx-auto w-full px-4 py-6 sm:px-6 sm:py-8',
          step === 'seats' ? 'max-w-6xl' : 'max-w-3xl',
        )}
      >
        <PurchaseStepper
          current={step}
          showSeats={showSeatStep}
          className="mb-8"
        />

        {isFirstStep && (
          <EventContextCard
            eventName={event.name}
            imageUrl={eventImage}
            eventId={event.id}
            startDate={startDate}
            location={locationLabel}
            className="mb-6"
          />
        )}

        <div className="rounded-3xl border border-border/40 bg-card/40 p-5 sm:p-7">
          <CheckoutSection label={sectionLabel} description={sectionDescription}>
            {stepContent}
          </CheckoutSection>
        </div>

        {showLocation && isFirstStep && (
          <div className="mt-6">
            <EventLocationMapCard
              latitude={event?.latitude}
              longitude={event?.longitude}
              venueName={event?.venue_name}
              location={event?.location}
              formattedAddress={event?.formatted_address}
            />
          </div>
        )}
      </main>

      <CheckoutActionDock
        total={total}
        calculating={calculatingTotals}
        label={primaryLabel}
        helper={
          step === 'seats'
            ? `${placedTotal} of ${totalTickets} ticket${totalTickets === 1 ? '' : 's'} placed`
            : seatHoldLabel
        }
        disabled={primaryDisabled}
        loading={purchaseMutation.isPending}
        isPayStep={step === 'payment'}
        onAction={handlePrimaryAction}
        onBack={step === 'select' ? undefined : handleBack}
        details={dockDetails}
      />

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
