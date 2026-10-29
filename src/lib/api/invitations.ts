import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type {
  BulkInvitationResult,
  BulkInvitationRow,
  Invitation,
  InvitationAnalytics,
  InvitationGuestType,
  InvitationRsvpStatus,
  InvitationStats,
  LegacyInvitationType,
  PublicInvitation,
  RsvpPageSettings,
  SocialPlatform,
} from '@/types/invitations';

const invalidateInvitationQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['invitations'] });
  queryClient.invalidateQueries({ queryKey: ['invitation-stats'] });
  queryClient.invalidateQueries({ queryKey: ['invitation-analytics'] });
};

/**
 * Event guest types (the organizer picks one of these when inviting).
 */
export const useEventGuestTypes = (eventId: number) => {
  return useQuery<InvitationGuestType[]>({
    queryKey: ['event-guest-types', eventId],
    queryFn: async () => {
      const response = await api.get(`/events/${eventId}/guest-types`);
      const data = response.data?.data ?? response.data;
      return Array.isArray(data) ? data : [];
    },
    enabled: !!eventId,
    staleTime: 60_000,
  });
};

/**
 * Generate a single invitation (optionally public link when no recipient is given).
 */
export const useGenerateInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      eventId: number;
      guestTypeId?: number | null;
      /** Legacy role for ticketed discount links. */
      type?: LegacyInvitationType;
      recipientName?: string;
      recipientEmail?: string;
      recipientPhone?: string;
      expiresAt?: string;
      discountType?: 'none' | 'percentage' | 'fixed';
      discountValue?: number;
      maxDiscountAmount?: number;
    }) => {
      const response = await api.post(`/events/${data.eventId}/invitations/generate`, {
        guest_type_id: data.guestTypeId ?? undefined,
        invitation_type: data.type,
        recipient_name: data.recipientName,
        recipient_email: data.recipientEmail,
        recipient_phone: data.recipientPhone,
        expires_at: data.expiresAt,
        discount_type: data.discountType ?? 'none',
        discount_value: data.discountValue ?? 0,
        max_discount_amount: data.maxDiscountAmount,
      });
      return (response.data?.data || response.data) as Invitation;
    },
    onSuccess: () => invalidateInvitationQueries(queryClient),
  });
};

/**
 * Bulk create + send RSVP invitations for one guest type.
 */
export const useBulkGenerateInvitations = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      eventId: number;
      guestTypeId: number | null;
      invitations: BulkInvitationRow[];
    }) => {
      const response = await api.post(`/events/${data.eventId}/invitations/bulk-generate`, {
        guest_type_id: data.guestTypeId ?? undefined,
        invitations: data.invitations,
      });
      return response.data as BulkInvitationResult;
    },
    onSuccess: () => invalidateInvitationQueries(queryClient),
  });
};

/**
 * Guest decline / re-open (acceptance is recorded when the form is submitted).
 */
export const useRSVPInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { invitationCode: string; status: 'accepted' | 'declined' }) => {
      const response = await api.post('/invitations/rsvp', {
        invitation_code: data.invitationCode,
        status: data.status,
      });
      return response.data?.data || response.data;
    },
    onSuccess: () => invalidateInvitationQueries(queryClient),
  });
};

/**
 * Public invitation lookup for the RSVP landing page.
 */
export const fetchPublicInvitation = async (code: string): Promise<PublicInvitation> => {
  const response = await api.get(`/public/invitations/${encodeURIComponent(code)}`);
  return (response.data?.data || response.data) as PublicInvitation;
};

/**
 * Invitations list. Polls while any email is still queued.
 */
