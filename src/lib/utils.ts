import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { getApiBaseURLForStorage } from "@/config/env"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates a strong password: 16 chars, uppercase, lowercase, numbers, symbols.
 * Suitable for system-generated default passwords.
 */
export function generateStrongPassword(length = 16): string {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lowercase = 'abcdefghjkmnpqrstuvwxyz'
  const numbers = '23456789'
  const symbols = '!@#$%&*'
  const all = uppercase + lowercase + numbers + symbols
  const getRandom = (str: string) => str[Math.floor(Math.random() * str.length)]
  const password = [
    getRandom(uppercase),
    getRandom(lowercase),
    getRandom(numbers),
    getRandom(symbols),
    ...Array.from({ length: length - 4 }, () => getRandom(all)),
  ]
  return password.sort(() => Math.random() - 0.5).join('')
}

// Guest Type Color Coding Utility with Dark Mode Support
export const GUEST_TYPE_COLORS: Record<string, { bg: string; text: string; border?: string; darkBg?: string; darkText?: string; darkBorder?: string }> = {
  'VIP': {
    bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200',
    darkBg: 'dark:bg-purple-900/30', darkText: 'dark:text-purple-300', darkBorder: 'dark:border-purple-700/50'
  },
  'Speaker': {
    bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200',
    darkBg: 'dark:bg-blue-900/30', darkText: 'dark:text-blue-300', darkBorder: 'dark:border-blue-700/50'
  },
  'Staff': {
    bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200',
    darkBg: 'dark:bg-green-900/30', darkText: 'dark:text-green-300', darkBorder: 'dark:border-green-700/50'
  },
  'Exhibitor': {
    bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200',
    darkBg: 'dark:bg-orange-900/30', darkText: 'dark:text-orange-300', darkBorder: 'dark:border-orange-700/50'
  },
  'Media': {
    bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200',
    darkBg: 'dark:bg-pink-900/30', darkText: 'dark:text-pink-300', darkBorder: 'dark:border-pink-700/50'
  },
  'Regular': {
    bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200',
    darkBg: 'dark:bg-muted', darkText: 'dark:text-muted-foreground', darkBorder: 'dark:border-border'
  },
  'General': {
    bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200',
    darkBg: 'dark:bg-muted', darkText: 'dark:text-muted-foreground', darkBorder: 'dark:border-border'
  },
  'Visitor': {
    bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200',
    darkBg: 'dark:bg-indigo-900/30', darkText: 'dark:text-indigo-300', darkBorder: 'dark:border-indigo-700/50'
  },
  'Sponsor': {
    bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200',
    darkBg: 'dark:bg-yellow-900/30', darkText: 'dark:text-yellow-300', darkBorder: 'dark:border-yellow-700/50'
  },
  'Organizer': {
    bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200',
    darkBg: 'dark:bg-red-900/30', darkText: 'dark:text-red-300', darkBorder: 'dark:border-red-700/50'
  },
  'Volunteer': {
    bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-200',
    darkBg: 'dark:bg-teal-900/30', darkText: 'dark:text-teal-300', darkBorder: 'dark:border-teal-700/50'
  },
  'Partner': {
    bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-200',
    darkBg: 'dark:bg-cyan-900/30', darkText: 'dark:text-cyan-300', darkBorder: 'dark:border-cyan-700/50'
  },
  'Vendor': {
    bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200',
    darkBg: 'dark:bg-amber-900/30', darkText: 'dark:text-amber-300', darkBorder: 'dark:border-amber-700/50'
  },
  'Press': {
    bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-200',
    darkBg: 'dark:bg-rose-900/30', darkText: 'dark:text-rose-300', darkBorder: 'dark:border-rose-700/50'
  },
  'Student': {
    bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200',
    darkBg: 'dark:bg-emerald-900/30', darkText: 'dark:text-emerald-300', darkBorder: 'dark:border-emerald-700/50'
  },
  'Other': {
    bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200',
    darkBg: 'dark:bg-muted', darkText: 'dark:text-muted-foreground', darkBorder: 'dark:border-border'
  },
};

