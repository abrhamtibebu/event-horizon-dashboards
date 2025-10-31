/**
 * Mock Payment Simulator
 * 
 * Simulates payment processing for development/testing purposes
 * Real payment gateway integration will replace this in production
 */

import type { PaymentMethod, PaymentStatus } from '@/types/tickets';

export interface MockPaymentResult {
  success: boolean;
  transaction_id: string;
  status: PaymentStatus;
  message: string;
  processing_time: number; // in milliseconds
}

/**
 * Simulate payment processing with random delay and success rate
 */
export const simulatePayment = async (
  method: PaymentMethod,
  amount: number
): Promise<MockPaymentResult> => {
  // Random delay between 2-5 seconds
  const processingTime = Math.random() * 3000 + 2000;
  
  await new Promise(resolve => setTimeout(resolve, processingTime));

  // 95% success rate
  const isSuccessful = Math.random() < 0.95;

  // Generate mock transaction ID
  const transaction_id = `${method.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  if (isSuccessful) {
    return {
      success: true,
      transaction_id,
      status: 'success',
      message: `Payment of ETB ${amount.toFixed(2)} processed successfully via ${getPaymentMethodName(method)}`,
      processing_time: Math.round(processing_time),
    };
  } else {
    return {
      success: false,
      transaction_id,
      status: 'failed',
      message: getRandomFailureReason(),
      processing_time: Math.round(processing_time),
    };
  }
};

/**
 * Get human-readable payment method name
 */
const getPaymentMethodName = (method: PaymentMethod): string => {
  const names: Record<PaymentMethod, string> = {
    telebirr: 'Telebirr',
    cbe_birr: 'CBE Birr',
    amole: 'Amole',
    bank: 'Bank Transfer',
  };
  return names[method] || method;
};

/**
 * Get random failure reason for mock failures
 */
const getRandomFailureReason = (): string => {
  const reasons = [
    'Insufficient funds in account',
    'Payment gateway timeout',
    'Invalid payment credentials',
    'Transaction declined by bank',
    'Daily transaction limit exceeded',
    'Network connection error',
  ];
  return reasons[Math.floor(Math.random() * reasons.length)];
};

/**
 * Simulate payment refund
 */
export const simulateRefund = async (
  transaction_id: string,
  amount: number
): Promise<MockPaymentResult> => {
  // Refunds are usually faster
  const processingTime = Math.random() * 1000 + 1000;
  
  await new Promise(resolve => setTimeout(resolve, processingTime));

  // Refunds have 99% success rate
  const isSuccessful = Math.random() < 0.99;

  if (isSuccessful) {
    return {
      success: true,
      transaction_id: `REF-${transaction_id}`,
      status: 'success',
      message: `Refund of ETB ${amount.toFixed(2)} processed successfully`,
      processing_time: Math.round(processingTime),
    };
  } else {
    return {
      success: false,
      transaction_id: `REF-${transaction_id}`,
      status: 'failed',
      message: 'Refund processing failed - please contact support',
      processing_time: Math.round(processing_time),
    };
  }
};

/**
 * Validate payment credentials (mock)
 */
export const validatePaymentCredentials = async (
  method: PaymentMethod,
  credentials: Record<string, any>
): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock validation - always succeeds for now
  return true;
};

/**
 * Get mock checkout URL for payment gateway
 */
export const getMockCheckoutUrl = (
  payment_reference: string,
  method: PaymentMethod
): string => {
  // In real implementation, this would be the actual gateway URL
  // For mock, we return a local route
  return `/payment/checkout?ref=${payment_reference}&method=${method}`;
};

/**
 * Estimate payment processing time
 */
export const estimateProcessingTime = (method: PaymentMethod): number => {
  const times: Record<PaymentMethod, number> = {
    telebirr: 3000,
    cbe_birr: 4000,
    amole: 3500,
    bank: 5000,
  };
  return times[method] || 3000;
};

