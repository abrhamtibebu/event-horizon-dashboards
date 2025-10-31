/**
 * Ticket API Functions
 * 
 * All API calls related to ticket management
 */

import api from '../api';
import type {
  TicketFormData,
  TicketPurchaseRequest,
  TicketFilters,
  TicketAnalytics,
  ExportRequest,
  ValidationResult,
  TicketValidationRequest,
  EventValidationStats,
} from '@/types/tickets';
import type { Ticket, TicketPurchase } from '@/types';

/**
 * Get all tickets for an event
 */
export const getEventTickets = async (eventId: number, filters?: TicketFilters) => {
  const response = await api.get(`/events/${eventId}/tickets`, { params: filters });
  return response.data;
};

/**
 * Get ticket sales for an event
 */
export const getTicketSales = async (eventId: number) => {
  const response = await api.get(`/events/${eventId}/tickets/sales`);
  return response.data;
};

/**
 * Get ticket analytics for an event
 */
export const getTicketAnalytics = async (eventId: number): Promise<TicketAnalytics> => {
  const response = await api.get(`/events/${eventId}/tickets/analytics`);
  return response.data.data;
};

/**
 * Get single ticket details
 */
export const getTicketDetails = async (ticketId: number): Promise<Ticket> => {
  const response = await api.get(`/tickets/${ticketId}`);
  return response.data.data;
};

/**
 * Get user's purchased tickets
 */
export const getMyTickets = async () => {
  const response = await api.get('/my-tickets');
  return response.data;
};

/**
 * Create a new ticket type for an event
 */
export const createTicketType = async (eventId: number, data: TicketFormData) => {
  const response = await api.post(`/events/${eventId}/ticket-types`, data);
  return response.data;
};

/**
 * Update a ticket type
 */
export const updateTicketType = async (ticketTypeId: number, data: Partial<TicketFormData>) => {
  const response = await api.put(`/ticket-types/${ticketTypeId}`, data);
  return response.data;
};

/**
 * Delete a ticket type
 */
export const deleteTicketType = async (ticketTypeId: number) => {
  const response = await api.delete(`/ticket-types/${ticketTypeId}`);
  return response.data;
};

/**
 * Refund a ticket
 */
export const refundTicket = async (ticketId: number) => {
  const response = await api.put(`/tickets/${ticketId}/refund`);
  return response.data;
};

/**
 * Cancel a ticket
 */
export const cancelTicket = async (ticketId: number) => {
  const response = await api.put(`/tickets/${ticketId}/cancel`);
  return response.data;
};

/**
 * Download ticket PDF
 */
export const downloadTicketPDF = async (ticketId: number) => {
  const response = await api.get(`/tickets/${ticketId}/download`, {
    responseType: 'blob',
  });
  
  // Create download link
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `ticket-${ticketId}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  
  return response.data;
};

/**
 * Validate a ticket (for ushers)
 */
export const validateTicket = async (data: TicketValidationRequest): Promise<ValidationResult> => {
  const response = await api.post('/tickets/validate', data);
  return response.data;
};

/**
 * Get validation history for a ticket
 */
export const getTicketValidationHistory = async (ticketId: number) => {
  const response = await api.get(`/tickets/${ticketId}/validation-history`);
  return response.data;
};

/**
 * Get validation statistics for an event
 */
export const getEventValidationStats = async (eventId: number): Promise<EventValidationStats> => {
  const response = await api.get(`/events/${eventId}/validation-stats`);
  return response.data.data;
};

/**
 * Purchase tickets (creates ticket purchase)
 */
export const purchaseTickets = async (data: TicketPurchaseRequest): Promise<TicketPurchase> => {
  const response = await api.post(`/events/${data.event_id}/purchase-ticket`, data);
  return response.data.data;
};

/**
 * Export ticket data
 */
export const exportTicketData = async (request: ExportRequest) => {
  const response = await api.post('/tickets/export', request, {
    responseType: 'blob',
  });
  
  // Create download link
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  const extension = request.format === 'pdf' ? 'pdf' : 'xlsx';
  link.setAttribute('download', `ticket-report-${Date.now()}.${extension}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  
  return response.data;
};

/**
 * Get available ticket types for an event
 */
export const getAvailableTicketTypes = async (eventId: number) => {
  const response = await api.get(`/events/${eventId}/ticket-types/available`);
  return response.data;
};

