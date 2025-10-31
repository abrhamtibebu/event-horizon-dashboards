import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type {
  TicketTypesResponse,
  ReservationRequest,
  ReservationResponse,
  PaymentInitiationRequest,
  PaymentInitiationResponse,
  PaymentConfirmationResponse,
} from '@/types/publicTickets';

/**
 * Fetch ticket types for a public event (no auth required)
 */
export const usePublicEventTickets = (eventUuid: string) => {
  return useQuery<TicketTypesResponse>({
    queryKey: ['publicEventTickets', eventUuid],
    queryFn: async () => {
      const response = await api.get(`/guest/events/${eventUuid}/ticket-types`);
      // Handle both data and data.data response structures
      const data = response.data?.data || response.data;
      console.log('[PublicTickets] Ticket types fetched:', data);
      return data;
    },
    enabled: !!eventUuid,
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // Refetch every 30 seconds for availability updates
  });
};

/**
 * Check real-time ticket availability
 */
export const useTicketAvailability = (eventUuid: string) => {
  return useQuery({
    queryKey: ['ticketAvailability', eventUuid],
    queryFn: async () => {
      const response = await api.get(`/guest/events/${eventUuid}/availability`);
      return response.data;
    },
    enabled: !!eventUuid,
    staleTime: 10000, // 10 seconds
    refetchInterval: 10000, // Refetch every 10 seconds
  });
};

/**
 * Reserve tickets (5-minute hold)
 */
export const useReserveTickets = () => {
  return useMutation<ReservationResponse, Error, ReservationRequest>({
    mutationFn: async (data) => {
      const response = await api.post('/guest/tickets/reserve', data);
      // Handle both data and data.data response structures
      const responseData = response.data?.data || response.data;
      console.log('[PublicTickets] Tickets reserved:', responseData);
      return responseData;
    },
  });
};

/**
 * Release reservation manually
 */
export const useReleaseReservation = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (reservationToken) => {
      await api.delete(`/guest/tickets/release/${reservationToken}`);
    },
    onSuccess: () => {
      // Invalidate availability queries
      queryClient.invalidateQueries({ queryKey: ['ticketAvailability'] });
      queryClient.invalidateQueries({ queryKey: ['publicEventTickets'] });
    },
  });
};

/**
 * Initiate payment for guest purchase
 */
export const useInitiateGuestPayment = () => {
  return useMutation<PaymentInitiationResponse, Error, PaymentInitiationRequest>({
    mutationFn: async (data) => {
      const response = await api.post('/guest/payments/initiate', data);
      // Handle both data and data.data response structures
      const responseData = response.data?.data || response.data;
      console.log('[PublicTickets] Payment initiated:', responseData);
      return responseData;
    },
  });
};

/**
 * Confirm payment
 */
export const useConfirmGuestPayment = () => {
  return useMutation<PaymentConfirmationResponse, Error, number>({
    mutationFn: async (paymentId) => {
      const response = await api.post(`/guest/payments/${paymentId}/confirm`);
      return response.data;
    },
  });
};

/**
 * Poll payment status
 */
export const usePaymentStatus = (paymentId: number | null) => {
  return useQuery({
    queryKey: ['paymentStatus', paymentId],
    queryFn: async () => {
      const response = await api.get(`/guest/payments/${paymentId}`);
      return response.data;
    },
    enabled: !!paymentId,
    refetchInterval: 3000, // Poll every 3 seconds
  });
};


