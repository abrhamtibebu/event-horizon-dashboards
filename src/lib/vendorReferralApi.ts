import { api } from './api';

export interface VendorReferral {
  id: number;
  vendor_id: number;
  event_id: number;
  referral_code: string;
  referral_link: string;
  campaign_name?: string;
  description?: string;
  commission_rate: number;
  commission_amount?: number;
  commission_type: 'percentage' | 'fixed';
  status: 'active' | 'inactive' | 'expired';
  expires_at?: string;
  max_uses?: number;
  current_uses: number;
  tracking_params?: Record<string, any>;
  created_by: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
  vendor?: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
  event?: {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
  };
  creator?: {
    id: number;
    name: string;
    email: string;
  };
  // Computed fields
  total_clicks?: number;
  total_registrations?: number;
  total_purchases?: number;
  conversion_rate?: number;
  total_commission_earned?: number;
  is_expired?: boolean;
  can_be_used?: boolean;
}

export interface VendorReferralActivity {
  id: number;
  vendor_referral_id: number;
  event_id: number;
  vendor_id: number;
  guest_id?: number;
  attendee_id?: number;
  activity_type: 'link_click' | 'registration' | 'ticket_purchase' | 'event_attendance';
  referral_code: string;
  ip_address?: string;
  user_agent?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  metadata?: Record<string, any>;
  commission_earned: number;
  commission_status: 'pending' | 'approved' | 'paid' | 'cancelled';
  commission_paid_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ReferralAnalytics {
  total_referrals: number;
  active_referrals: number;
  expired_referrals: number;
  total_clicks: number;
  total_registrations: number;
  total_purchases: number;
  total_commission_earned: number;
  average_conversion_rate: number;
  top_performing_referrals: VendorReferral[];
  referrals_by_status: Record<string, number>;
  referrals_by_vendor: Record<string, number>;
}

export interface CreateReferralRequest {
  vendor_id: number;
  event_id: number;
  campaign_name?: string;
  description?: string;
  commission_rate: number;
  commission_amount?: number;
  commission_type: 'percentage' | 'fixed';
  expires_at?: string;
  max_uses?: number;
  tracking_params?: Record<string, any>;
}

export interface UpdateReferralRequest {
  campaign_name?: string;
  description?: string;
  commission_rate?: number;
  commission_amount?: number;
  commission_type?: 'percentage' | 'fixed';
  status?: 'active' | 'inactive' | 'expired';
  expires_at?: string;
  max_uses?: number;
  tracking_params?: Record<string, any>;
}

export interface TrackActivityRequest {
  referral_code: string;
  activity_type: 'link_click' | 'registration' | 'ticket_purchase' | 'event_attendance';
  guest_id?: number;
  attendee_id?: number;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  metadata?: Record<string, any>;
  ticket_amount?: number;
}

class VendorReferralApiService {
  private baseUrl = '/vendor-referrals';

