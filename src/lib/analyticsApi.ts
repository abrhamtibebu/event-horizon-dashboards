import { api } from './api';

export interface VendorAnalytics {
  total_vendors: number;
  active_vendors: number;
  pending_approval: number;
  suspended_vendors: number;
  total_quotations: number;
  pending_quotations: number;
  approved_quotations: number;
  rejected_quotations: number;
  total_payments: number;
  pending_payments: number;
  paid_payments: number;
  total_tasks: number;
  pending_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  total_revenue: number;
  pending_revenue: number;
  paid_revenue: number;
  average_quotation_value: number;
  average_payment_time: number;
  top_performing_vendors: Array<{
    id: number;
    name: string;
    total_quotations: number;
    total_payments: number;
    total_revenue: number;
    completion_rate: number;
  }>;
  vendor_performance_by_category: Array<{
    category: string;
    vendor_count: number;
    total_quotations: number;
    total_revenue: number;
    average_rating: number;
  }>;
  monthly_trends: Array<{
    month: string;
    vendors_added: number;
    quotations_created: number;
    payments_processed: number;
    revenue_generated: number;
  }>;
  task_completion_rates: {
    overall: number;
    by_priority: {
      low: number;
      medium: number;
      high: number;
      urgent: number;
    };
    by_type: {
      deliverable: number;
      milestone: number;
      review: number;
      payment: number;
      other: number;
    };
  };
  payment_analytics: {
    by_method: {
      bank_transfer: number;
      cash: number;
      check: number;
      digital_wallet: number;
      other: number;
    };
    by_status: {
      pending: number;
      paid: number;
      partial: number;
      overdue: number;
      cancelled: number;
    };
    average_processing_time: number;
  };
}

export interface ReportFilters {
  date_from?: string;
  date_to?: string;
  vendor_ids?: number[];
  event_ids?: number[];
  status?: string;
  category?: string;
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  include_charts?: boolean;
  include_details?: boolean;
}

class AnalyticsApiService {
  private baseUrl = '/analytics';

