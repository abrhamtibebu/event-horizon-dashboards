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
  qr_single_use?: boolean;
  qr_used_at?: string | null;
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
  rsvp_reminder_sent_at?: string | null;
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
  email_message: string;
  rsvp_reminder_message: string;
  event_reminder_message: string;
  accent_color: string;
  show_banner: boolean;
  show_details: boolean;
  show_description: boolean;
  confirmation_attachments: RsvpConfirmationAttachment[];
}

export interface RsvpConfirmationAttachment {
  id: string;
  name: string;
  size: number;
  /** Empty means every guest type receives this PDF. */
  guest_type_ids: number[];
}

/** Evella brand orange used when an organizer has not chosen a custom RSVP accent. */
export const PLATFORM_RSVP_ACCENT_COLOR = '#ff610d';
export const PLATFORM_RSVP_ACCENT_CSS = 'hsl(var(--color-primary))';
const LEGACY_PLATFORM_RSVP_ACCENTS = new Set(['#f97316', PLATFORM_RSVP_ACCENT_COLOR]);

export function isPlatformRsvpAccent(color?: string | null): boolean {
  const value = color?.trim().toLowerCase();
  return !value || LEGACY_PLATFORM_RSVP_ACCENTS.has(value) || !/^#[0-9a-f]{6}$/.test(value);
}

export function resolveRsvpAccent(color?: string | null): string {
  return isPlatformRsvpAccent(color) ? PLATFORM_RSVP_ACCENT_CSS : (color as string);
}

export function rsvpAccentForeground(color?: string | null): string {
  if (isPlatformRsvpAccent(color)) return '#16120e';
  const value = (color as string).replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(value)) return '#ffffff';
  const rgb = [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16) / 255).map((c) => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) > 0.45 ? '#172033' : '#ffffff';
}

export const DEFAULT_RSVP_PAGE: RsvpPageSettings = {
  headline: 'Hi {name}, confirm your RSVP',
  message: 'Choose Accept to open the registration form. Your e-badge with a check-in QR code will be emailed after you register.',
  email_message: 'You’re invited to {event} as a {guest_type}.\n\nReview the event details and choose Accept or Regret on your RSVP page. If you accept, complete the short form to receive your e-badge.',
  rsvp_reminder_message: 'This is a reminder to respond to your invitation to {event}.\n\nOpen your RSVP page and choose Accept or Regret. If you accept, complete the short form to receive your e-badge.',
  event_reminder_message: '{event} is one week away.\n\nJoin us on {date} at {location}. We look forward to seeing you.',
  accent_color: PLATFORM_RSVP_ACCENT_COLOR,
  show_banner: true,
  show_details: true,
  show_description: true,
  confirmation_attachments: [],
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
  qr_single_use?: boolean;
  qr_used_at?: string | null;
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
