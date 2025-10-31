import type { SocialPlatform } from '@/types/invitations';

/**
 * Generate full invitation URL with tracking code
 */
export function generateInvitationUrl(
  baseUrl: string,
  eventUuid: string,
  invitationCode: string
): string {
  return `${baseUrl}/event/register/${eventUuid}?inv=${invitationCode}`;
}

/**
 * Generate contextual share text based on event type
 */
export function generateShareText(eventName: string, eventType: 'free' | 'ticketed'): string {
  if (eventType === 'ticketed') {
    return `🎟️ You're invited to ${eventName}! Get your tickets now:`;
  }
  return `📅 You're invited to ${eventName}! Register for free:`;
}

/**
 * Get platform-specific share URL
 */
export function getSocialShareUrl(
  platform: SocialPlatform,
  url: string,
  text: string
): string {
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);
  
  switch (platform) {
    case 'whatsapp':
      return `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
    case 'telegram':
      return `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case 'twitter':
      return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    case 'email':
      return `mailto:?subject=${encodedText}&body=${encodedUrl}`;
    default:
      return url;
  }
}

/**
 * Download QR code image
 */
export function downloadQRCode(qrCodeUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = qrCodeUrl;
  link.download = filename;
  link.click();
}

/**
 * Format conversion rate as percentage
 */
export function formatConversionRate(registrations: number, clicks: number): string {
  if (clicks === 0) return '0%';
  return `${((registrations / clicks) * 100).toFixed(1)}%`;
}

/**
 * Format large numbers with K/M suffixes
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * Get platform icon/emoji
 */
export function getPlatformIcon(platform: string): string {
  const icons: Record<string, string> = {
    whatsapp: '💬',
    telegram: '✈️',
    email: '📧',
    facebook: '👥',
    twitter: '🐦',
    linkedin: '💼'
  };
  return icons[platform.toLowerCase()] || '🔗';
}

/**
 * Get platform display name
 */
export function getPlatformName(platform: string): string {
  const names: Record<string, string> = {
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    email: 'Email',
    facebook: 'Facebook',
    twitter: 'Twitter/X',
    linkedin: 'LinkedIn'
  };
  return names[platform.toLowerCase()] || platform;
}

