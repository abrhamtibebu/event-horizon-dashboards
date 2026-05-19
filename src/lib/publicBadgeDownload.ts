import api from '@/lib/api';
import { toast } from 'sonner';

export type PublicBadgeDownloadParams = {
  eventId: number | string;
  attendeeId: number | string;
  guestUuid: string;
  downloadFilename?: string;
};

/**
 * Download the server-generated registration e-badge (same PDF as confirmation email).
 */
export async function downloadPublicAttendeeBadge({
  eventId,
  attendeeId,
  guestUuid,
  downloadFilename,
}: PublicBadgeDownloadParams): Promise<void> {
  const response = await api.get(`/public/events/${eventId}/attendees/${attendeeId}/badge`, {
    params: { guestUuid: guestUuid?.trim() || undefined },
    responseType: 'blob',
  });

  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download =
    downloadFilename ||
    (guestUuid.trim().length > 0
      ? `e-badge-${guestUuid.trim().slice(0, 8)}.pdf`
      : 'e-badge.pdf');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export async function downloadPublicAttendeeBadgeWithToast(
  params: PublicBadgeDownloadParams,
  successMessage = 'E-badge downloaded successfully!',
): Promise<boolean> {
  try {
    await downloadPublicAttendeeBadge(params);
    toast.success(successMessage);
    return true;
  } catch {
    toast.error('Failed to download badge. Please try again.');
    return false;
  }
}
