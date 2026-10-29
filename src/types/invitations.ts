export type InvitationEmailStatus = 'not_sent' | 'queued' | 'sent' | 'failed';
export type InvitationRsvpStatus = 'pending' | 'accepted' | 'declined';
export type LegacyInvitationType = 'generic' | 'personalized' | 'exhibitor' | 'speaker' | 'vip' | 'media';

export interface InvitationGuestType {
  id: number;
  name: string;
  description?: string | null;
}

export interface Invitation {
  id: number;
  event_id: number;
  user_id: number;
  user_name: string;
  invitation_code: string;
  invitation_url: string;
  qr_code_url: string;
  /** Legacy role; kept for ticketed-event discount links. */
  invitation_type: LegacyInvitationType;
  guest_type_id: number | null;
  guest_type: InvitationGuestType | null;
  status: 'active' | 'expired' | 'revoked';
  rsvp_status: InvitationRsvpStatus;
  recipient_name: string | null;
  recipient_email: string | null;
  recipient_phone: string | null;
  email_status: InvitationEmailStatus;
  email_sent_at: string | null;
  email_error: string | null;
  email_attempts: number;
  created_at: string;
  expires_at: string | null;
  rsvp_at: string | null;
  is_rsvp_completed: boolean;
  registrations_count?: number;
  stats?: {
    total_clicks: number;
    total_registrations: number;
  };
}

export interface InvitationStats {
  total_invitations: number;
  total_clicks: number;
  total_registrations: number;
  conversion_rate: number;
  email: Record<InvitationEmailStatus, number>;
  rsvp: Record<InvitationRsvpStatus, number>;
}

export interface BulkInvitationRow {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  job_title?: string;
  location?: string;
}

export interface GuestDetails {
  company?: string | null;
  job_title?: string | null;
  location?: string | null;
}

export interface BulkInvitationResult {
  success: boolean;
  message: string;
  data: Invitation[];
  summary: {
    created: number;
    reused: number;
    sent: number;
    queued: number;
    failed: number;
  };
}

/** Event-level guest page. Null stored values resolve to these defaults. */
export interface RsvpPageSettings {
  headline: string;
  message: string;
  accent_color: string;
  show_banner: boolean;
  show_details: boolean;
  show_description: boolean;
}

export const DEFAULT_RSVP_PAGE: RsvpPageSettings = {
  headline: 'Hi {name}, confirm your RSVP',
  message: 'Complete the short form below. Your e-badge with a check-in QR code will be emailed to you right away.',
  accent_color: '#f97316',
  show_banner: true,
  show_details: true,
  show_description: true,
};

export function guestFirstName(name?: string | null): string {
  const first = (name || '').trim().split(/\s+/)[0];
  return first || 'there';
}

export function applyRsvpHeadline(headline: string, firstName: string): string {
  return (headline || DEFAULT_RSVP_PAGE.headline).replace(/\{name\}/g, firstName);
}

/** Payload returned by GET /public/invitations/{code} */
export interface PublicInvitation {
  id: number;
  invitation_code: string;
  invitation_type: LegacyInvitationType;
  guest_type_id: number | null;
  guest_type: InvitationGuestType | null;
  recipient_name: string | null;
  recipient_email: string | null;
  recipient_phone: string | null;
  guest_details?: GuestDetails | null;
  rsvp_status: InvitationRsvpStatus;
  rsvp_at: string | null;
  is_rsvp_completed: boolean;
  expires_at: string | null;
  already_registered: boolean;
  attendee: {
    id: number;
    guest_uuid: string | null;
    guest_name: string | null;
    guest_email: string | null;
  } | null;
  event: {
    id: number;
    uuid: string;
    name: string;
    description: string | null;
    start_date: string | null;
    end_date: string | null;
    time?: string | null;
    venue_name: string | null;
    location: string | null;
    event_type: string;
    status: string;
    image_url: string | null;
    organizer: { name: string; logo: string | null } | null;
    organizer_logo: string | null;
    rsvp_page?: RsvpPageSettings | null;
  } | null;
}

export interface InvitationAnalytics {
  summary: {
    total_invitations: number;
    total_clicks: number;
    total_shares: number;
    total_registrations: number;
    conversion_rate: number;
    avg_clicks_per_invitation: number;
  };
  timeline: Array<{
    date: string;
    clicks: number;
    shares: number;
    registrations: number;
  }>;
  platforms: Array<{
    platform: string;
    shares: number;
    clicks: number;
    registrations: number;
  }>;
  geographic: Array<{
    country: string;
    city: string;
    clicks: number;
    registrations: number;
  }>;
  devices: Array<{
    device_type: 'mobile' | 'desktop' | 'tablet';
    os: string;
    browser: string;
    count: number;
  }>;
  top_inviters: Array<{
    user_id: number;
    user_name: string;
    invitations_sent: number;
    total_clicks: number;
    total_registrations: number;
    conversion_rate: number;
  }>;
}

export type SocialPlatform = 'whatsapp' | 'telegram' | 'email' | 'facebook' | 'twitter' | 'linkedin';