export const useInvitations = (
  eventId: number,
  filters?: { userId?: number; guestTypeId?: number; emailStatus?: string; rsvpStatus?: string },
) => {
  return useQuery<Invitation[]>({
    queryKey: ['invitations', eventId, filters],
    queryFn: async () => {
      const response = await api.get(`/events/${eventId}/invitations`, {
        params: {
          user_id: filters?.userId,
          guest_type_id: filters?.guestTypeId,
          email_status: filters?.emailStatus,
          rsvp_status: filters?.rsvpStatus,
        },
      });
      const data = response.data?.data || response.data;
      return Array.isArray(data) ? data : [];
    },
    enabled: !!eventId,
    refetchInterval: (query) => {
      const rows = query.state.data;
      if (Array.isArray(rows) && rows.some((r) => r.email_status === 'queued')) return 5000;
      // Pick up confirmations and rejections while the list is open.
      return 10000;
    },
  });
};

export interface InvitationResponse {
  invitation_id: number;
  recipient_name: string | null;
  recipient_email: string | null;
  recipient_phone: string | null;
  guest_type: string | null;
  rsvp_status: InvitationRsvpStatus;
  rsvp_label: string;
  rsvp_at: string | null;
  submitted_at: string | null;
  answers: Array<{ label: string; value: string }>;
}

export const fetchInvitationResponse = async (eventId: number, invitationId: number): Promise<InvitationResponse> => {
  const response = await api.get(`/events/${eventId}/invitations/${invitationId}/response`);
  return response.data?.data as InvitationResponse;
};

export const downloadInvitationsCsv = async (eventId: number): Promise<void> => {
  const response = await api.get(`/events/${eventId}/invitations/export`, { responseType: 'blob' });
  const url = URL.createObjectURL(response.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rsvp-guests-${eventId}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

/**
 * Get invitation analytics
 */
export const useInvitationAnalytics = (
  eventId: number,
  filters?: {
    start_date?: string;
    end_date?: string;
    user_id?: number;
  },
) => {
  return useQuery<InvitationAnalytics>({
    queryKey: ['invitation-analytics', eventId, filters],
    queryFn: async () => {
      const response = await api.get(`/events/${eventId}/invitations/analytics`, {
        params: filters,
      });
      return response.data?.data || response.data;
    },
    enabled: !!eventId,
    refetchInterval: 30000,
  });
};

/**
 * Summary counts: invited, emails sent/failed, RSVP confirmed.
 */
export const useInvitationStats = (eventId: number) => {
  return useQuery<InvitationStats>({
    queryKey: ['invitation-stats', eventId],
    queryFn: async () => {
      const response = await api.get(`/events/${eventId}/invitations/stats`);
      return response.data?.data || response.data;
    },
    enabled: !!eventId,
    refetchInterval: 15000,
  });
};

/**
 * Track social media share
 */
export const useTrackShare = () => {
  return useMutation({
    mutationFn: async (data: { invitationCode: string; platform: SocialPlatform }) => {
      await api.post('/invitations/track-share', {
        invitation_code: data.invitationCode,
        platform: data.platform,
      });
    },
  });
};

/**
 * Revoke invitation (organizers only)
 */
export const useRevokeInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: number) => {
      const response = await api.post(`/invitations/${invitationId}/revoke`);
      return response.data?.data || response.data;
    },
    onSuccess: () => invalidateInvitationQueries(queryClient),
  });
};

/**
 * Resend / retry the invitation email.
 */
export const useResendInvitationEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { invitationId: number; email?: string }) => {
      const response = await api.post(`/invitations/${params.invitationId}/resend-email`, {
        email: params.email || undefined,
      });
      return response.data as { success: boolean; message: string; data?: Invitation };
    },
    onSettled: () => invalidateInvitationQueries(queryClient),
  });
};

export const useRsvpPage = (eventId: number) => {
  return useQuery<RsvpPageSettings>({
    queryKey: ['rsvp-page', eventId],
    queryFn: async () => {
      const response = await api.get(`/events/${eventId}/rsvp-page`);
      return response.data?.data as RsvpPageSettings;
    },
    enabled: !!eventId,
  });
};

export const useUpdateRsvpPage = (eventId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: RsvpPageSettings) => {
      const response = await api.put(`/events/${eventId}/rsvp-page`, settings);
      return response.data?.data as RsvpPageSettings;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['rsvp-page', eventId], data);
    },
  });
};
