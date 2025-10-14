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
  'General': { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' },
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

// Check-in Status Color Coding
export function getCheckInBadgeClasses(checkedIn: boolean | null | undefined): string {
  if (checkedIn) {
    return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200';
  }
  return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200';
}

/**
 * Constructs a proper image URL from a storage path
 * @param imagePath - The image path from the backend (e.g., "/storage/image.png")
 * @returns The full URL to the image
 */
export const getImageUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath) {
    return '/placeholder.svg' // Default placeholder
  }
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  
  // If it starts with /storage/, construct the proper URL
  if (imagePath.startsWith('/storage/')) {
    const baseUrl = import.meta.env.VITE_API_URL || 'https://api.validity.et/api'
    // Remove /api from the base URL for storage access
    const storageBaseUrl = baseUrl.replace('/api', '')
    return `${storageBaseUrl}${imagePath}`
  }
  
  // If it's a relative path, assume it's from the public folder
  return imagePath
}
