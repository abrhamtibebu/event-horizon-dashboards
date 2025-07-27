import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Guest Type Color Coding Utility
export const GUEST_TYPE_COLORS: Record<string, { bg: string; text: string; border?: string }> = {
  'VIP': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
  'Speaker': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  'Staff': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
  'Exhibitor': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
  'Media': { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200' },
  'Regular': { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' },
  'Visitor': { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' },
  'Sponsor': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  'Organizer': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  'Volunteer': { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-200' },
  'Partner': { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-200' },
  'Vendor': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
  'Press': { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-200' },
  'Student': { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
  'Other': { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200' },
};

export function getGuestTypeColor(guestType: string | null | undefined): { bg: string; text: string; border?: string } {
  if (!guestType) {
    return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' };
  }
  
  // Convert to string and handle non-string values
  const guestTypeString = String(guestType).trim();
  
  // Handle empty string after trim
  if (!guestTypeString) {
    return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' };
  }
  
  return GUEST_TYPE_COLORS[guestTypeString] || GUEST_TYPE_COLORS['Other'];
}

export function getGuestTypeBadgeClasses(guestType: string | null | undefined): string {
  const colors = getGuestTypeColor(guestType);
  return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text} ${colors.border || ''} border`;
}
