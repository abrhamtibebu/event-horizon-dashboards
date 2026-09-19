import axios from 'axios';
import api from '@/lib/api';

export type PurchasePassInfo = {
  order_id: string;
  event_id?: number;
  event_name?: string;
  qr_code_path?: string;
  qr_value?: string;
  qr_code_base64?: string;
  guest_name?: string;
};

export type GuestPaymentStatusResponse = {
  payment_status: string;
  tickets_issued?: boolean;
  ticket_count?: number;
  purchase_pass?: PurchasePassInfo | null;
  tickets?: Array<{
    id: number;
    ticket_number: string;
    attendee_name?: string;
    qr_code_path?: string;
    status?: string;
  }>;
};

export async function confirmGuestPayment(paymentId: number): Promise<unknown> {
  const { data } = await api.post(`/guest/payments/${paymentId}/confirm`);
  return data;
}

export async function fetchGuestPaymentStatus(paymentId: number): Promise<GuestPaymentStatusResponse> {
  const { data } = await api.get(`/guest/payments/${paymentId}/status`);
  return data;
}

/**
 * Download the 2-page purchase pass PDF (same pattern as public e-badge download).
 * Stays in-app as a blob download — does not navigate to the API URL.
 */
export async function downloadGuestPurchasePass(
  paymentId: number,
  downloadFilename?: string,
): Promise<void> {
  try {
    const response = await api.get(`/guest/payments/${paymentId}/download-pass`, {
      responseType: 'blob',
      timeout: 90000,
      headers: { Accept: 'application/pdf, application/json' },
    });

    const contentType = String(response.headers?.['content-type'] ?? '');
    if (contentType.includes('application/json')) {
      const text = await (response.data as Blob).text();
      let message = 'Server returned an error instead of a PDF';
      try {
        const parsed = JSON.parse(text) as { error?: string; message?: string; detail?: string };
        message = parsed.error || parsed.detail || parsed.message || message;
      } catch {
        /* keep default */
      }
      throw new Error(message);
    }

    const blob = new Blob([response.data], { type: 'application/pdf' });
    if (blob.size < 5) {
      throw new Error('E-ticket file was empty');
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = downloadFilename ?? `e-ticket-${paymentId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const parsed = JSON.parse(text) as { error?: string; message?: string; detail?: string };
        throw new Error(parsed.error || parsed.detail || parsed.message || 'Failed to download e-ticket');
      } catch (inner) {
        if (inner instanceof Error && inner.message !== 'Failed to download e-ticket') {
          throw inner;
        }
      }
    }
    throw error;
  }
}

export type GuestPromoValidation = {
  valid: boolean;
  message?: string;
  discount_label?: string | null;
  data?: {
    discount_type?: string;
    discount_value?: number;
    max_discount_amount?: number | null;
    discount_label?: string | null;
    code?: string;
  };
};

export async function validateGuestPromoCode(
  eventUuid: string,
  code: string,
  type: 'vendor_referral' | 'invitation' | 'promo' = 'promo',
): Promise<GuestPromoValidation> {
  try {
    const { data } = await api.get('/guest/referrals/validate', {
      params: { event_uuid: eventUuid, code: code.trim(), type },
    });
    return {
      valid: true,
      discount_label: data.discount_label ?? data.data?.discount_label ?? null,
      data: data.data,
    };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return {
      valid: false,
      message: err.response?.data?.message ?? 'Invalid code.',
    };
  }
}
