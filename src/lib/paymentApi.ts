import { apiCall } from './api';

export interface Payment {
  id: number;
  vendor_id: number;
  quotation_id?: number;
  event_id: number;
  amount: number;
  currency: string;
  payment_type: 'quotation_payment' | 'referral_commission' | 'bonus' | 'penalty';
  payment_method: 'bank_transfer' | 'cash' | 'check' | 'digital_wallet' | 'other';
  status: 'pending' | 'paid' | 'partial' | 'overdue' | 'cancelled';
  payment_date?: string;
  due_date: string;
  reference_number: string;
  transaction_id?: string;
  notes?: string;
  referral_commission?: number;
  referral_count?: number;
  commission_rate?: number;
  referral_links?: string[];
  created_by: number;
  updated_by?: number;
  processed_by?: number;
  processed_at?: string;
  created_at: string;
  updated_at: string;
  vendor?: {
    id: number;
    name: string;
    email: string;
  };
  quotation?: {
    id: number;
    amount: number;
    description: string;
  };
  event?: {
    id: number;
    title: string;
    start_date: string;
  };
  creator?: {
    id: number;
    name: string;
  };
  processor?: {
    id: number;
    name: string;
  };
}

export interface PaymentFormData {
  vendor_id: number;
  quotation_id?: string;
  event_id: string;
  amount: string;
  currency: string;
  payment_type: string;
  payment_method: string;
  due_date: string;
  notes?: string;
  referral_commission?: string;
  commission_rate?: string;
  transaction_id?: string;
  check_number?: string;
}

export interface ReferralLinkData {
  event_id: number;
  commission_rate: number;
  count?: number;
}

export interface PaymentStatistics {
  total_payments: number;
  total_amount: number;
  pending_payments: number;
  pending_amount: number;
  paid_payments: number;
  paid_amount: number;
  overdue_payments: number;
  overdue_amount: number;
  referral_commissions: number;
  total_referral_commission: number;
  total_referrals: number;
}

class PaymentApiService {
  private baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

  // Set a test token for development (remove in production)
  setTestToken(): void {
    localStorage.setItem('jwt', 'test-jwt-token-for-development');
    localStorage.setItem('user_role', 'organizer');
    localStorage.setItem('user_id', '6'); // Test Organizer user ID
    localStorage.setItem('organizer_id', '1');
  }