export function getGuestTypeColor(guestType: string | null | undefined): { bg: string; text: string; border?: string } {
  if (!guestType) {
    return {
      bg: 'bg-gray-100 dark:bg-muted',
      text: 'text-gray-600 dark:text-muted-foreground',
      border: 'border-gray-200 dark:border-border'
    };
  }

  // Convert to string and handle non-string values
  const guestTypeString = String(guestType).trim();

  // Handle empty string after trim
  if (!guestTypeString) {
    return {
      bg: 'bg-gray-100 dark:bg-muted',
      text: 'text-gray-600 dark:text-muted-foreground',
      border: 'border-gray-200 dark:border-border'
    };
  }

  const colors = GUEST_TYPE_COLORS[guestTypeString] || GUEST_TYPE_COLORS['Other'];
  return {
    bg: `${colors.bg} ${colors.darkBg || ''}`,
    text: `${colors.text} ${colors.darkText || ''}`,
    border: colors.border ? `${colors.border} ${colors.darkBorder || ''}` : undefined
  };
}

export function getGuestTypeBadgeClasses(guestType: string | null | undefined): string {
  const colors = getGuestTypeColor(guestType);
  return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text} ${colors.border || ''} border`;
}

// Check-in Status Color Coding with Dark Mode Support
export function getCheckInBadgeClasses(checkedIn: boolean | null | undefined): string {
  if (checkedIn) {
    return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 dark:bg-success/20 text-success border border-success/30';
  }
  return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border';
}

// Task Color Coding with Dark Mode Support
export function getTaskColor(task: string): string {
  const taskLower = task.toLowerCase().trim();

  // Check-in related tasks
  if (taskLower.includes('check-in') || taskLower.includes('checkin') || taskLower.includes('registration')) {
    return 'bg-info/10 dark:bg-info/20 text-info border-info/30';
  }

  // Security related tasks
  if (taskLower.includes('security') || taskLower.includes('guard') || taskLower.includes('safety')) {
    return 'bg-error/10 dark:bg-error/20 text-error border-error/30';
  }

  // Guest assistance tasks
  if (taskLower.includes('guest') || taskLower.includes('assistance') || taskLower.includes('help') || taskLower.includes('support')) {
    return 'bg-success/10 dark:bg-success/20 text-success border-success/30';
  }

  // Crowd control tasks
  if (taskLower.includes('crowd') || taskLower.includes('control') || taskLower.includes('manage')) {
    return 'bg-info/10 dark:bg-info/20 text-info border-info/30';
  }

  // Communication tasks
  if (taskLower.includes('communication') || taskLower.includes('announcement') || taskLower.includes('coordination')) {
    return 'bg-warning/10 dark:bg-warning/20 text-[hsl(var(--color-warning))] border-warning/30';
  }

  // Technical tasks
  if (taskLower.includes('technical') || taskLower.includes('equipment') || taskLower.includes('setup') || taskLower.includes('audio') || taskLower.includes('video')) {
    return 'bg-info/10 dark:bg-info/20 text-info border-info/30';
  }

  // Emergency tasks
  if (taskLower.includes('emergency') || taskLower.includes('first aid') || taskLower.includes('medical')) {
    return 'bg-error/10 dark:bg-error/20 text-error border-error/30';
  }

  // Default color for other tasks
  return 'bg-muted text-muted-foreground border-border';
}

// Status Color Coding with Dark Mode Support
export function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-success/10 dark:bg-success/20 text-success border-success/30';
    case 'completed':
      return 'bg-info/10 dark:bg-info/20 text-info border-info/30';
    case 'draft':
      return 'bg-warning/10 dark:bg-warning/20 text-[hsl(var(--color-warning))] border-warning/30';
    case 'cancelled':
      return 'bg-error/10 dark:bg-error/20 text-error border-error/30';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

/**
 * Constructs a proper image URL from a storage path
 * @param imagePath - The image path from the backend (e.g., "/storage/image.png")
 * @returns The full URL to the image
 */
export const getImageUrl = (imagePath: string | null | undefined | any): string => {
  if (!imagePath || typeof imagePath !== 'string') {
    return '/placeholder.svg' // Default placeholder
  }

  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }

  // Check if it's a storage path (with or without leading slash)
  if (imagePath.includes('storage/')) {
    // Ensure path starts with a single slash
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${getApiBaseURLForStorage()}${cleanPath}`
  }

  // If it's a relative path, assume it's from the public folder
  return imagePath
}