  async getReferrals(params: {
    vendor_id?: number;
    event_id?: number;
    status?: string;
    search?: string;
    sort_by?: string;
    sort_order?: string;
    per_page?: number;
    page?: number;
  } = {}): Promise<{ data: VendorReferral[]; meta: any }> {
    try {
      const searchParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString());
        }
      });

      const response = await api.get(`${this.baseUrl}?${searchParams.toString()}`);
      console.log('VendorReferralApi - API Response:', response.data);
      console.log('VendorReferralApi - Search Params:', searchParams.toString());
      
      // Ensure consistent response format
      // Handle both { success: true, data: [...] } and direct array responses
      let data = [];
      if (response.data?.success && response.data?.data) {
        // Laravel API response format: { success: true, data: [...] }
        data = response.data.data;
      } else if (Array.isArray(response.data)) {
        // Direct array response
        data = response.data;
      } else if (response.data?.data) {
        // Nested data response
        data = response.data.data;
      }
      
      const result = {
        data: data,
        meta: response.data?.meta || {}
      };
      console.log('VendorReferralApi - Processed Result:', result);
      return result;
    } catch (error) {
      console.error('Vendor Referral API Error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        method: error.config?.method,
        params: params
      });
      console.warn('Vendor Referral API unavailable, using offline data:', error);
      return this.getReferralsOffline(params);
    }
  }

  async getReferral(id: number): Promise<VendorReferral> {
    const response = await api.get(`${this.baseUrl}/${id}`);
    return response.data.data;
  }

  async createReferral(data: CreateReferralRequest): Promise<VendorReferral> {
    const response = await api.post(this.baseUrl, data);
    return response.data.data;
  }

  async updateReferral(id: number, data: UpdateReferralRequest): Promise<VendorReferral> {
    const response = await api.put(`${this.baseUrl}/${id}`, data);
    return response.data.data;
  }

  async deleteReferral(id: number): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  async getAnalytics(params: {
    vendor_id?: number;
    event_id?: number;
    date_from?: string;
    date_to?: string;
  } = {}): Promise<ReferralAnalytics> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });

    const response = await api.get(`${this.baseUrl}/statistics?${searchParams.toString()}`);
    return response.data.data || response.data;
  }

  async trackActivity(data: TrackActivityRequest): Promise<VendorReferralActivity> {
    const response = await api.post('/vendor-referrals/track-activity', data);
    return response.data.data;
  }

  // Utility methods
  generateReferralLink(referralCode: string, eventUuid: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/register/${eventUuid}?ref=${referralCode}`;
  }

  copyToClipboard(text: string): Promise<void> {
    if (navigator.clipboard) {
      return navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
      document.body.removeChild(textArea);
      return Promise.resolve();
    }
  }

  formatCommission(amount: number, type: 'percentage' | 'fixed'): string {
    if (type === 'percentage') {
      return `${amount}%`;
    }
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  formatConversionRate(rate: number): string {
    return `${rate.toFixed(1)}%`;
  }

  // Mock data for offline functionality
  private mockReferrals: VendorReferral[] = [
    {
      id: 1,
      vendor_id: 17,
      event_id: 1,
      referral_code: 'REF001',
      referral_link: 'https://example.com/register?ref=REF001',
      campaign_name: 'Summer Event 2025',
      description: 'Referral campaign for summer event',
      commission_rate: 10,
      commission_amount: 500,
      commission_type: 'percentage',
      status: 'active',
      expires_at: '2025-12-31T23:59:59Z',
      max_uses: 100,
      current_uses: 15,
      tracking_params: { source: 'email', campaign: 'summer2025' },
      created_by: 1,
      created_at: '2025-01-15T10:00:00Z',
      updated_at: '2025-01-15T10:00:00Z',
      vendor: {
        id: 17,
        name: 'Test Vendor 1',
        email: 'test1@vendor.com',
        phone: '+251-911-234-567'
      },
      event: {
        id: 1,
        name: 'Tech Conference 2025',
        start_date: '2025-03-15T09:00:00Z',
        end_date: '2025-03-17T18:00:00Z'
      },
      creator: {
        id: 1,
        name: 'John Organizer',
        email: 'john@organizer.com'
      },
      total_clicks: 45,
      total_registrations: 15,
      total_purchases: 8,
      conversion_rate: 17.8,
      total_commission_earned: 4000,
      is_expired: false,
      can_be_used: true
    },
    {
      id: 2,
      vendor_id: 18,
      event_id: 2,
      referral_code: 'REF002',
      referral_link: 'https://example.com/register?ref=REF002',
      campaign_name: 'Wedding Special',
      description: 'Wedding event referral program',
      commission_rate: 15,
      commission_amount: 750,
      commission_type: 'fixed',
      status: 'active',
      expires_at: '2025-06-30T23:59:59Z',
      max_uses: 50,
      current_uses: 8,
      tracking_params: { source: 'social', campaign: 'wedding2025' },
      created_by: 1,
      created_at: '2025-01-14T14:30:00Z',
      updated_at: '2025-01-14T14:30:00Z',
      vendor: {
        id: 18,
        name: 'Test Vendor 2',
        email: 'test2@vendor.com',
        phone: '+251-922-345-678'
      },
      event: {
        id: 2,
        name: 'Wedding Ceremony',
        start_date: '2025-04-20T08:00:00Z',
        end_date: '2025-04-20T22:00:00Z'
      },
      creator: {
        id: 1,
        name: 'John Organizer',
        email: 'john@organizer.com'
      },
      total_clicks: 32,
      total_registrations: 8,
      total_purchases: 5,
      conversion_rate: 15.6,
      total_commission_earned: 3750,
      is_expired: false,
      can_be_used: true
    },
    {
      id: 3,
      vendor_id: 21,
      event_id: 11,
      referral_code: 'REF021',
      referral_link: 'https://example.com/register?ref=REF021',
      campaign_name: 'Test Campaign for Vendor 21',
      description: 'Test referral campaign for vendor 21',
      commission_rate: 15,
      commission_amount: 0,
      commission_type: 'percentage',
      status: 'active',
      expires_at: '2025-12-31T23:59:59Z',
      max_uses: 100,
      current_uses: 5,
      tracking_params: { source: 'test', campaign: 'vendor21' },
      created_by: 1,
      created_at: '2025-01-15T12:00:00Z',
      updated_at: '2025-01-15T12:00:00Z',
      vendor: {
        id: 21,
        name: 'Test Vendor 21',
        email: 'vendor21@test.com',
        phone: '+251-911-000-021'
      },
      event: {
        id: 11,
        name: 'Test Event 11',
        start_date: '2025-03-15T09:00:00Z',
        end_date: '2025-03-17T18:00:00Z'
      },
      creator: {
        id: 1,
        name: 'John Organizer',
        email: 'john@organizer.com'
      },
      total_clicks: 25,
      total_registrations: 5,
      total_purchases: 3,
      conversion_rate: 20.0,
      total_commission_earned: 1500,
      is_expired: false,
      can_be_used: true
    }
  ];

  // Fallback method for offline functionality
  async getReferralsOffline(params: {
    vendor_id?: number;
    event_id?: number;
    status?: string;
    search?: string;
    sort_by?: string;
    sort_order?: string;
    per_page?: number;
    page?: number;
  } = {}): Promise<{ data: VendorReferral[]; meta: any }> {
    let filteredReferrals = [...this.mockReferrals];

    // Apply filters
    if (params.vendor_id) {
      filteredReferrals = filteredReferrals.filter(r => r.vendor_id === params.vendor_id);
    }
    if (params.event_id) {
      filteredReferrals = filteredReferrals.filter(r => r.event_id === params.event_id);
    }
    if (params.status && params.status !== 'all') {
      filteredReferrals = filteredReferrals.filter(r => r.status === params.status);
    }
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filteredReferrals = filteredReferrals.filter(r => 
        r.campaign_name?.toLowerCase().includes(searchLower) ||
        r.referral_code.toLowerCase().includes(searchLower) ||
        r.vendor?.name.toLowerCase().includes(searchLower) ||
        r.event?.name.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    const sortBy = params.sort_by || 'created_at';
    const sortOrder = params.sort_order || 'desc';
    filteredReferrals.sort((a, b) => {
      const aValue = a[sortBy as keyof VendorReferral];
      const bValue = b[sortBy as keyof VendorReferral];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Apply pagination
    const perPage = params.per_page || 15;
    const page = params.page || 1;
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedReferrals = filteredReferrals.slice(startIndex, endIndex);

    return {
      data: paginatedReferrals,
      meta: {
        total: filteredReferrals.length,
        per_page: perPage,
        current_page: page,
        last_page: Math.ceil(filteredReferrals.length / perPage),
        from: startIndex + 1,
        to: Math.min(endIndex, filteredReferrals.length)
      }
    };
  }
}

export const vendorReferralApi = new VendorReferralApiService();

