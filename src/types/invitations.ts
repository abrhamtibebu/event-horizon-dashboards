export interface Invitation {
  id: number;
  event_id: number;
  user_id: number;
  user_name: string;
  invitation_code: string;
  invitation_url: string;
  qr_code_url: string;
  invitation_type: 'generic' | 'personalized';
  status: 'active' | 'expired' | 'revoked';
  created_at: string;
  expires_at: string | null;
  stats: {
    total_clicks: number;
    total_shares: number;
    total_registrations: number;
    conversion_rate: number;
  };
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

