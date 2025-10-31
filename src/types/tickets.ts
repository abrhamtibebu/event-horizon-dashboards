/**
 * Ticketing System Types
 * 
 * Comprehensive type definitions for the VEMS ticketing system
 */

export type TicketStatus = 'confirmed' | 'pending' | 'cancelled' | 'used' | 'refunded';
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'cancelled';
export type PaymentMethod = 'telebirr' | 'cbe_birr' | 'bank' | 'dashen_superapp';
export type ValidationStatus = 'valid' | 'invalid' | 'expired' | 'already_used' | 'refunded' | 'cancelled' | 'pending' | 'too_early';

/**
 * Payment interface
 */
export interface Payment {
  id: number;
  ticket_purchase_id: number;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  payment_reference: string;
  transaction_id: string | null;
  payment_gateway_response: Record<string, any> | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  is_successful?: boolean;
  is_pending?: boolean;
  is_failed?: boolean;
  formatted_amount?: string;
  payment_method_name?: string;
}

/**
 * Payment initiation request
 */
export interface PaymentInitiationRequest {
  ticket_purchase_id: number;
  amount: number;
  return_url?: string;
}

/**
 * Payment initiation response
 */
export interface PaymentInitiationResponse {
  payment_id: number;
  payment_reference: string;
  transaction_id: string;
  checkout_url: string;
  expires_at: string;
  payment_method: PaymentMethod;
  amount: number;
  currency: string;
}

/**
 * Ticket validation request
 */
export interface TicketValidationRequest {
  ticket_identifier: string; // ticket number or QR data
  event_id: number;
}

/**
 * Ticket validation result
 */
export interface ValidationResult {
  success: boolean;
  validation_status: ValidationStatus;
  message: string;
  icon: string;
  color: 'success' | 'danger' | 'warning' | 'info';
  ticket?: any; // Full ticket object if found
}

/**
 * Ticket sales statistics by type
 */
export interface TicketTypeSales {
  ticket_type_id: number;
  ticket_type_name: string;
  tickets_sold: number;
  revenue: number;
}

/**
 * Sales by date
 */
export interface SalesByDate {
  date: string;
  tickets_sold: number;
  revenue: number;
}

/**
 * Comprehensive ticket analytics
 */
export interface TicketAnalytics {
  total_revenue: number;
  total_tickets_sold: number;
  tickets_by_status: {
    confirmed: number;
    used: number;
    pending: number;
    refunded: number;
    cancelled: number;
  };
  tickets_by_type: Array<{
    ticket_type_id: number;
    ticket_type_name: string;
    tickets_sold: number;
    quantity: number | null;
    revenue: number;
    available: number | null;
  }>;
  sales_by_date: SalesByDate[];
  average_ticket_price: number;
  validation_rate: number;
}

/**
 * Event validation statistics
 */
export interface EventValidationStats {
  total_tickets: number;
  validated_tickets: number;
  pending_tickets: number;
  confirmed_tickets: number;
  refunded_tickets: number;
  validation_rate: number;
}

/**
 * Ticket form data for creation/editing
 */
export interface TicketFormData {
  name: string;
  description?: string;
  price: number;
  quantity?: number | null;
  sales_end_date?: string;
  benefits?: string[];
  min_group_size?: number;
  max_group_size?: number;
  is_active?: boolean;
}

/**
 * Ticket purchase request
 */
export interface TicketPurchaseRequest {
  event_id: number;
  ticket_type_id: number;
  quantity: number;
  guest_info: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
}

/**
 * Payment method info
 */
export interface PaymentMethodInfo {
  id: PaymentMethod;
  name: string;
  description: string;
  icon: string;
  processing_fee?: number;
  is_available: boolean;
}

/**
 * Ticket filter options
 */
export interface TicketFilters {
  event_id?: number;
  status?: TicketStatus;
  ticket_type_id?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
}

/**
 * Analytics date range
 */
export interface AnalyticsDateRange {
  start_date: string;
  end_date: string;
  comparison_period?: 'previous' | 'last_year';
}

/**
 * Export format options
 */
export type ExportFormat = 'csv' | 'pdf' | 'excel';

/**
 * Export request
 */
export interface ExportRequest {
  event_id: number;
  format: ExportFormat;
  date_range?: AnalyticsDateRange;
  filters?: TicketFilters;
}

