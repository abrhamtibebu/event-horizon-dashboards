import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Invitation, InvitationAnalytics, SocialPlatform } from '@/types/invitations';

/**
 * Generate invitation
 */
export const useGenerateInvitation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { 
      eventId: number; 
      type: 'generic' | 'personalized' | 'exhibitor' | 'speaker' | 'vip' | 'media';
      recipientName?: string;
      recipientEmail?: string;
      expiresAt?: string;
    }) => {
      const response = await api.post(`/events/${data.eventId}/invitations/generate`, {
        invitation_type: data.type,
        recipient_name: data.recipientName,
        recipient_email: data.recipientEmail,
        expires_at: data.expiresAt,
      });
      const responseData = response.data?.data || response.data;
      console.log('[Invitations] Invitation generated:', responseData);
      return responseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      queryClient.invalidateQueries({ queryKey: ['invitation-analytics'] });
    }
  });
};

/**
 * Update RSVP status
 */
export const useRSVPInvitation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { invitationCode: string; status: 'accepted' | 'declined' }) => {
      const response = await api.post('/invitations/rsvp', {
        invitation_code: data.invitationCode,
        status: data.status
      });
      return response.data?.data || response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      queryClient.invalidateQueries({ queryKey: ['invitation-analytics'] });
    }
  });
};

/**
 * Get invitations list
 */
export const useInvitations = (eventId: number, userId?: number) => {
  return useQuery<Invitation[]>({
    queryKey: ['invitations', eventId, userId],
    queryFn: async () => {
      const response = await api.get(`/events/${eventId}/invitations`, {
        params: userId ? { user_id: userId } : {}
      });
      const data = response.data?.data || response.data;
      console.log('[Invitations] Invitations list fetched:', data);
      return data;
    },
    enabled: !!eventId
  });
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
  }
) => {
  return useQuery<InvitationAnalytics>({
    queryKey: ['invitation-analytics', eventId, filters],
    queryFn: async () => {
      const response = await api.get(`/events/${eventId}/invitations/analytics`, {
        params: filters
      });
      const data = response.data?.data || response.data;
      console.log('[Invitations] Analytics fetched:', data);
      return data;
    },
    enabled: !!eventId,
    refetchInterval: 30000 // Refresh every 30 seconds
  });
};

/**
 * Get real-time stats summary
 */
export const useInvitationStats = (eventId: number) => {
  return useQuery({
    queryKey: ['invitation-stats', eventId],
    queryFn: async () => {
      const response = await api.get(`/events/${eventId}/invitations/stats`);
      const data = response.data?.data || response.data;
      return data;
    },
    enabled: !!eventId,
    refetchInterval: 10000 // Refresh every 10 seconds
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
        platform: data.platform
      });
      console.log('[Invitations] Share tracked:', data.platform);
    }
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      queryClient.invalidateQueries({ queryKey: ['invitation-analytics'] });
    }
  });
};

/**
 * Resend invitation email to the stored recipient (or override address).
 */
export const useResendInvitationEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { invitationId: number; email?: string }) => {
      const response = await api.post(`/invitations/${params.invitationId}/resend-email`, {
        email: params.email || undefined,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      queryClient.invalidateQueries({ queryKey: ['invitation-analytics'] });
    },
  });
};

/**
 * Bulk generate invitations
 */
export const useBulkGenerateInvitations = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { 
      eventId: number; 
      invitations: Array<{
        name: string;
        email: string;
        type: string;
      }>;
    }) => {
      const response = await api.post(`/events/${data.eventId}/invitations/bulk-generate`, {
        invitations: data.invitations
      });
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      queryClient.invalidateQueries({ queryKey: ['invitation-analytics'] });
    }
  });
};