  async getVendorAnalytics(filters: ReportFilters = {}): Promise<VendorAnalytics> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(`${key}[]`, v.toString()));
          } else {
            params.append(key, value.toString());
          }
        }
      });

      const response = await api.get(`${this.baseUrl}/vendors?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      console.warn('Analytics API unavailable, using offline data:', error);
      return this.getVendorAnalyticsOffline(filters);
    }
  }

  async getVendorPerformanceReport(filters: ReportFilters = {}): Promise<any> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(`${key}[]`, v.toString()));
          } else {
            params.append(key, value.toString());
          }
        }
      });

      const response = await api.get(`${this.baseUrl}/vendors/performance?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      console.warn('Performance report API unavailable, using offline data:', error);
      return this.getVendorPerformanceReportOffline(filters);
    }
  }

  async getFinancialReport(filters: ReportFilters = {}): Promise<any> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(`${key}[]`, v.toString()));
          } else {
            params.append(key, value.toString());
          }
        }
      });

      const response = await api.get(`${this.baseUrl}/vendors/financial?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      console.warn('Financial report API unavailable, using offline data:', error);
      return this.getFinancialReportOffline(filters);
    }
  }

  async getTaskAnalytics(filters: ReportFilters = {}): Promise<any> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(`${key}[]`, v.toString()));
          } else {
            params.append(key, value.toString());
          }
        }
      });

      const response = await api.get(`${this.baseUrl}/vendors/tasks?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      console.warn('Task analytics API unavailable, using offline data:', error);
      return this.getTaskAnalyticsOffline(filters);
    }
  }

  async exportReport(
    reportType: 'performance' | 'financial' | 'tasks' | 'comprehensive',
    filters: ReportFilters = {},
    options: ExportOptions = { format: 'pdf' }
  ): Promise<Blob> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(`${key}[]`, v.toString()));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`${this.baseUrl}/vendors/export/${reportType}?${params.toString()}`, {
      responseType: 'blob'
    });
    
    return response.data;
  }

  // Mock data for offline functionality
  private mockAnalytics: VendorAnalytics = {
    total_vendors: 25,
    active_vendors: 20,
    pending_approval: 3,
    suspended_vendors: 2,
    total_quotations: 150,
    pending_quotations: 25,
    approved_quotations: 100,
    rejected_quotations: 25,
    total_payments: 80,
    pending_payments: 15,
    paid_payments: 60,
    total_tasks: 200,
    pending_tasks: 45,
    completed_tasks: 140,
    overdue_tasks: 15,
    total_revenue: 2500000,
    pending_revenue: 500000,
    paid_revenue: 1800000,
    average_quotation_value: 25000,
    average_payment_time: 7.5,
    top_performing_vendors: [
      {
        id: 17,
        name: 'Test Vendor 1',
        total_quotations: 15,
        total_payments: 12,
        total_revenue: 450000,
        completion_rate: 95
      },
      {
        id: 18,
        name: 'Test Vendor 2',
        total_quotations: 12,
        total_payments: 10,
        total_revenue: 380000,
        completion_rate: 92
      },
      {
        id: 19,
        name: 'Test Vendor 3',
        total_quotations: 10,
        total_payments: 8,
        total_revenue: 320000,
        completion_rate: 88
      }
    ],
    vendor_performance_by_category: [
      {
        category: 'Catering',
        vendor_count: 8,
        total_quotations: 45,
        total_revenue: 800000,
        average_rating: 4.5
      },
      {
        category: 'Photography',
        vendor_count: 6,
        total_quotations: 35,
        total_revenue: 600000,
        average_rating: 4.3
      },
      {
        category: 'Audio/Visual',
        vendor_count: 5,
        total_quotations: 30,
        total_revenue: 500000,
        average_rating: 4.2
      },
      {
        category: 'Transportation',
        vendor_count: 4,
        total_quotations: 25,
        total_revenue: 400000,
        average_rating: 4.1
      },
      {
        category: 'Other',
        vendor_count: 2,
        total_quotations: 15,
        total_revenue: 200000,
        average_rating: 4.0
      }
    ],
    monthly_trends: [
      {
        month: '2024-10',
        vendors_added: 3,
        quotations_created: 25,
        payments_processed: 20,
        revenue_generated: 400000
      },
      {
        month: '2024-11',
        vendors_added: 5,
        quotations_created: 35,
        payments_processed: 28,
        revenue_generated: 550000
      },
      {
        month: '2024-12',
        vendors_added: 4,
        quotations_created: 30,
        payments_processed: 25,
        revenue_generated: 480000
      },
      {
        month: '2025-01',
        vendors_added: 6,
        quotations_created: 40,
        payments_processed: 32,
        revenue_generated: 620000
      }
    ],
    task_completion_rates: {
      overall: 85,
      by_priority: {
        low: 90,
        medium: 85,
        high: 80,
        urgent: 75
      },
      by_type: {
        deliverable: 88,
        milestone: 82,
        review: 90,
        payment: 85,
        other: 80
      }
    },
    payment_analytics: {
      by_method: {
        bank_transfer: 45,
        cash: 20,
        check: 10,
        digital_wallet: 15,
        other: 10
      },
      by_status: {
        pending: 15,
        paid: 60,
        partial: 5,
        overdue: 3,
        cancelled: 2
      },
      average_processing_time: 7.5
    }
  };

  // Fallback methods for offline functionality
  async getVendorAnalyticsOffline(filters: ReportFilters = {}): Promise<VendorAnalytics> {
    return this.mockAnalytics;
  }

  async getVendorPerformanceReportOffline(filters: ReportFilters = {}): Promise<any> {
    return {
      summary: this.mockAnalytics,
      detailed_breakdown: {
        by_vendor: this.mockAnalytics.top_performing_vendors,
        by_category: this.mockAnalytics.vendor_performance_by_category,
        monthly_trends: this.mockAnalytics.monthly_trends
      }
    };
  }

  async getFinancialReportOffline(filters: ReportFilters = {}): Promise<any> {
    return {
      total_revenue: this.mockAnalytics.total_revenue,
      pending_revenue: this.mockAnalytics.pending_revenue,
      paid_revenue: this.mockAnalytics.paid_revenue,
      payment_analytics: this.mockAnalytics.payment_analytics,
      monthly_revenue: this.mockAnalytics.monthly_trends.map(trend => ({
        month: trend.month,
        revenue: trend.revenue_generated
      }))
    };
  }

  async getTaskAnalyticsOffline(filters: ReportFilters = {}): Promise<any> {
    return {
      total_tasks: this.mockAnalytics.total_tasks,
      pending_tasks: this.mockAnalytics.pending_tasks,
      completed_tasks: this.mockAnalytics.completed_tasks,
      overdue_tasks: this.mockAnalytics.overdue_tasks,
      completion_rates: this.mockAnalytics.task_completion_rates
    };
  }
}

export const analyticsApi = new AnalyticsApiService();
