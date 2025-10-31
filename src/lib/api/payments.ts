/**
 * Payment API Functions
 * 
 * All API calls related to payment processing (Mock mode for MVP)
 */

import api from '../api';
import type {
  PaymentInitiationRequest,
  PaymentInitiationResponse,
  Payment,
  PaymentMethod,
} from '@/types/tickets';

/**
 * Initiate Telebirr payment
 */
export const initiateTelebirrPayment = async (
  data: PaymentInitiationRequest
): Promise<PaymentInitiationResponse> => {
  const response = await api.post('/payments/telebirr/initiate', data);
  return response.data.data;
};

/**
 * Initiate CBE Birr payment
 */
export const initiateCBEBirrPayment = async (
  data: PaymentInitiationRequest
): Promise<PaymentInitiationResponse> => {
  const response = await api.post('/payments/cbe-birr/initiate', data);
  return response.data.data;
};

/**
 * Initiate Dashen SuperApp payment
 */
export const initiateDashenSuperAppPayment = async (
  data: PaymentInitiationRequest
): Promise<PaymentInitiationResponse> => {
  const response = await api.post('/payments/dashen-superapp/initiate', data);
  return response.data.data;
};

/**
 * Initiate Bank Transfer
 */
export const initiateBankPayment = async (
  data: PaymentInitiationRequest
): Promise<PaymentInitiationResponse> => {
  const response = await api.post('/payments/bank/initiate', data);
  return response.data.data;
};

/**
 * Generic payment initiation based on payment method
 */
export const initiatePayment = async (
  method: PaymentMethod,
  data: PaymentInitiationRequest
): Promise<PaymentInitiationResponse> => {
  switch (method) {
    case 'telebirr':
      return initiateTelebirrPayment(data);
    case 'cbe_birr':
      return initiateCBEBirrPayment(data);
    case 'dashen_superapp':
      return initiateDashenSuperAppPayment(data);
    case 'bank':
      return initiateBankPayment(data);
    default:
      throw new Error(`Unsupported payment method: ${method}`);
  }
};

/**
 * Confirm payment status
 */
export const confirmPayment = async (paymentReference: string): Promise<Payment> => {
  const response = await api.post('/payments/confirm', { payment_reference: paymentReference });
  return response.data.data;
};

/**
 * Get payment details
 */
export const getPaymentDetails = async (paymentId: number): Promise<Payment> => {
  const response = await api.get(`/payments/${paymentId}`);
  return response.data.data;
};

/**
 * Check payment status (polling)
 */
export const checkPaymentStatus = async (paymentReference: string): Promise<Payment> => {
  return confirmPayment(paymentReference);
};

/**
 * Refund a payment
 */
export const refundPayment = async (paymentId: number): Promise<Payment> => {
  const response = await api.post(`/payments/${paymentId}/refund`);
  return response.data.data;
};

/**
 * Poll payment status until completion
 * Useful for waiting for payment confirmation
 */
export const pollPaymentStatus = async (
  paymentReference: string,
  maxAttempts: number = 30,
  intervalMs: number = 2000
): Promise<Payment> => {
  let attempts = 0;

  const poll = async (): Promise<Payment> => {
    attempts++;

    const payment = await checkPaymentStatus(paymentReference);

    // If payment is final status, return it
    if (['success', 'failed', 'cancelled'].includes(payment.status)) {
      return payment;
    }

    // If exceeded max attempts, return current status
    if (attempts >= maxAttempts) {
      throw new Error('Payment confirmation timeout');
    }

    // Wait and try again
    await new Promise(resolve => setTimeout(resolve, intervalMs));
    return poll();
  };

  return poll();
};

/**
 * Get payment method information
 */
export const getPaymentMethods = () => {
  return [
    {
      id: 'telebirr' as PaymentMethod,
      name: 'Telebirr',
      description: 'Pay with Telebirr mobile wallet',
      icon: '📱',
      processing_fee: 0,
      is_available: true,
    },
    {
      id: 'cbe_birr' as PaymentMethod,
      name: 'CBE Birr',
      description: 'Commercial Bank of Ethiopia mobile banking',
      icon: '🏦',
      processing_fee: 0,
      is_available: true,
    },
    {
      id: 'dashen_superapp' as PaymentMethod,
      name: 'Dashen SuperApp',
      description: 'Pay with Dashen Bank SuperApp',
      icon: '💳',
      processing_fee: 0,
      is_available: true,
    },
    {
      id: 'bank' as PaymentMethod,
      name: 'Bank Transfer',
      description: 'Direct bank transfer',
      icon: '🏛️',
      processing_fee: 0,
      is_available: true,
    },
  ];
};

