import type { SocialPlatform } from '@/types/invitations';

/**
 * Generate the public RSVP landing URL for an invitation code.
 * (eventUuid is accepted for backward compatibility but no longer needed.)
 */
export function generateInvitationUrl(
  baseUrl: string,
  _eventUuid: string | null | undefined,
  invitationCode: string
): string {
  return `${baseUrl.replace(/\/$/, '')}/event/rsvp/${invitationCode}`;
}

export type ParsedInviteRow = {
  name: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  location: string;
  line: number;
  error?: string;
};

/**
 * Record a phone as +251 plus the local digits.
 * 0911000001, 911000001, and +251911000001 all become +251911000001.
 */
export function formatEthiopianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  let local = digits;
  if (local.startsWith('251')) local = local.slice(3);
  else if (local.startsWith('0')) local = local.slice(1);
  local = local.replace(/^0+/, '');
  return local ? `+251${local}` : '';
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Sample CSV matching what `parseGuestCsv` expects. */
export const SAMPLE_GUEST_CSV =
  'Name,Email,Phone,Company,Job Title,Location\n' +
  'Abebe Bikila,abebe@example.com,0911000001,Ethiopian Airlines,Athlete,Addis Ababa\n' +
  '"Tirunesh, Dibaba",tirunesh@example.com,+251922000002,World Athletics,Runner,Addis Ababa\n' +
  'Haile Gebrselassie,haile@example.com,,,\n';

/** Trigger a browser download of the sample guest CSV. */
export function downloadSampleGuestCsv(fileName = 'rsvp-guests-sample.csv'): void {
  const blob = new Blob([SAMPLE_GUEST_CSV], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Parse a guest CSV. Columns: Name, Email, Phone, Company, Job Title, Location.
 * Header is optional; when present, column order does not matter.
 * Phone numbers are returned as +251…
 */
export function parseGuestCsv(text: string): ParsedInviteRow[] {
  const lines = text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return [];

  const splitLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if ((ch === ',' || ch === ';' || ch === '\t') && !inQuotes) {
        out.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    out.push(cur.trim());
    return out;
  };

  const first = splitLine(lines[0]).map((c) => c.toLowerCase().replace(/[_/]+/g, ' ').replace(/\s+/g, ' ').trim());
  const hasHeader = first.some((c) => /name|e-?mail|phone|mobile|company|job|location|address/.test(c)) && !first.some((c) => EMAIL_RE.test(c));

  let nameIdx = 0;
  let emailIdx = 1;
  let phoneIdx = hasHeader ? -1 : 2;
  let companyIdx = hasHeader ? -1 : 3;
  let jobIdx = hasHeader ? -1 : 4;
  let locationIdx = hasHeader ? -1 : 5;
  if (hasHeader) {
    const find = (re: RegExp) => first.findIndex((c) => re.test(c));
    const nameHit = find(/^(full )?name$|^guest( name)?$/);
    if (nameHit >= 0) nameIdx = nameHit;
    const emailHit = find(/e-?mail/);
    if (emailHit >= 0) emailIdx = emailHit;
    phoneIdx = find(/phone|mobile|\btel\b/);
    companyIdx = find(/compan|organi[sz]/);
    jobIdx = find(/\bjob\b|position|occupation/);
    locationIdx = find(/location|address|\bcity\b/);
  }

  const cell = (cols: string[], idx: number) => (idx >= 0 ? cols[idx] ?? '' : '');

  const rows: ParsedInviteRow[] = [];
  const seen = new Set<string>();
  lines.slice(hasHeader ? 1 : 0).forEach((line, i) => {
    const cols = splitLine(line);
    const name = cell(cols, nameIdx);
    const email = cell(cols, emailIdx).toLowerCase();
    const phone = formatEthiopianPhone(cell(cols, phoneIdx));
    const company = cell(cols, companyIdx);
    const jobTitle = cell(cols, jobIdx);
    const location = cell(cols, locationIdx);
    const row: ParsedInviteRow = { name, email, phone, company, jobTitle, location, line: i + (hasHeader ? 2 : 1) };
    if (!name) row.error = 'Missing name';
    else if (!email) row.error = 'Missing email';
    else if (!EMAIL_RE.test(email)) row.error = 'Invalid email';
    else if (seen.has(email)) row.error = 'Duplicate email';
    seen.add(email);
    rows.push(row);
  });
  return rows;
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