  private getAuthHeaders(): HeadersInit {
    let token = localStorage.getItem('jwt') || sessionStorage.getItem('jwt');
    
    // Auto-set test token if no token exists (for development)
    if (!token) {
      this.setTestToken();
      token = localStorage.getItem('jwt');
    }
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  // Get all payments with filtering
  async getPayments(params: any = {}): Promise<{ data: Payment[]; pagination: any }> {
    try {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = `/vendors/payments${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('Authentication failed, using mock data');
          return this.getMockPayments(params);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        data: result.data?.data || [],
        pagination: result.data?.pagination || {}
      };
    } catch (error) {
      console.warn('Failed to fetch payments from API, using mock data:', error);
      return this.getMockPayments(params);
    }
  }

  // Get payment statistics
  async getStatistics(): Promise<PaymentStatistics> {
    try {
      const response = await fetch(`${this.baseURL}/vendors/payments/statistics`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.warn('Failed to fetch payment statistics from API, using mock data:', error);
      return this.getMockStatistics();
    }
  }

  // Create a new payment
  async createPayment(data: PaymentFormData): Promise<Payment> {
    try {
      // Transform the data to match backend expectations
      const transformedData = {
        ...data,
        vendor_id: parseInt(data.vendor_id.toString()),
        event_id: parseInt(data.event_id.toString()),
        quotation_id: data.quotation_id ? parseInt(data.quotation_id.toString()) : null,
        amount: parseFloat(data.amount),
        referral_commission: data.referral_commission ? parseFloat(data.referral_commission) : undefined,
        commission_rate: data.commission_rate ? parseFloat(data.commission_rate) : undefined,
      };

      const response = await fetch(`${this.baseURL}/vendors/payments`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(transformedData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        (error as any).response = { data: errorData, status: response.status };
        throw error;
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.warn('Failed to create payment via API:', error);
      throw error;
    }
  }

  // Update a payment
  async updatePayment(id: number, data: Partial<PaymentFormData>): Promise<Payment> {
    try {
      const response = await fetch(`${this.baseURL}/vendors/payments/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          ...data,
          amount: data.amount ? parseFloat(data.amount) : undefined,
          referral_commission: data.referral_commission ? parseFloat(data.referral_commission) : undefined,
          commission_rate: data.commission_rate ? parseFloat(data.commission_rate) : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        (error as any).response = { data: errorData, status: response.status };
        throw error;
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.warn('Failed to update payment via API:', error);
      throw error;
    }
  }

  // Process a payment (mark as paid)
  async processPayment(id: number, data: { transaction_id?: string; payment_date?: string; notes?: string }): Promise<Payment> {
    try {
      const response = await fetch(`${this.baseURL}/vendors/payments/${id}/process`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        (error as any).response = { data: errorData, status: response.status };
        throw error;
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.warn('Failed to process payment via API:', error);
      throw error;
    }
  }

  // Cancel a payment
  async cancelPayment(id: number, notes?: string): Promise<Payment> {
    try {
      const response = await fetch(`${this.baseURL}/vendors/payments/${id}/cancel`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        (error as any).response = { data: errorData, status: response.status };
        throw error;
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.warn('Failed to cancel payment via API:', error);
      throw error;
    }
  }

  // Delete a payment
  async deletePayment(id: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/vendors/payments/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        (error as any).response = { data: errorData, status: response.status };
        throw error;
      }
    } catch (error) {
      console.warn('Failed to delete payment via API:', error);
      throw error;
    }
  }

  // Generate referral links for a vendor
  async generateReferralLinks(vendorId: number, data: ReferralLinkData): Promise<{ payment_id: number; referral_links: string[]; commission_rate: number; vendor: string }> {
    try {
      const response = await fetch(`${this.baseURL}/vendors/${vendorId}/generate-referral-links`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        (error as any).response = { data: errorData, status: response.status };
        throw error;
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.warn('Failed to generate referral links via API:', error);
      throw error;
    }
  }

  // Track a referral registration
  async trackReferral(referralToken: string, eventId: number, registrationData?: any): Promise<{ vendor: string; referral_count: number; commission_earned: number }> {
    try {
      const response = await fetch(`${this.baseURL}/vendors/track-referral`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          referral_token: referralToken,
          event_id: eventId,
          registration_data: registrationData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        (error as any).response = { data: errorData, status: response.status };
        throw error;
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.warn('Failed to track referral via API:', error);
      throw error;
    }
  }

  // Mock data for offline functionality
  private getMockPayments(params: any = {}): { data: Payment[]; pagination: any } {
    const mockPayments: Payment[] = [
      {
        id: 1,
        vendor_id: 17,
        quotation_id: 1,
        event_id: 1,
        amount: 5000.00,
        currency: 'ETB',
        payment_type: 'quotation_payment',
        payment_method: 'bank_transfer',
        status: 'pending',
        due_date: '2025-02-15T00:00:00Z',
        reference_number: 'PAY-ABC12345',
        notes: 'Payment for catering services',
        created_by: 1,
        created_at: '2025-01-14T10:00:00Z',
        updated_at: '2025-01-14T10:00:00Z',
        vendor: { id: 17, name: 'Test Vendor 1', email: 'test1@vendor.com' },
        quotation: { id: 1, amount: 5000, description: 'Catering for 100 guests' },
        event: { id: 1, title: 'Tech Conference 2025', start_date: '2025-02-20T09:00:00Z' },
        creator: { id: 1, name: 'John Organizer' },
      },
      {
        id: 2,
        vendor_id: 18,
        event_id: 1,
        amount: 250.00,
        currency: 'ETB',
        payment_type: 'referral_commission',
        payment_method: 'referral_tracking',
        status: 'pending',
        due_date: '2025-02-28T00:00:00Z',
        reference_number: 'REF-DEF67890',
        referral_commission: 250.00,
        referral_count: 5,
        commission_rate: 0.05,
        referral_links: ['http://localhost:3000/register?ref=abc123'],
        created_by: 1,
        created_at: '2025-01-14T11:00:00Z',
        updated_at: '2025-01-14T11:00:00Z',
        vendor: { id: 18, name: 'Test Vendor 2', email: 'test2@vendor.com' },
        event: { id: 1, title: 'Tech Conference 2025', start_date: '2025-02-20T09:00:00Z' },
        creator: { id: 1, name: 'John Organizer' },
      },
    ];

    // Apply filters
    let filteredPayments = mockPayments;

    if (params.vendor_id) {
      filteredPayments = filteredPayments.filter(p => p.vendor_id === parseInt(params.vendor_id));
    }

    if (params.status && params.status !== 'all') {
      filteredPayments = filteredPayments.filter(p => p.status === params.status);
    }

    if (params.payment_type) {
      filteredPayments = filteredPayments.filter(p => p.payment_type === params.payment_type);
    }

    return {
      data: filteredPayments,
      pagination: {
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: filteredPayments.length,
      }
    };
  }

  private getMockStatistics(): PaymentStatistics {
    return {
      total_payments: 15,
      total_amount: 25000.00,
      pending_payments: 8,
      pending_amount: 12000.00,
      paid_payments: 5,
      paid_amount: 8000.00,
      overdue_payments: 2,
      overdue_amount: 5000.00,
      referral_commissions: 3,
      total_referral_commission: 750.00,
      total_referrals: 15,
    };
  }
}

export const paymentApi = new PaymentApiService();
